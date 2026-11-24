/* =====================================================================
   TOOLBAR VIDEO · MOTOR
   La escena (scenes/*.js) define window.SCENE con: audio, duración,
   objetos iniciales (photos), cámara inicial y el guion de acciones.
   Este archivo convierte el guion en una línea de tiempo y dibuja
   cualquier instante t con renderAt(t) (función pura del tiempo).
   ===================================================================== */
const P = new URLSearchParams(location.search);
const W = 1080, H = +(P.get('h') || 2340);
const GLASS = !P.has('solid');               // barra translúcida por defecto
const ACCENT = '#0D99FF';
const INK = '#1F2430';

const TOOLS = [
  { id:'marquee', name:'Selección',          key:'V' },
  { id:'direct',  name:'Selección directa',  key:'A' },
  { id:'wand',    name:'Varita mágica',      key:'Y' },
  { id:'lasso',   name:'Lazo',               key:'Q' },
  { id:'pen',     name:'Pluma',              key:'P' },
  { id:'type',    name:'Texto',              key:'T' },
  { id:'line',    name:'Segmento de línea',  key:'\\' },
  { id:'rect',    name:'Rectángulo',         key:'M' },
  { id:'ellipse', name:'Elipse',             key:'L' },
  { id:'brush',   name:'Pincel',             key:'B' },
  { id:'pencil',  name:'Lápiz',              key:'N' },
  { id:'eraser',  name:'Borrador',           key:'⇧E' },
  { id:'rotate',  name:'Rotar',              key:'R' },
  { id:'scale',   name:'Escala',             key:'S' },
  { id:'builder', name:'Generador de formas',key:'⇧M' },
  { id:'bucket',  name:'Bote de pintura interactiva', key:'K' },
  { id:'gradient',name:'Degradado',          key:'G' },
  { id:'eyedrop', name:'Cuentagotas',        key:'I' },
  { id:'graph',   name:'Gráfica de columnas',key:'J' },
  { id:'artboard',name:'Mesa de trabajo',    key:'⇧O' },
  { id:'hand',    name:'Mano',               key:'H' },
  { id:'zoom',    name:'Zoom',               key:'Z' },
];
const toolIndex = Object.fromEntries(TOOLS.map((t,i)=>[t.id,i]));

/* Barra flotante: 28 px de aire a la izquierda; recortada arriba y abajo */
const TB = { x:28, marginY:120, pad:14, gap:6, r:32, head:40, foot:300 };
TB.y = TB.marginY; TB.h = H - 2*TB.marginY;
TB.btn = Math.floor((TB.h - 2*TB.pad - TB.head - TB.foot - (TOOLS.length-1)*TB.gap) / TOOLS.length);
TB.w = TB.btn + 2*TB.pad;
TB.btnsH = TOOLS.length*TB.btn + (TOOLS.length-1)*TB.gap;
TB.btnY0 = TB.y + TB.pad + TB.head;
function btnRect(id){
  const i = toolIndex[id], x = TB.x + TB.pad, y = TB.btnY0 + i*(TB.btn+TB.gap);
  return { x, y, w:TB.btn, h:TB.btn, cx:x+TB.btn/2, cy:y+TB.btn/2 };
}

