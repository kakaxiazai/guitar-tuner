#!/usr/bin/env bash
# 设备端调音器自检：用深链拉起自检 → 解析 logcat → 断言核心链路正确
#
# 为什么需要它：模拟器/云真机都没有「吉他」可以弹，麦克风硬件无法在云端验证。
# 但把输入换成合成信号后，调音链路里除麦克风以外的所有环节
# （React 状态机 → YIN → 频率→音名 → 音分）都能在真实设备上被断言。
#
# 用法: bash scripts/ci/tuner-selftest.sh
# 由 .github/workflows/android-smoke.yml 在 android-emulator-runner 内调用，
# 必须紧跟在 emulator-smoke.sh 之后（依赖应用已安装）。
set -uo pipefail

PKG="com.kakaxiazai.guitartuner"
OUT_DIR="${SMOKE_OUT_DIR:-smoke-out}"
DEEP_LINK="guitartuner://selftest"
MAX_WAIT_SECS="${SELFTEST_WAIT_SECS:-60}"

mkdir -p "$OUT_DIR"

echo "::group::用深链启动调音器自检"
adb shell am force-stop "$PKG" >/dev/null 2>&1 || true
adb logcat -c >/dev/null 2>&1 || true

START_OUT="$(adb shell am start -W \
  -a android.intent.action.VIEW \
  -c android.intent.category.BROWSABLE \
  -d "$DEEP_LINK" 2>&1 | tr -d '\r')"
echo "$START_OUT" | tee "$OUT_DIR/selftest-am-start.txt"

if echo "$START_OUT" | grep -qiE "^Error|unable to resolve|does not exist"; then
  echo "::warning::深链未被 intent-filter 解析，回退为显式组件启动"
  adb shell am start -W -a android.intent.action.VIEW -d "$DEEP_LINK" -n "$PKG/.MainActivity" \
    2>&1 | tr -d '\r' | tee -a "$OUT_DIR/selftest-am-start.txt" || true
fi
echo "::endgroup::"

echo "::group::等待自检完成（最多 ${MAX_WAIT_SECS}s）"
SUMMARY_LINE=""
for i in $(seq 1 $((MAX_WAIT_SECS / 2))); do
  sleep 2
  SUMMARY_LINE="$(adb logcat -d 2>/dev/null | tr -d '\r' \
    | grep -F 'TUNER_SELFTEST_SUMMARY ' | tail -1 || true)"
  if [ -n "$SUMMARY_LINE" ]; then
    echo "第 $((i * 2))s 收到自检结果"
    break
  fi
done
echo "::endgroup::"

echo "::group::抓取完整日志"
adb logcat -d -v threadtime > "$OUT_DIR/selftest-logcat.txt" 2>/dev/null || true
grep -F 'TUNER_SELFTEST' "$OUT_DIR/selftest-logcat.txt" | sed 's/^.*TUNER_SELFTEST/TUNER_SELFTEST/' \
  > "$OUT_DIR/selftest-lines.txt" || true
echo "--- 自检输出 ---"
cat "$OUT_DIR/selftest-lines.txt" 2>/dev/null || true
echo "--- 完整日志 $OUT_DIR/selftest-logcat.txt ---"
echo "::endgroup::"

EXIT=0

if [ -z "$SUMMARY_LINE" ]; then
  echo "::error::未在 ${MAX_WAIT_SECS}s 内收到 TUNER_SELFTEST_SUMMARY。可能原因：应用启动失败、深链未生效、或自检抛异常。"
  if grep -qE "FATAL EXCEPTION|Fatal signal [0-9]+ \(SIG" "$OUT_DIR/selftest-logcat.txt"; then
    echo "::error::检测到崩溃："
    grep -nE -A 25 "FATAL EXCEPTION" "$OUT_DIR/selftest-logcat.txt" | head -60 || true
  fi
  exit 1
fi

echo "摘要: ${SUMMARY_LINE#*TUNER_SELFTEST_SUMMARY }"

if ! printf '%s' "$SUMMARY_LINE" | grep -q '"pass":true'; then
  echo "::error::调音器自检未通过"
  EXIT=1
fi

# 单独再核对一次「没有失败用例」，防止摘要字段被截断导致的误判
if grep -F 'TUNER_SELFTEST case=' "$OUT_DIR/selftest-logcat.txt" | grep -q 'pass=false'; then
  echo "::error::存在失败的用例："
  grep -F 'TUNER_SELFTEST case=' "$OUT_DIR/selftest-logcat.txt" | grep 'pass=false' || true
  EXIT=1
fi

PASS_COUNT="$(grep -F 'TUNER_SELFTEST case=' "$OUT_DIR/selftest-logcat.txt" | grep -c 'pass=true' || true)"
if [ -n "$PASS_COUNT" ] && [ "$PASS_COUNT" -gt 0 ]; then
  echo "通过用例数: $PASS_COUNT"
fi

echo "::group::自检结论"
if [ "$EXIT" -eq 0 ]; then
  echo "自检通过：六根标准弦 + 失谐读数 + 静音不误报，全部符合预期"
else
  echo "::error::自检失败（见上）"
fi
echo "::endgroup::"

exit "$EXIT"
