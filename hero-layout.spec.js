const { chromium } = require('C:/Users/bb201/AppData/Roaming/npm/node_modules/playwright/index.js');
const VIEWPORTS = [[360,740,'Galaxy S8+'],[390,844,'iPhone 12/13/14'],[414,896,'iPhone XR'],[430,932,'iPhone 15 Pro Max'],[768,1024,'iPad portrait']];
let fail = 0;
const ck = (n,p,d) => { console.log(`  ${p?'PASS':'FAIL'}  ${n}  ${d}`); if(!p) fail++; };
(async () => {
  const b = await chromium.launch();
  for (const [w,h,label] of VIEWPORTS) {
    const p = await b.newPage({viewport:{width:w,height:h}, deviceScaleFactor:2});
    await p.goto('file:///C:/Users/bb201/Documents/curva/index.html');
    await p.waitForTimeout(1500);                       // fonts + reveal settle. NO scrolling.
    const m = await p.evaluate(() => {
      const q=s=>document.querySelector(s), rect=s=>q(s).getBoundingClientRect();
      const copy=q('.hero-copy'), cb=copy.getBoundingClientRect();
      const contentBottom=Math.max(...[...copy.children].map(e=>e.getBoundingClientRect().bottom));
      const btns=[...document.querySelectorAll('.hero-actions .btn')].map(e=>e.getBoundingClientRect());
      const rows=new Set(btns.map(r=>Math.round(r.top))).size;
      // largest vertical void between consecutive laid-out copy children
      let maxGap=0;
      const ch=[...copy.children].map(e=>e.getBoundingClientRect());
      for(let i=1;i<ch.length;i++) maxGap=Math.max(maxGap, ch[i].top-ch[i-1].bottom);
      return {
        heroH:+rect('.hero').height.toFixed(1), copyH:+cb.height.toFixed(1),
        slack:+(cb.bottom-contentBottom).toFixed(1), bottleH:+rect('.hero-bottle-wrap').height.toFixed(1),
        actH:+rect('.hero-actions').height.toFixed(1), btnRows:rows,
        btnH:btns.length?+btns[0].height.toFixed(1):0, minBtnW:Math.min(...btns.map(r=>r.width)),
        actTop:+rect('.hero-actions').top.toFixed(1), maxGap:+maxGap.toFixed(1),
        allIn:[...document.querySelectorAll('.hero .r-wipe')].every(e=>e.classList.contains('is-in')),
        actOp:+getComputedStyle(q('.hero-actions')).opacity, cueOp:+getComputedStyle(q('.hero-cue')).opacity,
        stageTop:+rect('.hero-stage').top.toFixed(1), navBottom:+rect('.nav').bottom.toFixed(1),
        docW:document.documentElement.scrollWidth, vw:innerWidth,
      };
    });
    console.log(`\n${label}  ${w}x${h}`);
    console.log(`  hero=${m.heroH} copy=${m.copyH} bottle=${m.bottleH} actions=${m.actH} actTop=${m.actTop}`);
    ck('copy box tight to its content',        m.slack<=0.6,                    `slack=${m.slack}px`);
    ck('whole hero revealed at load (no void)',m.allIn&&m.actOp>0.9&&m.cueOp>0.9,`allIn=${m.allIn} op=${m.actOp}/${m.cueOp}`);
    ck('CTA row tight (no ragged wrap)',       m.actH<=m.btnH*m.btnRows+12,     `actH=${m.actH} rows=${m.btnRows} btnH=${m.btnH}`);
    ck('no dead gap >48px inside copy',        m.maxGap<=48,                    `maxGap=${m.maxGap}px`);
    ck('hero <= 1.30x viewport height',        m.heroH<=h*1.30,                 `${m.heroH} vs ${(h*1.30).toFixed(0)}`);
    ck('bottle <= 47% of viewport height',     m.bottleH<=h*0.47,               `${m.bottleH} (${(m.bottleH/h*100).toFixed(1)}%)`);
    ck('bottle clears the fixed nav',          m.stageTop>=m.navBottom-0.5,     `stage=${m.stageTop} nav=${m.navBottom}`);
    ck('CTA tap targets >=44px tall',          m.btnH>=44,                      `btnH=${m.btnH}`);
    ck('no horizontal overflow',               m.docW<=m.vw+1,                  `doc=${m.docW} vw=${m.vw}`);
    await p.close();
  }
  await b.close();
  console.log(`\n${fail===0?'*** ALL PASS ***':fail+' FAILING'}`);
  process.exit(fail?1:0);
})();