const ICONS = {
  marquee:`<path d="M6.5 3v16.5l4.3-4.2 2.9 6.4 2.6-1.2-2.9-6.2h6z" fill="currentColor"/>`,
  direct: `<path d="M6.5 3v16.5l4.3-4.2 2.9 6.4 2.6-1.2-2.9-6.2h6z"/>`,
  wand:   `<path d="M4 20 14.5 9.5" stroke-width="2.2"/><path d="M17.5 2.5v3M17.5 9.5v3M12.5 7.5h3M19.5 7.5h3M14.6 4.6l1.4 1.4M19 9l1.4 1.4M20.4 4.6 19 6"/>`,
  lasso:  `<ellipse cx="13" cy="8.5" rx="8" ry="5"/><path d="M7.5 12.2c-1.6 1.1-1.8 3 .2 3.6 1.6.5 1.3 2.6-.9 3.9"/>`,
  pen:    `<path d="M12 2.5 18 10l-3 8.5H9L6 10z"/><path d="M12 2.5v8"/><circle cx="12" cy="12.6" r="1.5"/><path d="M9 21.5h6"/>`,
  type:   `<path d="M5 5.5h14M12 5.5v13.5M9.2 19h5.6" stroke-width="2.1"/>`,
  line:   `<path d="M5 19 19 5" stroke-width="1.9"/>`,
  rect:   `<rect x="4" y="5" width="16" height="14" rx="1.5"/>`,
  ellipse:`<ellipse cx="12" cy="12" rx="8.5" ry="6.5" fill="currentColor" fill-opacity=".25"/>`,
  brush:  `<path d="M20 3.2c-3.4 1-7.4 5-9.4 8.2l2.9 2.9c3.2-2 7.2-6 8.2-9.4.3-1.1-.6-2-1.7-1.7z"/><path d="M9.6 12.6c-2.2 0-3.8 1.5-3.8 3.6 0 1.6-1 2.6-2.6 3.1 3.4 1.2 7.5.1 8.3-3.3z" fill="currentColor"/>`,
  pencil: `<path d="M4 20l1.2-4.6L15.8 4.8a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8z"/><path d="M14 6.6l3.4 3.4M5.2 15.4l3.4 3.4"/>`,
  eraser: `<path d="M8.6 20 3.9 15.3a1.6 1.6 0 0 1 0-2.2l9.2-9.2a1.6 1.6 0 0 1 2.2 0l4.8 4.8a1.6 1.6 0 0 1 0 2.2L11 20z"/><path d="M8.2 8.8l7 7M11 20h9.5"/>`,
  rotate: `<path d="M18.5 12a6.5 6.5 0 1 1-1.9-4.6" stroke-dasharray="2 2.2"/><path d="M17.5 3.5v4.4h-4.4"/>`,
  scale:  `<rect x="3.5" y="10.5" width="10" height="10" rx="1"/><rect x="9" y="4" width="11" height="11" rx="1" stroke-dasharray="2.2 1.8"/><path d="M13 11l4-4M14 7h3v3"/>`,
  builder:`<circle cx="9" cy="10" r="5.5"/><rect x="10" y="9" width="9.5" height="9.5" rx="1"/><path d="M10 10a5.5 5.5 0 0 1 4.5 4.5" fill="currentColor" fill-opacity=".5"/>`,
  bucket: `<path d="M3.8 11.2 11 4l8 8-7.2 7.2a1.5 1.5 0 0 1-2.1 0l-5.9-5.9a1.5 1.5 0 0 1 0-2.1z"/><path d="M8.5 6.5 5.5 3.5M3.8 11.2H19"/><path d="M20.3 14.6s-1.9 2.3-1.9 3.6a1.9 1.9 0 0 0 3.8 0c0-1.3-1.9-3.6-1.9-3.6z" fill="currentColor" stroke="none"/>`,
  gradient:`<rect x="4" y="5" width="16" height="14" rx="1.5" fill="url(#icoGrad)"/>`,
  eyedrop:`<path d="M16.6 3.4a2.2 2.2 0 0 1 3.1 3.1L17.3 9l1.1 1.1-1.6 1.6-5.5-5.5 1.6-1.6L14 5.7z"/><path d="M12.6 7.9 5 15.5V19h3.5l7.6-7.6"/>`,
  graph:  `<path d="M3.5 20.5h17M6.5 20V12M10.5 20V5.5M14.5 20V9M18.5 20v-6" stroke-width="2.2"/>`,
  artboard:`<rect x="7.5" y="7.5" width="12" height="12" rx="1"/><path d="M7.5 2.5v3M2.5 7.5h3M19.5 21.5v-0M4 4l2 2"/>`,
  hand:   `<path d="M8 12.5V5.6a1.5 1.5 0 0 1 3 0V11M11 10.5V4.1a1.5 1.5 0 0 1 3 0V11M14 10.8V5.6a1.5 1.5 0 0 1 3 0V12M17 8.6a1.5 1.5 0 0 1 3 0V15a6.2 6.2 0 0 1-6.2 6.2h-1.4a6.2 6.2 0 0 1-4.8-2.3L4.2 15a1.6 1.6 0 0 1 2.4-2.1L8 14.3"/>`,
  zoom:   `<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.3 15.3 20.5 20.5" stroke-width="2.4"/>`,
};
function iconSVG(id, x, y, size, color){
  return `<g transform="translate(${x},${y}) scale(${size/24})" fill="none" stroke="${color}" color="${color}"
            stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[id]}</g>`;
}

/* ---------- utilidades ---------- */
const ease = t => t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
const easeOut = t => 1-Math.pow(1-t,3);
const easeBack = t => { const c=1.7; return 1 + (c+1)*Math.pow(t-1,3) + c*Math.pow(t-1,2); };
const clamp01 = t => Math.max(0,Math.min(1,t));
const lerp = (a,b,t)=>a+(b-a)*t;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const lastBefore = (arr, t) => { let v = arr[0]; for (const a of arr){ if (a.t<=t) v=a; else break; } return v; };

const widthCache = {};
function textWidth(str, size, weight=800){
  const k = size+'|'+weight+'|'+str; if (k in widthCache) return widthCache[k];
  const m = $('measure'); m.setAttribute('font-size', size); m.setAttribute('font-weight', weight); m.textContent = str;
  return widthCache[k] = m.getComputedTextLength();
}
function catmull(pts, n){
  const out = [], Q = [pts[0], ...pts, pts[pts.length-1]];
  for (let i=1;i<Q.length-2;i++) for (let j=0;j<n;j++){
    const t=j/n, t2=t*t, t3=t2*t, [p0,p1,p2,p3]=[Q[i-1],Q[i],Q[i+1],Q[i+2]];
    out.push([0,1].map(d=>0.5*((2*p1[d])+(-p0[d]+p2[d])*t+(2*p0[d]-5*p1[d]+4*p2[d]-p3[d])*t2+(-p0[d]+3*p1[d]-3*p2[d]+p3[d])*t3)));
  }
  out.push(pts[pts.length-1]); return out;
}
/* desplazamiento acumulado de un objeto movido con la herramienta Selección */
function offsetAt(o, t){
  let dx=0, dy=0;
  for (const m of (o.moves||[])){ const k = ease(clamp01((t-m.t0)/(m.t1-m.t0))); dx += m.dx*k; dy += m.dy*k; }
  return [dx,dy];
}
const boxOf = o => o.type==='photo' ? [o.x,o.y,o.w,o.h] : [Math.min(o.x0,o.x1), Math.min(o.y0,o.y1), Math.abs(o.x1-o.x0), Math.abs(o.y1-o.y0)];
const inBox = (p, b) => p[0]>=b[0] && p[0]<=b[0]+b[2] && p[1]>=b[1] && p[1]<=b[1]+b[3];

