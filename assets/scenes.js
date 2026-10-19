/* Capability scenes: eight live pieces drawn on one canvas with the plain 2D context, no libraries.
   Home stage: window.ARDHOLT_VIZ.set(name). Any page: window.ARDHOLT_SCENES.mount(canvas, name) returns an instance.
   Engine: a 12-column grid inside 7/9/7/10 % margins, one clock in seconds, a lifecycle for every element
   (enter 600 ms staggered 40 ms, loop, exit 350 ms), choreographed scene transitions, the site motion contract. */
(function(){
'use strict';
var INK=[241,236,230], RED=[255,59,31];
function rgba(c,a){return 'rgba('+c[0]+','+c[1]+','+c[2]+','+a+')'}
/* colour roles: the only colours drawn */
var C={ink:rgba(INK,1),ink2:rgba(INK,.62),mute:rgba(INK,.4),faint:rgba(INK,.16),line:rgba(INK,.09),acc:rgba(RED,1),acc45:rgba(RED,.45),acc18:rgba(RED,.18)};
var MONO='"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace', SERIF='"Instrument Serif",Georgia,serif';
var TRACK={10:.12,12:.08,14:.06,24:0};   /* tracking per ramp size (em) */
var LH=14;                                /* line pitch of wrapped 10 px lines */
/* easings: out for entrances, move for moves, in for exits; progress is linear */
var E={out:function(x){return x>=1?1:1-Math.pow(2,-10*x)},move:function(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2},in:function(x){return x*x*x}};
function u(x){return x<0?0:x>1?1:x} function lerp(a,b,t){return a+(b-a)*t} function pad(n,w){var s=String(n);while(s.length<w)s='0'+s;return s}
function rnd(seed){var s=seed;return function(){s=(s*9301+49297)%233280;return s/233280}}
var TAU=Math.PI*2;

/* Draw: every primitive registers its box (id, kind, scene) so the harness can check overlaps, margins and size steps. */
function Draw(ctx){this.c=ctx;this.els=[];this.s='';this.clip=null}
Draw.prototype={
  reg:function(id,k,x,y,w,h,a,text){if(a<=.02)return;var cl=this.clip;if(cl){var x2=Math.min(x+w,cl[0]+cl[2]),y2=Math.min(y+h,cl[1]+cl[3]);x=Math.max(x,cl[0]);y=Math.max(y,cl[1]);w=x2-x;h=y2-y;if(w<=0||h<=0)return}this.els.push({id:id,k:k,s:this.s,x:x,y:y,w:w,h:h,text:text||''})},
  font:function(size,serif){var c=this.c;c.font=size+'px '+(serif?SERIF:MONO);if('letterSpacing' in c)c.letterSpacing=((TRACK[size]||0)*size)+'px'},
  measure:function(str,size,serif){this.font(size,serif);return this.c.measureText(str).width},
  /* text anchored at its top-left (align right/center moves the anchor); the registered box is the em box */
  text:function(id,str,x,y,o){o=o||{};var a=o.a==null?1:o.a;if(a<=.001)return 0;var size=o.size||10,c=this.c,w=this.measure(str,size,o.serif),x0=x+(o.dx||0),y0=y+(o.dy||0);
    if(o.align==='right')x0-=w;else if(o.align==='center')x0-=w/2;c.textAlign='left';c.textBaseline='top';c.globalAlpha=a;c.fillStyle=o.col||C.ink2;c.fillText(str,x0,y0);c.globalAlpha=1;this.reg(id,'label',x0,y0,w,size,a,str);return w},
  rect:function(id,x,y,w,h,o){o=o||{};var a=o.a==null?1:o.a;if(a<=.001||w<=0||h<=0)return;var c=this.c;c.globalAlpha=a;c.beginPath();if(o.r&&c.roundRect)c.roundRect(x,y,w,h,o.r);else if(o.r){var r=Math.min(o.r,w/2,h/2);c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}else c.rect(x,y,w,h);
    if(o.fill){c.fillStyle=o.fill;c.fill()}if(o.stroke){c.lineWidth=o.w||1;c.strokeStyle=o.stroke;c.stroke()}c.globalAlpha=1;this.reg(id,o.k||'el',x,y,w,h,a)},
  line:function(id,x1,y1,x2,y2,o){o=o||{};var a=o.a==null?1:o.a;if(a<=.001)return;var c=this.c;c.globalAlpha=a;c.lineWidth=o.w||1;c.strokeStyle=o.col||C.line;if(o.dash)c.setLineDash(o.dash);
    c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();if(o.dash)c.setLineDash([]);c.globalAlpha=1;var lw=c.lineWidth;this.reg(id,'el',Math.min(x1,x2)-lw/2,Math.min(y1,y2)-lw/2,Math.abs(x2-x1)+lw,Math.abs(y2-y1)+lw,a)},
  ring:function(id,x,y,r,o){o=o||{};var a=o.a==null?1:o.a;if(a<=.001||r<=0)return;var c=this.c,f=o.from||0,t=o.to==null?1:o.to;if(t<=f)return;c.globalAlpha=a;c.lineWidth=o.w||1;c.strokeStyle=o.col||C.ink2;
    c.beginPath();c.arc(x,y,r,-Math.PI/2+f*TAU,-Math.PI/2+t*TAU);c.stroke();c.globalAlpha=1;this.reg(id,'el',x-r,y-r,r*2,r*2,a)},
  dot:function(id,x,y,r,col,a){a=a==null?1:a;if(a<=.001)return;var c=this.c;c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.globalAlpha=1;this.reg(id,'el',x-r,y-r,r*2,r*2,a)},
  /* polyline; registers the box of its points */
  path:function(id,pts,o){o=o||{};var a=o.a==null?1:o.a;if(a<=.001||pts.length<2)return;var c=this.c,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;c.globalAlpha=a;c.lineWidth=o.w||1;c.strokeStyle=o.col||C.ink;if(o.dash)c.setLineDash(o.dash);c.beginPath();
    for(var i=0;i<pts.length;i++){var p=pts[i];if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1]}
    c.stroke();if(o.dash)c.setLineDash([]);c.globalAlpha=1;var lw=c.lineWidth;this.reg(id,'el',x0-lw/2,y0-lw/2,x1-x0+lw,y1-y0+lw,a)},
  /* quadratic curve sampled as a polyline (so its box is honest) */
  quad:function(id,x1,y1,cx,cy,x2,y2,o,upto){var pts=[],n=24,m=upto==null?1:upto;for(var i=0;i<=n;i++){var s=i/n*m,q=1-s;pts.push([q*q*x1+2*q*s*cx+s*s*x2,q*q*y1+2*q*s*cy+s*s*y2])}this.path(id,pts,o)}
};

/* text change choreography: the old reading leaves (150 ms, up) before the new one enters (150 ms, from below) */
function swapTL(tl,c,cycle){var n=tl.length,k=n-1;for(var i=0;i<n;i++)if(c>=tl[i][0])k=i;var cur=tl[k],prev=tl[(k-1+n)%n],next=tl[(k+1)%n];
  var since=c-cur[0],until=(k===n-1?cycle:next[0])-c,a=1,dy=0;
  if(prev[1]!==cur[1]&&since<.15){var q=E.out(since/.15);a=q;dy=4*(1-q)}
  if(next[1]!==cur[1]&&until<.15){var q2=E.in(1-until/.15);a*=1-q2;dy=-4*q2}
  return {text:cur[1],a:a,dy:dy}}

var SC={}, ORDER=['voice','agents','knowledge','console','platform','data','infra','assurance'];

/* one stage instance: canvas, clock, pointer, transition machine */
function Inst(cv,name,opts){
  var self=this;this.manual=!!(opts&&opts.manual);this.cv=cv;this.ctx=cv.getContext('2d');this.d=new Draw(this.ctx);this.W=0;this.H=0;this.dpr=1;
  this.clock=function(){return performance.now()};this.shown=null;this.target=null;this.pulse=-1;this.hold=0;this.last=-1;this.raf=0;this.inView=true;this.dt=0;
  this.pt={x:.5,y:.5,on:false,b:0};this.st={};this.fresh=true;
  this.size();this.set(name||ORDER[0],true);
  var moved=function(e){var r=cv.getBoundingClientRect();if(!r.width)return;self.pt.x=(e.clientX-r.left)/r.width;self.pt.y=(e.clientY-r.top)/r.height;self.pt.on=true;if(!self.motion()){self.pt.b=1;self.draw()}};
  var left=function(){self.pt.on=false;if(!self.motion()){self.pt.b=0;self.draw()}};
  cv.addEventListener('pointermove',moved,{passive:true});cv.addEventListener('pointerleave',left);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(function(){self.size();self.draw()}).observe(cv);else addEventListener('resize',function(){self.size();self.draw()});
  if(typeof IntersectionObserver!=='undefined')new IntersectionObserver(function(en){self.inView=en[0].isIntersecting;self.loop()},{threshold:0}).observe(cv);
  addEventListener('ardholt:motion',function(){if(!self.motion()){self.settle()}self.loop()});
  this.draw();this.loop();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){self.draw()});
}
Inst.prototype={
  motion:function(){if(this.forceMotion)return true;if(navigator.webdriver)return false;if(window.ARDHOLT&&window.ARDHOLT.motionOn)return window.ARDHOLT.motionOn();return !matchMedia('(prefers-reduced-motion: reduce)').matches},
  size:function(){var cv=this.cv;this.W=cv.clientWidth||cv.width;this.H=cv.clientHeight||cv.height;this.dpr=Math.min(2,devicePixelRatio||1);cv.width=Math.round(this.W*this.dpr);cv.height=Math.round(this.H*this.dpr)},
  /* set(name): the shown scene exits along its own logic, the stage pulses, the new scene enters. Reversible at any point. */
  set:function(name,immediate){if(!SC[name])return;this.target=name;
    if(immediate||!this.shown||!this.motion()||!this.inView){this.shown={name:name,start:this.clock(),pres:1,mode:'on'};this.pulse=-1;this.hold=0;if(!immediate)this.draw();return}
    this.loop()},
  settle:function(){var s=this.shown;if(!s)return;s.name=this.target;s.pres=1;s.mode='on';s.start=this.clock()-SC[s.name].settled*1000;this.pulse=-1;this.draw()},
  advance:function(dt){var s=this.shown,p=this.pt;this.dt=dt;p.b+=(p.on?1:-1)*dt/.4;p.b=u(p.b);
    if(this.pulse>=0){this.pulse+=dt;if(this.pulse>.3)this.pulse=-1}
    if(s.name!==this.target){s.mode='out';s.pres=u(s.pres-dt/.35);s.xq=u((s.xq||0)+dt/.35);if(s.pres<=.43&&!s.pulsed&&this.pulse<0){s.pulsed=true;this.pulse=0}
      if(s.pres===0){this.shown={name:this.target,start:this.clock()+50,pres:0,mode:'in',hold:.05}}}
    else if(s.mode==='in'){if(s.hold>0){s.hold-=dt;if(s.hold>0)return}s.pres=u(s.pres+dt/.6);s.xq=u((s.xq||0)-dt/.6);if(s.pres>=1){s.mode='on';s.xq=0}}
    else if(s.mode==='out'){s.mode='in';s.pulsed=false}},
  /* the grid every scene draws on */
  grid:function(){var W=this.W,H=this.H,s=this.shown,x0=W*.07,x1=W*.93,y0=H*.09,y1=H*.9,cw=x1-x0,ch=y1-y0,self=this,d=this.d;
    var now=this.clock(),def=SC[s.name],pres=s.pres,mode=s.mode,t=this.ft!=null?this.ft:!this.motion()?def.settled:Math.max(0,(now-s.start)/1000);
    var e=mode==='on'?function(){return 1}:function(i){var te=pres*.6;return E.out(u((te-.04*i)/(.6-.04*i)))};
    var x=E.in(s.xq||0);
    var st=this.st[s.name]||(this.st[s.name]={});
    var g={d:d,W:W,H:H,x0:x0,x1:x1,y0:y0,y1:y1,cw:cw,ch:ch,narrow:W<560,rs:W<560?10:12,t:t,c:t%def.cycle,n:Math.floor(t/def.cycle),cycle:def.cycle,e:e,x:x,p:{x:(this.pt.x*W-x0)/cw,y:(this.pt.y*H-y0)/ch,on:this.pt.on,b:this.pt.b},st:st,dt:this.dt,now:now/1000,
      col:function(i){return x0+cw*i/12},row:function(j){return y0+ch*j/12}};
    /* eased state value for hover and the like */
    g.ease=function(key,target,rate){var v=st[key]==null?target:st[key];v+=(target-v>0?1:-1)*Math.min(Math.abs(target-v),self.dt*rate);st[key]=v;return v};
    /* readouts: top-left and top-right; on narrow stages the right one drops under the left */
    g.caps=function(left,right){var a=e(1)*(1-x),dy=6*(1-e(1))+6*x,rs=g.rs;d.text('tl',left,x0,y0,{size:rs,col:C.ink2,a:a,dy:dy});
      var sw=typeof right==='string'?{text:right,a:1,dy:0}:swapTL(right,g.c,def.cycle);var o={size:rs,col:C.mute,a:a*sw.a,dy:dy+sw.dy};var w;
      if(g.narrow){o.align='left';w=d.text('tr',sw.text,x0,y0+rs+6,o);return {x:x0,y:y0+rs+6+o.dy,w:w,h:rs}}o.align='right';w=d.text('tr',sw.text,x1,y0,o);return {x:x1-w,y:y0+o.dy,w:w,h:rs}};
    /* a state-driven reading (hover): old text leaves before the new arrives */
    g.swapS=function(key,text){var r=st[key];if(!r){r=st[key]={text:text,t0:-9,old:null}}if(r.text!==text){r.old=r.text;r.text=text;r.t0=g.now}var since=g.now-r.t0;
      if(since<.15&&r.old)return {text:r.old,a:1-E.in(since/.15),dy:-4*E.in(since/.15)};var q=E.out(u((since-.15)/.15));return {text:r.text,a:q,dy:4*(1-q)}};
    /* bottom line in mute 10 px, wrapped at sentence ends when it does not fit; anchored to the bottom margin; returns its top */
    g.bottom=function(id,text){var lines=[text];if(d.measure(text,10)>cw){lines=[];var parts=text.split('. '),cur='';parts.forEach(function(p,i){p=i<parts.length-1?p+'.':p;var tryS=cur?cur+' '+p:p;if(cur&&d.measure(tryS,10)>cw){lines.push(cur);cur=p}else cur=tryS});if(cur)lines.push(cur)}
      var top=y1-lines.length*LH+(LH-10)/2,a=e(2)*(1-x),dy=-6*(1-e(2))-6*x;lines.forEach(function(l,i){d.text(id+(i||''),l,x0,top+i*LH,{col:C.mute,a:a,dy:dy})});return top-6};
    return g},
  draw:function(){var c=this.ctx,d=this.d;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.W,this.H);d.els=[];d.clip=null;c.lineCap='butt';
    var s=this.shown;if(s&&(s.mode!=='in'||!(s.hold>0))){var g=this.grid();d.s=s.name;SC[s.name].draw(g,g.c)}
    if(this.pulse>=0){var q=this.pulse/.3,x0=this.W*.07,x1=this.W*.93,y=this.H*.495,head=lerp(x0,x1,q),tail=Math.max(x0,head-(x1-x0)*.22);d.s='stage';
      var gr=c.createLinearGradient(tail,0,head,0);gr.addColorStop(0,rgba(INK,0));gr.addColorStop(1,rgba(INK,.9));c.fillStyle=gr;c.fillRect(tail,y,head-tail,1);d.reg('pulse','el',tail,y,head-tail,1,1)}
    return d.els},
  tick:function(now){var dt=this.last<0?0:Math.min(.1,(now-this.last)/1000);this.last=now;this.advance(dt);this.draw()},
  loop:function(){var self=this;if(this.manual)return;cancelAnimationFrame(this.raf);this.raf=0;this.last=-1;if(!this.inView)return;if(!this.motion()){if(this.fresh){this.fresh=false;this.settle()}return}this.fresh=false;
    var step=function(now){if(self.manual)return;self.tick(now);if(self.inView&&self.motion())self.raf=requestAnimationFrame(step)};this.raf=requestAnimationFrame(step)},
  /* harness entry points: a pure frame of one scene at time t, and a stepped virtual clock for transitions */
  frame:function(name,t){this.shown={name:name,start:this.clock()-t*1000,pres:1,mode:'on'};this.target=name;this.pulse=-1;this.dt=0;this.ft=t;var els=this.draw();this.ft=null;return els},
  drive:function(dt){this.advance(dt);return this.draw()},
  state:function(){var s=this.shown;return {shown:s.name,target:this.target,pres:s.pres,mode:s.mode,pulse:this.pulse,hold:s.hold||0}}
};

