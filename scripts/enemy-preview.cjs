// Artifact-only sandbox; the production page and canonical level data are untouched.
const seed=require('./enemy-fixture.cjs');
module.exports=function buildEnemyPreview(html){
  const script=`
(() => {
  const seed=${seed.toString()};
  let reviewType='shellback';
  const panel=document.createElement('div');panel.id='enemy-review-controls';
  panel.style.cssText='position:fixed;left:50%;transform:translateX(-50%);z-index:1;display:flex;gap:8px;padding:6px;background:#182344ed;border-radius:12px;color:white;font:12px sans-serif';
  const placePanel=()=>{const rect=cv.getBoundingClientRect();panel.style.top=Math.max(110,rect.top+rect.height*.35)+'px';};
  addEventListener('resize',placePanel);placePanel();
  for(const [type,name] of [['shellback','Reset Shellback'],['sentinel','Reset Sentinel']]){
    const button=document.createElement('button');button.textContent=name;button.type='button';
    button.style.cssText='min-height:44px;min-width:100px;border:2px solid #a9e5d8;border-radius:10px;background:#e9fff6;color:#233c53;font-weight:bold;touch-action:manipulation';
    button.onclick=()=>{reviewType=type;seed({type,activeAI:true});cv.focus();};panel.appendChild(button);
  }
  document.body.appendChild(panel);
  const normalMenu=syncMenu;syncMenu=function(){normalMenu();panel.hidden=state!=='play';};
  const normalNewGame=newGame;newGame=function(){normalNewGame();seed({type:reviewType,activeAI:true});};
  const normalRestart=confirmRestart;confirmRestart=function(){normalRestart();seed({type:reviewType,activeAI:true});};
  document.title='Coin Hopper — isolated enemy review arena';
  syncMenu();
})();`;
  return String(html).replace('</body>',`<script>${script}</script></body>`);
};