/* =====================================================================
   COMPILADOR: guion → línea de tiempo
   Acciones: at · wait · pick · key · drag · click · type · zoom · stroke · move
   `at` ancla la acción siguiente a un segundo del audio (espera si va adelantado,
   avisa en consola si va tarde).
   ===================================================================== */
function fitCam(rect, pad=40){
  const vx = TB.x+TB.w+pad, vy = pad+40, vw = W-vx-pad, vh = H-vy-pad-40;
  const s = Math.min(vw/rect[2], vh/rect[3]);
  return { s, x: vx + (vw-rect[2]*s)/2 - rect[0]*s, y: vy + (vh-rect[3]*s)/2 - rect[1]*s };
}

function compile(SC){
  const tl = { moves:[], cams:[], tool:[{t:0,id:SC.tool0||'marquee'}], hovers:[], clicks:[], keys:[], objects:[],
               fg:[{t:0,c:'#FFFFFF'}], press:[], grabs:[], selections:[], late:[] };
  let cur = 0, cam = SC.cam0 ? fitCam(SC.cam0, SC.cam0pad ?? 40) : { x:0, y:0, s:1 };
  tl.cam0 = cam;
  let pos = SC.cursor0 || [W*0.7, H*0.72];
  for (const o of (SC.objects||[])) tl.objects.push({ appear:-1, tEnd:Infinity, ...o, t0:o.appear ?? -1 });
  const w2s = p => [p[0]*cam.s + cam.x, p[1]*cam.s + cam.y];
  const moveTo = to => {
    const d = Math.hypot(to[0]-pos[0], to[1]-pos[1]); if (d < 1) return 0;
    const dur = Math.min(0.9, Math.max(0.4, 0.3 + d/1900));
    tl.moves.push({ t0:cur, t1:cur+dur, from:pos, to, arc:true });
    pos = to; cur += dur; return dur;
  };
  const shapeAt = (p, t) => [...tl.objects].reverse().find(q=>(q.type==='shape') && q.t0<=t && inBox(p, (b=>{const [dx,dy]=offsetAt(q,t); return [b[0]+dx,b[1]+dy,b[2],b[3]];})(boxOf(q))));
  let lastText = null;

  for (const s of SC.script){
    if (s.do==='at'){
      if (cur > s.t + 0.05) tl.late.push(`${s.label||'paso'}: va ${(cur-s.t).toFixed(2)} s tarde (ancla ${s.t})`);
      cur = Math.max(cur, s.t);
    }
    else if (s.do==='wait') cur += s.dur;
    else if (s.do==='pick'){
      const b = btnRect(s.tool);
      moveTo([b.cx+8, b.cy+10]);
      const ta = cur;
      tl.hovers.push({ t0:ta-0.12, t1:ta+0.5, id:s.tool });
      tl.clicks.push({ t:ta+0.25, x:pos[0], y:pos[1] });
      tl.press.push({ t:ta+0.25, id:s.tool });
      tl.tool.push({ t:ta+0.27, id:s.tool });
      cur = ta + 0.45;
    }
    else if (s.do==='key'){
      const label = s.label ?? TOOLS[toolIndex[s.tool]].key;
      tl.keys.push({ t:cur, label, x:pos[0], y:pos[1] });
      if (s.tool){ tl.press.push({ t:cur+0.08, id:s.tool }); tl.tool.push({ t:cur+0.08, id:s.tool }); }
      cur += s.dur ?? 0.4;
    }
    else if (s.do==='drag'){
      moveTo(w2s(s.from)); cur += 0.06;
      const to = w2s(s.to);
      tl.moves.push({ t0:cur, t1:cur+s.dur, from:pos, to, arc:false });
      tl.objects.push({ ...s.make, x0:s.from[0], y0:s.from[1], x1:s.to[0], y1:s.to[1], t0:cur, t1:cur+s.dur, tEnd:Infinity });
      pos = to; cur += s.dur + 0.12;
    }
    else if (s.do==='click'){
      const o = { ...s.make, x:s.at[0], y:s.at[1], tEnd:Infinity };
      if (o.type==='text' && o.align==='center') o.x -= textWidth(o.text, o.size, o.weight||800)/2;
      moveTo(w2s(o.type==='text' ? [o.x, o.y - o.size*0.3] : s.at)); cur += 0.06;
      tl.clicks.push({ t:cur, x:pos[0], y:pos[1] });
      o.t0 = cur; o.t1 = cur + 0.6;
      if (o.type==='fill'){
        o.shape = shapeAt(s.at, cur);
        tl.fg.push({ t:cur-0.3, c:o.color });
        if (o.textColor && o.shape){
          const b = boxOf(o.shape), [dx,dy] = offsetAt(o.shape, cur);
          for (const q of tl.objects) if (q.type==='text'){
            const [qx,qy] = offsetAt(q, cur);
            if (inBox([q.x+qx+1, q.y+qy-1], [b[0]+dx,b[1]+dy,b[2],b[3]])) (q.recolor ||= []).push({ t:cur+0.22, c:o.textColor });
          }
        }
        cur += 0.5;
      } else if (o.type==='text'){
        o.marks = []; lastText = o; cur += 0.1;
      }
      tl.objects.push(o);
    }
    else if (s.do==='type' && lastText){
      const o = lastText, prevN = o.marks.length ? o.marks[o.marks.length-1].n1 : 0;
      const n1 = s.upto ? o.text.indexOf(s.upto) + s.upto.length : o.text.length;
      o.marks.push({ t0:cur, t1:cur+s.dur, n0:prevN, n1 });
      if (!o.movedAway){
        o.movedAway = true;
        const away = [pos[0]+60, pos[1]+130];
        tl.moves.push({ t0:cur, t1:cur+0.4, from:pos, to:away, arc:false }); pos = away;
      }
      cur += s.dur;
      if (n1 >= o.text.length) o.commit = cur + 0.3;
    }
    else if (s.do==='zoom'){
      if (s.label) tl.keys.push({ t:cur, label:s.label, x:pos[0], y:pos[1] });
      const c2 = fitCam(s.rect, s.pad ?? 40);
      tl.cams.push({ t0:cur+0.12, t1:cur+0.12+s.dur, from:cam, to:c2 });
      cam = c2; cur += s.dur + 0.12;
    }
    else if (s.do==='stroke'){
      const pts = catmull(s.pts, s.smooth ?? 18);
      moveTo(w2s(pts[0])); cur += 0.06;
      const spts = pts.map(w2s);
      tl.moves.push({ t0:cur, t1:cur+s.dur, path:spts });
      tl.objects.push({ ...s.make, pts, t0:cur, t1:cur+s.dur, tEnd:Infinity });
      pos = spts[spts.length-1]; cur += s.dur + 0.12;
    }
    else if (s.do==='move'){
      // Selección: agarra la figura bajo el punto y la arrastra con todo lo que contiene
      const sh = shapeAt(s.grab, cur);
      moveTo(w2s(s.grab)); cur += 0.06;
      tl.clicks.push({ t:cur, x:pos[0], y:pos[1] });
      const b = boxOf(sh), [ox,oy] = offsetAt(sh, cur), box = [b[0]+ox,b[1]+oy,b[2],b[3]];
      const group = tl.objects.filter(q => q===sh || (q.t0<=cur && q!==sh && q.type!=='photo' &&
        inBox(q.type==='text' ? [q.x+offsetAt(q,cur)[0]+1, q.y+offsetAt(q,cur)[1]-1] : q.type==='fill' ? [q.x,q.y] : [Math.min(q.x0,q.x1)+1, Math.min(q.y0,q.y1)+1], box)));
      const m = { t0:cur+0.08, t1:cur+0.08+s.dur, dx:s.by[0], dy:s.by[1] };
      for (const q of group) (q.moves ||= []).push(m);
      tl.selections.push({ t0:cur, t1:m.t1+0.45, shape:sh });
      const to = w2s([s.grab[0]+s.by[0], s.grab[1]+s.by[1]]);
      tl.moves.push({ t0:m.t0, t1:m.t1, from:pos, to, arc:false });
      pos = to; cur = m.t1 + 0.12;
    }
  }
  tl.duration = Math.max(cur, SC.duration || 0);
  return tl;
}