/* 01 Voice: a live call. The system speaks; the caller cuts in; the system yields within 120 ms; the thread resumes.
   Two bands: system above, caller below; a timeline records the turns; time flows left to right only. */
SC.voice={n:'01',cycle:9,settled:2,beats:[[0,'system speaks',.3],[2,'settled',0],[4.5,'caller cuts in',.3],[5.5,'caller holds',0],[6.5,'caller ends · system resumes',.6],[8.65,'loop',.35]],
  draw:function(g,c){var d=g.d,e=g.e,x=g.x,t=g.t,fade=1-x,x0=g.x0,x1=g.x1,cw=g.cw;
    var Ls=c<4.5?E.out(u(c/.3)):c<6.5?1-u((c-4.5)/.12):E.out(u((c-6.5)/.6));        /* system level */
    var Lc=c<4.5?0:c<6.5?E.out(u((c-4.5)/.3)):1-u((c-6.5)/.12);                       /* caller level */
    Lc*=lerp(1,lerp(.55,1.15,1-u(g.p.y)),g.p.b);                                       /* pointer height = the caller's loudness */
    var ys=g.row(3.6),yc=g.row(7),amp=g.ch*.085,flat=fade;
    d.line('rule-s',x0,ys,lerp(x0,x1,e(0)),ys,{col:C.line,a:fade});d.line('rule-c',x0,yc,lerp(x0,x1,e(0)),yc,{col:C.line,a:fade});
    function wave(id,y,L,col,seed,sp){var pts=[],n=150;for(var i=0;i<=n;i++){var f=i/n,env=Math.pow(Math.sin(f*Math.PI),.7);pts.push([x0+f*cw,y+env*L*amp*flat*(Math.sin(f*30+t*sp+seed)*.5+Math.sin(f*9-t*sp*.6+seed)*.38+Math.sin(f*67+t*sp*1.7+seed)*.12)])}d.path(id,pts,{col:col,w:1.5,a:e(2)*fade*u(L/.25)})}   /* a silent channel is not drawn */
    wave('wave-s',ys,Ls,C.ink,0,5.5);wave('wave-c',yc,Lc,C.acc,2,8);
    /* timeline: the turns recorded as bars, the playhead, the speakers */
    var ty=g.row(10),loopA=(1-E.in(u((c-8.65)/.35)))*E.out(u(c/.3));
    d.line('tline',x0,ty,lerp(x0,x1,e(0)),ty,{col:C.faint,a:fade});
    [[0,4.5,C.ink2,'bar-0'],[4.5,6.5,C.acc,'bar-1'],[6.5,9,C.ink2,'bar-2']].forEach(function(s){if(c<=s[0])return;var a=x0+s[0]/9*cw,b=x0+Math.min(c,s[1])/9*cw;d.rect(s[3],a,ty-1.5,b-a,3,{fill:s[2],a:e(1)*fade*loopA})});
    var px=Math.min(x0+c/9*cw+22*x,x1-2);d.line('ph-t',px,ty-6,px,ty+6,{col:C.ink,a:e(1)*fade*loopA});d.dot('ph',px,ty,1.5,C.ink,e(1)*fade*loopA);
    [[0,'SYSTEM','sp-0'],[4.5,'CALLER','sp-1'],[6.5,'SYSTEM','sp-2']].forEach(function(s){d.text(s[2],s[1],x0+s[0]/9*cw,ty+11,{col:C.mute,a:e(3)*fade})});
    var box=g.caps('LIVE CALL · '+pad(Math.floor(c),2)+'.'+Math.floor(c*10%10)+' S',[[0,'SPEAKING'],[4.5,'INTERRUPTED · YIELDED IN 120 MS'],[6.5,'RESUMING'],[7.1,'SPEAKING']]);
    /* the live ring, breathing once per second (opacity only; its size never changes) */
    var rx=g.narrow?box.x+box.w+14:box.x-14,ry=box.y+g.rs/2,pulse=.45+.55*(.5+.5*Math.cos(t*TAU));
    d.ring('live',rx,ry,4,{col:C.acc,a:e(3)*fade});d.dot('live-d',rx,ry,1.5,C.acc,e(3)*fade*pulse)}};

