const LETTERS=[
"You found one! Good eyes. Also, hi. 💌",
"On hard days, remember: you have survived 100% of them so far.",
"You make a room warmer just by being in it.",
"Your laugh is my favorite sound. Annoyingly so.",
"Drink water. Eat something. Yes, I'm being motherly now. It's your fault, you rub off on people.",
"You don't have to be strong all the time. Resting is part of the story too.",
"Last one! Happy birthday, Kabe. 🎂"
];
const BONUS="You found all 7! Bonus: one scoop of ice cream in your name. Imaginary, but it's the thought that counts. 🍦";
const REFUSE=["No.","Absolutely not.","You already had some.","Ask nicely. ...Still no.","Hmm. Let me think.","...Fine. One scoop. 🍦💛"];

const $=id=>document.getElementById(id), $$=s=>[...document.querySelectorAll(s)];
const still=matchMedia("(prefers-reduced-motion: reduce)").matches;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const clamp=v=>Math.max(0,Math.min(1,v));
const buzz=p=>navigator.vibrate&&navigator.vibrate(p);
const found=new Set();
let sound=true,ac,rainGain,w=0,target=0,done=false,prog=0,holding=false,tries=0;

/* ---------- sound ---------- */
function startAudio(){
  try{
    ac=new (window.AudioContext||window.webkitAudioContext)();
    const len=ac.sampleRate*2,b=ac.createBuffer(1,len,ac.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
    const n=ac.createBufferSource();n.buffer=b;n.loop=true;
    const f=ac.createBiquadFilter();f.type="lowpass";f.frequency.value=1200;
    rainGain=ac.createGain();rainGain.gain.value=0;
    n.connect(f);f.connect(rainGain);rainGain.connect(ac.destination);n.start();
  }catch(e){}
}
function chime(notes){
  if(!ac||!sound)return;
  notes.forEach((fr,i)=>{
    const t=ac.currentTime+i*.12,o=ac.createOscillator(),g=ac.createGain();
    o.type="sine";o.frequency.value=fr;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.15,t+.02);
    g.gain.exponentialRampToValueAtTime(.001,t+.9);
    o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+1);
  });
}
$("snd").onclick=()=>{sound=!sound;$("snd").textContent=sound?"🔊":"🔇"};

/* ---------- typing + panel reveal ---------- */
$$(".tw").forEach(el=>{el.dataset.t=el.textContent;el.innerHTML='<span class="v"></span><span class="h"></span>';el.lastChild.textContent=el.dataset.t});
async function type(el){
  const v=el.firstChild,h=el.lastChild,t=el.dataset.t;
  el.classList.add("on");
  if(still){v.textContent=t;h.textContent="";return}
  const sp=+el.dataset.s||28;
  for(let i=1;i<=t.length;i++){v.textContent=t.slice(0,i);h.textContent=t.slice(i);await sleep(sp)}
}
const io=new IntersectionObserver(es=>es.forEach(async e=>{
  const p=e.target;
  if(!e.isIntersecting||p.dataset.d)return;
  p.dataset.d=1;p.classList.add("in");
  for(const el of p.querySelectorAll(".tw"))await type(el);
  if(p.dataset.end){boom();chime([523,659,784,1047])}
}),{threshold:.3});
function watch(root){$$(root+" .panel").forEach(p=>io.observe(p))}

/* ---------- start ---------- */
$("start").onclick=()=>{
  startAudio();chime([523,784]);
  $("gate").classList.add("off");document.body.classList.remove("locked");
  watch("main > .panel");
};

/* ---------- modal + envelopes ---------- */
function show(html){$("mt").innerHTML=html;$("modal").classList.add("on")}
$("close").onclick=()=>$("modal").classList.remove("on");
$("modal").onclick=e=>{if(e.target.id==="modal")$("modal").classList.remove("on")};
$$(".egg").forEach(b=>b.onclick=()=>{
  const i=+b.dataset.i;
  b.classList.add("found");found.add(i);buzz(20);
  $("count").textContent="✉ "+found.size+"/7"+(found.size===7?" ★":"");
  if(found.size===7){chime([784,988,1175,1568]);boom();show(BONUS)}
  else{chime([660,880]);show(LETTERS[i])}
});
$("count").onclick=()=>{
  show(found.size?[...found].sort().map(i=>"<p>"+LETTERS[i]+"</p>").join("<hr>")+(found.size===7?"<hr><p>"+BONUS+"</p>":""):"<p>No letters yet. Look for small ✉ in the corners of the panels.</p>");
};

/* ---------- hold to stop the rain ---------- */
const hb=$("hold");
hb.addEventListener("pointerdown",e=>{holding=true;hb.setPointerCapture(e.pointerId)});
["pointerup","pointercancel","lostpointercapture"].forEach(ev=>hb.addEventListener(ev,()=>holding=false));
hb.addEventListener("contextmenu",e=>e.preventDefault());
function finish(){
  done=true;target=1;
  if(still)w=1;
  hb.classList.add("done");hb.innerHTML="♥";
  $("holdmsg").textContent="the rain stopped.";
  $("after").hidden=false;watch("#after");
  chime([523,659,784,1047]);buzz([30,50,30]);boom();
  setTimeout(()=>$("after").scrollIntoView({behavior:still?"auto":"smooth"}),900);
}