/* =====================================================================
   RENDER(t)
   ===================================================================== */
function camAt(tl, t){
  let c = tl.cam0;
  for (const k of tl.cams){
    if (t < k.t0) break;
    if (t <= k.t1){
      const e = ease(clamp01((t-k.t0)/(k.t1-k.t0)));
      const s = Math.exp(lerp(Math.log(k.from.s), Math.log(k.to.s), e));
      const f = Math.abs(k.from.s-k.to.s) < 1e-6 ? e : (s - k.from.s)/(k.to.s - k.from.s);
      return { s, x:lerp(k.from.x,k.to.x,f), y:lerp(k.from.y,k.to.y,f) };
    }
    c = k.to;
  }
  return c;
}
function cursorAt(tl, t){
  let p = null;
  for (const m of tl.moves){
    if (t < m.t0) break;
    if (t <= m.t1){
      const k = clamp01((t-m.t0)/(m.t1-m.t0));
      if (m.path){ const f = k*(m.path.length-1), i = Math.floor(f), r = f-i, a = m.path[i], b = m.path[Math.min(i+1,m.path.length-1)]; return [lerp(a[0],b[0],r), lerp(a[1],b[1],r)]; }
      const e = ease(k);
      let x = lerp(m.from[0], m.to[0], e), y = lerp(m.from[1], m.to[1], e);
      if (m.arc){ const dx=m.to[0]-m.from[0], dy=m.to[1]-m.from[1], d=Math.hypot(dx,dy), bow=Math.sin(Math.PI*e)*d*0.08; x += -dy/d*bow; y += dx/d*bow; }
      return [x,y];
    }
    p = m.path ? m.path[m.path.length-1] : m.to;
  }
  return p ?? (tl.moves[0] ? tl.moves[0].from : [W*0.7,H*0.7]);
}

