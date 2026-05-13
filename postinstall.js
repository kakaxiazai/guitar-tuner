const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules/expo-av/android/src/main/java/expo/modules/av/ViewUtils.kt');

const newContent = `package expo.modules.av

import androidx.annotation.AnyThread
import expo.modules.av.video.VideoView
import expo.modules.av.video.VideoViewWrapper
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.interfaces.services.UIManager

object ViewUtils {
  interface VideoViewCallback {
    fun runWithVideoView(videoView: VideoView): Unit
  }

  @JvmStatic
  @AnyThread
  @Deprecated("Use \`dispatchCommands\` in favor of finding view with imperative calls")
  fun tryRunWithVideoView(moduleRegistry: ModuleRegistry, viewTag: Int, callback: VideoViewCallback, promise: Promise) {
    promise.reject("E_DEPRECATED", "This method is deprecated. Use dispatchCommands instead.")
  }

  @AnyThread
  @Deprecated("Use \`dispatchCommands\` in favor of finding view with imperative calls")
  fun tryRunWithVideoView(moduleRegistry: ModuleRegistry, viewTag: Int, callback: VideoViewCallback, promise: expo.modules.kotlin.Promise) {
    promise.reject("E_DEPRECATED", "This method is deprecated. Use dispatchCommands instead.", null)
  }
}
`;

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('✅ Fixed expo-av ViewUtils.kt');
