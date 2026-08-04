import { chromium } from 'playwright-core';
const name=process.argv[2],W=+process.argv[3],H=+process.argv[4];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const page=await b.newPage({viewport:{width:W,height:H}});const errors=[],warns=[];
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.text().includes('[pac]'))warns.push(m.text());});page.on('pageerror',e=>errors.push(String(e)));
await page.goto(`file://${process.cwd()}/preview-${name}.html`,{waitUntil:'networkidle'});await page.waitForTimeout(300);
function snap(){return page.evaluate(()=>{const vw=innerWidth,sb=Math.round(document.querySelector('.pac-stage').getBoundingClientRect().bottom),panels={};
  for(const p of document.querySelectorAll('.pac-panel')){const r=p.getBoundingClientRect();const k=(p.querySelector('.pac-panel-head')?.textContent?.trim()||p.dataset.type);panels[k]={x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)};}
  const over=[...document.querySelectorAll('.pac-panel')].filter(p=>p.getBoundingClientRect().right>vw+1).map(p=>(p.querySelector('.pac-panel-head')?.textContent||p.dataset.type).trim().slice(0,10));
  const clipV=[...document.querySelectorAll('.pac-panel')].filter(p=>p.getBoundingClientRect().bottom>sb+1).map(p=>(p.querySelector('.pac-panel-head')?.textContent||p.dataset.type).trim().slice(0,12));
  const hs=[...document.querySelectorAll('.pac-panel[data-kind="structure"] .pac-panel-body')].filter(b=>b.scrollWidth>b.clientWidth+1).length;
  return{panels,over,clipV,hstruct:hs,narr:document.querySelector('.pac-narrate')?.textContent?.trim()||''};})}
const base=await snap();const moves=[];const overs=new Set(),clipsV=new Set();let steps=0,hsMax=0;
for(let i=0;i<200;i++){const g=await snap();steps++;
  for(const k in g.panels){const a=base.panels[k],c=g.panels[k];if(!a)continue;if(a.x!==c.x||a.y!==c.y||a.w!==c.w||a.h!==c.h)moves.push(k);}
  g.over.forEach(o=>overs.add(o));g.clipV.forEach(o=>clipsV.add(o));hsMax=Math.max(hsMax,g.hstruct);
  await page.keyboard.press('ArrowRight');await page.waitForTimeout(9);const af=await page.evaluate(()=>document.querySelector('.pac-narrate')?.textContent?.trim()||'');if(af===g.narr)break;}
console.log(`${name}: ${steps}st | moves:${[...new Set(moves)].length?[...new Set(moves)].join(','):'0'} | overVP:${overs.size?[...overs]:'none'} | clipStage:${clipsV.size?[...clipsV]:'none'} | structHscroll:${hsMax} | warn:${warns.length} | err:${errors.length?errors.slice(0,2):'none'}`);
await b.close();
