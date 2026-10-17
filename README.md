# Voz Segura — Android

Botón de pánico silencioso para Wear OS. Un doble toque discreto en una pantalla que parece una
carátula normal activa la grabación de audio y envía la ubicación a contactos de confianza, sin
nada visible en pantalla y sin sonido.

Caso de estudio para la materia **Diseño de Interfaces de Software**.

## Módulos

| Módulo   | Descripción                                                                 |
|----------|-----------------------------------------------------------------------------|
| `wear`   | App del reloj (Compose for Wear OS). Carátula disimulada + servicio de alerta. |
| `mobile` | App companion del celular (Jetpack Compose). Contactos, ajustes, historial.  |
| `shared` | Modelos y formato de mensajes comunes (estados de alerta, rutas Data Layer). |

Ambas apps comparten `applicationId = com.vozsegura.app`, requisito de la Wearable Data Layer API.

## Requisitos

- Android Studio Rabbit 2026.1 (JDK incluido)
- SDK 37, emulador **Wear OS Large Round** y un celular/emulador con Google Play
- Backend: [VozSegura-backend](https://github.com/MarioZaMu/VozSegura-backend)

## Cómo correr

1. Abrir la carpeta en Android Studio y sincronizar Gradle.
2. Seleccionar la configuración `wear` → emulador redondo → Run.
3. Seleccionar la configuración `mobile` → celular → Run.

Desde terminal:

```bash
./gradlew :wear:assembleDebug :mobile:assembleDebug
```

## Uso de IA

La IA **nunca** decide cuándo activar la alerta: siempre la dispara el usuario. Solo interviene
después, en el backend, para transcribir el audio y resumirlo. Si falla, la alerta con ubicación
se envía igual.
