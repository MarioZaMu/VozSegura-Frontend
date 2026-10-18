# Voz Segura — Frontend

Botón de pánico silencioso para smartwatch, caso de estudio de **Diseño de Interfaces de
Software**. Un doble toque discreto en la carátula del reloj activa la grabación de audio
y envía la ubicación a contactos de confianza, sin nada visible en pantalla y sin sonido.

Esta es la app web progresiva (PWA) con tres vistas:

| Vista             | Ruta               | Para quién                                   |
| ----------------- | ------------------ | -------------------------------------------- |
| **Reloj**         | `/`                | La persona en riesgo. En PC se ve un mockup de reloj; instalada en el celular, ocupa la pantalla completa como si fuera un reloj. |
| **Configuración** | `/configuracion`   | App compañera: contactos, mensaje, práctica del gesto, historial y modo demo. |
| **Contacto**      | `/alerta/:alertId` | Lo que recibe la persona de confianza: mapa, hora, estado y resumen de la IA. |

El backend (funciones serverless que guardan la alerta, avisan por Telegram y resumen el
audio con IA) está en [VozSegura-backend](https://github.com/MarioZaMu/VozSegura-backend).

## Stack

React 19 · Vite 8 · TypeScript · Tailwind CSS v4 · React Router · oxlint · Vercel

## Cómo correrlo

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env   # ajusta VITE_API_BASE_URL a la URL del backend
npm run dev            # http://localhost:5173
```

Otros comandos:

```bash
npm run build     # verificación de tipos + build de producción en dist/
npm run lint      # análisis estático con oxlint
npm run preview   # sirve dist/ localmente
```

> En el celular, el micrófono y la ubicación solo funcionan sobre HTTPS. Para probar en
> el teléfono usa la URL de Vercel.

## Cómo desplegarlo (Vercel)

1. En [vercel.com/new](https://vercel.com/new) importa el repo `VozSegura-Frontend`.
2. Vercel detecta Vite: build `npm run build`, salida `dist`.
3. En *Settings → Environment Variables* agrega `VITE_API_BASE_URL` con la URL del backend.
4. Cada push a `main` despliega automáticamente.

`vercel.json` redirige todas las rutas a `index.html` para que `/alerta/...` funcione al
recargar.

## Licencia

Proyecto académico.
