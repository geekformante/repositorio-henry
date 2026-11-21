# Toolbar Video: boceto

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