function buildStatic(){
  for (const id of ['stage','world','ui']){ const e=$(id); e.setAttribute?.('width',W); e.setAttribute?.('height',H); e.style.width=W+'px'; e.style.height=H+'px'; }
  for (const id of ['bg','dotLayer']){ $(id).setAttribute('width',W); $(id).setAttribute('height',H); }
  if (GLASS) Object.assign($('glass').style,{display:'block',left:TB.x+'px',top:TB.y+'px',width:TB.w+'px',height:TB.h+'px'});
}

function renderToolbar(tl, t){
  const active = lastBefore(tl.tool, t).id;
  const hover = tl.hovers.find(h=>t>=h.t0 && t<=h.t1);
  let g = GLASS ? '' : `<rect x="${TB.x}" y="${TB.y}" width="${TB.w}" height="${TB.h}" rx="${TB.r}" fill="#202126" stroke="#30323A" stroke-width="1.5" filter="url(#tbShadow)"/>`;
  for (const tool of TOOLS){
    const b = btnRect(tool.id), on = tool.id===active, hv = hover && hover.id===tool.id && !on;
    const pr = tl.press.find(p=>t>=p.t && t<=p.t+0.16 && p.id===tool.id), sc = pr ? 0.88 : 1;
    const bg = on ? ACCENT : hv ? (GLASS ? 'rgba(255,255,255,.12)' : '#30323A') : 'none';
    g += `<g transform="translate(${b.cx},${b.cy}) scale(${sc}) translate(${-b.cx},${-b.cy})">
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${Math.round(TB.btn*0.24)}" fill="${bg}"/>
      ${iconSVG(tool.id, b.cx-TB.btn*0.29, b.cy-TB.btn*0.29, TB.btn*0.58, on ? '#FFFFFF' : '#D3D5DA')}</g>`;
  }
  const cx = TB.x + TB.w/2, line = GLASS ? 'rgba(255,255,255,.16)' : '#34363D';
  g += `<g fill="#7C7F88">${[-2,-1,0,1,2].map(i=>`<rect x="${cx+i*8-1.5}" y="${TB.y+TB.pad+12}" width="3" height="12" rx="1.5"/>`).join('')}</g>`;
  const fy = TB.btnY0 + TB.btnsH + 18, fg = lastBefore(tl.fg, t).c;
  g += `<rect x="${TB.x+20}" y="${fy}" width="${TB.w-40}" height="1.5" fill="${line}"/>
    <rect x="${cx-16}" y="${fy+56}" width="58" height="58" rx="10" fill="none" stroke="#0E0F12" stroke-width="16"/>
    <rect x="${cx-16}" y="${fy+56}" width="58" height="58" rx="10" fill="none" stroke="#E6E7EA" stroke-width="10"/>
    <rect x="${cx-42}" y="${fy+26}" width="58" height="58" rx="10" fill="${fg}" stroke="#E6E7EA" stroke-width="3"/>
    <path d="M${cx+20} ${fy+22}h14v14" fill="none" stroke="#9EA1A9" stroke-width="2.5" stroke-linecap="round"/>
    <g transform="translate(${cx-42},${fy+150})">
      <rect width="24" height="24" rx="5" fill="#FFFFFF"/>
      <rect x="30" width="24" height="24" rx="5" fill="url(#icoGrad)" stroke="#9EA1A9" stroke-width="1"/>
      <rect x="60" width="24" height="24" rx="5" fill="#FFFFFF"/><path d="M62 22 82 2" stroke="#E5484D" stroke-width="3"/></g>
    <rect x="${TB.x+20}" y="${fy+196}" width="${TB.w-40}" height="1.5" fill="${line}"/>
    <rect x="${TB.x+TB.pad}" y="${fy+214}" width="${TB.btn}" height="44" rx="12" fill="${GLASS?'rgba(255,255,255,.08)':'#2A2C32'}"/>
    <g fill="#C9CBD1">${[-1,0,1].map(i=>`<circle cx="${cx+i*14}" cy="${fy+236}" r="3.5"/>`).join('')}</g>`;
  $('toolbar').innerHTML = g;
  return { active, hover };
}

