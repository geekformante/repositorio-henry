// Uso:
//   node render.js stills 0.5 3.2 9.8 [--solid] [--h=1920]  → out/frame_<t>.png
//   node render.js video [--solid] [--h=1920]                → out/demo[_glass][_9x16].mp4
//   node render.js clip 20 26 [--solid]                      → solo ese tramo (prueba rápida)
// Por defecto 1080×2340 (pantalla completa en iPhone, 9:19.5).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30;
const OUT = path.join(__dirname, 'out');

(async () => {
  const argv = process.argv.slice(2);
  const flags = argv.filter(a => a.startsWith('--'));
  const [mode, ...args] = argv.filter(a => !a.startsWith('--'));
  const solid = flags.includes('--solid');
  const H = +(flags.find(f => f.startsWith('--h='))?.slice(4) ?? 2340);
  const q = new URLSearchParams({ render: 1, h: H, scene: flags.find(f => f.startsWith('--scene='))?.slice(8) ?? 'jpgxl' }); if (solid) q.set('solid', 1);
  const suffix = (solid ? '_solid' : '') + (H === 1920 ? '_9x16' : '');

  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('ERROR en página:', e.message));
  await page.goto('file://' + path.join(__dirname, 'index.html') + '?' + q);
  await page.waitForFunction(() => window.READY === true);
  const duration = await page.evaluate(() => TL.duration);

  if (mode === 'stills') {
    for (const s of args) {
      await page.evaluate(t => renderAt(t), +s);
      await page.screenshot({ path: path.join(OUT, `frame_${s}${suffix}.png`) });
    }
  } else if (mode === 'video' || mode === 'clip') {
    const t0 = mode === 'clip' ? +args[0] : 0, t1 = mode === 'clip' ? +args[1] : duration;
    const scene = await page.evaluate(() => (new URLSearchParams(location.search).get('scene') || 'jpgxl'));
    const name = (mode === 'clip' ? 'clip_' : '') + scene + suffix + '.mp4';
    const tmp = path.join(OUT, name.replace('.mp4', '.tmp.mp4'));
    const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp],
      { stdio: ['pipe', 'ignore', 'inherit'] });
    const total = Math.ceil((t1 - t0) * FPS);
    for (let f = 0; f < total; f++) {
      await page.evaluate(t => renderAt(t), t0 + f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    const code = await new Promise(r => ff.on('close', r));
    if (code !== 0) throw new Error('ffmpeg falló: ' + code);
    const audio = mode === 'video' ? await page.evaluate(() => window.SCENE.audio || null) : null;
    if (audio) {
      // mezcla la voz: recorte [start, end] con salida suave y silencio hasta el final del video
      const len = audio.end - audio.start, final = path.join(OUT, name);
      const mux = spawn('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-ss', String(audio.start), '-t', String(len), '-i', path.join(__dirname, audio.src),
        '-filter_complex', `[1:a]afade=t=out:st=${Math.max(0, len - 0.2)}:d=0.2,apad[a]`,
        '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart',
        final.replace('.mp4', '.mux.mp4')], { stdio: ['ignore', 'ignore', 'inherit'] });
      if (await new Promise(r => mux.on('close', r)) !== 0) throw new Error('ffmpeg (audio) falló');
      fs.renameSync(final.replace('.mp4', '.mux.mp4'), final); fs.unlinkSync(tmp);
    } else fs.renameSync(tmp, path.join(OUT, name));
    console.log(`${name}: ${total} frames${audio ? ' + audio' : ''}`);
  }
  console.log('duración del guion:', duration.toFixed(2), 's');
  await browser.close();
})();
