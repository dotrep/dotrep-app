/**
 * Live Nudge Mode — no rebuilds for pixel tweaks.
 * Keys:
 *   ;      = toggle Nudge Mode (status pill appears)
 *   O      = toggle comp overlay (if apps/web/public/comp-overlay.png exists)
 *   1/2/3/4= select orb / headline / ctas / chameleon
 *   ←→↑↓   = move selected (Shift = 10px step)
 *   = / -  = grow/shrink (orb, chameleon)
 *   [ / ]  = rotate ring seam (deg)
 *   .      = print current CSS vars to console for copy/paste
 */
type Sel = 'orb'|'copy'|'ctas'|'cham';
let enabled = false;
let sel: Sel = 'orb';

const $ = (q:string)=>document.querySelector(q) as HTMLElement|null;
const root = document.documentElement;

function ensureOverlayInsideCanvas(){
  const overlay = $('#comp-overlay');
  const canvas  = $('.canvas');
  if (overlay && canvas && overlay.parentElement !== canvas) {
    canvas.appendChild(overlay);
  }
}

// Create a small HUD pill
function hud(on:boolean){
  let pill = $('#nudge-pill');
  if(!pill){
    pill = document.createElement('div');
    pill.id = 'nudge-pill';
    pill.style.cssText = 'position:fixed;left:10px;top:10px;z-index:99999;background:#0a0d12;color:#9fe2a5;border:1px solid #1f2a34;padding:6px 10px;border-radius:999px;font:12px/1.2 system-ui,Segoe UI,Roboto;opacity:.9';
    document.body.appendChild(pill);
  }
  pill.style.display = on ? 'inline-block' : 'none';
  pill.textContent = `NUDGE • sel=${sel}`;
}

function v(name:string, def:string){
  const cs = getComputedStyle(root);
  const cur = cs.getPropertyValue(name).trim();
  return cur || def;
}
function set(name:string, val:string){ root.style.setProperty(name, val); }

function getNum(name:string, def:number){
  const s = v(name, `${def}px`);
  const n = parseFloat(s);
  return isNaN(n) ? def : n;
}
function setPx(name:string, n:number){ set(name, `${n}px`); }

function move(dx:number, dy:number){
  switch(sel){
    case 'orb':
      setPx('--orb-x', getNum('--orb-x', -90)+dx);
      setPx('--orb-y', getNum('--orb-y', 110)+dy);
      break;
    case 'copy':
      setPx('--copy-x', getNum('--copy-x', 870)+dx);
      setPx('--copy-y', getNum('--copy-y', 128)+dy);
      break;
    case 'ctas':
      setPx('--ctas-x', getNum('--ctas-x', 870)+dx);
      setPx('--ctas-y', getNum('--ctas-y', 294)+dy);
      break;
    case 'cham':
      setPx('--cham-x', getNum('--cham-x', 1052)+dx);
      setPx('--cham-y', getNum('--cham-y', 78)+dy);
      break;
  }
}

function grow(delta:number){
  if(sel==='orb'){
    setPx('--orb-size', getNum('--orb-size', 1020)+delta);
  } else if(sel==='cham'){
    setPx('--cham-w', getNum('--cham-w', 430)+delta);
    setPx('--cham-h', getNum('--cham-h', 610)+Math.round(delta*1.4));
  }
}

function seam(delta:number){
  const cur = parseFloat(v('--ring-start','-8deg')) || -8;
  set('--ring-start', `${cur+delta}deg`);
}

function printVars(){
  const names = ['--orb-x','--orb-y','--orb-size','--copy-x','--copy-y','--copy-w','--ctas-x','--ctas-y','--cham-x','--cham-y','--cham-w','--cham-h','--ring-start'];
  const out = names.map(n=>`${n}: ${v(n, getComputedStyle(root).getPropertyValue(n)).trim()};`).join('\n');
  console.log('\n/* Paste into :root (index.css) */\n:root{\n'+out+'\n}\n');
}

function toggleOverlay(){
  document.body.classList.toggle('show-overlay');
}

window.addEventListener('keydown', (e)=>{
  if(e.key===';'){ enabled=!enabled; hud(enabled); }
  if(!enabled) return;

  if(e.key==='1') { sel='orb'; hud(true); }
  if(e.key==='2') { sel='copy'; hud(true); }
  if(e.key==='3') { sel='ctas'; hud(true); }
  if(e.key==='4') { sel='cham'; hud(true); }

  const step = e.shiftKey ? 10 : 1;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){ e.preventDefault(); }

  if(e.key==='ArrowLeft')  move(-step,0);
  if(e.key==='ArrowRight') move(step,0);
  if(e.key==='ArrowUp')    move(0,-step);
  if(e.key==='ArrowDown')  move(0, step);

  if(e.key==='=' || e.key==='+') grow(step);
  if(e.key==='-')                 grow(-step);

  if(e.key==='[') seam(-1);
  if(e.key===']') seam(+1);

  if(e.key==='.'){ printVars(); }

  if(e.key.toLowerCase()==='o'){ toggleOverlay(); }

}, {passive:false});

ensureOverlayInsideCanvas();