/* ---------- ice cream scene ---------- */
$("ice").onclick=()=>{
  if(tries>=REFUSE.length)return;
  const s=$("say");s.textContent="Kabe: "+REFUSE[tries];
  s.classList.remove("pop");void s.offsetWidth;s.classList.add("pop");
  tries++;buzz(15);
  $("tries").textContent="attempts: "+tries;
  if(tries===REFUSE.length){chime([784,988,1175]);boom()}else chime([220]);
};
$("open").onclick=()=>{$("note").style.display="block";$("open").style.display="none"};

/* ---------- sky, rain, petals, confetti, sparkles ---------- */
const rc=$("rain"),rx=rc.getContext("2d"),pc=$("petal"),px=pc.getContext("2d");
function size(){rc.width=pc.width=innerWidth;rc.height=pc.height=innerHeight}
addEventListener("resize",size);size();
const lerp=(a,b,t)=>a+(b-a)*t;
const mix=(c1,c2,t)=>"rgb("+c1.map((v,i)=>Math.round(lerp(v,c2[i],t))).join(",")+")";
const drops=Array.from({length:90},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,l:8+Math.random()*12,v:9+Math.random()*7}));
const pet=Array.from({length:40},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,s:5+Math.random()*6,v:.6+Math.random(),r:Math.random()*6,d:Math.random()*2-1}));
let conf=[],sparks=[];
function boom(){
  if(still)return;
  for(let i=0;i<90;i++)conf.push({x:innerWidth/2,y:innerHeight*.55,vx:(Math.random()-.5)*11,vy:-Math.random()*12-3,r:Math.random()*6,c:["#ffb7d0","#cdbcff","#fff3b0","#fff"][i%4]});
}
let lastSp=0;
addEventListener("pointermove",e=>{
  if(still||e.timeStamp-lastSp<40)return;lastSp=e.timeStamp;
  sparks.push({x:e.clientX,y:e.clientY,life:1});
});
addEventListener("scroll",()=>{
  const h=document.documentElement.scrollHeight-innerHeight;
  $("bar").style.width=(h>0?scrollY/h*100:0)+"%";
},{passive:true});

function frame(){
  if(!done){
    prog=clamp(prog+(holding?.006:-.012));
    hb.style.setProperty("--p",prog*360+"deg");
    if(holding&&prog>0.05&&prog<1)buzz(5);
    target=prog*.35;
    if(prog>=1)finish();
  }
  w+=(target-w)*.03;
  document.body.style.background="linear-gradient(180deg,"+mix([74,85,120],[255,201,217],w)+","+mix([110,126,163],[205,188,255],w)+")";
  if(rainGain)rainGain.gain.value=sound?(1-w)*.1:0;

  rx.clearRect(0,0,rc.width,rc.height);
  px.clearRect(0,0,pc.width,pc.height);
  if(!still){
    const ra=1-clamp((w-.3)/.4);
    if(ra>0){
      rx.globalAlpha=ra*.6;rx.strokeStyle="#cfe0ff";rx.lineWidth=1.2;
      drops.forEach(d=>{rx.beginPath();rx.moveTo(d.x,d.y);rx.lineTo(d.x-2,d.y+d.l);rx.stroke();
        d.y+=d.v;d.x-=.4;if(d.y>rc.height){d.y=-20;d.x=Math.random()*rc.width}});
    }
    const pa=clamp((w-.5)/.4);
    if(pa>0){
      px.globalAlpha=pa*.85;px.fillStyle="#ffc4d8";
      pet.forEach(p=>{px.save();px.translate(p.x,p.y);px.rotate(p.r);px.beginPath();px.ellipse(0,0,p.s,p.s/2,0,0,7);px.fill();px.restore();
        p.y+=p.v;p.x+=Math.sin(p.y/40)*.6+p.d*.3;p.r+=.02;if(p.y>pc.height+10){p.y=-10;p.x=Math.random()*pc.width}});
    }
    px.globalAlpha=1;
    conf.forEach(c=>{c.x+=c.vx;c.y+=c.vy;c.vy+=.35;c.r+=.2;px.save();px.translate(c.x,c.y);px.rotate(c.r);px.fillStyle=c.c;px.fillRect(-4,-2,8,5);px.restore()});
    conf=conf.filter(c=>c.y<pc.height+20);
    px.fillStyle="#fff";px.font="14px sans-serif";
    sparks.forEach(s=>{px.globalAlpha=s.life;px.fillText("✦",s.x,s.y);s.life-=.04;s.y+=.6});
    sparks=sparks.filter(s=>s.life>0);
  }
  requestAnimationFrame(frame);
}
frame();
