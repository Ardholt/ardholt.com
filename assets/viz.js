/* Capabilities stage: eight scenes on one canvas, each a small piece with its own concept. No libraries. */
(function(){
  var cv=document.getElementById('viz'); if(!cv) return; var ctx=cv.getContext('2d');
  var W=0,H=0,DPR=Math.min(2,devicePixelRatio||1); function size(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)} size(); addEventListener('resize',function(){size();draw(performance.now())});
  var INK='#f1ece6', INK2='rgba(241,236,230,.62)', MUTE='rgba(241,236,230,.4)', FAINT='rgba(241,236,230,.16)', LINE='rgba(241,236,230,.09)', ACC='#ff3b1f', ACC2='rgba(255,59,31,.45)', ACC3='rgba(255,59,31,.18)';
  var mx=-1,my=-1,hover=false; cv.parentNode.addEventListener('mousemove',function(e){var r=cv.getBoundingClientRect();mx=(e.clientX-r.left)/r.width;my=(e.clientY-r.top)/r.height;hover=true},{passive:true}); cv.parentNode.addEventListener('mouseleave',function(){hover=false});
  function rnd(seed){var s=seed;return function(){s=(s*9301+49297)%233280;return s/233280}}
  function eio(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2} function eo(x){return 1-Math.pow(1-x,3)}
  function mono(sz){ctx.font=sz+'px "JetBrains Mono",ui-monospace,monospace'} function serif(sz){ctx.font=sz+'px "Instrument Serif",Georgia,serif'}
  function cap(l,r){mono(10);ctx.textAlign='left';ctx.fillStyle=INK2;ctx.fillText(l,W*.07,H*.09);if(r){if(W<560){ctx.fillStyle=MUTE;ctx.fillText(r,W*.07,H*.09+15)}else{ctx.textAlign='right';ctx.fillText(r,W*.93,H*.09);ctx.textAlign='left'}}}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function dot(x,y,r,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill()}
  function pad(n,w){var s=String(n);while(s.length<w)s='0'+s;return s}
  var V={};

  /* 01 voice: a live call. The system speaks; the caller cuts in; the system yields within a breath and resumes. */
  V.voice=function(t){var c=t%9, cy=H*.46, amp=H*.13, x0=W*.07, x1=W*.93, n=180;
    var inter=c>4.6&&c<6.4, yielded=c>=4.6?Math.min(1,(c-4.6)/.12):0, resume=c>6.4?Math.min(1,(c-6.4)/.6):0;
    var sysLevel=(1-yielded)+resume, callerLevel=inter?Math.min(1,(c-4.6)/.3):0;
    function wave(level,col,seed,speed,lw){ctx.lineWidth=lw;ctx.strokeStyle=col;ctx.beginPath();for(var i=0;i<=n;i++){var f=i/n,x=x0+f*(x1-x0),env=Math.sin(f*Math.PI);var y=cy+env*level*amp*(Math.sin(f*26+t*speed+seed)*.55+Math.sin(f*7-t*speed*.6+seed)*.45);i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}
    ctx.strokeStyle=LINE;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,cy);ctx.lineTo(x1,cy);ctx.stroke();
    wave(sysLevel*(.7+.3*Math.sin(t*1.3)),INK,0,5.5,1.3); if(callerLevel)wave(callerLevel,ACC,2,8,1.3);
    /* turn-taking record at the bottom */
    var ty=H*.8, tw=x1-x0; ctx.fillStyle=FAINT; ctx.fillRect(x0,ty,tw,1);
    var turns=[[0,4.6,INK2],[4.6,6.4,ACC],[6.4,9,INK2]]; turns.forEach(function(s){var a=x0+s[0]/9*tw,b=x0+Math.min(c,s[1])/9*tw;if(c>s[0]){ctx.fillStyle=s[2];ctx.fillRect(a,ty-3,Math.max(0,b-a),7)}});
    dot(x0+c/9*tw,ty+.5,3,INK);
    mono(10);ctx.fillStyle=MUTE;ctx.fillText('SYSTEM',x0,ty+24);ctx.fillStyle=ACC;ctx.fillText('CALLER',x0+4.6/9*tw,ty+24);ctx.fillStyle=MUTE;ctx.fillText('SYSTEM',x0+6.4/9*tw,ty+24);
    cap('LIVE CALL · '+pad(Math.floor(c),2)+'.'+Math.floor((c%1)*10)+' S', inter?'INTERRUPTED · YIELDED IN 120 MS':resume<1&&c>6.4?'RESUMING':'SPEAKING');
    mono(10); var tw=ctx.measureText(inter?'INTERRUPTED · YIELDED IN 120 MS':resume<1&&c>6.4?'RESUMING':'SPEAKING').width; var pr=(t%1.6)/1.6; ctx.strokeStyle='rgba(255,59,31,'+(1-pr)*.6+')';ctx.beginPath();ctx.arc(W*.93-tw-14,H*.09-4,4+pr*10,0,7);ctx.stroke(); dot(W*.93-tw-14,H*.09-4,2.5,ACC)};

  /* 02 agents: work orders cross five stations; what fails at PROVE goes back; a person is reached only at a decision. */
  V.agents=function(t){var names=['BRIEF','PLAN','BUILD','PROVE','SHIP'],xs=names.map(function(_,i){return W*.1+i*W*.2}),y=H*.55,r=15;
    ctx.strokeStyle=LINE;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(xs[0],y);ctx.lineTo(xs[4],y);ctx.stroke();
    /* the return arc from PROVE to BUILD */
    ctx.strokeStyle=FAINT;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(xs[3],y+r);ctx.quadraticCurveTo((xs[2]+xs[3])/2,y+H*.22,xs[2],y+r);ctx.stroke();ctx.setLineDash([]);
    /* the decision node above PLAN */
    var dx=xs[1],dy=y-H*.24; ctx.strokeStyle=FAINT;ctx.beginPath();ctx.moveTo(dx,y-r);ctx.lineTo(dx,dy+12);ctx.stroke();
    xs.forEach(function(x,i){ctx.fillStyle='rgba(241,236,230,.05)';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.fill();ctx.strokeStyle=i===3?ACC2:INK2;ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();mono(10);ctx.textAlign='center';ctx.fillStyle=MUTE;ctx.fillText(names[i],x,y+40)});
    ctx.textAlign='left';
    var delivered=0, asked=false;
    for(var p=0;p<4;p++){var tt=(t*.5+p*1.37)%5.6, fail=(p%2===1), stops=[0,1,2,3,fail?2:4,fail?3:4,4]; /* station index over time */
      var seg=tt*1.25, i=Math.floor(seg), f=seg-i, from=stops[Math.min(i,stops.length-1)], to=stops[Math.min(i+1,stops.length-1)], x,yy=y;
      if(from===3&&to===2){var q=eio(f);x=xs[3]+(xs[2]-xs[3])*q;yy=y+r+Math.sin(q*Math.PI)*H*.11;ctx.fillStyle=ACC}
      else{x=xs[from]+(xs[to]-xs[from])*eio(f);ctx.fillStyle=INK; if(from===1&&f<.3&&p===0){yy=y-(dy>0?0:0);asked=true}}
      if(from===4&&to===4)delivered++;
      rr(x-7,yy-4,14,8,2);ctx.fill()}
    var ask=(t%5.6)>1.2&&(t%5.6)<2.0; ctx.strokeStyle=ask?INK:FAINT;ctx.beginPath();ctx.arc(dx,dy,9,0,7);ctx.stroke();ctx.beginPath();ctx.arc(dx,dy-3,3,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(dx-5,dy+6);ctx.quadraticCurveTo(dx,dy,dx+5,dy+6);ctx.stroke();
    mono(10);ctx.fillStyle=ask?INK2:MUTE;ctx.fillText('DECISION',dx+16,dy+4);
    var pulse=(t%1.65)/1.65;ctx.strokeStyle='rgba(255,59,31,'+(1-pulse)*.5+')';ctx.beginPath();ctx.arc(xs[3],y,r+pulse*22,0,7);ctx.stroke();
    cap('WORK ORDERS IN FLIGHT · 4','DELIVERED · '+pad(1180+Math.floor(t/5.6)*2,4));
    mono(10);ctx.fillStyle=MUTE;ctx.fillText('WHAT FAILS AT PROVE GOES BACK TO BUILD. NOTHING SHIPS ON ASSURANCE.',W*.07,H*.9)};

  /* 03 knowledge: a body of records; a question lights what it needs, ranked. */
  var kr=rnd(7),K=[],KE=[];for(var i=0;i<380;i++){var c=Math.floor(kr()*6),a=kr()*6.283,r=Math.pow(kr(),.55);K.push([.5+Math.cos(c*1.05+.4)*.3+Math.cos(a)*r*.12,.5+Math.sin(c*1.05+.4)*.26+Math.sin(a)*r*.1,c])}
  K.forEach(function(p,i){var best=[],d;for(var j=0;j<K.length;j++){if(j===i)continue;d=Math.hypot(p[0]-K[j][0],(p[1]-K[j][1])*1.2);if(d<.05)best.push(j);if(best.length>1)break}best.forEach(function(j){if(j>i)KE.push([i,j])})});
  V.knowledge=function(t){var qx=hover?mx:.5+Math.cos(t*.25)*.3,qy=hover?my:.5+Math.sin(t*.25)*.26;
    var near=K.map(function(p,i){return [Math.hypot(p[0]-qx,(p[1]-qy)*1.2),i]}).sort(function(a,b){return a[0]-b[0]}).slice(0,16);var set={};near.forEach(function(n){set[n[1]]=n[0]});
    ctx.strokeStyle=LINE;ctx.lineWidth=1;ctx.beginPath();KE.forEach(function(e){ctx.moveTo(K[e[0]][0]*W,K[e[0]][1]*H);ctx.lineTo(K[e[1]][0]*W,K[e[1]][1]*H)});ctx.stroke();
    K.forEach(function(p,i){var d=set[i];if(d===undefined){dot(p[0]*W,p[1]*H,1.1,MUTE)}});
    near.forEach(function(n,k){var p=K[n[1]],g=1-k/16;ctx.strokeStyle='rgba(255,59,31,'+(g*.5)+')';ctx.beginPath();ctx.moveTo(qx*W,qy*H);ctx.lineTo(p[0]*W,p[1]*H);ctx.stroke();dot(p[0]*W,p[1]*H,1.6+g*1.6,INK)});
    ctx.strokeStyle=ACC;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(qx*W,qy*H,6,0,7);ctx.stroke();ctx.lineWidth=1;
    /* ranked answers */
    var lx=W*.68,ly=H*.72; mono(10);ctx.fillStyle=MUTE;ctx.fillText('RANKED',lx,ly-14);
    for(var k=0;k<5;k++){var sc=Math.max(0,1-near[k][0]*3.2);ctx.fillStyle=FAINT;ctx.fillRect(lx,ly+k*12,W*.25,4);ctx.fillStyle=k?INK2:ACC;ctx.fillRect(lx,ly+k*12,W*.25*sc,4)}
    cap('RECORDS · 380 · LINKED',hover?'QUERY · POINTER':'QUERY · ROAMING')};

  /* 04 console: one job, as it reads on the channel the client already uses. */
  V.console=function(t){var c=t%12, cards=[['REQUEST',0,'rgba(241,236,230,.08)',.55],['CLARIFY',1.6,'rgba(241,236,230,.13)',.4],['IN PROGRESS',3.6,'rgba(241,236,230,.08)',.5],['DELIVERED',8.4,'rgba(241,236,230,.13)',.45]];
    var x0=W*.12, lw=W*.76, h=H*.13, g=H*.035, base=H*.2; ctx.strokeStyle=LINE;ctx.beginPath();ctx.moveTo(W*.085,H*.16);ctx.lineTo(W*.085,H*.9);ctx.stroke();
    cards.forEach(function(cd,i){if(c<cd[1])return;var a=Math.min(1,(c-cd[1])/.5),y=base+i*(h+g)+ (1-eo(a))*14,left=i%2===0,w=lw*cd[3]+W*.12,x=left?x0:x0+lw-w;
      ctx.globalAlpha=eo(a);ctx.fillStyle=cd[2];rr(x,y,w,h,8);ctx.fill();mono(10);ctx.fillStyle=INK2;ctx.fillText(cd[0],x+16,y+22);
      ctx.fillStyle=MUTE;ctx.fillRect(x+16,y+h*.58,w*.6,2);ctx.fillRect(x+16,y+h*.58+9,w*.38,2);
      if(i===2){var pgr=Math.min(1,(c-3.6)/4.8);ctx.fillStyle=FAINT;ctx.fillRect(x+16,y+h-16,w-32,3);ctx.fillStyle=INK;ctx.fillRect(x+16,y+h-16,(w-32)*pgr,3);mono(9);ctx.textAlign='right';ctx.fillStyle=MUTE;ctx.fillText(Math.round(pgr*100)+'%',x+w-16,y+22);ctx.textAlign='left'}
      dot(W*.085,y+h/2,3,i===3&&c>8.4?ACC:INK2); ctx.globalAlpha=1});
    cap('ONE JOB · ON THE CLIENT’S OWN CHANNEL',c<8.4?'IN PLAIN LANGUAGE':'DELIVERED · WITH EVIDENCE')};

  /* 05 platform: a product assembles from its parts, then holds its order across every frame. */
  V.platform=function(t){var c=t%11, asm=Math.min(1,c/3.2), ph=c<6?0:eio(Math.min(1,(c-6)/2.2)), ph2=c<9?0:eio(Math.min(1,(c-9)/2)); var f=hover?Math.min(1,Math.max(0,1-mx*1.1)):ph-ph2*ph;
    var fw=W*(.8-.48*f),fh=H*.76,x0=(W-fw)/2,y0=H*.14,pd=10;
    ctx.strokeStyle=INK2;ctx.lineWidth=1;ctx.strokeRect(x0,y0,fw,fh);
    var parts=[['nav',0],['side',.4],['kpi0',.8],['kpi1',1.0],['kpi2',1.2],['chart',1.6],['rows',2.2]];
    function a(k){return eo(Math.min(1,Math.max(0,(c-k)/.7)))}
    var sideW=f>.5?0:fw*.2, cx=x0+pd+sideW+(sideW?pd:0), cw=fw-pd*2-sideW-(sideW?pd:0);
    ctx.fillStyle='rgba(241,236,230,.12)';var an=a(0);ctx.fillRect(x0+pd,y0+pd-10*(1-an),fw-pd*2,12);
    if(sideW){var as=a(.4);ctx.globalAlpha=as;ctx.fillStyle='rgba(241,236,230,.07)';ctx.fillRect(x0+pd,y0+pd*2+12,sideW,fh-pd*3-12);for(var i=0;i<5;i++){ctx.fillStyle=MUTE;ctx.fillRect(x0+pd+8,y0+pd*2+30+i*16,sideW*.6,2)}ctx.globalAlpha=1}
    var cols=f>.5?1:3,kw=(cw-pd*(cols-1))/cols,kh=fh*.17;
    for(var k=0;k<3;k++){var ak=a(.8+k*.2);var kx=cx+(k%cols)*(kw+pd),ky=y0+pd*2+12+Math.floor(k/cols)*(kh+pd);ctx.globalAlpha=ak;ctx.fillStyle='rgba(241,236,230,.07)';rr(kx,ky-6*(1-ak),kw,kh,4);ctx.fill();mono(9);ctx.fillStyle=MUTE;ctx.fillText(['THROUGHPUT','LATENCY','UPTIME'][k],kx+10,ky+16);serif(Math.min(26,kh*.5));ctx.fillStyle=INK;ctx.fillText(['4.2k','38 ms','99.98'][k],kx+10,ky+kh-12);ctx.globalAlpha=1}
    var rowsY=y0+pd*2+12+(f>.5?3*(kh+pd):kh+pd), chH=fh*.26, ac=a(1.6);
    ctx.globalAlpha=ac;ctx.fillStyle='rgba(241,236,230,.05)';rr(cx,rowsY,cw,chH,4);ctx.fill();ctx.strokeStyle=INK;ctx.beginPath();for(var i=0;i<=40;i++){var fx=i/40,x=cx+12+fx*(cw-24),y=rowsY+chH-12-(Math.sin(fx*6+t*.8)*.25+.5+fx*.3)*(chH-28)*.8;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();ctx.globalAlpha=1;
    var ar=a(2.2),ry=rowsY+chH+pd; ctx.globalAlpha=ar;for(var i=0;i<4;i++){var yy=ry+i*14;if(yy>y0+fh-pd)break;ctx.fillStyle=i%2?'rgba(241,236,230,.04)':'rgba(241,236,230,.07)';ctx.fillRect(cx,yy,cw,11);ctx.fillStyle=MUTE;ctx.fillRect(cx+8,yy+4.5,cw*.3,2);ctx.fillRect(cx+cw*.5,yy+4.5,cw*.15,2)}ctx.globalAlpha=1;
    ctx.fillStyle=ACC;ctx.fillRect(x0+pd,y0+fh-pd-3,Math.max(16,fw*.18)*asm,3);
    cap(Math.round(1440-1050*f)+' PX',c<3.2?'ASSEMBLING':f>.5?'SAME PRODUCT · SAME ORDER':'HOLDS ITS SHAPE')};

  /* 06 data: what arrives, what leaves, and the one thing a pipeline must never do: guess. */
  var dr=rnd(3),rows=[];for(var i=0;i<12;i++){rows.push({bad:dr()<.22,o:dr(),segs:[dr()*.3+.1,dr()*.3+.1,dr()*.2+.1]})}
  V.data=function(t){var gx=W*.5,x0=W*.07,x1=W*.93,ty=H*.2,rh=H*.045,tray=H*.86, proc=0,flag=0;
    ctx.strokeStyle=ACC2;ctx.beginPath();ctx.moveTo(gx,H*.14);ctx.lineTo(gx,H*.78);ctx.stroke(); mono(10);ctx.textAlign='center';ctx.fillStyle=MUTE;ctx.fillText('VALIDATE',gx,H*.12);ctx.textAlign='left';
    rows.forEach(function(r,i){var p=((t*.16+r.o)%1), x=x0+p*(x1-x0+W*.3)-W*.3, y=ty+i*rh, past=x>gx; if(x>gx)proc++;
      if(past&&r.bad){flag++;var k=Math.min(1,(x-gx)/(W*.12));var yy=y+(tray-y)*eo(k),xx=gx+Math.min(W*.1,(x-gx)*.4);ctx.fillStyle=ACC3;ctx.fillRect(xx-W*.2,yy,W*.2,6);ctx.fillStyle=ACC;ctx.fillRect(xx-W*.2+W*.2*.62,yy,W*.2*.12,6);if(k>=1){mono(9);ctx.fillStyle=ACC;ctx.fillText('FLAG · ROW '+pad(i+1,2),xx+8,yy+6)}return}
      var left=x-W*.2; if(past){ /* clean, typed, aligned */ var w=W*.2;ctx.fillStyle='rgba(241,236,230,.2)';[0,.45,.78].forEach(function(s,k){ctx.fillRect(left+w*s,y,w*[.4,.3,.22][k],6)})}
      else{var cx=left;r.segs.forEach(function(s,k){var w=W*.2*s;ctx.fillStyle=k===1&&r.bad?ACC:'rgba(241,236,230,.16)';ctx.fillRect(cx,y+(k%2)*1.5,w,6);cx+=w+4})}});
    ctx.strokeStyle=LINE;ctx.beginPath();ctx.moveTo(gx,tray-8);ctx.lineTo(x1,tray-8);ctx.stroke();mono(10);ctx.fillStyle=MUTE;ctx.fillText('FOR A PERSON TO DECIDE',gx+8,tray+22);
    cap('IN · INCONSISTENT','OUT · VALIDATED, TRACEABLE');
    mono(10);ctx.fillStyle=MUTE;ctx.fillText('NEVER GUESSED. EVERY EXCEPTION NAMED.',x0,H*.93)};

  /* 07 infrastructure: three sites that carry each other. One goes dark; the work moves; it comes back on its own. */
  V.infra=function(t){var c=t%12, names=['SITE A','SITE B','SITE C'], sw=W*.24, gap=(W-sw*3)/4, top=H*.22, fail=c>4&&c<7.4, rec=c>=7.4&&c<8.6;
    var pos=names.map(function(_,i){return gap+i*(sw+gap)});
    /* links */
    for(var i=0;i<2;i++){var x=pos[i]+sw,x2=pos[i+1],y=H*.5,alive=!(fail&&i===0)||true;ctx.strokeStyle=LINE;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y);ctx.stroke()}
    /* traffic: when B fails, packets skip B via an arc over it */
    for(var p=0;p<5;p++){var f=((t*.35+p*.2)%1),x,y=H*.5; if(fail){var ax=pos[0]+sw,bx=pos[2];x=ax+(bx-ax)*f;y=H*.5-Math.sin(f*Math.PI)*H*.16;if(p===0){ctx.strokeStyle=FAINT;ctx.setLineDash([3,4]);ctx.beginPath();ctx.moveTo(ax,H*.5);ctx.quadraticCurveTo((ax+bx)/2,H*.5-H*.32,bx,H*.5);ctx.stroke();ctx.setLineDash([])}}
      else{x=pos[0]+sw+f*(pos[2]-pos[0]-sw)} dot(x,y,2,INK)}
    names.forEach(function(nm,i){var x=pos[i],down=fail&&i===1,back=rec&&i===1;ctx.strokeStyle=down?ACC2:FAINT;rr(x,top,sw,H*.56,4);ctx.stroke();
      for(var k=0;k<4;k++){var y=top+16+k*H*.12,load=(Math.sin(t*1.1+k*1.3+i)+1)/2;if(!down&&!fail)load=load*.7+.1;if(fail&&i!==1)load=Math.min(1,load*.7+.35);ctx.fillStyle='rgba(241,236,230,.06)';ctx.fillRect(x+12,y,sw-24,H*.07);ctx.fillStyle=down?ACC3:back?ACC:'rgba(241,236,230,.4)';ctx.fillRect(x+12,y,(sw-24)*(down?.04:load),H*.07)}
      mono(10);ctx.fillStyle=down?ACC:MUTE;ctx.fillText(nm+(down?' · DOWN':back?' · RECOVERED':' · GPU ×4'),x,top-10);
      if(back){var pr=((c-7.4)/1.2);ctx.strokeStyle='rgba(255,59,31,'+(1-pr)*.6+')';ctx.beginPath();ctx.arc(x+sw/2,top+H*.28,20+pr*40,0,7);ctx.stroke()}});
    cap('PRIVATE COMPUTE · 3 SITES',fail?'TRAFFIC REROUTED · NO ONE PAGED':rec?'WATCHDOG BROUGHT IT BACK':'ALL SITES SERVING');
    mono(10);ctx.fillStyle=MUTE;ctx.fillText('RUNS UNATTENDED. RECOVERS ON ITS OWN.',W*.07,H*.93)};

  /* 08 assurance: a release is attacked before it ships. The planted fault is found; secrets never leave; a verifier signs. */
  var ar=rnd(11),LN=[];for(var i=0;i<13;i++){var segs=[],x=0;while(x<.82){var w=.04+ar()*.13;segs.push([x,w,ar()<.08]);x+=w+.018}LN.push(segs)}
  V.assurance=function(t){var c=t%10, sweep=Math.min(1.08,c/5.5), faultLine=5+Math.floor((Math.floor(t/10)*3)%6), sy=H*.17+sweep*H*.62;
    LN.forEach(function(segs,i){var y=H*.18+i*H*.047, passed=y<sy, isFault=i===faultLine;
      segs.forEach(function(s,k){var x=W*.08+s[0]*W,w=s[1]*W;if(s[2]){ctx.fillStyle=passed?INK2:'rgba(255,59,31,.3)';if(passed){ctx.fillRect(x,y,w,7)}else{ctx.fillRect(x,y+2.5,w,2)}}else{ctx.fillStyle=isFault&&k===2&&!passed?ACC3:'rgba(241,236,230,.2)';ctx.fillRect(x,y+2.5,w,2)}});
      if(isFault&&passed){var x=W*.08+segs[2][0]*W,w=segs[2][1]*W;ctx.strokeStyle=ACC;ctx.strokeRect(x-4,y-5,w+8,13);mono(9);ctx.fillStyle=ACC;ctx.fillText('PLANTED FAULT · CAUGHT',x+w+12,y+6)}});
    if(sweep<1){ctx.strokeStyle=ACC;ctx.beginPath();ctx.moveTo(W*.07,sy);ctx.lineTo(W*.93,sy);ctx.stroke()}
    else{var k=Math.min(1,(c-5.5)/.8);ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(W*.86,H*.86,14,-Math.PI/2,-Math.PI/2+6.283*k);ctx.stroke();if(k>=1){ctx.beginPath();ctx.moveTo(W*.86-6,H*.86);ctx.lineTo(W*.86-1.5,H*.86+5);ctx.lineTo(W*.86+7,H*.86-5);ctx.stroke()}ctx.lineWidth=1;mono(10);ctx.textAlign='right';ctx.fillStyle=INK2;ctx.fillText('INDEPENDENT VERIFIER · SIGNED',W*.86-24,H*.86+4);ctx.textAlign='left'}
    cap('RELEASE CANDIDATE · UNDER ATTACK',sweep<1?'SWEEPING · SECRETS REDACTED':'FAULT FOUND · RELEASE HELD');
    mono(10);ctx.fillStyle=MUTE;ctx.fillText('SECRETS STAY. FAULTS ARE PLANTED ON PURPOSE. NOTHING SHIPS ON ASSURANCE.',W*.07,H*.95)};

  var cur='voice',prev=null,fade=1,t0=performance.now(),raf=0,inView=false;
  window.ARDHOLT_VIZ={set:function(n){if(!V[n]||n===cur)return;prev=cur;cur=n;fade=0;if(!(window.ARDHOLT&&window.ARDHOLT.motionOn())||!inView){fade=1;draw(performance.now())}}};
  function draw(now){var t=(now-t0)/1000;ctx.clearRect(0,0,W,H);ctx.lineWidth=1;ctx.textAlign='left';if(prev&&fade<1){ctx.globalAlpha=1-fade;V[prev](t);ctx.globalAlpha=fade;fade=Math.min(1,fade+.05)}V[cur](t);ctx.globalAlpha=1}
  function loop(){cancelAnimationFrame(raf);if(!inView)return;function step(now){draw(now);if(window.ARDHOLT&&window.ARDHOLT.motionOn()&&inView)raf=requestAnimationFrame(step)}raf=requestAnimationFrame(step)}
  draw(performance.now());
  new IntersectionObserver(function(en){inView=en[0].isIntersecting;loop()},{threshold:0}).observe(cv);
  addEventListener('ardholt:motion',loop);
})();
