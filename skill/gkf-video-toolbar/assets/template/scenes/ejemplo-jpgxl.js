/* =====================================================================
   ESCENA: JPEG XL · primeros ~19 s
   Narración (anclas en segundos, de audio/transcript.json):
   0.00  ¿Sabías que el JPG puede desaparecer?           → el Borrador se come la foto
   3.38  El formato en el que se guardan casi todas las
         imágenes de internet                            → alejar: es una de miles
   6.56  ya tiene un sucesor que funciona en Chrome,
         Firefox, Safari y Windows.                      → Rectángulo: tarjeta nueva; Texto sincronizado
  11.16  Se llama JPEG XL.                               → Texto: título
  13.86  Y por primera vez la idea de reemplazar el JPG
         tiene argumentos sólidos.                       → Selección: la tarjeta cubre las JPG;
                                                           Bote: relleno "sólido" en "sólidos"
   ===================================================================== */
(() => {
  const PAL = [
    ['#8EC5FF','#FFD34D','#4F7CAC','#2F5D50'],
    ['#FFB38A','#FFF1C1','#B4546B','#5B2A4E'],
    ['#A7E3D0','#FFFFFF','#3E8E7E','#1F5F5B'],
    ['#FFE08A','#FF7A59','#C46A3A','#7A3E2A'],
    ['#1E2A4A','#F5F3CE','#3C4F7A','#1A2238'],
    ['#CDB4FF','#FFE6F2','#7B5CC4','#43327A'],
  ];
  // cuadrícula de "imágenes de internet": 3 × 5, la del centro es la protagonista
  const CW = 250, CH = 190, COLS = [190, 490, 790], ROWS = [150, 420, 690, 960, 1230];
  const MAIN = { col:1, row:2 };
  const objects = [];
  const center = [COLS[MAIN.col]+CW/2, ROWS[MAIN.row]+CH/2];
  const others = [];
  ROWS.forEach((y, r) => COLS.forEach((x, c) => {
    const isMain = c===MAIN.col && r===MAIN.row, i = r*3 + c;
    const o = { type:'photo', id: isMain ? 'main' : 'p'+i, x, y, w:CW, h:CH, r:14,
      pal: isMain ? PAL[0] : PAL[(i*5+2) % PAL.length], sunX: isMain ? 0.72 : 0.2 + ((i*37)%60)/100,
      peaks: [0.34 + ((i*13)%20)/100, 0.42 + ((i*7)%22)/100],
      label: isMain ? 'foto.jpg' : `img_${String(i+1).padStart(2,'0')}.jpg`, badge:'JPG' };
    if (isMain) o.appear = -1; else others.push(o);
    objects.push(o);
  }));
  // las demás aparecen en ola, de la más cercana a la más lejana, mientras la cámara se aleja
  others.sort((a,b) => Math.hypot(a.x+CW/2-center[0], a.y+CH/2-center[1]) - Math.hypot(b.x+CW/2-center[0], b.y+CH/2-center[1]))
        .forEach((o, k) => o.appear = 3.4 + k*0.08);

  const CARD = { x0:1040, y0:2160, x1:190, y1:1560 };       // se dibuja de abajo-derecha a arriba-izquierda
  const MOVE_BY = [0, -1085];                                // la tarjeta sube y cubre la cuadrícula
  const BROWSERS = 'Chrome · Firefox · Safari · Windows';

  window.SCENE = {
    audio: { src:'audio/jpgxl.mp3', start:0, end:18.6 },
    duration: 19.6,
    eraserWidth: 30,
    cam0: [COLS[MAIN.col]-30, ROWS[MAIN.row]-60, CW+60, CH+100],   // empieza muy cerca de la foto
    cursor0: [430, 1150],
    tool0: 'marquee',
    objects,
    script: [
      // "¿Sabías que el JPG puede desaparecer?"
      { do:'at', t:0.7, label:'borrador' },
      { do:'key', tool:'eraser' },
      { do:'at', t:1.35 },
      { do:'stroke', pts:[[500,712],[732,752],[506,800],[734,848]], dur:1.1,
        make:{ type:'erase', target:'main', width:30 } },
      // "…casi todas las imágenes de internet"
      { do:'at', t:3.15, label:'alejar' },
      { do:'zoom', rect:[170, 110, 880, 2080], dur:1.0, label:'Ctrl 0' },
      // "ya tiene un sucesor…"
      { do:'pick', tool:'rect' },
      { do:'drag', from:[CARD.x0,CARD.y0], to:[CARD.x1,CARD.y1], dur:0.65, make:{ type:'shape', fill:'#FFFFFF', r:28 } },
      { do:'key', tool:'type' },
      { do:'click', at:[615, 2010], make:{ type:'text', text:BROWSERS, size:40, weight:700, align:'center' } },
      // cada nombre aparece cuando la voz lo dice
      { do:'at', t:8.3, label:'Chrome' },  { do:'type', upto:'Chrome',  dur:0.35 },
      { do:'at', t:8.92, label:'Firefox' },{ do:'type', upto:'Firefox', dur:0.45 },
      { do:'at', t:9.66, label:'Safari' }, { do:'type', upto:'Safari',  dur:0.35 },
      { do:'at', t:10.3, label:'Windows' },{ do:'type', dur:0.45 },
      // "Se llama JPEG XL"
      { do:'click', at:[615, 1830], make:{ type:'text', text:'JPEG XL', size:150, align:'center', spacing:-3 } },
      { do:'at', t:11.6, label:'JPEG XL' }, { do:'type', dur:0.5 },
      // "…reemplazar el JPG…"
      { do:'at', t:14.3, label:'selección' },
      { do:'key', tool:'marquee' },
      { do:'move', grab:[615, 1660], by:MOVE_BY, dur:0.95 },
      // "…argumentos sólidos": relleno sólido
      { do:'key', tool:'bucket' },
      { do:'at', t:17.0, label:'bote' },
      { do:'click', at:[930, 1030], make:{ type:'fill', color:'#1E6BFF', textColor:'#FFFFFF' } },
      // cierre: ajustar a la ventana para centrar la composición final
      { do:'at', t:18.35 },
      { do:'zoom', rect:[170, 110, 880, 1330], dur:0.9, label:'Ctrl 0' },
      { do:'at', t:19.6 },
    ],
  };
})();
