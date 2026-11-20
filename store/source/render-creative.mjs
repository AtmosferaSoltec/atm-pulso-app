import { chromium } from "playwright-core";
import os from "os"; import fs from "fs";
const exe = os.homedir()+"/Library/Caches/ms-playwright/chromium-1254/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const b = await chromium.launch({ executablePath: exe });
const out="/Users/jmaldonado/Documents/Atmosfera/pulso/atm-pulso-app/store/ios/";
const jobs={header:[3840,1646,"header-3840x1646"],search:[3840,2560,"search-results-3840x2560"]};
for (const [k,[w,h,name]] of Object.entries(jobs)) {
  const p = await b.newPage({viewport:{width:w,height:h}});
  await p.goto(`file://${process.cwd()}/creative.html?k=${k}`);
  await p.waitForTimeout(900);
  await p.screenshot({path:`tmp-${k}.jpg`,type:"jpeg",quality:100});
  console.log(name);
}
await b.close();