/* 02 Agents: work orders. BRIEF → PLAN → BUILD → PROVE → SHIP; what fails at PROVE returns to BUILD on the lower path;
   a person is reached only at the decision node above PLAN, rarely. Cards move left to right; returns right to left below. */
(function(){
  var NAMES=['BRIEF','PLAN','BUILD','PROVE','SHIP'],R=15;
  function plan(k){var segs=[[.3,0,0],[1,0,1],[.3,1,1]];if(k===0)segs.push([.7,1,1,'dec']);segs.push([1,1,2],[.3,2,2],[1,2,3],[.5,3,3]);
    if(k===2)segs.push([1.2,3,2,'ret'],[.3,2,2],[1,2,3],[.5,3,3]);segs.push([1,3,4]);var D=0;segs.forEach(function(s){D+=s[0]});return {segs:segs,D:D}}
  var PLANS=[0,1,2,3].map(plan);
  SC.agents={n:'02',cycle:11,settled:3,beats:[[0,'first brief leaves',0],[1.6,'plan',0],[3,'settled · decision reached',0],[5.4,'first delivery',0],[7.1,'return from PROVE',0],[9.2,'retry proven',0]],
    draw:function(g,c){var d=g.d,e=g.e,x=g.x,t=g.t,fade=1-x,y=g.row(6.2),xs=[1,3.5,6,8.5,11].map(g.col),gx=xs[1],gy=g.row(2.6);
      d.line('rail',xs[0],y,lerp(xs[0],xs[4],e(0)),y,{col:C.faint,a:fade});
      d.quad('ret',xs[3],y+R,(xs[2]+xs[3])/2,y+R+g.ch*.3,xs[2],y+R,{col:C.faint,dash:[3,5],a:e(1)*fade},e(1));
      d.line('stem',gx,y-R,gx,lerp(y-R,gy+12,e(1)),{col:C.faint,a:fade});
      /* cards of the current and previous cycle; counter and in-flight count from the same schedule */
      var cur=g.n,inflight=0,delivered=1184+4*Math.max(0,cur-1),atDec=0,hov=g.p.on?g.p.b:0,px=g.p.x*g.cw+g.x0,py=g.p.y*g.ch+g.y0;
      for(var m=Math.max(0,cur-1);m<=cur;m++)for(var k=0;k<4;k++){var P=PLANS[k],tau=t-(m*11+k*1.5);if(tau<0)continue;if(tau>=P.D){delivered++;if(tau>P.D+.35)continue}else inflight++;
        var acc=0,cx=xs[0],cy=y,col=C.ink;for(var i=0;i<P.segs.length;i++){var s=P.segs[i];if(tau<acc+s[0]){var f=(tau-acc)/s[0];
            if(s[3]==='ret'){var q=E.move(f);cx=lerp(xs[3],xs[2],q);cy=y+R+Math.sin(q*Math.PI)*g.ch*.15;col=C.acc}
            else if(s[3]==='dec'){var b=E.move(u(f/.3))-E.move(u((f-.65)/.3));cx=xs[1];cy=y-b*(y-gy-16);atDec=Math.max(atDec,b)}
            else{cx=lerp(xs[s[1]],xs[s[2]],E.move(f));cy=y}break}acc+=s[0]}
        var a=E.out(u(tau/.3)),ex=tau>=P.D?E.in(u((tau-P.D)/.35)):0;cx+=ex*10+x*12-(1-a)*8;
        d.rect('card-'+(m*4+k),cx-7,cy-4,14,8,{fill:col,r:4,a:a*(1-ex)*fade})}
      xs.forEach(function(sx,i){var near=hov*(Math.hypot(px-sx,py-y)<R+12?1:0),h=g.ease('h'+i,near,5),r=R+2*h;
        d.ring('st-'+i,sx,y,r,{col:i===3?C.acc45:C.ink2,w:1,a:e(0)*fade,to:e(0)});d.text('nm-'+i,NAMES[i],sx,y+R+10,{align:'center',col:h>.5?C.ink2:C.mute,a:e(2)*fade,dy:(1-e(2))*6+6*x})});
      /* the person at the decision node: a head and shoulders, brighter while a card is with them */
      var gc=atDec>.5?C.ink:C.mute,ga=e(1)*fade;d.ring('glyph-h',gx,gy-3,3,{col:gc,a:ga});d.quad('glyph-s',gx-7,gy+9,gx,gy-2,gx+7,gy+9,{col:gc,a:ga});
      d.text('dec','DECISION',gx+16,gy-2,{col:atDec>.5?C.ink2:C.mute,a:e(2)*fade,dx:(1-e(2))*-6});
      g.caps('WORK ORDERS IN FLIGHT · '+inflight,'DELIVERED · '+pad(delivered,4))}};
})();