/* Foto plana (paisaje) con fondo de transparencia: lo borrado deja ver el tablero */
function photoSVG(o, t, px){
  const { x, y, w, h, pal } = o, r = o.r ?? 14, id = o.id;
  const sx = o.sunX ?? 0.72, pk = o.peaks ?? [0.42, 0.5];
  const erases = o._erases || [];
  let mask = '';
  if (erases.length){
    mask = `<mask id="m_${id}" maskUnits="userSpaceOnUse" x="${x-5}" y="${y-5}" width="${w+10}" height="${h+10}">
      <rect x="${x-5}" y="${y-5}" width="${w+10}" height="${h+10}" fill="#fff"/>`;
    for (const e of erases){
      if (t < e.t0) continue;
      const n = Math.max(2, Math.round(e.pts.length * clamp01((t-e.t0)/(e.t1-e.t0))));
      mask += `<polyline points="${e.pts.slice(0,n).map(p=>p.join(',')).join(' ')}" fill="none" stroke="#000" stroke-width="${e.width}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    mask += `</mask>`;
  }
  return `${mask}
    <clipPath id="c_${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath>
    <text x="${x+2}" y="${y-12}" font-size="${o.labelSize ?? 19}" font-weight="500" fill="#8E929C">${esc(o.label||'')}</text>
    <g clip-path="url(#c_${id})">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#checker)"/>
      <g ${erases.length ? `mask="url(#m_${id})"` : ''}>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${pal[0]}"/>
        <circle cx="${x+w*sx}" cy="${y+h*0.32}" r="${h*0.13}" fill="${pal[1]}"/>
        <path d="M${x} ${y+h*0.8}L${x+w*0.3} ${y+h*pk[0]}L${x+w*0.55} ${y+h*0.7}L${x+w*0.76} ${y+h*pk[1]}L${x+w} ${y+h*0.76}V${y+h}H${x}z" fill="${pal[2]}"/>
        <path d="M${x} ${y+h*0.9}L${x+w*0.42} ${y+h*0.64}L${x+w*0.82} ${y+h*0.93}L${x+w} ${y+h*0.86}V${y+h}H${x}z" fill="${pal[3]}"/>
        ${o.badge ? `<rect x="${x+12}" y="${y+12}" width="${textWidth(o.badge,19,800)+24}" height="32" rx="9" fill="rgba(20,22,28,.82)"/>
        <text x="${x+24}" y="${y+34}" font-size="19" font-weight="800" fill="#FFFFFF">${esc(o.badge)}</text>` : ''}
      </g>
    </g>`;
}

function renderWorld(tl, t, cam){
  const sp = 40*cam.s, pat = $('dots');
  pat.setAttribute('width', sp); pat.setAttribute('height', sp);
  pat.setAttribute('x', ((cam.x % sp)+sp)%sp); pat.setAttribute('y', ((cam.y % sp)+sp)%sp);
  const dot = $('dot'); dot.setAttribute('cx', sp/2); dot.setAttribute('cy', sp/2); dot.setAttribute('r', Math.max(1.2, 2.4*Math.sqrt(Math.min(cam.s,1.6))));
  const px = 1/cam.s;
  const live = o => t >= o.t0 && t < o.tEnd;
  const L = { photo:'', shape:'', fill:'', text:'', stroke:'', marquee:'', sel:'' };
  for (const o of tl.objects){
    if (!live(o)) continue;
    const k = clamp01((t-o.t0)/((o.t1??o.t0+1)-o.t0)), [dx,dy] = offsetAt(o,t);
    const wrap = s => (dx||dy) ? `<g transform="translate(${dx},${dy})">${s}</g>` : s;
    if (o.type==='photo'){
      const a = o.appear < 0 ? 1 : clamp01((t-o.appear)/0.35), sc = o.appear < 0 ? 1 : lerp(0.82, 1, easeBack(a));
      const cx = o.x+o.w/2, cy = o.y+o.h/2;
      L.photo += `<g opacity="${clamp01(a*1.4)}" transform="translate(${cx},${cy}) scale(${sc}) translate(${-cx},${-cy})">${photoSVG(o,t,px)}</g>`;
    }
    else if (o.type==='shape'){
      const kk = ease(k), x1 = lerp(o.x0,o.x1,kk), y1 = lerp(o.y0,o.y1,kk);
      const x = Math.min(o.x0,x1), y = Math.min(o.y0,y1), w = Math.abs(x1-o.x0), h = Math.abs(y1-o.y0);
      const r = Math.min(o.r||0, w/2, h/2), outline = 1 - clamp01((t-o.t1)/0.35);
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${o.fill}"/>`;
      if (outline>0) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${ACCENT}" stroke-width="${3*px}" opacity="${outline}"/>`;
      L.shape += wrap(s);
    }
    else if (o.type==='fill' && o.shape){
      const id = 'f'+Math.round(o.t0*1000), b = boxOf(o.shape), [sx,sy] = offsetAt(o.shape,t);
      const R = Math.hypot(Math.max(o.x-b[0]-sx, b[0]+sx+b[2]-o.x), Math.max(o.y-b[1]-sy, b[1]+sy+b[3]-o.y)) * easeOut(k);
      L.fill += `<clipPath id="${id}"><rect x="${b[0]+sx}" y="${b[1]+sy}" width="${b[2]}" height="${b[3]}" rx="${o.shape.r||0}"/></clipPath>
        <circle cx="${o.x}" cy="${o.y}" r="${R}" fill="${o.color}" clip-path="url(#${id})"/>`;
    }
    else if (o.type==='text'){
      let n = 0;
      for (const m of o.marks||[]) if (t >= m.t0) n = Math.round(lerp(m.n0, m.n1, clamp01((t-m.t0)/(m.t1-m.t0))));
      const str = o.text.slice(0, n), wgt = o.weight||800, tw = str ? textWidth(str, o.size, wgt) : 0;
      const col = o.recolor ? (o.recolor.filter(r=>t>=r.t).pop()?.c ?? o.color ?? INK) : (o.color ?? INK);
      let s = `<text x="${o.x}" y="${o.y}" font-size="${o.size}" font-weight="${wgt}" fill="${col}" letter-spacing="${o.spacing??0}">${esc(str)}</text>`;
      if (!(o.commit && t >= o.commit)){
        const typing = (o.marks||[]).some(m=>t>=m.t0 && t<=m.t1);
        if (typing || Math.floor((t-o.t0)*2.4)%2===0) s += `<rect x="${o.x+tw+4}" y="${o.y-o.size*0.8}" width="${3*px}" height="${o.size*0.95}" fill="#111"/>`;
        s += `<rect x="${o.x-2}" y="${o.y+o.size*0.16}" width="${Math.max(tw+10,24)}" height="${2.5*px}" fill="${ACCENT}"/>`;
      }
      L.text += wrap(s);
    }
    else if (o.type==='stroke'){
      const n = Math.max(2, Math.round(o.pts.length * k));
      L.stroke += wrap(`<polyline points="${o.pts.slice(0,n).map(p=>p.join(',')).join(' ')}" fill="none" stroke="${o.color}" stroke-width="${o.width}" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    else if (o.type==='marquee'){
      const kk = ease(k), x1 = lerp(o.x0,o.x1,kk), y1 = lerp(o.y0,o.y1,kk);
      const x = Math.min(o.x0,x1), y = Math.min(o.y0,y1), w = Math.abs(x1-o.x0), h = Math.abs(y1-o.y0);
      L.marquee += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(13,153,255,.08)" stroke="${ACCENT}" stroke-width="${2*px}" stroke-dasharray="${8*px} ${6*px}"/>`;
    }
  }
  // caja de selección (Selección arrastrando una figura)
  for (const s of tl.selections){
    if (t < s.t0 || t > s.t1) continue;
    const a = 1 - clamp01((t-(s.t1-0.2))/0.2), b = boxOf(s.shape), [dx,dy] = offsetAt(s.shape,t);
    const x = b[0]+dx, y = b[1]+dy, w = b[2], h = b[3], hs = 14*px;
    const pts = [[x,y],[x+w/2,y],[x+w,y],[x+w,y+h/2],[x+w,y+h],[x+w/2,y+h],[x,y+h],[x,y+h/2]];
    L.sel += `<g opacity="${a}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${ACCENT}" stroke-width="${2.5*px}"/>
      ${pts.map(p=>`<rect x="${p[0]-hs/2}" y="${p[1]-hs/2}" width="${hs}" height="${hs}" fill="#fff" stroke="${ACCENT}" stroke-width="${2*px}"/>`).join('')}</g>`;
  }
  $('cam').setAttribute('transform', `translate(${cam.x},${cam.y}) scale(${cam.s})`);
  $('cam').innerHTML = L.photo + L.shape + L.fill + L.text + L.stroke + L.marquee + L.sel;
}

function cursorSVG(kind, x, y, r){
  const OUT = d => `<path d="${d}" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  switch(kind){
    case 'cross': return `<g transform="translate(${x},${y})">${OUT('M-26 0h18M8 0h18M0 -26v18M0 8v18')}</g>`;
    case 'ibeam': return `<g transform="translate(${x},${y})">${OUT('M-10 -26q10 0 10 6v40q0 6 -10 6M10 -26q-10 0 -10 6v40q0 6 10 6')}</g>`;
    case 'circle': return `<g transform="translate(${x},${y})"><circle r="${r+1.5}" fill="none" stroke="#000" stroke-width="3"/><circle r="${r}" fill="none" stroke="#fff" stroke-width="2"/></g>`;
    case 'bucket': return `<g transform="translate(${x-9},${y-62}) scale(3)">
        <path d="M3.8 11.2 11 4l8 8-7.2 7.2a1.5 1.5 0 0 1-2.1 0l-5.9-5.9a1.5 1.5 0 0 1 0-2.1z" fill="#fff" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M8.5 6.5 5.5 3.5" stroke="#000" stroke-width="1.3" stroke-linecap="round"/>
        <path d="M3.4 20.2s-1.6-2.1-1.6-3.2a1.6 1.6 0 0 1 3.2 0c0 1.1-1.6 3.2-1.6 3.2z" fill="#fff" stroke="#000" stroke-width="1"/></g>`;
    case 'direct': return `<g transform="translate(${x},${y}) scale(2.1)"><path d="M0 0v22l5.2-4.8 3.6 7.8 3.4-1.5-3.6-7.6H16z" fill="#fff" stroke="#000" stroke-width="1.3" stroke-linejoin="round"/></g>`;
    default: return `<g transform="translate(${x},${y}) scale(2.1)"><path d="M0 0v22l5.2-4.8 3.6 7.8 3.4-1.5-3.6-7.6H16z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></g>`;
  }
}

