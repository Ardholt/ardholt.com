/* Capabilities stage: one canvas, eight hand-drawn live visuals, cross-faded as the steps scroll. No libraries. */
(function(){
  var cv=document.getElementById('viz'); if(!cv) return; var ctx=cv.getContext('2d');
  var W=0,H=0,DPR=Math.min(2,devicePixelRatio||1); function size(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)} size(); addEventListener('resize',function(){size();draw(performance.now())});
  var INK='#f1ece6', INK2='rgba(241,236,230,.55)', MUTE='rgba(241,236,230,.38)', LINE='rgba(241,236,230,.10)', ACC='#ff3b1f', ACC2='rgba(255,59,31,.35)';
  var mx=.5,my=.5; cv.parentNode.addEventListener('mousemove',function(e){var r=cv.getBoundingClientRect();mx=(e.clientX-r.left)/r.width;my=(e.clientY-r.top)/r.height},{passive:true});
  function rnd(seed){var s=seed;return function(){s=(s*9301+49297)%233280;return s/233280}}
  function ease(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
  function mono(sz){ctx.font=sz+'px "JetBrains Mono",ui-monospace,monospace'}

  var V={};
  /* 01 voice: a live line that speaks, is interrupted by a second voice, and yields */
  V.voice=function(t){var cx=W/2,cy=H/2,n=160,amp=H*.16,inter=(t%6)>4.2,k=inter?1-ease(Math.min(1,((t%6)-4.2)/.6)):1;
    ctx.lineWidth=1.2;ctx.strokeStyle=INK;ctx.beginPath();for(var i=0;i<=n;i++){var x=W*.08+i/n*W*.84,f=i/n,e=Math.sin(f*Math.PI);var y=cy+e*(Math.sin(f*22+t*5.2)*.5+Math.sin(f*9-t*3.1)*.5)*amp*k*(.6+.4*mx);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
    if(inter){var k2=ease(Math.min(1,((t%6)-4.2)/.5));ctx.strokeStyle=ACC;ctx.beginPath();for(var j=0;j<=n;j++){var x2=W*.08+j/n*W*.84,g=j/n,e2=Math.sin(g*Math.PI);var y2=cy+e2*Math.sin(g*31+t*8)*amp*.7*k2;j?ctx.lineTo(x2,y2):ctx.moveTo(x2,y2)}ctx.stroke()}
    ctx.strokeStyle=LINE;ctx.beginPath();ctx.moveTo(W*.08,cy);ctx.lineTo(W*.92,cy);ctx.stroke();
    ctx.fillStyle=MUTE;mono(10);ctx.fillText('LINE A',W*.08,H*.14);ctx.fillText('LINE B · STANDBY',W*.08,H*.14+16);ctx.fillStyle=inter?ACC:MUTE;ctx.fillText(inter?'BARGE-IN':'STREAMING',W*.92-70,H*.14);
    var m=t%6;ctx.fillStyle=ACC;ctx.beginPath();ctx.arc(W*.08+(m/6)*W*.84,H*.86,2.5,0,7);ctx.fill();ctx.strokeStyle=LINE;ctx.beginPath();ctx.moveTo(W*.08,H*.86);ctx.lineTo(W*.92,H*.86);ctx.stroke()};
  /* 02 agents: plan → build → test → gate → ship; the gate sends weak work back */
  V.agents=function(t){var names=['PLAN','BUILD','TEST','GATE','SHIP'],xs=names.map(function(_,i){return W*.12+i*W*.19}),y=H*.5;
    ctx.strokeStyle=LINE;ctx.beginPath();ctx.moveTo(xs[0],y);ctx.lineTo(xs[4],y);ctx.stroke();
    xs.forEach(function(x,i){ctx.strokeStyle=i===3?ACC2:INK2;ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,14,0,7);ctx.stroke();ctx.fillStyle=MUTE;mono(10);ctx.textAlign='center';ctx.fillText(names[i],x,y+38)});ctx.textAlign='left';
    xs.forEach(function(x,i){var busy=(Math.sin(t*2.1+i*1.3)+1)/2;ctx.fillStyle='rgba(241,236,230,'+(.05+busy*.12)+')';ctx.beginPath();ctx.arc(x,y,13,0,7);ctx.fill();for(var k=0;k<3;k++){ctx.fillStyle='rgba(241,236,230,'+(.15+.5*((Math.sin(t*3+i+k*2)+1)/2))+')';ctx.fillRect(x-14+k*10,y+22,6,2)}});
    for(var p=0;p<5;p++){var tt=(t*.55+p*.66)%3.3,seg=Math.min(3.999,tt*1.5),rej=(p===1&&seg>2.6&&seg<3.3);var sx;if(rej){var b=(seg-2.6)/.7;sx=xs[3]-(xs[3]-xs[1])*ease(b);ctx.fillStyle=ACC}else{var i=Math.floor(seg),f=seg-i;sx=xs[i]+(xs[Math.min(4,i+1)]-xs[i])*f;ctx.fillStyle=INK}ctx.beginPath();ctx.arc(sx,y+(rej?-26*Math.sin(Math.PI*((seg-2.6)/.7)):0),3,0,7);ctx.fill()}
    var pulse=(t%1.65)/1.65;ctx.strokeStyle='rgba(255,59,31,'+(1-pulse)*.5+')';ctx.beginPath();ctx.arc(xs[3],y,14+pulse*26,0,7);ctx.stroke();
    ctx.fillStyle=MUTE;mono(10);ctx.fillText('NOTHING PASSES THE GATE WITHOUT EVIDENCE',W*.08,H*.14);ctx.fillText('HUMAN REACHED ONLY FOR A REAL DECISION',W*.08,H*.14+16)};
  /* 03 knowledge: a field of records; the query lights the nearest cluster */
  var kr=rnd(7),K=[];for(var i=0;i<900;i++){var c=Math.floor(kr()*7),a=kr()*6.283,r=Math.pow(kr(),.6);K.push([.5+Math.cos(c*.9)*.32+Math.cos(a)*r*.11,.5+Math.sin(c*.9)*.3+Math.sin(a)*r*.1,c])}
  V.knowledge=function(t){var qx=mx,qy=my;if(Math.hypot(mx-.5,my-.5)<.001){qx=.5+Math.cos(t*.3)*.3;qy=.5+Math.sin(t*.3)*.28}
    var near=K.map(function(p,i){return [Math.hypot(p[0]-qx,p[1]-qy),i]}).sort(function(a,b){return a[0]-b[0]}).slice(0,24);var set={};near.forEach(function(n){set[n[1]]=n[0]});
    K.forEach(function(p,i){var d=set[i];ctx.fillStyle=d!==undefined?INK:MUTE;ctx.beginPath();ctx.arc(p[0]*W,p[1]*H,d!==undefined?1.8:1,0,7);ctx.fill();if(d!==undefined){ctx.strokeStyle='rgba(255,59,31,'+(1-d/.14)*.45+')';ctx.beginPath();ctx.moveTo(qx*W,qy*H);ctx.lineTo(p[0]*W,p[1]*H);ctx.stroke()}});
    ctx.strokeStyle=ACC;ctx.beginPath();ctx.arc(qx*W,qy*H,5,0,7);ctx.stroke();
    ctx.fillStyle=MUTE;mono(10);ctx.fillText('QUERY → NEAREST RECORDS, GRAPH-LINKED',W*.08,H*.14);ctx.fillText('QUALITY GATES ON ENTRY · DAILY UPKEEP',W*.08,H*.14+16)};
  /* 04 console: a conversation in plain language, job isolated, status reported */
  V.console=function(t){var n=7,h=H*.09,g=H*.03,base=H*.84-((t*.35)%1)*(h+g);for(var i=-1;i<n;i++){var y=base-i*(h+g),k=Math.floor(t*.35)-i,left=k%2===0,w=W*(.34+((k*7919)%5)/18);if(y<H*.1||y>H*.95)continue;ctx.fillStyle=left?'rgba(241,236,230,.07)':'rgba(241,236,230,.13)';var x=left?W*.08:W*.92-w;ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.fill();ctx.fillStyle=MUTE;for(var l=0;l<2;l++){ctx.fillRect(x+14,y+h*.3+l*h*.3,w*(.75-l*.3),2)}if(i===0){ctx.fillStyle=ACC;ctx.beginPath();ctx.arc(x+w-12,y+12,2.5,0,7);ctx.fill()}}
    ctx.fillStyle=MUTE;mono(10);ctx.fillText('INTAKE · CLARIFY · PROGRESS · DELIVERY',W*.08,H*.06+8);};
  /* 05 platform: one layout holding its shape across screens */
  V.platform=function(t){var f=ease((Math.sin(t*.8)+1)/2),fw=W*(.78-.48*f),fh=H*.74,x0=(W-fw)/2,y0=H*.13;ctx.strokeStyle=INK2;ctx.lineWidth=1;ctx.strokeRect(x0,y0,fw,fh);
    var pad=10;ctx.fillStyle='rgba(241,236,230,.12)';ctx.fillRect(x0+pad,y0+pad,fw-pad*2,14);
    var cols=f>.5?1:3,cw=(fw-pad*(cols+1))/cols,ch=f>.5?(fh*.16):(fh*.36);ctx.fillStyle='rgba(241,236,230,.08)';for(var i=0;i<3;i++){var cx=x0+pad+(i%cols)*(cw+pad),cy=y0+pad*2+14+Math.floor(i/cols)*(ch+pad);ctx.fillRect(cx,cy,cw,ch);ctx.fillStyle=MUTE;ctx.fillRect(cx+8,cy+ch-14,cw*.5,2);ctx.fillStyle='rgba(241,236,230,.08)'}
    ctx.fillStyle=ACC;ctx.fillRect(x0+pad,y0+fh-pad-3,fw*.22,3);
    ctx.fillStyle=MUTE;mono(10);ctx.fillText(Math.round(1440-1050*f)+' PX · SAME CONTENT, SAME ORDER',W*.08,H*.06+8)};
  /* 06 data: rows through a validator; exceptions flagged, never guessed */
  var dr=rnd(3),rows=[];for(var i=0;i<14;i++){rows.push({y:.14+i*.058,bad:dr()<.2,o:dr()})}
  V.data=function(t){var gx=W*.55;ctx.strokeStyle=ACC2;ctx.beginPath();ctx.moveTo(gx,H*.1);ctx.lineTo(gx,H*.9);ctx.stroke();
    rows.forEach(function(r,i){var p=((t*.22+r.o)%1),x=W*.06+p*W*1.0,w=W*.2,past=x>gx,y=r.y*H+(r.bad&&past?Math.min(H*.12,(x-gx)*.25):0);ctx.fillStyle=r.bad&&past?ACC2:'rgba(241,236,230,.16)';ctx.fillRect(x-w,y,w,8);ctx.fillStyle=r.bad?ACC:INK2;ctx.fillRect(x-w+w*.6,y,w*.12,8);if(r.bad&&past){ctx.fillStyle=ACC;mono(9);ctx.fillText('FLAG',x+6,y+8)}});
    ctx.fillStyle=MUTE;mono(10);ctx.fillText('VALIDATE',gx+8,H*.12);ctx.fillText('EVERY RULE WRITTEN DOWN · EVERY EXCEPTION FLAGGED',W*.06,H*.95)};
  /* 07 infrastructure: three sites, load, a failure, the watchdog brings it back */
  V.infra=function(t){var sites=['SITE A','SITE B','SITE C'],sw=W*.24,gap=(W-sw*3)/4;sites.forEach(function(s,si){var x=gap+si*(sw+gap),fail=(si===1&&(t%7)>3.6&&(t%7)<5.2),rec=(si===1&&(t%7)>=5.2&&(t%7)<6);for(var i=0;i<6;i++){var y=H*.22+i*H*.095,load=(Math.sin(t*1.3+i*1.7+si)+1)/2;ctx.fillStyle='rgba(241,236,230,.07)';ctx.fillRect(x,y,sw,H*.06);ctx.fillStyle=fail?'rgba(255,59,31,.25)':rec?ACC:'rgba(241,236,230,.35)';ctx.fillRect(x,y,sw*(fail?.05:load*.9+.1),H*.06)}ctx.fillStyle=fail?ACC:MUTE;mono(10);ctx.fillText(s+(fail?' · DOWN':rec?' · RECOVERED':''),x,H*.17);if(si<2){ctx.strokeStyle=LINE;ctx.beginPath();ctx.moveTo(x+sw,H*.5);ctx.lineTo(x+sw+gap,H*.5);ctx.stroke();ctx.fillStyle=INK;ctx.beginPath();ctx.arc(x+sw+((t*.6+si)%1)*gap,H*.5,2,0,7);ctx.fill()}});
    ctx.fillStyle=MUTE;mono(10);ctx.fillText('PRIVATE NETWORK · WATCHDOGS · THERMAL · BOOT RECOVERY',W*.06,H*.92)};
  /* 08 assurance: a scanner sweeps the text, secrets are caught and redacted, the verifier signs */
  var ar=rnd(11),LN=[];for(var i=0;i<12;i++){var segs=[],x=0;while(x<.84){var w=.05+ar()*.14;segs.push([x,w,ar()<.1]);x+=w+.02}LN.push(segs)}
  V.assurance=function(t){var p=(t*.28)%1.3,sy=H*.14+p*H*.72;LN.forEach(function(segs,i){var y=H*.16+i*H*.058;segs.forEach(function(s){var x=W*.08+s[0]*W,w=s[1]*W,passed=y<sy;ctx.fillStyle=s[2]&&passed?ACC:(s[2]?'rgba(255,59,31,.25)':'rgba(241,236,230,.18)');if(s[2]&&passed){ctx.fillRect(x,y,w,8)}else{ctx.fillRect(x,y+3,w,2)}})});
    if(p<1){ctx.strokeStyle=ACC;ctx.beginPath();ctx.moveTo(W*.06,sy);ctx.lineTo(W*.94,sy);ctx.stroke()}else{ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(W*.82,H*.86);ctx.lineTo(W*.86,H*.9);ctx.lineTo(W*.93,H*.82);ctx.stroke();ctx.lineWidth=1}
    ctx.fillStyle=MUTE;mono(10);ctx.fillText('SECRETS · PERSONAL DATA · PLANTED DEFECTS · INDEPENDENT VERIFIER',W*.08,H*.1)};

  var cur='voice',prev=null,fade=1,t0=performance.now(),raf=0,inView=false;
  window.ARDHOLT_VIZ={set:function(n){if(!V[n]||n===cur)return;prev=cur;cur=n;fade=0;if(!(window.ARDHOLT&&window.ARDHOLT.motionOn()))draw(performance.now())}};
  function draw(now){var t=(now-t0)/1000;ctx.clearRect(0,0,W,H);ctx.lineWidth=1;if(prev&&fade<1){ctx.globalAlpha=1-fade;V[prev](t);ctx.globalAlpha=fade;fade=Math.min(1,fade+.05)}V[cur](t);ctx.globalAlpha=1}
  function loop(){cancelAnimationFrame(raf);if(!inView)return;function step(now){draw(now);if(window.ARDHOLT&&window.ARDHOLT.motionOn()&&inView)raf=requestAnimationFrame(step)}raf=requestAnimationFrame(step)}
  draw(performance.now());
  new IntersectionObserver(function(en){inView=en[0].isIntersecting;loop()},{threshold:0}).observe(cv);
  addEventListener('ardholt:motion',loop);
})();
