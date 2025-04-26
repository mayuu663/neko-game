// game.js  (貫通弾 + ボス高速ダイブ + HP50 + 1Hit 制限)

/* ========== Canvas 基本設定 ========== */
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width = 360;
canvas.height = 640;

/* ========== 画像・サウンド ========== */
let bgReady = false;
const bgImage = new Image();
bgImage.src = 'stage.png';
bgImage.onload = () => (bgReady = true);

const startSound   = new Audio('start_jingle.mp3');
const shootSound   = new Audio('cute_shoot.mp3');
const hitSound     = new Audio('poan_hit.mp3');
const boomSound    = new Audio('public_boom-sound.mp3');
const victorySound = new Audio('fancy_bakuad.mp3');
const bgm          = new Audio('bgm.mp3');
bgm.loop = true;  bgm.volume = 0.5;

const playerImages = { front:new Image(), left:new Image(), right:new Image(), shoot:new Image() };
playerImages.front.src='front.png'; playerImages.left.src='left.png';
playerImages.right.src='right.png'; playerImages.shoot.src='heart.png';

const enemyImages=[new Image(),new Image()];
enemyImages[0].src='note-cute1.png'; enemyImages[1].src='note-cute2.png';

const bulletImage=new Image(); bulletImage.src='bullet.png';
const bossImage  =new Image(); bossImage.src ='boss150.png';

/* ========== オブジェクト & 変数 ========== */
const player={x:150,y:540,width:60,height:60,speed:5,image:playerImages.front};

let bullets=[],enemies=[],effects=[];
let score=0,moveLeft=false,moveRight=false,lastShot=0;
let timeLeft=30,timerInterval,spawnInterval,rafId;

let boss=null;
/* --- ボス挙動パラメータ --- */
const BOSS_HP_MAX = 50;      // HP 50
const BOSS_SPEED_X = 2;      // 通常横速度
const DIVE_CHANCE  = 0.012;  // 1.2%/frame でダイブ開始
const DIVE_VY      = 6;      // ダイブ速度
const ORIG_Y       = 120;    // 元の高さ

let bossLine='',bossLineTimer=0,damageFlashTimer=0;

const cooldown=250;
let playerHealth=20,maxPlayerHealth=20;

const bossHitLines=['ぐにゃ〜','イタッ','何するの！'];
const bossDefeatedLine='やられた…';

/* ========== DOM ========== */
const timerDisplay   = document.getElementById('timerDisplay');
const scoreDisplay   = document.getElementById('scoreValue');
const resultDisplay  = document.getElementById('result');
const playerHealthBar= document.getElementById('playerHealth');

/* ========== 描画 ========== */
const updatePlayerHealthBar=()=>playerHealthBar.style.width=`${(playerHealth/maxPlayerHealth)*100}%`;