/* 03 Knowledge: retrieval. 420 linked records in six soft clusters; a question lights the 16 nearest, ranked.
   Everything radiates outward from the query; on exit the retrieval lines retract into it. */
(function(){
  var r=rnd(7),K=[],KE=[],CENT=[[.14,.3],[.4,.18],[.72,.26],[.9,.6],[.58,.7],[.24,.76]];
  for(var i=0;i<420;i++){var ci=i%6,cc=CENT[ci],a=r()*TAU,rr=Math.pow(r(),.6);K.push([cc[0]+Math.cos(a)*rr*.13,cc[1]+Math.sin(a)*rr*.16,ci])}
  K.forEach(function(p,i){var n=0;for(var j=i+1;j<K.length&&n<2;j++){if(Math.hypot(p[0]-K[j][0],p[1]-K[j][1])<.045){KE.push([i,j]);n++}}});
  SC.knowledge={n:'03',cycle:12,settled:4,beats:[[0,'query roams',0],[2,'',0],[4,'settled',0],[6,'',0],[8,'',0],[10,'',0]],
    draw:function(g,c){var d=g.d,e=g.e,x=g.x,fade=1-x,fx=g.x0,fw=g.cw,fy=g.row(1.3),fh=g.row(8.6)-fy,ph=g.t/12*TAU;
      var qx=lerp(fx+fw*(.5+.42*Math.sin(ph)),g.p.x*g.cw+g.x0,g.p.b),qy=lerp(fy+fh*(.5+.38*Math.sin(2*ph+1.1)),g.p.y*g.ch+g.y0,g.p.b);
      var P=K.map(function(p){return [fx+p[0]*fw,fy+p[1]*fh]}),ds=P.map(function(p,i){return [Math.hypot(p[0]-qx,p[1]-qy),i]}).sort(function(a,b){return a[0]-b[0]});
      var d16=ds[15][0],m=d16*.3,hot={};ds.forEach(function(s,k){var h=u((d16+m-s[0])/m);if(h>0)hot[s[1]]=[h,k]});
      /* the body: faint links then the records */
      var ctx=d.c,ea=e(0)*fade;if(ea>.02){ctx.globalAlpha=ea;ctx.strokeStyle=C.line;ctx.lineWidth=1;ctx.beginPath();KE.forEach(function(ed){ctx.moveTo(P[ed[0]][0],P[ed[0]][1]);ctx.lineTo(P[ed[1]][0],P[ed[1]][1])});ctx.stroke();ctx.globalAlpha=1;d.reg('edges','el',fx,fy,fw,fh,ea)}
      var da=e(1)*fade;if(da>.02){ctx.globalAlpha=da;ctx.fillStyle=C.mute;ctx.beginPath();P.forEach(function(p,i){if(hot[i]&&hot[i][0]>=1)return;ctx.moveTo(p[0]+1,p[1]);ctx.arc(p[0],p[1],1,0,TAU)});ctx.fill();ctx.globalAlpha=1;d.reg('dots','el',fx-1,fy-1,fw+2,fh+2,da)}
      /* retrieval: lines by rank tint, the found records enlarged in ink; the query ring */
      for(var i in hot){var h=hot[i][0],k=hot[i][1],p=P[i],col=k<6?C.acc:k<11?C.acc45:C.acc18,ex=lerp(qx,p[0],e(3)*(1-x)),ey=lerp(qy,p[1],e(3)*(1-x));
        if(k<16&&h*fade>.01){ctx.globalAlpha=h*fade;ctx.strokeStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(qx,qy);ctx.lineTo(ex,ey);ctx.stroke();ctx.globalAlpha=1}d.dot('hot-'+i,p[0],p[1],1+h,C.ink,da)}
      var rx0=Math.max(fx,qx-d16),ry0=Math.max(fy,qy-d16);d.reg('retrieval','el',rx0,ry0,Math.min(fx+fw,qx+d16)-rx0,Math.min(fy+fh,qy+d16)-ry0,e(3)*fade);
      d.ring('q',qx,qy,6,{col:C.acc,a:e(2)*fade,to:e(2)});
      /* ranked answers, bottom right */
      var lx=g.col(8.5),lw=g.col(12)-lx,ly=g.row(9.7),la=e(4)*fade;d.text('ranked','RANKED',lx,ly-16,{col:C.mute,a:la,dy:6*(1-e(4))});
      for(var k=0;k<5;k++){var sc=u(1-ds[k][0]/(2.2*d16)),by=ly+k*9;d.rect('trk-'+k,lx,by,lw,2,{fill:C.line,a:la});d.rect('bar-'+k,lx,by,lw*sc*fade*e(4),2,{fill:k?C.ink2:C.acc,a:la})}
      g.caps('RECORDS · 420 · LINKED',g.p.on?'QUERY · POINTER':'QUERY · ROAMING')}};
})();

