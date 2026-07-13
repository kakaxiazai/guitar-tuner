# 构建安卓 APK / iOS IPA 安装包

## 前提条件
1. 已安装 Node.js
2. 已安装 EAS CLI: `npm install -g eas-cli`
3. 已登录 Expo 账号: `eas login`
4. 项目已配置 EAS (eas.json)

## 步骤 1: 安装依赖
```bash
npm install
```

## 步骤 2: 构建安装包

### 方式 A: 使用 EAS Build（推荐，云构建）

```bash
# 构建 Android 预览版（用于测试）
npm run build:preview

# 或构建 Android 生产版（AAB）
npm run build:android

# 或构建 iOS 预览版
eas build --platform ios --profile preview

# 或构建 iOS 生产版（IPA）
npm run build:ios
```

### 方式 B: 本地构建（需要 Android Studio / Xcode）
```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## 构建产物

### EAS Build
- 构建完成后会收到下载链接（Expo 网站或邮件）
- Android 生产版生成 AAB（Android App Bundle）
- Android 预览版生成 APK
- iOS 生成 IPA

### 本地构建
- Android APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- iOS: 需要 Xcode 打开 `ios/` 目录构建

## 项目配置

### app.json
- Bundle ID: `com.kakaxiazai.guitartuner` (Android) / `com.kakaxiazai.guitartuner` (iOS)
- 权限: `RECORD_AUDIO` (麦克风)
- 版本: 1.0.0

### eas.json
- development: 开发构建（带 Expo Go）
- preview: 预览构建（内部测试）
- production: 生产构建（自动递增版本号）

## 提交应用商店

构建完成后提交到应用商店：
```bash
# 提交到 Google Play (Android)
npm run submit:android

# 提交到 App Store (iOS)
npm run submit:ios
```

## 构建时间
- EAS Build（云构建）: 约 15-30 分钟
- 本地构建: 约 5-10 分钟（取决于设备性能）

## 故障排除

### Gradle 构建超时
如果在 EAS 构建时遇到网络问题，可以配置国内镜像：
编辑 `android/gradle.properties` 添加代理配置。

### 麦克风权限
确保 `app.json` 中包含 `RECORD_AUDIO` 权限。

### expo-av 兼容性
项目使用 expo-av 15.0.1，确保 Expo SDK 版本匹配。
