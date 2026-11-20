import { chromium } from "playwright-core";
import fs from "fs"; import os from "os";
const exe = os.homedir()+"/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const b = await chromium.launch({ executablePath: exe });
const files={1:"01-home",2:"02-ficha",3:"03-renovar",4:"04-venta"};
const names={1:"1-miembros",2:"2-ficha",3:"3-renovar",4:"4-venta"};
const out="/Users/jmaldonado/Documents/Atmosfera/pulso/atm-pulso-app/store/ios/screenshots/";
fs.mkdirSync(out,{recursive:true});
for (const n of [1,2,3,4]) {
  const probe = await b.newPage();
  const b64 = fs.readFileSync(`ios/${files[n]}.png`).toString("base64");
  await probe.setContent(`<img id=x src="data:image/png;base64,${b64}">`);
  const c = await probe.evaluate(async()=>{const im=document.getElementById("x");await im.decode();
    const cv=document.createElement("canvas");cv.width=im.width;cv.height=im.height;const g=cv.getContext("2d");g.drawImage(im,0,0);
    const px=(x,y)=>{const d=g.getImageData(x,y,1,1).data;return [d[0],d[1],d[2]]};
    const L=px(4,3),R=px(im.width-5,3);const lum=(a)=>(0.299*a[0]+0.587*a[1]+0.114*a[2]);
    return {l:`rgb(${L})`,r:`rgb(${R})`,dark:(lum(L)+lum(R))/2<140};});
  await probe.close();
  const p = await b.newPage({viewport:{width:1206,height:2622}});
  await p.goto(`file://${process.cwd()}/slide-ios.html?n=${n}&l=${encodeURIComponent(c.l)}&r=${encodeURIComponent(c.r)}&dark=${c.dark?1:0}`);
  await p.waitForTimeout(900);
  await p.screenshot({path:out+names[n]+".jpg",type:"jpeg",quality:100});
  console.log(n,c);
}
await b.close();
