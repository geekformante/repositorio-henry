# Toolbar Video


> **Versión actual: v4.** Escena real con audio: `scenes/jpgxl.js` sobre `audio/jpgxl.mp3` (primeros ~19 s). Resultado: `out/jpgxl.mp4`.

## v4: motor + escenas con audio

Estructura:
- `engine.js`: motor (barra, cámara, cursor, acciones, render). No cambia entre videos.
- `scenes/<nombre>.js`: cada video define `window.SCENE` con el audio, los objetos iniciales y el guion.
- `index.html?scene=jpgxl`: vista previa (clic para reproducir con audio).
- `audio/transcript.json`: transcripción con tiempos por palabra (faster-whisper, modelo small).

```bash
node render.js video --scene=jpgxl   # out/jpgxl.mp4 con la voz mezclada
node render.js stills 2.6 9.6 19.5   # fotogramas para revisar
```

**Sincronía con la voz:** `{ do:'at', t:8.3, label:'Chrome' }` ancla la acción siguiente a ese segundo del audio. Si la acción va adelantada, espera; si va tarde, el motor lo avisa en consola (`TL.late`) con cuánto se retrasó. Así sabemos cuándo conviene usar un atajo en lugar de viajar a la barra.

Acciones del guion: `at`, `wait`, `pick` (ir a la barra), `key` (atajo), `drag` (dibujar figura), `click` (rellenar o poner texto), `type` (escribir; `upto:'Chrome'` escribe hasta esa palabra), `zoom` (ajustar la cámara a un rectángulo), `stroke` (pincel o borrador, `type:'erase'`), `move` (Selección: arrastra una figura con todo lo que contiene).

Objetos de escena: `photo` (paisaje plano con etiqueta `.jpg` y distintivo; al borrarse se ve el tablero de transparencia y puede aparecer en ola con `appear`).

Barra: una hilera, 22 herramientas de Illustrator, translúcida, 28 px de aire a la izquierda y 120 px arriba y abajo.

## v2: interfaz más abstracta y moderna (estilo Figma)

- **Formato 1080 × 2340 (9:19.5)**: llena la pantalla del iPhone 16 (2556 × 1179). Un video 9:16 deja barras negras arriba y abajo. `--h=1920` saca la versión 9:16 si se necesita para otra plataforma.
- **Barra de herramientas flotante**: separada 28 px del borde, con esquinas redondeadas (30 px) y sombra, centrada en vertical y fija. La herramienta activa se marca en azul (`#0D99FF`).
- **Recortar → Mano (H)**: la Mano arrastra el lienzo hasta otra zona para empezar una idea nueva.
- **Fondo oscuro con puntos** (`#141518` y puntos `#2E3037`) anclados al mundo: se mueven y escalan con la cámara.
- **Lienzo con esquinas redondeadas (44 px)** y de **cualquier proporción**. Es más grande que la pantalla y abraza el contenido: no tiene que caber completo.
- **Barra superior** pegada al borde de arriba y con la misma paleta. El zoom (`100%` → `56%`) se actualiza en vivo.
- **Cierre de "pizarra"** (inspirado en RSA Animate y VideoScribe): `⇧ 1` aleja la cámara para mostrar todo el lienzo, y el Pincel dibuja una flecha que conecta las ideas.
- **Prueba translúcida** (`?glass` / `--glass`): barra con `backdrop-filter: blur(26px)` al 58 % de opacidad. Sobre el fondo oscuro se ve igual que la sólida. Sobre el lienzo blanco se vuelve gris medio y los iconos pierden contraste (ver `out/comparacion_solida_vs_glass.png`). Si se usa, conviene subir la opacidad a ~75 %.

Nuevas acciones del guion: `{ do:'pan', from, by }` (Mano), `{ do:'zoomFit', label }` (alejar para ver todo) y `{ do:'stroke', pts }` (trazo de Pincel con flecha opcional). El bote rellena con color o con patrón (`pattern:'subpix'`).

```bash
node render.js video            # out/demo.mp4 (1080×2340)
node render.js video --glass    # out/demo_glass.mp4
node render.js stills 23.2 36.6 # fotogramas sueltos
node render.js clip 20 26       # solo un tramo
```

---

## v1: notas originales

Videos explicativos en 9:16 con estilo flat. El giro es que **la animación la "ejecuta" un cursor con las herramientas de una app de diseño**, a la manera de Photoshop. El cursor va a la barra, toma una herramienta, vuelve al lienzo y dibuja, selecciona o escribe lo que ilustra la narración.

- `index.html`: la interfaz y el motor de animación. Ábrelo en el navegador para verlo en bucle (`?guides` muestra las zonas seguras).
- `render.js`: exporta fotogramas y video con Playwright y ffmpeg.
- `out/boceto.png`, `out/boceto_guias.png`, `out/demo.mp4`: el resultado.

```bash
node render.js mockup 21     # boceto.png + boceto_guias.png (fotograma en t = 21 s)
node render.js stills 2 9.5  # fotogramas sueltos para revisar
node render.js video         # out/demo.mp4, 1080×1920 a 30 fps
```

## Interfaz (1080 × 1920)

