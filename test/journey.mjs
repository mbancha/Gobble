import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

fs.mkdirSync(new URL('../artifacts/',import.meta.url),{recursive:true});
const browser=await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : process.platform==='win32' ? {channel:'chrome'} : {});
try {
 const page=await browser.newPage({viewport:{width:1600,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{Math.random=()=>.42});
 await page.goto(new URL('../index.html',import.meta.url).href);
 await page.locator('#cfg-pointsToWin').fill('100');
 await page.locator('#speedSelect').selectOption('4');
 await page.locator('#btnNewGame').click();
 await page.locator('#btnAutoPlace').click();
 for(let round=1;round<=3;round++){
  const deadline=Date.now()+20000;
  while(true){
   if(await page.locator('#btnRespawn').isVisible())await page.locator('#btnRespawn').click();
   if(await page.locator('#btnAutoPlace').isVisible())await page.locator('#btnAutoPlace').click();
   const ready=await page.evaluate(()=>Gobble.LIVE.currentHuman!==null&&!Gobble.LIVE.placing&&Gobble.LIVE.roundStarted&&document.querySelector('#countdownOverlay').classList.contains('hidden'));
   if(ready)break;
   if(Date.now()>deadline)throw Error('Programming not ready: '+await page.evaluate(()=>JSON.stringify({phase:Gobble.LIVE.phase,placing:Gobble.LIVE.placing,round:Gobble.LIVE.engine.round,human:Gobble.LIVE.currentHuman})));
   await page.waitForTimeout(50);
  }
  const before=await page.evaluate(()=>Gobble.LIVE.engine.round);
  const commands=await page.evaluate(()=>{const L=Gobble.LIVE;return Gobble.Bot.plan(L.engine,L.engine.players[L.currentHuman]).slice(0,2)});
  for(const command of commands){
   await page.locator(`[data-dir="${command.dir}"]`).click();
  }
  if(round===1){
   // Toggle a boost and cancel it before locking: exercise real program editing.
   await page.locator('[data-boost="0"]').click();await page.locator('[data-boost="0"]').click();
   await page.locator('#btnLock').waitFor({state:'visible'});
   await page.waitForTimeout(250);
   await page.screenshot({path:fileURLToPath(new URL('../artifacts/desktop-programming.png',import.meta.url)),fullPage:true});
  }
  await page.locator('#btnLock').click();
  await page.waitForFunction(n=>Gobble.LIVE.engine.round>n||Gobble.LIVE.engine.gameOver,before,{timeout:20000});
  assert.equal(await page.evaluate(()=>Gobble.LIVE.engine.gameOver),false);
  if(await page.locator('#btnRespawn').isVisible())await page.locator('#btnRespawn').click();
  if(await page.locator('#btnAutoPlace').isVisible())await page.locator('#btnAutoPlace').click();
 }
 // The round counter advances before the respawn UI finishes appearing.
 // Keep servicing placement instead of waiting passively behind its prompt.
 const readyBy=Date.now()+20000;
 while(true) {
  if(await page.locator('#btnRespawn').isVisible())await page.locator('#btnRespawn').click();
  if(await page.locator('#btnAutoPlace').isVisible())await page.locator('#btnAutoPlace').click();
  if(await page.evaluate(()=>Gobble.LIVE.engine.round===4&&Gobble.LIVE.roundStarted&&Gobble.LIVE.currentHuman!==null&&!Gobble.LIVE.placing&&document.querySelector('#countdownOverlay').classList.contains('hidden')))break;
  if(Date.now()>readyBy)throw Error('Round four unavailable: '+await page.evaluate(()=>JSON.stringify({round:Gobble.LIVE.engine.round,placing:Gobble.LIVE.placing,human:Gobble.LIVE.currentHuman,phase:Gobble.LIVE.phase})));
  await page.waitForTimeout(50);
 }
 await page.locator('#btnLock').waitFor({state:'visible'});
 await page.waitForTimeout(250);
 await page.screenshot({path:fileURLToPath(new URL('../artifacts/desktop-round-four.png',import.meta.url)),fullPage:true});
 const outcome=await page.evaluate(()=>({round:Gobble.LIVE.engine.round,scores:Gobble.LIVE.engine.players.map(p=>p.score),board:Gobble.LIVE.engine.W}));
 assert.equal(outcome.board,8);assert.equal(outcome.round,4);assert.ok(outcome.scores.some(s=>s>0));
 await page.setViewportSize({width:1024,height:768});
 await page.screenshot({path:fileURLToPath(new URL('../artifacts/tablet-round-four.png',import.meta.url)),fullPage:true});
 await page.setViewportSize({width:1600,height:1000});
 await page.locator('#cfg-playerCount').fill('6');await page.locator('#btnNewGame').click();await page.locator('#btnAutoPlace').click();
 await page.waitForFunction(()=>Gobble.LIVE.roundStarted&&!Gobble.LIVE.placing&&document.querySelector('#countdownOverlay').classList.contains('hidden'));
 await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>Gobble.LIVE.engine.W),12);
 assert.equal(await page.evaluate(()=>Gobble.LIVE.engine.valid.size),116);
 await page.screenshot({path:fileURLToPath(new URL('../artifacts/desktop-six-players.png',import.meta.url)),fullPage:true});
 assert.deepEqual(errors,[]);
 await page.locator('#cfg-playerCount').fill('2');await page.locator('#btnNewGame').click();await page.locator('#btnAutoPlace').click();
 await page.waitForFunction(()=>Gobble.LIVE.roundStarted&&!Gobble.LIVE.placing&&document.querySelector('#countdownOverlay').classList.contains('hidden'));
 assert.equal(await page.evaluate(()=>Gobble.LIVE.engine.W),6);
 assert.equal(await page.evaluate(()=>Gobble.LIVE.engine.food.size),1);
 await page.screenshot({path:fileURLToPath(new URL('../artifacts/desktop-two-players.png',import.meta.url)),fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('GUI journey passed:',JSON.stringify(outcome),'plus six-player shaped board and two-player 6x6 setup; no page errors');
}finally{await browser.close()}