/* 04 Console: one job on the client's own channel. REQUEST, CLARIFY, IN PROGRESS, DELIVERED arrive as a message thread,
   each card rising into its slot from below; the thread scrolls up and out at the end. Cards move upward only. */
SC.console={n:'04',cycle:12,settled:9,beats:[[0,'request',.6],[1.5,'clarify',.6],[3.5,'in progress',.6],[6,'progress',0],[8.5,'delivered',.6],[9,'settled',0],[10.5,'thread scrolls out',1.5]],
  draw:function(g,c){var d=g.d,e=g.e,x=g.x,fade=1-x,rh=g.ch/12,hC=2.05*rh,gap=.35*rh,top=g.row(1.4),lx=g.col(.4),w=g.cw*7.4/12,T=[['REQUEST',0],['CLARIFY',1.5],['IN PROGRESS',3.5],['DELIVERED',8.5]];
    var out=E.move(u((c-10.5)/1.5)),lift=out*(g.row(11.2)-top),outA=1-E.in(u((c-10.5)/1.5)),curI=-1;T.forEach(function(k,i){if(c>=k[1])curI=i});
    d.line('rule',lx,top,lx,lerp(top,g.row(11.2),e(0)),{col:C.line,a:fade});
    var px=g.p.x*g.cw+g.x0,py=g.p.y*g.ch+g.y0;var ct=g.row(1.2);d.clip=[g.x0,ct,g.cw,g.y1-ct];d.c.save();d.c.beginPath();d.c.rect(g.x0,ct,g.cw,g.y1-ct);d.c.clip();
    T.forEach(function(k,i){if(c<k[1])return;var en=E.out(u((c-k[1])/.6)),y=top+i*(hC+gap)+(1-en)*rh-lift-x*rh*.6,cx=i%2?g.col(12)-w:g.col(1),a=en*outA*fade*e(1);
      var hv=g.ease('h'+i,g.p.on&&px>cx&&px<cx+w&&py>y&&py<y+hC?g.p.b:0,5);y-=2*hv;
      d.rect('card-'+i,cx,y,w,hC,{fill:C.line,r:4,a:a});d.text('ttl-'+i,k[0],cx+14,y+12,{size:14,col:C.ink2,a:a});
      d.rect('ln-'+i+'a',cx+14,y+32,(w-28)*.62,2,{fill:C.mute,a:a});d.rect('ln-'+i+'b',cx+14,y+37,(w-28)*.4,2,{fill:C.mute,a:a});
      if(i===2){var pr=u((c-3.5)/5);d.rect('prog-t',cx+14,y+hC-8,w-28,2,{fill:C.faint,a:a});d.rect('prog',cx+14,y+hC-8,(w-28)*pr,2,{fill:C.ink2,a:a})}
      d.dot('dot-'+i,lx,y+hC/2,1.5,i===curI?C.acc:C.ink2,a)});
    d.c.restore();d.clip=null;
    g.caps("ONE JOB · ON THE CLIENT'S OWN CHANNEL",[[0,'IN PLAIN LANGUAGE'],[8.5,'DELIVERED · WITH EVIDENCE']])}};