function renderOverlay(tl, t, active, hover, cam){
  let g = '';
  if (hover){
    const a = clamp01((t-hover.t0)/0.12) * (1-clamp01((t-(hover.t1-0.12))/0.12));
    const b = btnRect(hover.id), tool = TOOLS[toolIndex[hover.id]];
    const kw = Math.max(40, textWidth(tool.key, 22, 700) + 18), tw = textWidth(tool.name, 26, 600) + kw + 60;
    const x = TB.x + TB.w + 16, y = b.cy - 30;
    g += `<g opacity="${a}" filter="url(#tipShadow)">
      <rect x="${x}" y="${y}" width="${tw}" height="60" rx="14" fill="#2A2B31" stroke="#3E4048"/>
      <text x="${x+20}" y="${y+39}" font-size="26" font-weight="600" fill="#F2F2F2">${esc(tool.name)}</text>
      <rect x="${x+tw-kw-18}" y="${y+12}" width="${kw}" height="36" rx="9" fill="#1B1C20" stroke="#55575F"/>
      <text x="${x+tw-kw/2-18}" y="${y+38}" font-size="22" font-weight="700" fill="#E6E6E6" text-anchor="middle">${esc(tool.key)}</text></g>`;
  }
  for (const c of tl.clicks){
    const k = (t-c.t)/0.45; if (k<0||k>1) continue;
    g += `<circle cx="${c.x}" cy="${c.y}" r="${10+46*easeOut(k)}" fill="none" stroke="${ACCENT}" stroke-width="${5*(1-k)+1}" opacity="${1-k}"/>`;
  }
  for (const kk of tl.keys){
    const k = (t-kk.t)/0.75; if (k<0||k>1) continue;
    const pop = k<0.2 ? easeOut(k/0.2) : 1, a = k>0.75 ? 1-(k-0.75)/0.25 : 1;
    const w = Math.max(76, textWidth(kk.label, 34, 800) + 44);
    const x = Math.min(kk.x+34, W-w-24), y = Math.min(kk.y+40, H-110);
    g += `<g opacity="${a}" transform="translate(${x+w/2},${y+38}) scale(${0.6+0.4*pop}) translate(${-(x+w/2)},${-(y+38)})">
      <rect x="${x}" y="${y+6}" width="${w}" height="76" rx="16" fill="#0E0E0E"/>
      <rect x="${x}" y="${y}" width="${w}" height="72" rx="16" fill="#F4F4F4" stroke="#0E0E0E" stroke-width="3"/>
      <text x="${x+w/2}" y="${y+48}" font-size="34" font-weight="800" fill="#141414" text-anchor="middle">${esc(kk.label)}</text></g>`;
  }
  const [x,y] = cursorAt(tl, t);
  const overUI = x > TB.x && x < TB.x+TB.w && y > TB.y && y < TB.y+TB.h;
  const toolSize = { eraser:(window.SCENE.eraserWidth||30)/2, brush:7 };
  const kind = overUI ? 'arrow' : ({ rect:'cross', ellipse:'cross', line:'cross', artboard:'cross', type:'ibeam',
               bucket:'bucket', brush:'circle', eraser:'circle', direct:'direct' }[active] ?? 'arrow');
  g += cursorSVG(kind, x, y, Math.max(6, (toolSize[active]||7)*cam.s));
  $('overlay').innerHTML = g;
}

