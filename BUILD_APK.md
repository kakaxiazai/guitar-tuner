# 构建安卓 APK 安装包

## 前提条件
1. 安装 Android Studio
2. 配置 Android SDK 和环境变量
3. 安装 Java JDK (JDK 8 或 11)
4. 安装 Node.js

## 步骤 1: 安装 Expo EAS CLI
```bash
npm install -g eas-cli
eas login  # 登录 Expo 账号
```

## 步骤 2: 配置项目
在 `app.json` 中配置包名和名称：
```json
{
  "expo": {
    "name": "吉他调音器",
    "slug": "guitar-tuner",
    "package": "com.guitartuner.app"
  }
}
```

## 步骤 3: 构建 APK

### 方式 A: 使用 EAS Build（推荐，云构建）
```bash
# 构建测试版 APK
eas build --platform android --profile preview

# 或构建发布版 APK
eas build --platform android --profile production
```

### 方式 B: 本地构建
```bash
# 安装依赖
npm install

# Android
npm run android
```

本地构建会生成 APK 文件在：
- Mac: `android/app/build/outputs/apk/debug/app-debug.apk`
- 需要安装 Android Studio 的 SDK 才能编译

## 构建时间
- EAS Build（云）：约 15-30 分钟
- 本地构建：约 5-10 分钟

## 下载 APK
构建完成后，EAS 会提供下载链接或发送到邮箱。