/* 05 Platform: one product, every screen. The parts assemble in order, then the frame narrows from 1440 to 390 px and
   widens again; the sidebar collapses, the tiles stack (down first, then across), chart and table reflow. Nothing teleports. */
SC.platform={n:'05',cycle:11,settled:5,beats:[[0,'nav, sidebar',.6],[1,'tiles',1.2],[1.9,'chart',.6],[2.4,'rows',.8],[5,'settled · 1440 px',0],[6,'narrows',2.2],[8.2,'390 px',0],[9,'widens',2],[10.6,'parts leave',.4]],
  draw:function(g,c){var d=g.d,e=g.e,x=g.x,fade=1-x,rh=g.ch/12,t=g.t;
    var f=c<6?0:c<8.2?E.move((c-6)/2.2):c<9?1:1-E.move((c-9)/2);f=lerp(f,1-u(g.p.x),g.p.b);
    var fw=g.cw*lerp(1,.42,f)*(1-.04*x),fh=g.row(11.6)-g.row(1.4),fx=g.x0+(g.cw-fw)/2,fy=g.row(1.4),p=Math.round(g.cw*.012)+4;
    var leave=1-E.in(u((c-10.6)/.4));function part(k){return E.out(u((c-k)/.6))*leave}
    d.rect('frame',fx,fy,fw,fh,{stroke:C.ink2,r:4,a:e(0)*fade});
    d.clip=[fx,fy,fw,fh];d.c.save();d.c.beginPath();d.c.rect(fx,fy,fw,fh);d.c.clip();
    /* nav with the one live thing: a 3 px accent progress mark */
    var nH=.7*rh,an=part(0),ny=fy+p-6*(1-an);d.line('nav',fx,ny+nH,fx+fw,ny+nH,{col:C.line,a:an*fade});d.dot('nav-m',fx+p+4,ny+nH/2,1.5,C.ink2,an*fade);
    for(var i=0;i<3;i++)d.rect('nav-'+i,fx+fw-p-(3-i)*22,ny+nH/2-1,14,2,{fill:C.mute,a:an*fade});
    d.rect('mark',fx,ny+nH-1,fw*.2*u(c/3.2),3,{fill:C.acc,a:an*fade});
    /* sidebar collapses in the first half of the narrowing */
    var sw=g.narrow?0:g.cw*.2*(1-u(f/.5)),as=part(.5)*(1-u(f/.4)),cy=ny+nH+p,cx=fx+p+(sw>0?sw+p:0),cw2=fw-2*p-(sw>0?sw+p:0);
    if(sw>1){d.rect('side',fx+p,cy,sw,fh-nH-3*p,{fill:C.line,r:4,a:as*fade});for(var i=0;i<5;i++)d.rect('side-'+i,fx+2*p,cy+p+6+i*14,sw*.6,2,{fill:C.mute,a:as*fade})}
    /* three KPI tiles: down first (uA), then across (uB) */
    var uA=u(f/.5),uB=u((f-.5)/.5),th=Math.max(1.3*rh,2*p+38),tg=.2*rh,third=(cw2-2*tg)/3,V=['4.2k','38 ms','99.98'],L=['THROUGHPUT','LATENCY','UPTIME'];
    for(var k=0;k<3;k++){var ak=part(1+k*.2),tx=lerp(cx+k*(third+tg),cx,uB),tw=lerp(third,cw2,uB),ty=cy+k*(th+tg)*uA-4*(1-ak);
      d.rect('kpi-'+k,tx,ty,tw,th,{fill:C.line,r:4,a:ak*fade});d.text('kpi-l-'+k,L[k],tx+p,ty+p,{col:C.mute,a:ak*fade});d.text('kpi-v-'+k,V[k],tx+p,ty+th-p-26,{size:24,serif:true,col:C.ink,a:ak*fade})}
    /* chart with a live line, then four table rows */
    var chy=cy+th+(th+tg)*2*uA+tg,chh=2*rh,ac=part(1.9);d.rect('chart',cx,chy,cw2,chh,{fill:C.line,r:4,a:ac*fade});
    var pts=[],n=48;for(var i=0;i<=n;i++){var q=i/n;pts.push([cx+p+q*(cw2-2*p),chy+chh-p-(.5+.3*Math.sin(q*5-t*1.2)+.15*Math.sin(q*13-t*2.3))*(chh-2*p)*.8])}d.path('chart-ln',pts,{col:C.ink,a:ac*fade});
    var ry=chy+chh+tg,rrh=.42*rh;for(var i=0;i<4;i++){var ar=part(2.4+i*.1),yy=ry+i*(rrh+.12*rh);d.rect('row-'+i,cx,yy,cw2,rrh,{fill:i%2?C.faint:C.line,a:ar*fade*.7});d.rect('row-'+i+'a',cx+p,yy+rrh/2-1,cw2*.3,2,{fill:C.mute,a:ar*fade});d.rect('row-'+i+'b',cx+cw2*.55,yy+rrh/2-1,cw2*.15,2,{fill:C.mute,a:ar*fade})}
    d.c.restore();d.clip=null;
    g.caps(Math.round(lerp(1440,390,f))+' PX',[[0,'ASSEMBLING'],[3.2,'HOLDS ITS SHAPE'],[8.2,'SAME PRODUCT · SAME ORDER']])}};

/* 06 Data: what arrives, what leaves. Inconsistent rows arrive from the left, pass the validator, leave aligned and typed to
   the right; what cannot be validated is never guessed at: it drops to the review tray, flagged by row number. */