let TL;
window.renderAt = function(t){
  const cam = camAt(TL, t);
  const { active, hover } = renderToolbar(TL, t);
  renderWorld(TL, t, cam);
  renderOverlay(TL, t, active, hover, cam);
};

async function boot(){
  await document.fonts.ready;
  buildStatic();
  TL = compile(window.SCENE); window.TL = TL;
  // borraduras: se registran en la foto que tocan
  for (const o of TL.objects) if (o.type==='erase'){
    const target = TL.objects.find(q=>q.id===o.target); (target._erases ||= []).push(o); o.tEnd = -1;
  }
  if (TL.late.length) console.warn('Acciones tarde respecto al audio:\n' + TL.late.join('\n'));
  if (!P.has('render')){
    const stage = $('stage');
    const fit = () => { const s = Math.min(innerWidth/W, innerHeight/H); stage.style.transform = `scale(${s})`; stage.style.left = (innerWidth-W*s)/2+'px'; };
    addEventListener('resize', fit); fit();
    const audio = window.SCENE.audio ? new Audio(window.SCENE.audio.src) : null;
    let t0 = performance.now();
    if (audio){ audio.currentTime = window.SCENE.audio.start||0; document.addEventListener('click', ()=>{ t0 = performance.now(); audio.currentTime = window.SCENE.audio.start||0; audio.play(); }); }
    const loop = () => { const t = (performance.now()-t0)/1000; renderAt(Math.min(t, TL.duration)); requestAnimationFrame(loop); };
    loop();
  } else renderAt(0);
  window.READY = true;
}
