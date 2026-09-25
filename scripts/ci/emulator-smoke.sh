#!/usr/bin/env bash
# 云模拟器冒烟测试：安装 APK → 启动 → 截图 → 抓日志 → 崩溃判定
# 用法: bash scripts/ci/emulator-smoke.sh <apk-path>
# 由 .github/workflows/android-smoke.yml 在 android-emulator-runner 内调用。
set -uo pipefail

APK="${1:-}"
OUT_DIR="${SMOKE_OUT_DIR:-smoke-out}"
PKG="com.kakaxiazai.guitartuner"
ACTIVITY="${PKG}/.MainActivity"

if [ -z "$APK" ] || [ ! -f "$APK" ]; then
  echo "::error::未找到 APK：'$APK'"
  exit 2
fi

mkdir -p "$OUT_DIR"
FAIL=0

echo "::group::等待模拟器就绪"
adb wait-for-device
BOOT=""
for _ in $(seq 1 60); do
  BOOT="$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')"
  if [ "$BOOT" = "1" ]; then break; fi
  sleep 2
done
echo "sys.boot_completed=${BOOT:-unknown}"
if [ "$BOOT" != "1" ]; then
  echo "::warning::模拟器未在预期时间内完成启动，继续尝试"
fi
adb shell input keyevent 82 >/dev/null 2>&1 || true
adb shell settings put global window_animation_scale 0 >/dev/null 2>&1 || true
adb shell settings put global transition_animation_scale 0 >/dev/null 2>&1 || true
adb shell settings put global animator_duration_scale 0 >/dev/null 2>&1 || true
echo "::endgroup::"

echo "::group::安装 APK"
if ! adb install -r -t "$APK" 2>&1 | tee "$OUT_DIR/install.txt"; then
  echo "::error::APK 安装失败"
  exit 1
fi
echo "::endgroup::"

echo "::group::核对安装结果"
if adb shell pm list packages 2>/dev/null | tr -d '\r' | grep -qx "package:${PKG}"; then
  echo "已安装: ${PKG}"
else
  echo "::error::安装后未在包列表中找到 ${PKG}"
  FAIL=1
fi
adb shell dumpsys package "$PKG" 2>/dev/null | tr -d '\r' | grep -m1 -E "versionName|versionCode" || true
echo "::endgroup::"

echo "::group::启动应用"
adb logcat -c
adb shell am start -W -n "$ACTIVITY" 2>&1 | tee "$OUT_DIR/am-start.txt" || true
if grep -qE "Error|Exception|does not exist" "$OUT_DIR/am-start.txt"; then
  echo "::warning::am start 输出含异常信息，见上方日志"
fi
echo "::endgroup::"

echo "::group::等待首屏稳定并截图"
sleep 12
adb shell dumpsys activity activities 2>/dev/null | tr -d '\r' \
  | grep -m5 -E "mResumedActivity|topResumedActivity|ResumedActivity" || true
adb exec-out screencap -p > "$OUT_DIR/01-launch.png" 2>/dev/null || true
echo "已保存 $OUT_DIR/01-launch.png"

# 尝试切到第一个底部 Tab（调音页），坐标按实际分辨率推算；失败不影响判定
SIZE="$(adb shell wm size 2>/dev/null | tr -d '\r' | sed -n 's/.*: *//p' | head -1)"
if [ -n "$SIZE" ]; then
  W="${SIZE%x*}"
  H="${SIZE#*x}"
  TX=$((W / 6))
  TY=$((H - 80))
  echo "屏幕 ${W}x${H}，点击底部 Tab 坐标 (${TX}, ${TY})"
  adb shell input tap "$TX" "$TY" >/dev/null 2>&1 || true
  sleep 5
  adb exec-out screencap -p > "$OUT_DIR/02-tuner-tab.png" 2>/dev/null || true
  echo "已保存 $OUT_DIR/02-tuner-tab.png"
fi
echo "::endgroup::"

echo "::group::抓取日志与进程状态"
adb logcat -d -v threadtime > "$OUT_DIR/logcat.txt" 2>/dev/null || true
adb shell pidof "$PKG" 2>/dev/null | tr -d '\r' > "$OUT_DIR/pid.txt" || true
echo "pid=$([ -s "$OUT_DIR/pid.txt" ] && cat "$OUT_DIR/pid.txt" || echo '(空)')"
echo "日志行数: $(wc -l < "$OUT_DIR/logcat.txt" 2>/dev/null || echo 0)"
echo "::endgroup::"

echo "::group::崩溃判定"
if grep -qE "FATAL EXCEPTION|Fatal signal [0-9]+ \(SIG" "$OUT_DIR/logcat.txt"; then
  echo "::error::检测到原生/Java 层崩溃"
  grep -nE -A 25 "FATAL EXCEPTION" "$OUT_DIR/logcat.txt" | head -80 || true
  grep -nE "Fatal signal [0-9]+ \(SIG" "$OUT_DIR/logcat.txt" | head -10 || true
  FAIL=1
fi

if grep -qE "ReactNativeJS.*(Invariant Violation|Unable to load script|Cannot find module|is not a function)" "$OUT_DIR/logcat.txt"; then
  echo "::error::检测到 React Native JS 层致命错误"
  grep -nE "ReactNativeJS.*(Invariant Violation|Unable to load script|Cannot find module|is not a function)" \
    "$OUT_DIR/logcat.txt" | head -20 || true
  FAIL=1
fi

if grep -qE "Could not find index.android.bundle|Unable to resolve module" "$OUT_DIR/logcat.txt"; then
  echo "::error::JS bundle 缺失或模块解析失败"
  FAIL=1
fi

if [ ! -s "$OUT_DIR/pid.txt" ]; then
  echo "::error::应用进程不存在（启动后已崩溃退出）"
  FAIL=1
fi
echo "::endgroup::"

echo "::group::冒烟结论"
if [ "$FAIL" -eq 1 ]; then
  echo "::error::冒烟测试失败（见上）"
else
  echo "冒烟通过：安装成功 · 启动无崩溃 · 进程存活 · 首屏可截图"
fi
echo "::endgroup::"

exit "$FAIL"
