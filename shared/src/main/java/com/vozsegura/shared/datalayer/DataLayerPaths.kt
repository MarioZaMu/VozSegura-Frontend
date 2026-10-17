package com.vozsegura.shared.datalayer

/** Paths used by the Wearable Data Layer API between watch and phone. */
object DataLayerPaths {
    /** DataItem holding the serialized [com.vozsegura.shared.model.AlertConfig]. */
    const val CONFIG = "/voz-segura/config"
    const val CONFIG_KEY = "config_json"

    /** Message sent by the watch whenever an alert changes state. */
    const val ALERT_EVENT = "/voz-segura/alert-event"
}
