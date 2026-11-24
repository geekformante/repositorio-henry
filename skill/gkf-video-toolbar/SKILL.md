---
name: gkf-video-toolbar
description: Crea videos explicativos verticales en estilo flat a partir de una narración. Un cursor animado usa herramientas de una barra estilo Illustrator (seleccionar, dibujar, escribir, borrar, rellenar, alejar la cámara) para ilustrar las ideas clave sobre una mesa de trabajo oscura con puntos, sincronizado palabra por palabra con el audio. Úsala cuando pidan un video, reel o short "con la barra de herramientas", "estilo programa de diseño", "con el cursor que dibuja", o pidan animar una narración/voz en off con esta skill (gkf-video-toolbar).
---

# GKF Video Toolbar

Videos verticales donde **la animación la ejecuta un cursor con herramientas de diseño**. El cursor va a la barra, toma una herramienta (se ve el recuadro con nombre y atajo), vuelve al lienzo y dibuja, escribe, borra, rellena o mueve lo que ilustra la narración. Todo queda sincronizado con la voz.

## Requisitos

- **Node 18+** y Playwright con Chromium: `npm i playwright && npx playwright install chromium` (si el entorno ya trae Chromium, no lo reinstales).
- **ffmpeg** en el PATH.
- **Para transcribir**: `pip install faster-whisper numpy`. El modelo se descarga de Hugging Face; si no hay red, pasa con `--model` la ruta a un modelo CTranslate2 ya descargado.
- La tipografía Inter viene incluida en `fonts/` (licencia OFL).

## Flujo de trabajo

1. **Crear el proyecto**: copia `assets/template/` a la carpeta de trabajo, pon el audio en `audio/` y trabaja desde ahí. El template trae la escena de ejemplo `scenes/ejemplo-jpgxl.js`, con su audio y su transcripción, como referencia.
2. **Transcribir con tiempos por palabra**:
   ```bash
   python3 <skill>/scripts/transcribe.py audio/narracion.mp3 audio/transcript.json
   python3 <skill>/scripts/words.py audio/transcript.json 0 20   # palabras@segundo del tramo
   ```
3. **Elegir el tramo**: si piden "los primeros N segundos", corta al final de la última frase completa antes de N (no a media palabra) y deja ~1 s de cola visual. Ese corte va en `audio.end`.
4. **Diseñar el guion visual antes de escribir código.** Haz una tabla `segundo → frase → idea visual → herramienta`. Lee "Reglas de dirección".
5. **Escribir la escena** `scenes/<nombre>.js` (ver `references/guion.md`). Ancla con `{ do:'at', t }` las acciones que deben caer en una palabra concreta.
6. **Revisar la sincronía**: `node render.js check --scene=<nombre>`. Si alguna acción va tarde, cambia un viaje a la barra (`pick`) por un atajo (`key`), acorta duraciones o mueve el cursor inicial. Repite hasta que todo quede a menos de ~0.15 s.
7. **Revisar el encuadre**: `node render.js contact 0.3 2.6 4 6 8 10 12 15 19 --scene=<nombre>` genera `out/contact.png`. Mira esa hoja: nada tapado por la barra, textos legibles, composición centrada.
8. **Renderizar una vez**: `node render.js video --scene=<nombre>` produce `out/<nombre>.mp4` con la voz mezclada.
9. **Vista previa en vivo** (opcional): abre `index.html?scene=<nombre>` en un navegador y haz clic para reproducir con audio.

Opciones del render: `--h=1920` para 9:16 (por defecto es 1080×2340, 9:19.5, que llena la pantalla de un iPhone sin barras) y `--solid` para la barra opaca.

**Pregunta el formato si no está claro.** El usuario lo ve en un iPhone 16 (2556×1179): 1080×2340 lo llena; 1080×1920 (9:16, estándar de Reels/TikTok) deja barras negras en el teléfono. Sus otros videos (la skill de vidrio) podrían ser 9:16. Mantén el formato consistente con lo que pida.

## Reglas de dirección (lo que el usuario ya aprobó)

- **Una idea completa por escena, no una por frase.** La imagen puede quedarse quieta mientras la voz la explica. No ilustres cada oración; ilustra lo importante.
- **El ida y vuelta a la barra cuesta tiempo** (unos 1.0–1.5 s). Úsalo la **primera vez** que aparece una herramienta o cuando importa que se note. Después, **atajo de teclado** (`key`, ~0.4 s).
- **Sincroniza lo que se nombra**: si la voz enumera ("Chrome, Firefox, Safari y Windows"), escribe cada palabra con `type` + `upto` anclado al segundo en que se dice.
- **Juega con el significado de la herramienta**: Borrador para "desaparecer", alejar la cámara para "casi todas las imágenes", Selección que arrastra algo encima de otra cosa para "reemplazar", relleno sólido en "argumentos sólidos".
- **Cierra con una composición centrada**: un `zoom` con tecla (`'Ctrl 0'`) que encuadre el resultado final.
- **Estilo flat y limpio**: colores planos, esquinas redondeadas, sin texturas ni sombras realistas. Nada de logotipos de marcas; nombres en texto.
- Al dibujar en el lienzo, termina el trazo cerca de donde va la siguiente acción, para ahorrar viaje del cursor.

## Diseño de la interfaz (fijo)

- **Lienzo / mesa de trabajo**: fondo `#141518` con una cuadrícula de puntos `#2E3037` cada 40 px. Los puntos se mueven y escalan con la cámara.
- **Barra de herramientas**: una sola hilera vertical a la izquierda con 22 herramientas de Illustrator en su orden real. Es translúcida (desenfoque 26 px, `rgba(24,25,29,.66)`), con esquinas de 32 px, y queda desacoplada: 28 px de aire a la izquierda y 120 px arriba y abajo. Abajo lleva relleno y trazo, los tres modos de color y el botón "•••". La herramienta activa se marca en azul `#0D99FF`.
- **Sin interfaz superior.**
- **Detalles**: recuadro con nombre y atajo al pasar sobre una herramienta, onda azul en cada clic, tecla de atajo que aparece junto al cursor, cursor que cambia por herramienta, caja de selección con manijas y cursor de texto parpadeando.
- Los iconos son dibujos propios inspirados en Illustrator, no recursos de Adobe.

## Archivos

- `assets/template/engine.js`: el motor. No lo cambies por un video concreto; si hace falta una acción nueva, agrégala ahí (ver `references/guion.md` → "Extender el motor").
- `assets/template/index.html`: el escenario (SVG + capa de vidrio). Carga `scenes/<scene>.js`.
- `assets/template/render.js`: los modos `check`, `contact`, `stills`, `clip` y `video`.
- `assets/template/scenes/ejemplo-jpgxl.js`: escena completa de ejemplo (19.6 s); úsala como modelo.
- `scripts/transcribe.py` y `scripts/words.py`: transcripción y lista de anclas.
- `references/guion.md`: API completa del guion, coordenadas, objetos y cómo extender el motor.
