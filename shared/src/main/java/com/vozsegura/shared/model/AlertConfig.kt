package com.vozsegura.shared.model

import kotlinx.serialization.Serializable

/** User settings synced from the phone to the watch. */
@Serializable
data class AlertConfig(
    val contacts: List<TrustedContact> = emptyList(),
    val alertMessage: String = DEFAULT_ALERT_MESSAGE,
    val demoMode: Boolean = true,
) {
    companion object {
        const val DEFAULT_ALERT_MESSAGE = "Necesito ayuda. Esta es mi ubicación actual."
    }
}
