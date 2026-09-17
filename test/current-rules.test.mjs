import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const board=JSON.parse(fs.readFileSync(new URL('../print/board.json',import.meta.url)));
const browser=await chromium.launch(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : process.platform==='win32' ? {channel:'chrome'} : {});
try {
 const page=await browser.newPage();
 await page.goto(new URL('../index.html',import.meta.url).href);
 const result=await page.evaluate(board=>{
  const {Engine,makeConfig}=Gobble;
  const K=(x,y)=>(y<<6)|x;
  const check=(ok,message)=>{if(!ok)throw Error(message)};
  const make=(n=4,over={})=>new Engine(makeConfig({playerCount:n,...over}),Array.from({length:n},(_,i)=>({name:'P'+i,isBot:true})),()=>.8);
  for(const n of [2,3,4,5,6]){
   const e=make(n),size=n===2?6:n<=4?8:12,off=(12-size)/2;
   check(e.W===size&&e.H===size&&e.valid.size===(n===2?36:n<=4?64:116),`${n} players: dimensions`);
   check(e.spots.size===(n===2?12:n<=4?20:28)&&e.food.size===1,'food counts');
   for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const zone=Number(board.zones[y+off][x+off]);
    check(e.inBounds(x,y)===(zone<=n),'print/digital zone geometry');
    if(e.inBounds(x,y))check(e.zones.get(K(x,y))===zone,'print/digital zone color');
   }
   for(const [x,y] of board.regularFood.filter(([x,y])=>e.inBounds(x-off,y-off)))check(e.spots.get(K(x-off,y-off))?.value===1,'print/digital regular food');
   for(const [x,y] of board.specialFood)check(e.food.get(K(x-off,y-off))?.kind==='special','print/digital special food');
   const [special]=e.food.keys();
   check([size/2-1,size/2].includes(special&63)&&[size/2-1,size/2].includes(special>>6),'special is central');
   check(e.spawnFootprint()===3&&e.cfg.maxSnakeLength===13,'length defaults');
   check(e.cfg.freeBoostsPerRound===1&&e.cfg.panicSeconds===15,'boost/timer defaults');
  }
  const put=(e,body)=>{const p=e.players[0];p.body=body.map(([x,y])=>({x,y}));p.alive=true;p.facing='right';return p};
  // A boost cannot cut across an absent corner; legal placement cannot use it.
  const shaped=make(6);shaped.spots.clear();shaped.food.clear();
  let edge=put(shaped,[[4,0],[5,0],[6,0]]);edge.score=7;edge.commands=[{dir:'left',boost:true}];
  check(!shaped.validChain([{x:3,y:0},{x:4,y:0},{x:5,y:0}]),'void blocks placement');
  shaped.beginTick(0);while(shaped.stepTick().more){}shaped.finishTick();
  check(!edge.alive&&edge.score===7,'void kills without changing score');
  check([...shaped.food.keys()].every(k=>shaped.inBounds(k&63,k>>6)),'no food drops in void');
  for(const n of [2,3,4,5,6]) {
   const e=make(n);e.setup();e.respawnDead();
   check(e.players.every(p=>p.alive&&p.body.every(c=>e.inBounds(c.x,c.y))),`${n} players can spawn`);
   check(e.players.every(p=>p.body.some(c=>e.onOuterEdge(c.x,c.y))),`${n} players spawn on edge`);
  }
  const placement=make(6);placement.food.clear();
  check(placement.validChain([{x:4,y:1},{x:4,y:0},{x:5,y:0}]),'middle can touch edge');
  check(placement.validChain([{x:3,y:3},{x:3,y:2},{x:3,y:1}]),'tail can touch stepped edge');
  check(!placement.validChain([{x:4,y:4},{x:5,y:4},{x:6,y:4}]),'interior placement rejected');
  // If every edge is blocked, wait rather than spawning illegally in the middle.
  for(const k of placement.valid)if(placement.onOuterEdge(k&63,k>>6))placement.food.set(k,{kind:'bounty',value:2});
  check(placement.smartPlacement()===null,'no interior fallback when perimeter full');
  // Exactly two endpoints, including the tail lifted during a fatal step.
  const e=make();e.spots.clear();e.food.clear();
  let p=put(e,[[0,2],[1,2],[2,2],[3,2]]);p.commands=[{dir:'left'}];
  let calls=0;e.rng=()=>[0,.9][calls++];e.beginTick(0);while(e.stepTick().more){}e.finishTick();
  check(!p.alive&&e.food.size===2&&calls===2,'two independent endpoint rolls');
  check(e.food.get(K(0,2))?.kind==='special'&&e.food.get(K(3,2))?.kind==='bounty','head and cleared tail preserved');
  check(!e.food.has(K(1,2))&&!e.food.has(K(2,2)),'no intermediate body drops');
  p=put(e,[[1,1],[1,1]]);e.food.clear();e.rng=()=>.5;e.killSnake(p,'body',null,[],{x:2,y:1});check(e.food.size===1,'coincident endpoints deduplicate');
  for(const roll of [1/3-1e-8,1/3,0.999]){
   e.food.clear();p=put(e,[[1,1],[2,1],[3,1]]);e.rng=()=>roll;e.killSnake(p,'wall',null,[],{x:0,y:1});
   check([...e.food.values()].every(f=>f.kind===(roll<1/3?'special':'bounty')&&f.value===2),'one-third boundary');
  }
  const eat=(len,kind='special',nom=false)=>{
   const e=make();e.food.clear();e.spots.clear();
   const p=put(e,[[3,3],...Array.from({length:len-1},()=>[2,3])]);
   p.fx['nom-nom']=nom;e.food.set(K(4,3),{kind,value:2});p.commands=[{dir:'right'}];
   e.beginTick(0);while(e.stepTick().more){}e.finishTick();return {e,p};
  };
  for(const [len,gain,score] of [[3,2,2],[12,1,3],[13,0,4]]){
   const {e,p}=eat(len);check(p.body.length===len+gain&&p.score===score&&p.specials.length===1&&!e.food.size,'special food growth/score/draw/consumption');
  }
  const nom=eat(13,'special',true);check(nom.p.score===6&&nom.p.specials.length===1,'Nom Nom applies to special food');
  for(const [len,value,expected] of [[3,1,2],[3,2,4],[12,2,6],[13,2,8]]) {
   const e=make();e.spots.clear();e.food.clear();
   const p=put(e,[[3,3],...Array.from({length:len-1},()=>[2,3])]);
   p.specials=['victory-lap'];e.playSpecial(p,'victory-lap');
   e.food.set(K(4,3),{kind:'bounty',value});p.commands=[{dir:'right'}];
   e.beginTick(0);while(e.stepTick().more){}e.finishTick();
   check(p.score===expected,'Victory Lap doubles immediate food points');
   const scored=p.score;e.nextRound();check(p.score===scored,'round end awards nothing');
   e.killSnake(p,'wall',null,[],{x:4,y:3});check(p.score===scored,'death awards nothing');
   e.endGame('roundcap');check(p.score===scored,'end game awards nothing');
  }
  check(nom.p.boosts===0&&eat(13,'bounty').p.boosts===0,'capped feeding never repeats the last growth milestone');
  for(const len of [5,8,12]){const {p}=eat(len,'bounty');check(p.boosts===1,'each growth milestone awards an extra');}
  const milestone=eat(12,'bounty');milestone.p.boosts=4;milestone.e.killSnake(milestone.p,'wall',null,[],{x:0,y:0});check(milestone.p.boosts===4,'unspent extras survive death');
  // The game ends after the winning substep, before the rest of a boost or normal phase.
  const win=make(4,{pointsToWin:45});win.food.clear();win.spots.clear();
  p=put(win,[[2,2],[1,2],[0,2]]);p.score=44;p.commands=[{dir:'right',boost:true}];win.spots.set(K(3,2),{kind:'food',value:1});win.beginTick(0);
  const step=win.stepTick();check(!step.more&&p.body[0].x===3,'stop at winning beat');win.finishTick();
  check(win.gameOver&&p.score===45,'adjustable target, no cash-out');
  const tie=make();tie.players[0].score=tie.players[1].score=30;tie.endGame('score');check(tie.winnerSeats.join(',')==='0,1','shared ties');
  return 'All current-rule regression checks passed';
 },board);
 console.log(result);
}finally{await browser.close()}
