# 云端 Android 验证流水线

不碰手机、不装 Android SDK，就能拿到「**装得上、起得来、不崩**」的结论。
两条 GitHub Actions 流水线各管一段，配置一次长期复用。

---

## 一、流水线一览

| 文件 | 证明什么 | 需要什么 secret | 花费 |
|---|---|---|---|
| `.github/workflows/android-smoke.yml` | 安装成功 · 启动无崩溃 · 进程存活 · 首屏可截图（x86_64 模拟器，API 34） | `EXPO_TOKEN`（仅在需要新建 APK 时） | GitHub Actions 额度内 |
| `.github/workflows/firebase-test-lab.yml` | 在**设备/系统版本矩阵**上安装并自动遍历不崩 | `GCP_SA_KEY` | Spark 免费额度：虚拟 10 次/天 · 真机 5 次/天 |
| `scripts/ci/emulator-smoke.sh` | 冒烟判定逻辑本体（被第一条流水线调用） | — | — |

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
| **麦克风采音 → 音高检测的真实链路** | ❌ | 见下 |

### 唯一的盲区

云端模拟器是 headless 的（本流水线用 `-no-audio` 启动），**没有麦克风输入**；
真机农场虽然在数据中心有真实麦克风，但那里没有吉他可弹。
所以「拨弦 → 显示正确音名」这一条，**云端无法自动判定**。

**推荐的补强方式**（尚未实现，需要时再加）：
给调音器增加一个「音频回放模式」——从文件读取一段已知音高的 PCM，
走同一条解码 → YIN → 显示链路，然后在真机农场上用仪器化测试断言显示的音名。
这样调音功能的核心逻辑就能搬进云端验收，只剩「麦克风本身是否采到声音」需要人工确认一次。

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
