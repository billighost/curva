const { chromium } = require('C:/Users/bb201/AppData/Roaming/npm/node_modules/playwright/index.js');
// Measures the oil body's bounding width at rest vs. mid-fast-scroll.
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file:///C:/Users/bb201/Documents/curva/index.html');
  await p.waitForTimeout(1200);

  const widthOf = () => p.evaluate(() => {
    const bb = document.querySelector('#oilBody').getBBox();
    return +bb.width.toFixed(2);
  });

  // settle at a mid-page position so the ribbon is long and measurable
  await p.evaluate(() => window.scrollTo(0, 2200));
  await p.waitForTimeout(1500);
  const atRest = await widthOf();

  // fast continuous scroll, sampling while still in motion
  let narrowest = Infinity;
  for (let i = 0; i < 26; i++) {
    await p.evaluate(y => window.scrollTo(0, y), 2200 + i * 190);
    await p.waitForTimeout(16);
    narrowest = Math.min(narrowest, await widthOf());
  }
  await p.waitForTimeout(2500);            // let it park, then confirm recovery
  await p.evaluate(() => window.scrollTo(0, 2200));
  await p.waitForTimeout(1800);
  const recovered = await widthOf();

  const necked = (1 - narrowest / atRest) * 100;
  console.log(`rest=${atRest}  fastest=${narrowest}  recovered=${recovered}`);
  console.log(`necked by ${necked.toFixed(1)}%`);

  let fail = 0;
  const ck = (n, ok, d) => { console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}  ${d}`); if (!ok) fail++; };
  ck('ribbon necks under fast scroll', necked > 4, `${necked.toFixed(1)}% (want >4%)`);
  ck('neck stays subtle',              necked < 34, `${necked.toFixed(1)}% (want <34%)`);
  ck('ribbon recovers after stopping', Math.abs(recovered - atRest) / atRest < 0.06,
     `rest=${atRest} recovered=${recovered}`);   // catches the frozen-neck bug from Step 4
  await b.close();
  console.log(fail ? `\n${fail} FAILING` : '\n*** FLOW OK ***');
  process.exit(fail ? 1 : 0);
})();