(function(){
  var r=rnd(3),ROWS=[];for(var i=0;i<12;i++)ROWS.push({bad:i===6||i===11,segs:[.15+r()*.2,.12+r()*.22,.1+r()*.18],gaps:[.03+r()*.05,.03+r()*.05],jit:[r()*3-1.5,r()*3-1.5,r()*3-1.5]});
  SC.data={n:'06',cycle:6,settled:2.5,beats:[[0,'',0],[1.2,'row 12 drops',.8],[2.5,'settled',0],[3.7,'row 07 drops',.8],[4.5,'',0],[5.4,'',0]],
    draw:function(g,c){var d=g.d,e=g.e,x=g.x,fade=1-x,t=g.t,gx=g.col(6),rw=g.cw*2.6/12,travel=g.cw-rw,phC=(g.cw/2-rw/2)/travel,trayY=g.row(9.9),trayX=g.col(6.4),px=g.p.x*g.cw+g.x0,py=g.p.y*g.ch+g.y0;
      d.line('val',gx,g.row(1),gx,lerp(g.row(1),g.row(9.2),e(0)),{col:C.acc45,a:fade});
      d.clip=[g.x0,g.y0,g.cw,g.ch];d.c.save();d.c.beginPath();d.c.rect(g.x0,g.y0,g.cw,g.ch);d.c.clip();
      ROWS.forEach(function(R,i){var ph=((t+2.12+i*.5)/6)%1,y=g.row(1.3+i*.63),lx=g.x0+ph*travel+x*g.cw*.3,xc=lx+rw/2,a=E.out(u(ph/.05))*(1-E.in(u((ph-.95)/.05)))*e(1)*fade;
        var m=E.move(u((xc-gx)/(g.cw*.05)+.5)),id='row-'+i,ly=y,col=C.mute,dropped=0;          /* m: morph from irregular to typed */
        if(R.bad&&xc>=gx){var td=(ph-phC)*6,k=E.move(u(td/.8));dropped=k;lx=lerp(gx-rw/2,trayX,k);ly=lerp(y,trayY,E.move(u(td/.8)));a=E.out(u(ph/.05))*(1-E.in(u((td-2.1)/.35)))*e(1)*fade;m=0;col=k>.5?C.acc:C.acc45}
        if(a<=.02)return;var cx=lx,W=[.38,.28,.2],G=[.04,.04],X0=1e9,X1=-1e9;
        for(var s=0;s<3;s++){var w=lerp(R.segs[s],W[s],m)*rw,jy=lerp(R.jit[s],0,m),bad=R.bad&&s===1&&!dropped,sc=bad?C.acc45:m>.5?C.ink2:col;
          d.rect(id+'-'+s,cx,ly+jy-2,w,4,{fill:sc,a:a});X0=Math.min(X0,cx);X1=Math.max(X1,cx+w);cx+=w+lerp(R.gaps[s]||.04,G[s]||.04,m)*rw}
        if(dropped>=1){if(g.narrow)d.text('flag-'+i,'FLAG · ROW '+pad(i+1,2),X0,ly-16,{col:C.acc,a:a});else d.text('flag-'+i,'FLAG · ROW '+pad(i+1,2),X1+10,ly-5,{col:C.acc,a:a})}
        if(g.p.on&&!dropped&&py>y-8&&py<y+8&&px>X0&&px<X1)d.text('hov-'+i,'ROW '+pad(i+1,2),X0,y-16,{col:C.ink2,a:a*g.p.b})});
      d.c.restore();d.clip=null;
      d.line('tray',g.col(6),trayY+8,lerp(g.col(6),g.col(12),e(0)),trayY+8,{col:C.faint,a:fade});d.text('tray-l','FOR A PERSON TO DECIDE',g.x1,trayY+14,{align:'right',col:C.mute,a:e(2)*fade,dy:6*(1-e(2))});
      g.bottom('bottom','NEVER GUESSED. EVERY EXCEPTION NAMED.');g.caps('IN · INCONSISTENT','OUT · VALIDATED, TRACEABLE')}};
})();

/* 07 Infrastructure: three sites that carry each other. Site B goes dark; traffic reroutes over the bypass arc; the watchdog
   brings it back; nothing is paged. Packets move left to right; on exit they finish their segment. */
SC.infra={n:'07',cycle:12,settled:10,beats:[[0,'all sites serving',0],[4,'site B fails',.4],[5.5,'bypass',0],[7.5,'watchdog recovers',1.2],[10,'settled',0],[11,'',0]],
  draw:function(g,c){var d=g.d,e=g.e,x=g.x,fade=1-x,t=g.t,py=g.row(2.4),ph=g.row(8.6)-py,X=[[0,3.6],[4.2,7.8],[8.4,12]].map(function(s){return [g.col(s[0]),g.col(s[1])]}),yl=g.row(5.5),apex=g.row(1.2);
    var bf=c<4?1:c<7.5?1-E.move(u((c-4)/.4)):E.out(u((c-7.5)/1.2)),w=1-bf,px=g.p.x*g.cw+g.x0,pyy=g.p.y*g.ch+g.y0;
    var blockTop=g.bottom('bottom','RUNS UNATTENDED. RECOVERS ON ITS OWN.');
    /* links, bypass arc and packets along whichever path is live */
    d.line('link-0',X[0][1],yl,X[1][0],yl,{col:C.faint,a:e(0)*fade*(1-w*.6)});d.line('link-1',X[1][1],yl,X[2][0],yl,{col:C.faint,a:e(0)*fade*(1-w*.6)});
    var ax=X[0][1],bx=X[2][0],cxq=(ax+bx)/2,cyq=yl-2*(yl-apex);if(w>.02)d.quad('arc',ax,yl,cxq,cyq,bx,yl,{col:C.faint,dash:[3,4],a:w*fade});
    for(var j=0;j<5;j++){var f=((t*.32+j*.2)+x*.6)%1,q=1-f,kx=lerp(lerp(ax,bx,f),q*q*ax+2*q*f*cxq+f*f*bx,w),ky=lerp(yl,q*q*yl+2*q*f*cyq+f*f*yl,w);d.dot('pk-'+j,kx,ky,1.5,C.ink,e(2)*fade)}
    X.forEach(function(s,i){var x0=s[0],pw=s[1]-s[0],down=i===1&&w>.5,inside=g.p.on&&px>x0&&px<s[1]&&pyy>py&&pyy<py+ph,hv=g.ease('h'+i,inside?g.p.b:0,5),sum=0;
      d.rect('panel-'+i,x0,py,pw,ph,{stroke:down?C.acc45:C.faint,r:4,a:e(0)*fade});
      for(var k=0;k<4;k++){var base=.4+.22*Math.sin(t*.7+k*1.3+i*2.1)+.1*Math.sin(t*1.9+k),load=i===1?base*bf:Math.min(1,base+.3*w),by=py+ph*.42+k*ph*.13;sum+=load;
        d.rect('trk-'+i+k,x0+10,by,pw-20,4,{fill:C.line,a:e(1)*fade});d.rect('bar-'+i+k,x0+10,by,(pw-20)*load,4,{fill:i===1&&w>.02?(bf>.5?C.acc:C.acc45):C.mute,a:e(1)*fade})}
      var lab=i===1?swapTL([[0,'SITE B · GPU ×4'],[4,'SITE B · DOWN'],[7.5,'SITE B · RECOVERED']],c,12):{text:'SITE '+'ABC'[i]+' · GPU ×4',a:1,dy:0},col=down?C.acc:C.mute;
      if(g.narrow){var parts=lab.text.split(' · ');d.text('lab-'+i,parts[0],x0+10,py+10,{col:col,a:e(2)*fade*lab.a,dy:lab.dy});d.text('lab2-'+i,parts[1],x0+10,py+24,{col:col,a:e(2)*fade*lab.a,dy:lab.dy})}
      else d.text('lab-'+i,lab.text,x0+10,py+10,{col:col,a:e(2)*fade*lab.a,dy:lab.dy});
      if(hv>.02)d.text('load-'+i,'LOAD · '+Math.round(sum/4*100)+' %',x0+10,py+ph-20,{col:C.ink2,a:hv*fade})});
    if(c>=7.5&&c<8.7){var k=E.out((c-7.5)/1.2);d.ring('pulse',(X[1][0]+X[1][1])/2,py+ph/2,lerp(16,48,k),{col:C.acc45,a:(1-k)*fade})}
    g.caps('PRIVATE COMPUTE · 3 SITES',[[0,'ALL SITES SERVING'],[4,'TRAFFIC REROUTED · NO ONE PAGED'],[7.5,'WATCHDOG BROUGHT IT BACK'],[8.7,'ALL SITES SERVING']])}};