function drawBackground(){
  bgReady ? ctx.drawImage(bgImage,0,0,canvas.width,canvas.height)
          : (ctx.fillStyle='#000',ctx.fillRect(0,0,canvas.width,canvas.height));
  if(damageFlashTimer-- >0){
    ctx.fillStyle='rgba(255,0,0,0.3)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }
}
const drawPlayer =()=>ctx.drawImage(player.image,player.x,player.y,player.width,player.height);
const drawBullets=()=>bullets.forEach(b=>ctx.drawImage(bulletImage,b.x-10,b.y-10,20,20));
const drawEnemies=()=>enemies.forEach(e=>ctx.drawImage(enemyImages[e.type],e.x,e.y,e.width,e.height));
function drawBoss(){
  if(!boss) return;
  ctx.drawImage(bossImage,boss.x,boss.y,boss.width,boss.height);
  ctx.fillStyle='#000'; ctx.fillRect(boss.x,boss.y-15,150,10);
  ctx.fillStyle='#f00'; ctx.fillRect(boss.x,boss.y-15,150*(boss.hp/BOSS_HP_MAX),10);
  if(bossLineTimer>0 && bossLine){
    ctx.fillStyle='#000'; ctx.font='16px sans-serif';
    ctx.fillText(bossLine,boss.x,boss.y-25); bossLineTimer--;
  }
}
function drawEffects(){effects.forEach(fx=>{ctx.beginPath();ctx.arc(fx.x,fx.y,fx.size,0,Math.PI*2);ctx.fillStyle=`rgba(255,192,203,${fx.alpha})`;ctx.fill();});}
const drawScore=()=>scoreDisplay.textContent=score;

/* ========== 更新 ========== */
const updateBullets=()=>bullets=bullets.filter(b=>(b.y-=b.speed)>0);
function updateEnemies(){enemies=enemies.filter(e=>{e.y+=e.speedY;e.x+=e.speedX;if(e.x<=0||e.x>=canvas.width-e.width)e.speedX*=-1;return e.y<=canvas.height;});}
function updateBoss(){
  if(!boss) return;
  boss.x+=boss.speedX;
  if(boss.x<0||boss.x>canvas.width-boss.width) boss.speedX*=-1;

  if(!boss.diving && Math.random()<DIVE_CHANCE){ boss.diving=true; boss.vy=DIVE_VY; }
  if(boss.diving){
    boss.y+=boss.vy;
    if(boss.vy>0 && boss.y>canvas.height-boss.height-40){ boss.vy=-DIVE_VY; }
    if(boss.vy<0 && boss.y<=ORIG_Y){ boss.y=ORIG_Y; boss.vy=0; boss.diving=false; }
  }
}
const updateEffects =()=>effects=effects.filter(fx=>((fx.alpha-=0.05)>0 && (fx.size+=1)));

/* ========== 衝突（貫通だが 1Hit） ========== */
function detectCollisions(){
  bullets.forEach(b=>{
    enemies.forEach((e,ei)=>{
      if(b.x>e.x&&b.x<e.x+e.width&&b.y>e.y&&b.y<e.y+e.height){
        enemies.splice(ei,1);
        effects.push({x:b.x,y:b.y,size:5,alpha:1});
        hitSound.currentTime=0; hitSound.play(); score++;
      }
    });
  });
  bullets.forEach(b=>{
    if(b.hitBoss) return;                 // ★ すでにボスに当たっていれば無視
    if(boss && b.x>boss.x&&b.x<boss.x+boss.width&&b.y>boss.y&&b.y<boss.y+boss.height){
      b.hitBoss=true;                    // ★ フラグを立てる
      effects.push({x:b.x,y:b.y,size:5,alpha:1});
      hitSound.currentTime=0; hitSound.play();
      boss.hp--;
      bossLine=bossHitLines[Math.floor(Math.random()*bossHitLines.length)];
      bossLineTimer=60;
      if(boss.hp<=0){
        boomSound.play(); bossLine=bossDefeatedLine; bossLineTimer=180; score+=40;
        setTimeout(()=>{boss=null; endGame();},1000);
      }
    }
  });
  const buf=10;
  enemies.forEach((e,ei)=>{
    if(player.x+buf<e.x+e.width&&player.x+player.width-buf>e.x&&player.y+buf<e.y+e.height&&player.y+player.height-buf>e.y){
      enemies.splice(ei,1); playerHealth--; updatePlayerHealthBar(); damageFlashTimer=10;
      if(playerHealth<=0){ clearInterval(timerInterval); clearInterval(spawnInterval); cancelAnimationFrame(rafId);
        resultDisplay.innerHTML=`<div style='color:#000;'>Game Over!<br>Score: ${score}<br><button onclick="restartGame()">Try Again</button>`;
        resultDisplay.style.display='block'; document.getElementById('gameUI').style.display='none'; bgm.pause(); bgm.currentTime=0; }
    }
  });
}

/* ========== メインループ ========== */
function gameLoop(){ctx.clearRect(0,0,canvas.width,canvas.height);drawBackground();
  if(moveLeft)player.x=Math.max(0,player.x-player.speed);
  if(moveRight)player.x=Math.min(canvas.width-player.width,player.x+player.speed);
  drawPlayer();drawBullets();drawEnemies();drawBoss();drawEffects();drawScore();
  updateBullets();updateEnemies();updateBoss();updateEffects();detectCollisions();
  rafId=requestAnimationFrame(gameLoop);}

/* ========== 敵スポーン ========== */
function spawnEnemy(n=1){for(let i=0;i<n;i++){const w=40,h=40,t=Math.random()<0.5?0:1;
  enemies.push({x:Math.random()*(canvas.width-w),y:-h,width:w,height:h,type:t,speedX:(Math.random()-0.5)*4,speedY:1+Math.random()*1.2});}}

/* ========== ゲーム制御 ========== */
function resetGame(){cancelAnimationFrame(rafId);clearInterval(timerInterval);clearInterval(spawnInterval);
  bullets=[];enemies=[];effects=[];score=0;moveLeft=moveRight=false;lastShot=0;timeLeft=30;
  player.image=playerImages.front;resultDisplay.style.display='none';document.getElementById('gameUI').style.display='block';
  boss=null;bossLine='';bossLineTimer=0;damageFlashTimer=0;playerHealth=maxPlayerHealth;updatePlayerHealthBar();}
function startGame(){
  bgm.currentTime=0;bgm.play();timerDisplay.textContent=`${timeLeft}s`;
  timerInterval=setInterval(()=>{if(timeLeft>0){timeLeft--;timerDisplay.textContent=`${timeLeft}s`; }},1000);
  spawnInterval=setInterval(()=>{
    if(timeLeft<=5)spawnEnemy(6);else if(timeLeft<=10)spawnEnemy(3);else spawnEnemy(1);
    if(timeLeft===5&&!boss){
      boss={x:Math.random()*(canvas.width-120),y:ORIG_Y,width:120,height:150,hp:BOSS_HP_MAX,speedX:BOSS_SPEED_X,vy:0,diving:false};
    }
  },400);}
function endGame(){clearInterval(timerInterval);clearInterval(spawnInterval);cancelAnimationFrame(rafId);
  victorySound.play();bgm.pause();bgm.currentTime=0;
  resultDisplay.innerHTML=`<div style='color:#000;'>You Win!<br>Score: ${score}<br><button onclick="restartGame()">Play Again</button>`;
  resultDisplay.style.display='block';document.getElementById('gameUI').style.display='none';}
function restartGame(){document.getElementById('startScreen').style.display='flex';
  resultDisplay.style.display='none';document.getElementById('gameUI').style.display='none';}

/* ========== 入力 ========== */
function shoot(){const now=Date.now();if(now-lastShot<cooldown)return;
  lastShot=now;bullets.push({x:player.x+player.width/2,y:player.y,speed:7,hitBoss:false});   // ★ hitBoss フラグ追加
  player.image=playerImages.shoot;shootSound.currentTime=0;shootSound.play();
  setTimeout(()=>player.image=playerImages.front,200);}
document.getElementById('startButton').addEventListener('click',()=>{
  if(!bgReady){alert('Background is still loading…');return;}
  document.getElementById('startScreen').style.display='none';
  document.getElementById('gameUI').style.display='block';
  resetGame();startGame();gameLoop();});

/* マウス / タッチ / キー 下は変更なし */
document.getElementById('leftBtn').addEventListener('mousedown',()=>{moveLeft=true;player.image=playerImages.left;});
document.getElementById('leftBtn').addEventListener('mouseup',()=>{moveLeft=false;player.image=playerImages.front;});
document.getElementById('rightBtn').addEventListener('mousedown',()=>{moveRight=true;player.image=playerImages.right;});
document.getElementById('rightBtn').addEventListener('mouseup',()=>{moveRight=false;player.image=playerImages.front;});
document.getElementById('shootBtn').addEventListener('click',shoot);
['touchstart','mousedown'].forEach(ev=>{
  document.getElementById('leftBtn').addEventListener(ev,e=>{e.preventDefault();moveLeft=true;player.image=playerImages.left;});
  document.getElementById('rightBtn').addEventListener(ev,e=>{e.preventDefault();moveRight=true;player.image=playerImages.right;});});
['touchend','mouseup'].forEach(ev=>{
  document.getElementById('leftBtn').addEventListener(ev,e=>{e.preventDefault();moveLeft=false;player.image=playerImages.front;});
  document.getElementById('rightBtn').addEventListener(ev,e=>{e.preventDefault();moveRight=false;player.image=playerImages.front;});});
document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){moveLeft=true;player.image=playerImages.left;}
  if(e.key==='ArrowRight'){moveRight=true;player.image=playerImages.right;}
  if(e.key===' '||e.key==='Enter') shoot();});
document.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'){moveLeft=false;player.image=playerImages.front;}
  if(e.key==='ArrowRight'){moveRight=false;player.image=playerImages.front;}});
