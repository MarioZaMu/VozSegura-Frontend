package com.vozsegura.shared.datalayer

/** Paths used by the Wearable Data Layer API between watch and phone. */
object DataLayerPaths {
    /** DataItem holding the serialized [com.vozsegura.shared.model.AlertConfig]. */
    const val CONFIG = "/voz-segura/config"
    const val CONFIG_KEY = "config_json"

    /** Message holding a serialized [com.vozsegura.shared.model.AlertUpdate], watch to phone. */
    const val ALERT_EVENT = "/voz-segura/alert-event"
}
