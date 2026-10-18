# Voz Segura — Android

Botón de pánico silencioso para Wear OS. Un doble toque discreto en una pantalla que parece una
carátula normal activa la grabación de audio y envía la ubicación a contactos de confianza, sin
nada visible en pantalla y sin sonido.

Caso de estudio para la materia **Diseño de Interfaces de Software**.

## Caso de estudio

📄 **[Documento completo (PDF)](docs/Voz-Segura-Caso-de-estudio.pdf)**: problema, usuarios,
arquitectura, estados, diseño de interfaz, uso de IA, privacidad, accesibilidad, pruebas,
limitaciones y guion de la demo.

**Problema.** En una situación de riesgo, sacar el celular o usar un botón de pánico visible puede
delatar a quien pide ayuda. El reloj está siempre en la muñeca y se toca sin mirar.

**Cómo funciona**

1. Doble toque en la pantalla del reloj. La carátula no cambia: nadie se da cuenta.
2. Una vibración confirma. Hay 4 s para cancelar en silencio manteniendo presionado 2 s.
3. Los contactos reciben por Telegram la ubicación (en unos 5 s) y luego un audio de 30 s.
4. La IA solo transcribe y resume el audio después; nunca decide si se envía una alerta.

**Principios de diseño**

- **Sigilo total:** la carátula se ve igual en todos los estados; el único aviso es háptico.
- **Fácil a propósito, difícil por accidente:** reglas físicas para el gesto (≤ 250 ms por toque,
  60–400 ms entre toques, ≤ 10 mm de distancia, rechazo de palma) en lugar de un botón.
- **Reversible:** gracia de 4 s sin avisar a nadie; después, la cancelación avisa «estoy bien».
- **La alerta sale aunque todo lo demás falle:** ni el GPS, ni el audio, ni la IA la bloquean; si
  falla la red, el reloj reintenta en silencio cada 5 s.

| Estado | Vibración | Qué pasa |
|---|---|---|
| Reposo | — | Carátula normal |
| Gracia (4 s) | 1 tic | Nada sale del reloj; se puede cancelar en silencio |
| Enviando / Enviada | 2 tics al llegar | Ubicación a los contactos, luego audio y resumen |
| Error | 1 vibración larga | Reintenta cada 5 s sin volver a vibrar |
| Cancelada | 3 tics | Si ya se había enviado, los contactos reciben «estoy bien» |

**Limitaciones principales:** la sincronización celular ↔ reloj no se pudo probar en emuladores;
el gesto oculto no funciona con TalkBack activo; las personas no se validaron con usuarias reales.
Detalle y trabajo futuro en el PDF.

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

### Conectar con el backend

Sin configuración, el reloj usa un backend simulado (`FakeAlertGateway`, se ve en Logcat).
Para enviar alertas reales, agregar a `local.properties` (no se sube a git):

```properties
vozsegura.backendUrl=https://tu-proyecto.vercel.app
vozsegura.alertApiToken=el-mismo-ALERT_API_TOKEN-del-backend
# Usuario del bot sin @, para el botón "Invitar por Telegram" de la app del celular
vozsegura.botUsername=TuBot_bot
```

Para probar con el servidor local del backend (`npm run serve`) desde el emulador, usar
`http://10.0.2.2:3000` y, como Android 17 bloquea la red local, conceder el permiso una vez:

```bash
adb shell pm grant com.vozsegura.app android.permission.ACCESS_LOCAL_NETWORK
```

### Celular y reloj

- El celular es la fuente de verdad de contactos, mensaje y modo demo; cada cambio se publica como
  DataItem y el reloj guarda una copia, así la alerta nunca depende de que el celular esté cerca.
- El reloj avisa al celular cada cambio de estado de una alerta (mensaje Data Layer) para el historial.
- La sincronización requiere emparejar el reloj con el celular (app Wear OS). Sin emparejar, el
  reloj alerta a los `DEFAULT_CHAT_IDS` del backend y el celular funciona por su cuenta.
- **Probar gesto** usa el mismo detector (`shared/gesture`) y los mismos umbrales que el reloj.

### Pruebas

```bash
./gradlew :wear:testDebugUnitTest   # detector del gesto y máquina de estados
```

## Accesibilidad

- Contraste WCAG AA verificado en la paleta; el color nunca es la única señal (los estados tienen texto).
- Títulos marcados como encabezados, tarjetas leídas como una sola frase y resultados del gesto
  anunciados (live region) para TalkBack.
- Limitación conocida: con TalkBack activo, el lector usa el doble toque, por lo que el gesto oculto
  no funciona en el reloj. Ver el documento del caso.

## Uso de IA

La IA **nunca** decide cuándo activar la alerta: siempre la dispara el usuario. Solo interviene
después, en el backend, para transcribir el audio y resumirlo. Si falla, la alerta con ubicación
se envía igual.
