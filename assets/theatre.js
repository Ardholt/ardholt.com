/* Theatre: arrival, light, chapters, scroll choreography, exits, page transitions, navigation and cursor, plus each
   inner page's own piece (layers, pinned chapters, the standard's rule and ledger, the contact breath).
   Autonomous motion obeys window.ARDHOLT.motionOn() and 'ardholt:motion'; automated browsers get the settled page. */
(function(){
  'use strict';
  var root=document.documentElement, body=document.body;
  var rrm=matchMedia('(prefers-reduced-motion: reduce)'), fineMq=matchMedia('(hover:hover) and (pointer:fine)');
  var A=window.ARDHOLT||{motionOn:function(){return !root.classList.contains('motion-off')&&!rrm.matches}};
  var bot=!!navigator.webdriver;
  function motionOn(){return A.motionOn()}
  function live(){return motionOn()&&!bot}
  function clamp(v,a,b){return v<a?a:v>b?b:v}
  function lerp(a,b,t){return a+(b-a)*t}
  function eio(x){return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2}
  function eo(x){return 1-Math.pow(1-x,3)}
  function mod(a,n){return ((a%n)+n)%n}
  function pad(n,w){var s=String(n);while(s.length<w)s='0'+s;return s}
  function $(s,c){return (c||document).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
  function make(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html)e.innerHTML=html;return e}
  var stats={frames:0,work:0,max:0};
  function timed(fn){return function(a){var t0=performance.now();fn(a);var d=performance.now()-t0;stats.frames++;stats.work+=d;if(d>stats.max)stats.max=d}}
  root.classList.add('th-js');

  /* local files: directory links resolve to their index page */
  if(location.protocol==='file:')$$('a[href]').forEach(function(a){var h=a.getAttribute('href');if(/\/$/.test(h)&&!/^([a-z]+:|\/|#)/i.test(h))a.setAttribute('href',h+'index.html')});

  /* a capture-sized viewport (full-page screenshot) drops the fixed chrome that would float mid-page */
  var baseH=innerHeight;
  function isTall(){return innerHeight>baseH*1.8||innerHeight>2200}

  /* ---------- header: compact glass and scroll progress ---------- */
  var hdr=$('#hdr')||$('.top'), prog=null, hdrScrolled=false;
  /* the header steps aside past the hero and returns on an upward gesture (wheel or touch), not on programmatic scroll */
  if(hdr){var ty0=null;addEventListener('wheel',function(e){if(e.deltaY<-2)hdr.classList.remove('th-away')},{passive:true});addEventListener('touchstart',function(e){ty0=e.touches[0].clientY},{passive:true});addEventListener('touchmove',function(e){var y=e.touches[0].clientY;if(ty0!==null&&y-ty0>6)hdr.classList.remove('th-away');ty0=y},{passive:true});hdr.addEventListener('focusin',function(){hdr.classList.remove('th-away');if(scrollY>160)scrollTo({top:0,behavior:'instant'})})}
  if(hdr){prog=make('span','th-prog');prog.setAttribute('aria-hidden','true');hdr.appendChild(prog)}

  /* ---------- arrival: once per session, home only (the head script decides) ---------- */
  function arrival(){
    if(!root.classList.contains('th-arrive'))return;
    var mark=hdr&&$('.brand svg',hdr);
    /* too late to open cleanly (the CSS failsafe lifts the curtain at 1.6 s): skip rather than cover a shown page */
    if(!mark||!live()||performance.now()>1450){root.classList.remove('th-arrive');return}
    var ov=make('div','th-arrival','<div class="cv"></div><svg viewBox="0 0 32 32" aria-hidden="true"><path class="f" d="M3 29 16 3l13 26h-3.6L16 10.2 6.6 29H3Z"/><path class="f" d="M11 29l5-10 5 10H11Z"/><path class="s" pathLength="1" d="M6.6 29 16 10.2 25.4 29H29L16 3 3 29H11L16 19 21 29H11"/></svg>');
    ov.setAttribute('aria-hidden','true');body.appendChild(ov);
    root.classList.add('th-arriving','th-hold');root.classList.remove('th-arrive');
    var svg=$('svg',ov), s=$('.s',ov), cv=$('.cv',ov), fills=$$('.f',ov), landed=false, ended=false;
    /* phases follow the animations themselves (not timers), so the sequence stays in step however busy the page is */
    function end(){if(ended)return;ended=true;root.classList.remove('th-arriving','th-landing','th-hold');ov.remove()}
    function land(){
      if(landed)return;landed=true;
      try{
        var r=mark.getBoundingClientRect(), q=svg.getBoundingClientRect();
        var dx=(r.left+r.width/2)-(q.left+q.width/2), dy=(r.top+r.height/2)-(q.top+q.height/2), k=r.width/q.width;
        var mv=svg.animate([{transform:'none'},{transform:'translate('+dx+'px,'+dy+'px) scale('+k+')'}],{duration:400,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
        cv.animate([{opacity:1},{opacity:0}],{duration:380,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
        mv.finished.then(end,end);
      }catch(e){end()}
      root.classList.add('th-landing');root.classList.remove('th-hold');
      setTimeout(end,4000);
    }
    try{
      var draw=s.animate([{strokeDashoffset:1},{strokeDashoffset:0}],{duration:500,easing:'cubic-bezier(.45,0,.2,1)',fill:'forwards'});
      fills.forEach(function(f){f.animate([{opacity:0},{opacity:1}],{duration:220,delay:360,fill:'forwards'})});
      s.animate([{opacity:1},{opacity:0}],{duration:200,delay:440,fill:'forwards'});
      draw.finished.then(land,land);
    }catch(e){land()}
    setTimeout(land,4000);
  }
  try{arrival()}catch(e){root.classList.remove('th-arrive','th-arriving','th-hold')}

  /* ---------- section heads: labels type themselves in (300 ms) ---------- */
  $$('.head .label.rv, .contact>.label.rv, [data-type]').forEach(function(el){
    var txt=el.textContent; if(!txt.trim())return;
    var n=txt.length, step=300/Math.max(1,n-1), vis=make('span');
    vis.setAttribute('aria-hidden','true');
    for(var i=0;i<n;i++){var c=make('span','th-ch');c.textContent=txt.charAt(i);c.style.transitionDelay=Math.round(i*step)+'ms';vis.appendChild(c)}
    var sr=make('span','th-sr');sr.textContent=txt;
    el.textContent='';el.appendChild(sr);el.appendChild(vis);el.classList.add('th-type');
  });

  /* ---------- numerals that count up from 00 as they enter ---------- */
  var counters=[];
  $$('.steps').forEach(function(box){
    var items=$$(':scope>div:not(.progress)',box);
    items.forEach(function(d,i){var s=make('span','th-num');s.setAttribute('aria-hidden','true');s.textContent=pad(i+1,2);d.insertBefore(s,d.firstChild);counters.push({el:s,to:i+1,w:2,host:d})});
    box.classList.add('th-counted');
  });
  $$('[data-count]').forEach(function(el){var v=parseInt(el.textContent,10);if(!isNaN(v))counters.push({el:el,to:v,w:Math.max(2,el.textContent.trim().length),host:el.closest('[data-count-host]')||el})});
  function settleCounter(c){c.done=true;c.el.textContent=pad(c.to,c.w)}
  function runCounter(c){
    if(c.done)return;c.done=true;
    if(!live()){settleCounter(c);return}
    var t0=performance.now(), dur=Math.min(720,150*(c.to+1));
    (function f(now){var p=clamp((now-t0)/dur,0,1);c.el.textContent=pad(p>=1?c.to:Math.min(c.to,Math.floor(p*(c.to+1))),c.w);if(p<1)requestAnimationFrame(f)})(t0);
  }
  if(counters.length){
    if(live()){
      counters.forEach(function(c){c.el.textContent=pad(0,c.w)});
      var kio=new IntersectionObserver(function(en){en.forEach(function(x){if(!x.isIntersecting)return;counters.forEach(function(c){if(c.host===x.target)runCounter(c)});kio.unobserve(x.target)})},{rootMargin:'0px 0px -12% 0px',threshold:.2});
      counters.forEach(function(c){kio.observe(c.host)});
    }else counters.forEach(settleCounter);
  }

  /* ---------- pillars: diagrams redraw on hover; keyboard users get every second sentence open ---------- */
  $$('.three .dg path, .three .dg circle').forEach(function(p){p.setAttribute('pathLength','1')});
  addEventListener('keydown',function(e){if(e.key==='Tab')root.classList.add('th-kbd')});

  /* ---------- statement band: lifts by 2% as it enters ---------- */
  var band=$('.band'), bandLift=null;
  if(band){bandLift=make('div','th-band-lift');bandLift.setAttribute('aria-hidden','true');band.insertBefore(bandLift,band.firstChild)}

  /* ---------- footer: the mark and lines rise into place ---------- */
  var foot=$('.foot');
  function footIn(){if(foot)foot.classList.add('th-in')}
  if(foot&&live()){
    foot.classList.add('th-foot');
    var fio=new IntersectionObserver(function(en){if(en[0].isIntersecting){footIn();fio.disconnect()}},{threshold:.2});
    fio.observe(foot);
  }

  /* ---------- ledgers: lines draw in one by one ---------- */
  $$('.ledger[data-draw]').forEach(function(l){
    if(!live()){l.classList.add('in');return}
    var lio=new IntersectionObserver(function(en){if(en[0].isIntersecting){l.classList.add('in');lio.disconnect()}},{rootMargin:'0px 0px -14% 0px',threshold:.25});
    lio.observe(l);
  });

  /* ---------- light: trails the pointer by 120 ms over the lattice backgrounds ---------- */
  var lights=[], pointer={x:-1,y:-1,in:false,touch:false}, dpr=Math.min(2,devicePixelRatio||1);
  function addLight(host,ref){
    var box=make('div','th-lightbox'), L=make('div','th-light','<i></i><b></b>');
    box.setAttribute('aria-hidden','true');box.appendChild(L);
    if(ref)ref.insertAdjacentElement('afterend',box);else host.insertBefore(box,bandLift&&host===band?bandLift.nextSibling:host.firstChild);
    lights.push({host:host,ref:ref,box:box,el:L,grid:L.firstChild,x:0,y:0,tx:0,ty:0,on:false,ox:0});
  }
  $$('[data-light] .lattice, .hero:not(.still) > .lattice, .pr > .lattice').forEach(function(l){addLight(l.parentNode,l)});
  if(band)addLight(band,null);
  function layoutLights(){lights.forEach(function(o){
    if(o.ref){o.box.style.left=o.ref.offsetLeft+'px';o.box.style.top=o.ref.offsetTop+'px';o.box.style.width=o.ref.offsetWidth+'px';o.box.style.height=o.ref.offsetHeight+'px'}
    o.ox=mod((o.box.clientWidth-120)/2,120);
  })}
  function lightsOn(){return fineMq.matches&&motionOn()}

  /* ---------- cursor: a bone dot, larger over what can be pressed, a ring over live stages ---------- */
  var cur=null, cu={x:0,y:0,tx:0,ty:0,state:'',shown:false};
  function cursorOn(){return fineMq.matches&&motionOn()}
  function ensureCursor(){if(bot)return;if(!cur){cur=make('div','th-cursor','<i></i><b></b>');cur.setAttribute('aria-hidden','true');body.appendChild(cur)}}
  document.addEventListener('pointerover',function(e){
    if(!cur)return;var t=e.target,s='';
    if(t&&t.closest){if(t.closest('a[href],button,[role="button"],summary,label'))s='link';else if(t.closest('.stage,.scene,.pr-stage'))s='ring'}
    if(s!==cu.state){cu.state=s;cur.classList.toggle('link',s==='link');cur.classList.toggle('ring',s==='ring')}
  },{passive:true});

  /* one pointer loop drives the light and the cursor; it stops as soon as both have settled */
  var pRaf=0, pLast=0;
  function pTick(now){
    pRaf=0;var dt=pLast?Math.min(64,now-pLast):16;pLast=now;var moving=false,t0=performance.now();
    if(lightsOn()){
      var k=1-Math.exp(-dt/120), rects=lights.map(function(o){return o.box.getBoundingClientRect()});
      lights.forEach(function(o,i){
        var r=rects[i], inside=pointer.in&&!pointer.touch&&pointer.x>=r.left&&pointer.x<=r.right&&pointer.y>=r.top&&pointer.y<=r.bottom;
        if(inside){o.tx=pointer.x-r.left;o.ty=pointer.y-r.top;if(!o.on){o.x=o.tx;o.y=o.ty}}
        if(inside!==o.on){o.on=inside;o.el.classList.toggle('on',inside)}
        o.x+=(o.tx-o.x)*k;o.y+=(o.ty-o.y)*k;
        var x=Math.round(o.x*dpr)/dpr, y=Math.round(o.y*dpr)/dpr;
        o.el.style.transform='translate3d('+x+'px,'+y+'px,0)';
        o.grid.style.transform='translate3d('+mod(o.ox-x+500,120)+'px,'+mod(-y+500,120)+'px,0)';
        if(Math.abs(o.tx-o.x)>.3||Math.abs(o.ty-o.y)>.3)moving=true;
      });
    }
    if(cur&&cursorOn()){
      var show=pointer.in&&!pointer.touch;
      if(show!==cu.shown){cu.shown=show;cur.classList.toggle('on',show);if(show){cu.x=cu.tx;cu.y=cu.ty}}
      var kc=1-Math.exp(-dt/45);cu.x+=(cu.tx-cu.x)*kc;cu.y+=(cu.ty-cu.y)*kc;
      cur.style.transform='translate3d('+cu.x.toFixed(2)+'px,'+cu.y.toFixed(2)+'px,0)';
      if(Math.abs(cu.tx-cu.x)>.2||Math.abs(cu.ty-cu.y)>.2)moving=true;
    }
    var d=performance.now()-t0;stats.frames++;stats.work+=d;if(d>stats.max)stats.max=d;
    if(moving)pRaf=requestAnimationFrame(pTick);else pLast=0;
  }
  function kickPointer(){if(!pRaf&&(lightsOn()||(cur&&cursorOn())))pRaf=requestAnimationFrame(pTick)}
  addEventListener('pointermove',function(e){pointer.x=e.clientX;pointer.y=e.clientY;pointer.in=true;pointer.touch=e.pointerType==='touch';cu.tx=e.clientX;cu.ty=e.clientY;kickPointer();if(layers)layers.point(e.clientX,e.clientY)},{passive:true});
  addEventListener('pointerdown',function(e){pointer.touch=e.pointerType==='touch'},{passive:true});
  document.addEventListener('pointerout',function(e){if(!e.relatedTarget){pointer.in=false;kickPointer()}},{passive:true});
  function setPointerFeatures(){
    if(cursorOn())ensureCursor();else if(cur){cur.classList.remove('on');cu.shown=false}
    if(!lightsOn())lights.forEach(function(o){o.on=false;o.el.classList.remove('on')});
    kickPointer();
  }

  /* ---------- chapters: the right-edge index follows the chapter crossing the middle of the viewport ---------- */
  var chapNav=$('.th-chapters'), chapLinks=[], chapIdx=-1;
  if(chapNav){
    if(band&&!band.id)band.id='statement';
    chapLinks=$$('a[href^="#"]',chapNav);
    var targets=chapLinks.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))});
    var setChap=function(i){if(i<0||i===chapIdx)return;chapIdx=i;chapLinks.forEach(function(a,j){if(j===i)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')})};
    var cio=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting)setChap(targets.indexOf(x.target))})},{rootMargin:'-50% 0px -50% 0px',threshold:0});
    targets.forEach(function(t){if(t)cio.observe(t)});
    setChap(0);
  }

  /* ---------- menu: a full-screen sheet on phones; Escape closes and returns focus ---------- */
  var mbtn=$('#th-menu-btn'), menu=$('#th-menu');
  function setInert(on){['main','.foot','.th-chapters','.skip'].forEach(function(s){var el=$(s);if(el){if(on)el.setAttribute('inert','');else el.removeAttribute('inert')}})}
  function openMenu(){
    menu.hidden=false;void menu.offsetWidth;menu.classList.add('open');
    mbtn.setAttribute('aria-expanded','true');root.classList.add('th-menu-open');setInert(true);
    var f=$('a',menu);if(f)f.focus({preventScroll:true});
  }
  function closeMenu(focusBtn){
    if(!menu||menu.hidden)return;
    menu.classList.remove('open');mbtn.setAttribute('aria-expanded','false');root.classList.remove('th-menu-open');setInert(false);
    var done=function(){if(!menu.classList.contains('open'))menu.hidden=true};
    if(motionOn())setTimeout(done,270);else done();
    if(focusBtn)mbtn.focus({preventScroll:true});
  }
  if(mbtn&&menu){
    mbtn.addEventListener('click',function(){if(menu.hidden)openMenu();else closeMenu(true)});
    addEventListener('keydown',function(e){if((e.key==='Escape'||e.key==='Esc')&&!menu.hidden){e.preventDefault();closeMenu(true)}});
    menu.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('a'))closeMenu(false)});
    var wide=matchMedia('(min-width:52.501em)'), onWide=function(e){if(e.matches)closeMenu(false)};
    if(wide.addEventListener)wide.addEventListener('change',onWide);
  }

  /* ---------- page transitions: view transitions where the browser has them, a curtain where it does not ---------- */
  var crossVT=('onpagereveal' in window)&&location.protocol!=='file:';
  addEventListener('pageswap',function(e){if(e.viewTransition&&(!motionOn()||bot))e.viewTransition.skipTransition()});
  var curtain=null;
  function navigate(href){
    if(!curtain){curtain=make('div','th-curtain');curtain.setAttribute('aria-hidden','true');body.appendChild(curtain)}
    var gone=false;function go(){if(!gone){gone=true;location.href=href}}
    void curtain.offsetWidth;curtain.classList.add('on');
    curtain.addEventListener('transitionend',go,{once:true});setTimeout(go,320);
  }
  if(!crossVT)document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!motionOn()||bot)return;
    var a=e.target.closest&&e.target.closest('a[href]');
    if(!a||(a.target&&a.target!=='_self')||a.hasAttribute('download'))return;
    var u;try{u=new URL(a.href,location.href)}catch(x){return}
    if(u.protocol!==location.protocol||u.host!==location.host)return;
    if(u.pathname===location.pathname&&u.search===location.search)return;
    e.preventDefault();navigate(u.href);
  });
  addEventListener('pageshow',function(e){if(curtain)curtain.classList.remove('on')});

  /* ---------- practice: three planes (touch, think, run) that part as you scroll in and lock at "Entire" ---------- */
  var layers=null;
  function Layers(cv){
    var ctx=cv.getContext('2d');if(!ctx)return null;
    var W=0,H=0,D=1,t=0,lockY=1,lockA=0,lockT=0,tilt=[0,0],tiltT=[0,0],inView=true,raf=0,last=0,clock=0;
    var ent=document.getElementById('h-entire'), th=0,ph=0,K=1,cx=0,cy=0,DIST=7, INK='241,236,230', ACC='255,59,31';
    var NODES=[[-.6,-.5],[-.1,-.7],[.5,-.45],[-.45,.1],[.15,.05],[.65,.2],[-.2,.6],[.45,.68]], EDGES=[[0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],[3,6],[4,7],[6,7],[5,7]];
    function size(){var r=cv.getBoundingClientRect();W=r.width;H=r.height;D=Math.min(2,devicePixelRatio||1);cv.width=Math.max(1,Math.round(W*D));cv.height=Math.max(1,Math.round(H*D));ctx.setTransform(D,0,0,D,0,0);measure();draw()}
    function measure(){if(ent){var r=ent.getBoundingClientRect();lockY=r.top+(scrollY||pageYOffset)-innerHeight*.55}}
    function cam(){th=-.68+tilt[0]*.16;ph=.5+tilt[1]*.07;K=Math.min(W*.26,H*.3);cx=W*.5+Math.min(30,W*.05);cy=H*.5}
    function P(x,y,z){var c=Math.cos(th),s=Math.sin(th),x1=x*c-z*s,z1=x*s+z*c,cp=Math.cos(ph),sp=Math.sin(ph),y2=y*cp+z1*sp,z2=-y*sp+z1*cp,f=DIST/(DIST+z2);return [cx+x1*f*K,cy-y2*f*K,z2]}
    function path(pts,close){ctx.moveTo(pts[0][0],pts[0][1]);for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);if(close)ctx.closePath()}
    function rect(y,u0,v0,u1,v1){path([P(u0,y,v0),P(u1,y,v0),P(u1,y,v1),P(u0,y,v1)],true)}
    function gap(t){return t<.42?lerp(.4,.82,eio(t/.42)):lerp(.82,.13,eio((t-.42)/.58))}
    function plane(y,kind,a){
      var q=[P(-1,y,-1),P(1,y,-1),P(1,y,1),P(-1,y,1)];
      ctx.beginPath();path(q,true);ctx.fillStyle='rgba('+INK+','+(.03+.025*a)+')';ctx.fill();
      ctx.lineWidth=1;ctx.strokeStyle='rgba('+INK+','+(.42+.2*a)+')';ctx.stroke();
      ctx.beginPath();ctx.strokeStyle='rgba('+INK+',.2)';
      if(kind===0){rect(y,-.8,-.8,.8,.8);rect(y,-.8,.56,.8,.8);rect(y,-.8,-.8,-.46,.46);rect(y,-.36,.1,.12,.46);rect(y,.22,.1,.8,.46);rect(y,-.36,-.8,.8,0)}
      else if(kind===1){EDGES.forEach(function(e){var a1=NODES[e[0]],b1=NODES[e[1]];path([P(a1[0],y,a1[1]),P(b1[0],y,b1[1])])})}
      else{for(var i=0;i<4;i++)for(var j=0;j<3;j++){var u=-.8+i*.42,v=-.8+j*.56;rect(y,u,v,u+.32,v+.42)}}
      ctx.stroke();
      if(kind===1){ctx.fillStyle='rgba('+INK+',.62)';NODES.forEach(function(n){var p=P(n[0],y,n[1]);ctx.beginPath();ctx.arc(p[0],p[1],2,0,7);ctx.fill()})}
      return q;
    }
    function draw(){
      if(!W)return;cam();ctx.clearRect(0,0,W,H);
      var g=gap(t), bob=live()?Math.sin(clock*Math.PI*2/8)*.025:0, la=eo(clamp(lockA,0,1));
      var ys=[g+bob,bob,-g+bob], names=['TOUCH','THINK','RUN'], quads=[];
      if(la>0){
        var corners=[[-1,-1],[1,-1],[1,1],[-1,1]], sides=[];
        for(var i=0;i<4;i++){var c0=corners[i],c1=corners[(i+1)%4];sides.push([P(c0[0],ys[2],c0[1]),P(c1[0],ys[2],c1[1]),P(c1[0],ys[0],c1[1]),P(c0[0],ys[0],c0[1])])}
        sides.sort(function(a,b){return (a[0][2]+a[1][2])-(b[0][2]+b[1][2])});
        ctx.fillStyle='rgba('+INK+','+(.035*la)+')';
        for(i=0;i<2;i++){ctx.beginPath();path(sides[i],true);ctx.fill()}
      }
      for(var k=2;k>=0;k--)quads[k]=plane(ys[k],k,la);
      if(la>0){
        ctx.beginPath();ctx.strokeStyle='rgba('+INK+','+(.5*la)+')';
        [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(c){var a=P(c[0],ys[2],c[1]),b=P(c[0],lerp(ys[2],ys[0],la),c[1]);path([a,b])});
        ctx.stroke();
        var a0=P(0,ys[2],0),a1=P(0,lerp(ys[2],ys[0],la),0);
        ctx.beginPath();ctx.strokeStyle='rgba('+ACC+',.45)';path([a0,a1]);ctx.stroke();
        if(la>.98){ctx.fillStyle='rgb('+ACC+')';ctx.beginPath();ctx.arc(a1[0],a1[1],3,0,7);ctx.fill()}
      }
      ctx.font='10px "JetBrains Mono",ui-monospace,monospace';ctx.textAlign='right';ctx.textBaseline='middle';
      if('letterSpacing' in ctx)ctx.letterSpacing='2px';
      /* labels sit left of each plane's leftmost corner on a leader; they keep 18 px apart however close the planes get */
      var ls=quads.map(function(q,i){var m=q[0];q.forEach(function(p){if(p[0]<m[0])m=p});return {cx:m[0],cy:m[1],y:m[1],n:names[i]}});
      for(i=1;i<3;i++)if(ls[i].y<ls[i-1].y+18)ls[i].y=ls[i-1].y+18;
      ls.forEach(function(l){
        var tw=ctx.measureText(l.n).width, tx=Math.max(8+tw,l.cx-44);
        ctx.beginPath();ctx.strokeStyle='rgba('+INK+',.3)';path([[l.cx-5,l.cy],[tx+6,l.y]]);ctx.stroke();
        ctx.fillStyle='rgba('+INK+','+(la>.98?.92:.62)+')';ctx.fillText(l.n,tx,l.y);
      });
    }
    function want(){return inView&&(live()||Math.abs(tilt[0]-tiltT[0])>.002||Math.abs(tilt[1]-tiltT[1])>.002||lockA!==lockT)}
    var tick=timed(function(now){
      raf=0;var dt=last?Math.min(64,now-last):16;last=now;if(live())clock+=dt/1000;
      var kt=1-Math.exp(-dt/180);tilt[0]+=(tiltT[0]-tilt[0])*kt;tilt[1]+=(tiltT[1]-tilt[1])*kt;
      if(lockA!==lockT){if(!live())lockA=lockT;else{var st=dt/(lockT>lockA?700:360);lockA=lockT>lockA?Math.min(lockT,lockA+st):Math.max(lockT,lockA-st)}}
      draw();if(want())raf=requestAnimationFrame(tick);else last=0;
    });
    function kick(){if(!raf&&inView)raf=requestAnimationFrame(tick)}
    var vio=new IntersectionObserver(function(en){inView=en[0].isIntersecting;if(inView)kick()});vio.observe(cv);
    addEventListener('resize',size);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(size);
    size();
    return {
      scroll:function(y){var nt=lockY>0?clamp(y/lockY,0,1):1;var nl=nt>=.999?1:0;if(nt!==t||nl!==lockT){t=nt;lockT=nl;if(!live())lockA=lockT;kick();if(!raf)draw()}},
      point:function(x,y){if(!motionOn())return;var r=cv.getBoundingClientRect();tiltT[0]=clamp((x-(r.left+r.width/2))/(r.width*.6),-1,1);tiltT[1]=clamp((y-(r.top+r.height/2))/(r.height*.6),-1,1);kick()},
      motion:function(){if(!motionOn()){tiltT=[0,0];tilt=[0,0]}lockA=live()?lockA:lockT;kick();draw()},
      measure:measure, state:function(){return {t:t,lock:lockA,gap:gap(t)}}
    };
  }
  var lcv=$('canvas[data-layers]');if(lcv)try{layers=Layers(lcv)}catch(e){layers=null}

  /* ---------- capabilities: eight chapters, each with its own scene, running only while in view ---------- */
  var scenes=[];
  $$('canvas[data-scene]').forEach(function(cv){
    var o={cv:cv,name:cv.getAttribute('data-scene'),chap:cv.closest('.chap')||cv.parentNode,h:null,mounted:false,on:false};
    scenes.push(o);
  });
  function call(h,names){if(!h)return;for(var i=0;i<names.length;i++){if(typeof h[names[i]]==='function'){try{h[names[i]]()}catch(e){}return}}}
  function mountScene(o){
    if(o.mounted)return;var S=window.ARDHOLT_SCENES;if(!S||typeof S.mount!=='function')return;
    try{o.h=S.mount(o.cv,o.name)||null;o.mounted=true}catch(e){o.mounted=true}
  }
  if(scenes.length){
    scenes.forEach(mountScene);
    var sio=new IntersectionObserver(function(en){en.forEach(function(x){
      var o=null;scenes.forEach(function(s){if(s.chap===x.target)o=s});if(!o)return;
      mountScene(o);o.on=x.isIntersecting;o.chap.classList.toggle('on',o.on);
      call(o.h,o.on?['start','play','resume']:['stop','pause']);
    })},{threshold:0});
    scenes.forEach(function(o){sio.observe(o.chap)});
  }

  /* ---------- the standard: a vertical rule that draws as you read ---------- */
  var rail=null, sd=$('.sd');
  if(sd){
    var rfill=$('.sd-rail i',sd), rlist=$('.sd-steps',sd), rsteps=$$('.sd-step',sd);
    rail={update:function(vh){
      var settled=!motionOn()||bot, line=vh*.62, r=rlist.getBoundingClientRect(), p=settled?1:clamp((line-r.top)/r.height,0,1);
      rfill.style.transform='scaleY('+p.toFixed(4)+')';
      rsteps.forEach(function(s){var on=settled||s.getBoundingClientRect().top+24<=line;if(on!==s.classList.contains('on'))s.classList.toggle('on',on)});
    }};
  }

  /* ---------- contact: the pill breathes once on arrival and the header mark pulses with it ---------- */
  var pill=$('.ct-pill');
  if(pill&&live())setTimeout(function(){
    if(!live())return;
    var E={duration:1900,easing:'cubic-bezier(.45,0,.55,1)'};
    try{
      pill.animate([{transform:'scale(1)',boxShadow:'0 0 0 0 rgba(241,236,230,0)'},{transform:'scale(1.035)',boxShadow:'0 0 0 12px rgba(241,236,230,.07)',offset:.45},{transform:'scale(1)',boxShadow:'0 0 0 28px rgba(241,236,230,0)'}],E);
      var m=hdr&&$('.brand svg',hdr);if(m)m.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.16)',opacity:.72,offset:.45},{transform:'scale(1)',opacity:1}],E);
    }catch(e){}
  },1250);

  /* ---------- one scroll frame for every scroll-linked beat ---------- */
  var heroEl=$('.hero'), heroH1=heroEl&&$('h1',heroEl), stage=$('.stage'), stageTop=0, stageH=0, released=false, heroDirty=false, ticking=false;
  function measureAll(){if(stage){stageTop=parseFloat(getComputedStyle(stage).top)||0;stageH=stage.offsetHeight}layoutLights();if(layers){layers.measure()}}
  var frame=timed(function(){
    ticking=false;
    var y=scrollY||pageYOffset, vh=innerHeight, max=Math.max(1,root.scrollHeight-vh), mon=motionOn();
    var hr=heroH1&&heroEl.getBoundingClientRect(), br=bandLift&&band.getBoundingClientRect(), sb=stage&&stage.parentNode.getBoundingClientRect().bottom;
    if(hdr){var sc=y>8;if(sc!==hdrScrolled){hdrScrolled=sc;hdr.classList.toggle('th-scrolled',sc)}prog.style.transform='scaleX('+clamp(y/max,0,1).toFixed(4)+')';
      /* the header steps aside while reading down and returns on the first scroll up, so it never sits over the words */
      if(y>160){hdr.classList.add('th-away')}else{hdr.classList.remove('th-away')}}
    if(heroH1){
      var s=-hr.top;
      if(mon&&s>0&&hr.bottom>0){heroH1.style.transform='translate3d(0,'+(s*.15).toFixed(1)+'px,0)';heroH1.style.opacity=(1-clamp(s/(hr.height*.7),0,1)*.85).toFixed(3);heroDirty=true}
      else if(heroDirty&&(s<=0||!mon)){heroH1.style.transform='';heroH1.style.opacity='';heroDirty=false}
    }
    if(bandLift)bandLift.style.opacity=(!mon||bot)?'1':clamp((vh-br.top)/(vh*.5),0,1).toFixed(3);
    /* released = the container's end has reached the pinned stage (read from the container, so the lift itself cannot feed back) */
    if(stage){var rel=mon&&sb<stageTop+stageH-.5;if(rel!==released){released=rel;stage.classList.toggle('th-released',rel)}}
    if(layers)layers.scroll(y);
    if(rail)rail.update(vh);
    if(chapLinks.length&&y>=max-2)setChap(chapLinks.length-1);
  });
  function req(){if(!ticking){ticking=true;requestAnimationFrame(frame)}}
  addEventListener('scroll',function(){req();kickPointer()},{passive:true});
  addEventListener('resize',function(){root.classList.toggle('th-tall',isTall());if(isTall())settleAll();measureAll();req()});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){measureAll();req()});
  addEventListener('load',function(){measureAll();req()});

  /* ---------- motion control: everything settles at once, and wakes again ---------- */
  function settleAll(){counters.forEach(settleCounter);footIn();$$('.ledger[data-draw]').forEach(function(l){l.classList.add('in')})}
  function onMotion(){
    if(!live())settleAll();
    setPointerFeatures();if(layers)layers.motion();req();
  }
  addEventListener('ardholt:motion',onMotion);
  if(rrm.addEventListener)rrm.addEventListener('change',onMotion);
  if(fineMq.addEventListener)fineMq.addEventListener('change',setPointerFeatures);

  root.classList.toggle('th-tall',isTall());
  measureAll();setPointerFeatures();frame();
  window.ARDHOLT_THEATRE={stats:stats,layers:function(){return layers&&layers.state()},resetStats:function(){stats.frames=0;stats.work=0;stats.max=0}};
})();
