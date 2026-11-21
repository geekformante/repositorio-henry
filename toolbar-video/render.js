// Uso:
//   node render.js stills 0.5 3.2 9.8     → out/frame_<t>.png en esos segundos
//   node render.js mockup                 → out/boceto.png y out/boceto_guias.png
//   node render.js video                  → out/demo.mp4 (1080×1920, 30 fps)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const FPS = 30;
const OUT = path.join(__dirname, 'out');
const URL = 'file://' + path.join(__dirname, 'index.html') + '?render=1';

(async () => {
  const [mode, ...args] = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(URL);
  await page.evaluate(() => document.fonts.ready);
  const duration = await page.evaluate(() => TL.duration);

  if (mode === 'stills') {
    for (const s of args) {
      await page.evaluate(t => renderAt(t), +s);
      await page.screenshot({ path: path.join(OUT, `frame_${s}.png`) });
    }
  } else if (mode === 'mockup') {
    const t = +(args[0] ?? 13.6);
    await page.evaluate(t => renderAt(t), t);
    await page.screenshot({ path: path.join(OUT, 'boceto.png') });
    await page.evaluate(t => renderAt(t, true), t);
    await page.screenshot({ path: path.join(OUT, 'boceto_guias.png') });
  } else if (mode === 'video') {
    const total = Math.ceil(duration * FPS);
    const tmp = path.join(OUT, 'demo.tmp.mp4');
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', tmp],
      { stdio: ['pipe', 'ignore', 'inherit'] });
    for (let f = 0; f < total; f++) {
      await page.evaluate(t => renderAt(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    const code = await new Promise(r => ff.on('close', r));
    if (code !== 0) throw new Error('ffmpeg falló: ' + code);
    fs.renameSync(tmp, path.join(OUT, 'demo.mp4'));
    console.log(`demo.mp4: ${total} frames, ${duration.toFixed(2)} s`);
  }
  console.log('duración del guion:', duration.toFixed(2), 's');
  await browser.close();
})();
