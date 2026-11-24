# Referencia del guion y del motor

Una escena es un archivo `scenes/<nombre>.js` que define `window.SCENE`. El motor (`engine.js`) lo compila a una línea de tiempo y dibuja cualquier instante con `renderAt(t)`, que es una función pura del tiempo. Por eso la vista previa y el render cuadro por cuadro dan exactamente lo mismo.

## Coordenadas

- **Mundo**: el espacio de los objetos (fotos, figuras, textos). Todo lo que pones en `objects` y en el guion (`from`, `to`, `at`, `pts`, `grab`) está en coordenadas del mundo.
- **Pantalla**: 1080 × H (por defecto H = 2340). La cámara convierte mundo → pantalla: `x·s + cam.x`.
- `cam0: [x, y, w, h]` (rectángulo del mundo) es lo que se ve al empezar. `fitCam` lo encaja en el área libre a la derecha de la barra.
- Con la cámara en `s = 1, x = 0, y = 0`, el mundo coincide con la pantalla. Conviene diseñar la vista general así y usar `cam0` para empezar de cerca.
- El área útil a la derecha de la barra va de x ≈ 170 a x ≈ 1040.

## `window.SCENE`

```js
window.SCENE = {
  audio: { src:'audio/narracion.mp3', start:0, end:18.6 }, // tramo de la voz que entra al video
  duration: 19.6,              // duración del video (≥ la del guion)
  cam0: [x, y, w, h],          // encuadre inicial (mundo); omitir = mundo 1:1
  cam0pad: 40,
  cursor0: [x, y],             // posición inicial del cursor (pantalla)
  tool0: 'marquee',            // herramienta activa al empezar
  eraserWidth: 30,             // grosor del borrador (para el tamaño del cursor)
  objects: [ ... ],            // objetos que ya existen o que aparecen solos
  script: [ ... ],             // acciones
};
```

## Objetos iniciales

`photo`: un paisaje plano en una tarjeta redondeada, con una etiqueta encima (estilo nombre de mesa de trabajo) y un distintivo.

```js
{ type:'photo', id:'main', x, y, w, h, r:14,
  pal:['#cielo','#sol','#montaña1','#montaña2'], sunX:0.72, peaks:[0.42,0.5],
  label:'foto.jpg', badge:'JPG', appear:3.4 }   // appear: segundo en que entra con rebote (-1 = siempre visible)
```

Lo que se borra de una `photo` muestra el tablero de transparencia, como en un programa de diseño.

Para otros tipos de objeto (íconos, gráficas, diagramas) agrega una función de dibujo junto a `photoSVG` en `engine.js` y un caso en `renderWorld`. Mantén el estilo flat: colores planos, esquinas redondeadas, nada de degradados realistas.

## Acciones del guion

| Acción | Campos | Qué hace |
|---|---|---|
| `at` | `t`, `label` | Ancla la acción siguiente al segundo `t` del audio. Si el guion va adelantado, espera; si va tarde, lo registra en `TL.late`. |
| `wait` | `dur` | Pausa. |
| `pick` | `tool` | El cursor viaja a la barra, aparece el recuadro con nombre y atajo, hace clic y la herramienta queda activa. Cuesta unos 1.0–1.5 s. |
| `key` | `tool` o `label` | Atajo de teclado: aparece la tecla junto al cursor y la herramienta cambia sin viajar (unos 0.4 s). Con solo `label` (ej. `'Ctrl 0'`) es una tecla sin cambio de herramienta. |
| `drag` | `from`, `to`, `dur`, `make` | Arrastra en el lienzo. `make:{type:'shape', fill, r}` dibuja un rectángulo; `make:{type:'marquee'}` hace un recuadro de selección punteado. |
| `click` | `at`, `make` | `make:{type:'text', text, size, weight, align:'center', spacing}` pone el punto de inserción (con `align:'center'`, `at` es el centro del texto). `make:{type:'fill', color, textColor}` rellena la figura bajo el punto con onda radial; `textColor` recolorea los textos que contiene. |
| `type` | `dur`, `upto` | Escribe el último texto. `upto:'Chrome'` escribe hasta el final de esa palabra; sin `upto`, hasta el final del texto. Combínalo con `at` para que cada palabra aparezca cuando la voz la dice. |
| `zoom` | `rect`, `dur`, `label`, `pad` | Lleva la cámara a encuadrar `rect` (mundo). Con `label` muestra la tecla (ej. `'Ctrl 0'`). Sirve para alejar, acercar y recentrar. |
| `stroke` | `pts`, `dur`, `make`, `smooth` | Trazo a mano por los puntos (curva suave). `make:{type:'stroke', color, width}` es Pincel; `make:{type:'erase', target:'<id de photo>', width}` es Borrador. |
| `move` | `grab`, `by`, `dur` | Selección: agarra la figura bajo `grab` y la arrastra `by:[dx,dy]` junto con todo lo que hay dentro (textos, rellenos). Muestra la caja de selección con manijas. |

Duraciones que calcula el motor:
- Viaje del cursor: entre 0.4 y 0.9 s, según la distancia, con una ligera curva.
- `pick`: viaje + 0.45 s.
- `key`: 0.4 s.
- `drag` y `stroke`: viaje + `dur` + 0.12 s.

## Herramientas disponibles (ids)

`marquee` (Selección, V) · `direct` (Selección directa, A) · `wand` (Varita mágica, Y) · `lasso` (Lazo, Q) · `pen` (Pluma, P) · `type` (Texto, T) · `line` (Segmento de línea, \) · `rect` (Rectángulo, M) · `ellipse` (Elipse, L) · `brush` (Pincel, B) · `pencil` (Lápiz, N) · `eraser` (Borrador, ⇧E) · `rotate` (Rotar, R) · `scale` (Escala, S) · `builder` (Generador de formas, ⇧M) · `bucket` (Bote de pintura interactiva, K) · `gradient` (Degradado, G) · `eyedrop` (Cuentagotas, I) · `graph` (Gráfica de columnas, J) · `artboard` (Mesa de trabajo, ⇧O) · `hand` (Mano, H) · `zoom` (Zoom, Z)

El cursor cambia solo según la herramienta: cruz para dibujar figuras, I para texto, bote para rellenar, círculo del tamaño del trazo para Pincel y Borrador, y flecha sobre la barra.

## Extender el motor

Para agregar una acción nueva:
1. En `compile()` agrega un caso `s.do === 'nueva'`. Ahí mueve el cursor (`moveTo`, `tl.moves`), registra clics, teclas o cambios de herramienta y crea objetos con `t0` y `t1`. Al final avanza `cur`.
2. En `renderWorld()` dibuja el objeto según `k = (t - t0) / (t1 - t0)`. Respeta el orden de capas: fotos → figuras → rellenos → textos → trazos → selecciones.
3. Mantén todo como función pura de `t`: nada de estado que dependa del cuadro anterior.

Ideas ya pensadas y sin implementar: Pluma (nodos y manijas), Mano (paneo con cursor de mano cerrada; estaba en la v2), Cuentagotas (lupa de color), Gráfica de columnas (barras que crecen), Rotar y Escala sobre una figura seleccionada, Elipse.
