// Controlled review/test arena only. Never imported by the shipped game page.
// Serializable for page.evaluate(), and for the separate generated HTML preview.
module.exports = function seedEnemyFixture({ type = 'shellback', x = 350, activeAI = false } = {}) {
  score=0;lives=3;startLevel(3);
  grid=Array.from({length:ROWS},(_,y)=>Array(LW).fill(y>=13?'#':' '));
  coins=[];shields=[];flag={x:(LW-2)*T,y:12*T};
  pl.x=144;pl.y=13*T-pl.h;pl.vx=0;pl.vy=0;pl.ground=true;pl.inv=0;cam=0;
  start={x:pl.x,y:pl.y};
  const enemy=createEnemy(type,x,0);enemy.y=13*T-enemy.h;enemy.ground=true;
  if(!activeAI){enemy.vx=0;if(type==='sentinel')enemy.attackTimer=999;}
  enemies=[enemy];
  let label=document.getElementById('enemy-fixture-label');
  if(!label){label=document.createElement('div');label.id='enemy-fixture-label';label.setAttribute('aria-hidden','true');document.body.appendChild(label);}
  label.textContent='ENEMY TEST ARENA · No campaign placements';
  label.style.cssText='position:fixed;bottom:7px;left:50%;transform:translateX(-50%);z-index:3;pointer-events:none;white-space:nowrap;background:#182344e8;color:#fff3be;padding:4px 10px;border-radius:8px;font:11px sans-serif';
  draw();
};
