package com.vozsegura.wear.alert

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import androidx.wear.ongoing.OngoingActivity
import androidx.wear.ongoing.Status
import com.vozsegura.wear.R
import com.vozsegura.wear.presentation.MainActivity

/** Starts and stops whatever keeps an alert alive while it runs. Abstracted for tests. */
interface AlertSession {
    fun start()
    fun stop()
}

class ForegroundAlertSession(private val context: Context) : AlertSession {
    override fun start() {
        ContextCompat.startForegroundService(context, Intent(context, AlertService::class.java))
    }

    override fun stop() {
        context.stopService(Intent(context, AlertService::class.java))
    }
}

/**
 * Foreground service that keeps the process (and its microphone and location access) alive
 * during an alert, and publishes an Ongoing Activity so the fake watch face stays on screen.
 * The actual work runs in [AlertController]; this service only holds the foreground state.
 *
 * Android requires a visible notification for it. Its wording is deliberately neutral
 * ("Hora · Sincronizando") so a glance at the notification list reveals nothing.
 */
class AlertService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ensureChannel()
        val openFace = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_clock)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.service_notification_text))
            .setContentIntent(openFace)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_MIN)
            .setSilent(true)
            .setOngoing(true)

        OngoingActivity.Builder(this, NOTIFICATION_ID, notification)
            .setStaticIcon(R.drawable.ic_stat_clock)
            .setTouchIntent(openFace)
            .setStatus(Status.Builder().addTemplate(getString(R.string.service_notification_text)).build())
            .build()
            .apply(this)

        ServiceCompat.startForeground(this, NOTIFICATION_ID, notification.build(), foregroundTypes())
        return START_NOT_STICKY
    }

    /** Only declare types whose permission is granted; declaring a missing one crashes on API 34+. */
    private fun foregroundTypes(): Int {
        var types = 0
        if (AlertPermissions.hasMicrophone(this)) types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE
        if (AlertPermissions.hasLocation(this)) types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        // Without either permission the alert still uploads, so fall back to a data-sync service.
        return if (types == 0) ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC else types
    }

    private fun ensureChannel() {
        val manager = getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_ID,
                getString(R.string.service_channel_name),
                NotificationManager.IMPORTANCE_MIN,
            ).apply {
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            },
        )
    }

    private companion object {
        const val CHANNEL_ID = "sync"
        const val NOTIFICATION_ID = 1
    }
}
