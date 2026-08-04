import { chromium } from 'playwright-core';
const [,,name]=process.argv;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page=await b.newPage({viewport:{width:1920,height:1080}});
await page.goto(`file://${process.cwd()}/preview-${name}.html`,{waitUntil:'networkidle'});await page.waitForTimeout(300);
const r=await page.evaluate(()=>{
  const stage=document.querySelector('.pac-stage').getBoundingClientRect();
  const cols=[...document.querySelectorAll('.pac-col')].map((c,i)=>{
    const cb=c.getBoundingClientRect();
    const panels=[...c.querySelectorAll('.pac-panel')].map(p=>{const r=p.getBoundingClientRect();return{t:(p.querySelector('.pac-panel-head')?.textContent||p.dataset.type).trim().slice(0,14),top:+r.top.toFixed(1),bottom:+r.bottom.toFixed(1),h:+r.height.toFixed(1)};});
    const last=panels.reduce((m,p)=>p.bottom>m.bottom?p:m,{bottom:0});
    return{col:i,colBottom:+cb.bottom.toFixed(1),lastPanelBottom:last.bottom,gap:+(cb.bottom-last.bottom).toFixed(1),panels};
  });
  return{stageBottom:+stage.bottom.toFixed(1),stageH:+stage.height.toFixed(1),cols};
});
console.log('###',name,'stageBottom',r.stageBottom);
for(const c of r.cols){console.log(`  col${c.col} colBottom=${c.colBottom} lastPanel=${c.lastPanelBottom} slack=${c.gap}`);
  for(const p of c.panels)console.log(`      ${p.t.padEnd(15)} top=${p.top} bottom=${p.bottom} h=${p.h}`);}
await b.close();
