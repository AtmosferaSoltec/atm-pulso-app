import { chromium } from "playwright-core";
import os from "os";
const exe = os.homedir()+"/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const b = await chromium.launch({ executablePath: exe });
const names={1:"1-miembros",2:"2-ficha",3:"3-renovar",4:"4-venta"};
const out="/Users/jmaldonado/Documents/Atmosfera/pulso/atm-pulso-app/store/screenshots/";
for (const n of [1,2,3,4]) {
  const p = await b.newPage({viewport:{width:1080,height:1920}});
  await p.goto("file://"+process.cwd()+"/slide.html#"+n); await p.reload(); await p.waitForTimeout(800);
  await p.screenshot({path:out+names[n]+".png"});
}
await b.close();
