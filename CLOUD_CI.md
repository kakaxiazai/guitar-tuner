# 云端 Android 验证流水线

不碰手机、不装 Android SDK，就能拿到「**装得上、起得来、不崩**」的结论。
两条 GitHub Actions 流水线各管一段，配置一次长期复用。

---

## 一、流水线一览

| 文件 | 证明什么 | 需要什么 secret | 花费 |
|---|---|---|---|
| `.github/workflows/android-smoke.yml` | 安装成功 · 启动无崩溃 · 进程存活 · 首屏可截图 · **调音核心链路自检**（x86_64 模拟器，API 34） | `EXPO_TOKEN`（仅新建 APK 时需要；缺省则自动跳过） | GitHub Actions 额度内 |
| `.github/workflows/firebase-test-lab.yml` | 在**设备/系统版本矩阵**上安装并自动遍历不崩 | `GCP_SA_KEY` | Spark 免费额度：虚拟 10 次/天 · 真机 5 次/天 |
| `scripts/ci/emulator-smoke.sh` | 启动冒烟判定逻辑本体 | — | — |
| `scripts/ci/tuner-selftest.sh` | 深链拉起调音自检并解析日志断言 | — | — |
| `scripts/dev/run-selftest-node.mjs` | 本地跑同一套自检（不需要设备，秒级反馈） | — | — |

### 触发方式

- **手动**：仓库 → Actions → 选流水线 → *Run workflow*。可填 `apk_url` 直接指向现成 APK，跳过构建。
- **自动**：push 到 `main` 且改动了 `src/**`、`app.json`、`package.json`、`patches/**` 时跑冒烟；两条流水线每周一凌晨各跑一次。
- 真机农场默认**复用**最近一次冒烟流水线的 APK 产物，不重复消耗 EAS 构建额度。

---

## 二、一次性配置

### 1. `EXPO_TOKEN` —— 让 CI 能触发 EAS 云端构建

1. 打开 <https://expo.dev/accounts/kakaxiazai/settings/access-tokens> → *Create token*，复制。
2. 仓库 → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*。
3. 名称填 `EXPO_TOKEN`，值粘贴 token。

> 不想给 CI 构建权限也行：本地/手动构建好 APK，把下载链接填进 `apk_url` 即可，此 secret 可省。

### 2. `GCP_SA_KEY` —— 云真机农场

1. 在 [Firebase 控制台](https://console.firebase.google.com/)创建或选择一个项目。
2. **计费**：Spark（免费）计划本身就含 Test Lab 额度——**虚拟设备 10 次/天、真机 5 次/天**。
   若控制台要求绑定结算账号才能启用 Cloud Testing API，则绑定（项目会升级为 Blaze），
   但 Blaze 仍有每日免费时长：**虚拟设备 60 分钟/天、真机 30 分钟/天**，超出才按
   $1 / 虚拟设备·小时、$5 / 真机·小时计费（按分钟向上取整）。
   建议同时设置预算提醒。
3. 启用 API：**Cloud Testing API** 与 **Cloud Tool Results API**。
4. 创建服务账号，授予角色 **Firebase Test Lab Admin**。
5. 生成 JSON 密钥并下载。
6. 仓库 → *Settings* → *Secrets and variables* → *Actions* → 新建 secret，名称 `GCP_SA_KEY`，
   把整个 JSON 文件内容粘进去。

> 未配置时该流水线不会报错：会输出一条 warning 并跳过，保持 CI 绿色。

---

## 三、能证明什么 / 证不了什么

| 结论 | 云端能否给出 | 靠哪条 |
|---|---|---|
| APK 编译产出、ABI/权限/bundle 正确 | ✅ | EAS + 静态解包 |
| 装得上、起得来、进程存活、无原生/JS 崩溃 | ✅ | 模拟器冒烟 |
| 在多种真实设备与系统版本上不崩 | ✅ | 云真机农场 |
| **给定 PCM → 音名 + 音分的完整链路** | ✅ | 设备端自检（合成信号） |
| 麦克风**硬件**能否采到声音 | ❌ | 只能人工确认 |

### 调音器自检是怎么做的

难点在于「拨弦 → 显示音名」需要真实声音，而云端既没有吉他、模拟器也没有麦克风。
解法是把**输入**换掉：用程序合成一段已知音高的拨弦信号（基频 + 6 次泛音 + 各自指数衰减
+ 轻微非谐性 + 本底噪声），喂进**真实的**处理链路，再断言输出的音名与音分。

用例共 8 条：六根标准弦（E2 / A2 / D3 / G3 / B3 / E4）、一条刻意失谐 +25 音分的读数校验、
一条静音（验证信号门限不会凭空报音）。

```bash
# 本地跑（秒级，不需要设备）
node scripts/dev/run-selftest-node.mjs

# 设备端跑（CI 自动执行；也可手动）
adb shell am start -a android.intent.action.VIEW -d "guitartuner://selftest"
adb logcat -d | grep TUNER_SELFTEST_SUMMARY
```

覆盖范围：除了麦克风硬件本身，链路里的每一环都在**真实设备**上被验证过 ——
React 状态机、平滑窗口、门限判断、YIN 音高检测、频率→音名、音分计算。

> 自检顺带发现并修复了 `PitchDetector` 的一个真实缺陷：抛物线插值的顶点公式分母写成了
> `2*(2*y0 - y-1 - y+1)`，等价于把分子取反，插值会朝错误方向偏移；加上 YIN 路径上多了一层
> 本不该有的 Hann 窗。修正后最大频率误差从 **10.2 音分降到 0.7 音分**。详见 `src/audio/PitchDetector.ts` 注释。

---

## 四、成本提示

- **GitHub Actions**：公开仓库免费；私有仓库每月 2000 分钟额度（Ubuntu runner 按 1× 计）。
- **EAS Build**：preview 构建走免费额度并可能排队；已加 `concurrency` 自动取消被覆盖的重复运行，避免白烧额度。
- **Firebase Test Lab**：先吃免费额度，超出后按分钟计费——上面已给当前费率与免费时长。

---

## 五、已知边界

- APK 的 native 库（`libaudio-studio-cpp.so`）只打进 `arm64-v8a / x86 / x86_64`，**没有 `armeabi-v7a`**；
  模拟器走 x86_64，不受影响。32 位 ARM 真机的安全性此前已单独论证过（该库为懒加载，调音路径不触碰它）。
- 冒烟脚本会尝试点击底部第一个 Tab 以截取调音页截图，**该点击失败不判失败**，仅作为证据留存。
- 判定为失败的条件只有三类：安装失败、出现 `FATAL EXCEPTION` / `Fatal signal`、出现 React Native JS 致命错误或进程消失。
- 调音自检通过深链 `guitartuner://selftest` 触发（已在 `app.json` 的 `android.intentFilters` 声明，
  `MainActivity` 为 `singleTask`，冷启动与热启动都能收到）。深链解析失败时脚本会自动回退为显式组件启动。
- 自检**不需要麦克风权限**（输入是合成信号），因此在无麦克风的模拟器上也能跑。
- 自检容差 ±5 音分；当前实测最大误差 0.7 音分，留出约 7 倍余量，避免设备差异导致误报。