/* 08 Assurance: a release under attack. The sweep moves down the candidate line by line; tokens are redacted as it passes;
   the planted fault is caught and boxed; the independent verifier signs; the release is held until it does. */
(function(){
  var r=rnd(11),LN=[];for(var i=0;i<13;i++){var segs=[],x=[0,.025,.05,.075][Math.floor(r()*4)],n=0;while(x<.72&&n<6){var w=.04+r()*.12;segs.push([x,w,r()<.1]);x+=w+.015;n++}LN.push(segs)}
  SC.assurance={n:'08',cycle:10,settled:6.5,beats:[[0,'candidate arrives',.6],[2,'sweeping',0],[4,'',0],[5.5,'seal',.8],[6.5,'settled · held',0],[9.65,'next candidate',.35]],
    draw:function(g,c){var d=g.d,e=g.e,x=g.x,fade=1-x,pitch=.6*g.ch/12,y0=g.row(1.3),sw=u(c/5.5),sy=lerp(g.row(1),g.row(9),sw);
      var blockTop=g.bottom('bottom','SECRETS STAY. FAULTS ARE PLANTED ON PURPOSE. NOTHING SHIPS ON ASSURANCE.');
      var fl=(4+g.n*5)%13,leave=1-E.in(u((c-9.65)/.35)),fs=0;LN[fl].forEach(function(s,k){if(s[0]+s[1]<=.42)fs=k+1});fs=fs?fs-1:0;
      LN.forEach(function(segs,i){var y=y0+i*pitch,en=E.out(u((c-.03*i)/.3))*leave*e(1)*fade,passed=E.out(u((sy-y)/(pitch*.5)));
        segs.forEach(function(s,k){var sx=g.x0+s[0]*g.cw,w=s[1]*g.cw,id='ln-'+i+'-'+k,yy=y-4*(1-en);
          if(s[2]){var h=lerp(2,6,passed);d.rect(id,sx,yy-h/2,w,h,{fill:passed>.5?C.ink2:C.acc45,a:en})}else d.rect(id,sx,yy-1,w,2,{fill:passed>.5?C.mute:C.faint,a:en})});
        if(i===fl&&passed>=1){var s=segs[fs],bx=g.x0+s[0]*g.cw,bw=s[1]*g.cw,bo=E.out(u((c-(y-g.row(1))/(g.row(9)-g.row(1))*5.5)/.35));
          d.rect('fault',bx-4,y-6,bw+8,12,{stroke:C.acc,r:4,a:en*bo});d.text('fault-l','PLANTED FAULT · CAUGHT',bx+bw+14,y-5,{col:C.acc,a:en*bo,dx:-6*(1-bo)})}});
      if(c<5.85)d.line('sweep',g.x0,sy,g.x1,sy,{col:C.acc,a:E.out(u(c/.3))*(1-E.in(u((c-5.5)/.35)))*e(2)*fade});
      /* the verifier's seal: a ring drawing, then a tick, then the signature */
      var sx=g.x1-14,scy=blockTop-20,k1=E.out(u((c-5.5)/.6)),k2=E.out(u((c-6.1)/.2)),sa=leave*e(2)*fade;
      if(c>=5.5){d.ring('seal',sx,scy,12,{col:C.ink,w:1.5,a:sa,to:k1});if(k2>0)d.path('seal-t',[[sx-5,scy],[sx-1.5,scy+4],[sx-1.5+8.5*k2,scy+4-9*k2]],{col:C.ink,w:1.5,a:sa});
        d.text('seal-l','INDEPENDENT VERIFIER · SIGNED',sx-22,scy-5,{align:'right',col:C.ink2,a:sa*k2,dx:4*(1-k2)})}
      g.caps('RELEASE CANDIDATE · UNDER ATTACK',[[0,'SWEEPING · SECRETS REDACTED'],[5.5,'FAULT FOUND · RELEASE HELD']])}};
})();

/* public surface */
var home=null;
window.ARDHOLT_SCENES={mount:function(cv,name,opts){return new Inst(cv,name,opts)},names:ORDER.slice(),def:function(n){var s=SC[n];return s&&{n:s.n,cycle:s.cycle,settled:s.settled,beats:s.beats}}};
var vizEl=document.getElementById('viz');
if(vizEl){home=new Inst(vizEl,'voice');window.ARDHOLT_VIZ={set:function(n){home.set(n)},inst:home}}
})();
