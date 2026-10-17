package com.vozsegura.wear.alert

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import android.util.Log
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.NonCancellable
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Records one short, compressed audio clip for the AI summary. Small on purpose (AAC mono
 * 16 kHz 32 kbps, about 120 KB for 30 s) so it uploads fast on a watch connection.
 */
class AudioClipRecorder(private val context: Context) {

    /**
     * Records [durationMs] of audio. Returns the file, or null if the microphone is unavailable.
     * If cancelled (false alarm) the partial clip is deleted: nothing is kept without consent.
     */
    suspend fun record(alertId: String, durationMs: Long = CLIP_DURATION_MS): File? {
        if (!AlertPermissions.hasMicrophone(context)) return null
        val file = File(context.cacheDir, "alert-audio/$alertId.m4a").apply { parentFile?.mkdirs() }
        val recorder = newRecorder()
        var completed = false
        try {
            recorder.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioChannels(1)
                setAudioSamplingRate(16_000)
                setAudioEncodingBitRate(32_000)
                setOutputFile(file)
                prepare()
                start()
            }
            delay(durationMs)
            completed = true
            return file
        } catch (e: Exception) {
            if (e is CancellationException) throw e
            Log.w(TAG, "Audio recording failed; the alert continues without audio", e)
            return null
        } finally {
            withContext(NonCancellable) {
                runCatching { recorder.stop() }
                recorder.release()
                if (!completed) file.delete()
            }
        }
    }

    private fun newRecorder(): MediaRecorder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }

    companion object {
        const val CLIP_DURATION_MS = 30_000L
        private const val TAG = "AudioClipRecorder"
    }
}