| Zona | Medidas | Color |
|---|---|---|
| Barra de menú | 0–64 px | `#262626` |
| Barra de opciones (cambia según la herramienta) | 64–136 px | `#2E2E2E` |
| Pestaña del documento | 136–192 px | `#262626` / `#2E2E2E` |
| **Barra de herramientas** (izquierda) | 132 px de ancho, botones de 104 px | `#2E2E2E`; herramienta activa `#555555` |
| **Mesa de trabajo** (fondo) | resto de la pantalla | `#1B1B1B` (más oscuro que la barra, como en Photoshop) |
| **Lienzo blanco** | 816 × 1400 en (198, 232) | `#FFFFFF` con sombra |
| Zona de subtítulos | 1650–1865 px, sobre la mesa oscura | ‑ |
| Barra de estado | 1876–1920 px | `#2E2E2E` |

Tener la barra a la izquierda tiene una ventaja extra: en Reels y TikTok los botones de la app (like, comentar, compartir) quedan a la **derecha**, así que la barra nunca choca con ellos.

## Las 10 herramientas

Van en el mismo orden que en Photoshop, de arriba a abajo. Escogí las más clásicas y les asigné un uso narrativo a cada una:

| # | Herramienta | Atajo | Para qué sirve en el video |
|---|---|---|---|
| 1 | Mover | V | Llevar un objeto de un lado a otro, reordenar, comparar |
| 2 | Marco rectangular | M | **Resaltar o seleccionar** algo con hormigas en marcha |
| 3 | Recortar | C | Reencuadrar o hacer zoom a un detalle ("fíjate en esto") |
| 4 | Cuentagotas | I | "Sacar" un color de algo; ideal para temas de color |
| 5 | Pincel | B | Subrayar, encerrar en un círculo, flechas a mano alzada |
| 6 | Borrador | E | Quitar lo que ya no aplica ("esto es un mito") |
| 7 | Bote de pintura | G | Rellenar de color una zona o una selección |
| 8 | Pluma | P | Curvas limpias, flechas y diagramas de conexión |
| 9 | Texto horizontal | T | Marcar el punto de inserción y escribir el texto letra por letra |
| 10 | Rectángulo | U | **Dibujar figuras u objetos** (tarjetas, barras, cajas) |

Cada botón lleva el triangulito de "grupo de herramientas". Más adelante sirve para mantener presionado y sacar Elipse, Lazo y otras sin agregar botones.

## Detalles que "venden" la interfaz

- **Tooltip** con nombre y atajo al pasar el cursor por un botón. El espectador aprende cómo se llama la herramienta.
- **Barra de opciones** que cambia con la herramienta (Calado, Tolerancia, fuente y tamaño…).
- **Cursor que cambia** según la herramienta y la zona: flecha sobre la interfaz, cruz para seleccionar o dibujar, I para texto, bote para rellenar.
- **Onda azul en cada clic**, para que el clic se lea aunque el cursor sea pequeño.
- **Color frontal** que se actualiza con el color que se va a usar.
- Hormigas en marcha animadas, contorno azul mientras se dibuja una figura, cursor de texto parpadeando.

## Ritmo: cómo no hacerlo lento

El ida y vuelta a la barra cuesta unos 1,5–2 s. Para controlarlo, el guion tiene tres "velocidades":

1. **Viaje completo** (cursor → barra → tooltip → clic → regreso). Se usa la **primera vez** que aparece una herramienta, o cuando quieres que el espectador la note.
2. **Atajo de teclado**: aparece una tecla ("M", "G", "Ctrl D") junto al cursor y la herramienta se activa en la barra **sin que el cursor viaje**. Cuesta unos 0,45 s. En el demo, las selecciones verde y azul ya se hacen así.
3. **Mantener**: la imagen se queda quieta mientras la narración la explica. Con esto aplicamos lo que pulimos en la skill de vidrio: **una idea completa por escena**, no una por frase.

## Arquitectura (pensada para convertirse en skill)

El video se escribe como un **guion de acciones humanas**:

```js
{ do:'pick',  tool:'rect' }                                   // ir a la barra y elegir
{ do:'drag',  from:[x,y], to:[x,y], make:{ type:'shape' } }   // arrastrar en el lienzo
{ do:'click', at:[x,y], make:{ type:'fill', color } }         // clic con efecto
{ do:'key',   tool:'marquee' }                                // atajo de teclado
{ do:'type',  dur:1.3 }                                       // escribir el último texto
{ do:'deselect' } / { do:'wait', dur }
```

`compile()` convierte el guion en una línea de tiempo con los movimientos del cursor, los clics, los cambios de herramienta y los objetos, y calcula solo los tiempos de viaje. `renderAt(t)` es una función pura del tiempo, así que la misma página sirve para la vista previa en vivo y para exportar cuadro por cuadro sin saltos.

Para sincronizar con la voz, cada paso puede anclarse a una marca de tiempo de la narración en vez de ir solo en secuencia.

## Pendiente / ideas siguientes

- Panel de **Capas** opcional abajo a la derecha (o colapsado) para mostrar objetos que se apilan.
- Acciones para las otras herramientas: Mover, Recortar con zoom de cámara, Pincel con trazo a mano alzada, Pluma con nodos y manijas, Borrador y Cuentagotas con lupa de color.
- Estilo visual del lienzo alineado con la skill de animación del video CMYK.
- Sonidos sutiles de clic y teclado.
