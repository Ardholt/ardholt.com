(function(){
  var root=document.documentElement, fine=matchMedia('(pointer:fine)').matches, rrm=matchMedia('(prefers-reduced-motion: reduce)');
  function motionOn(){return !root.classList.contains('motion-off') && !rrm.matches}
  window.ARDHOLT={motionOn:motionOn};

  /* motion control (WCAG 2.2.2): one switch for every autonomous movement on the page */
  var btn=document.getElementById('motion');
  function paint(){var on=!root.classList.contains('motion-off');btn.setAttribute('aria-pressed',String(!on));btn.querySelector('.t').textContent=on?'Pause motion':'Resume motion'}
  btn.addEventListener('click',function(){root.classList.toggle('motion-off');try{localStorage.setItem('ardholt-motion',root.classList.contains('motion-off')?'off':'on')}catch(e){}paint();window.dispatchEvent(new Event('ardholt:motion'))});
  paint();

  /* split headings into lines for the curtain reveal; accessible name kept on the heading */
  function split(el){
    var text=el.textContent.replace(/\s+/g,' ').trim();
    var nodes=[]; (function walk(n){for(var i=0;i<n.childNodes.length;i++){var c=n.childNodes[i];if(c.nodeType===1&&c.classList.contains('dot')){var d=c.cloneNode(true);d.classList.add('w');nodes.push(d);continue}if(c.nodeType===3){c.textContent.split(/(\s+)/).forEach(function(w){if(!w)return;if(/^\s+$/.test(w)){nodes.push(document.createTextNode(' '))}else{var s=document.createElement('span');s.className='w';s.textContent=w;nodes.push(s)}})}else{var w2=c.cloneNode(false);w2.textContent='';var save=nodes;nodes=[];walk(c);nodes.forEach(function(x){w2.appendChild(x)});nodes=save;nodes.push(w2)}}})(el);
    el.textContent='';nodes.forEach(function(n){el.appendChild(n)});
    var words=el.querySelectorAll('.w, i > .w'); var lines=[],cur=null,top=null;
    el.querySelectorAll('.w').forEach(function(w){var t=w.offsetTop;if(top===null||Math.abs(t-top)>4){top=t;cur={top:t,items:[]};lines.push(cur)}cur.items.push(w)});
    var frag=document.createDocumentFragment();
    lines.forEach(function(l,i){var ln=document.createElement('span');ln.className='ln';var inner=document.createElement('span');inner.style.transitionDelay=(i*70)+'ms';l.items.forEach(function(w,j){var p=w.parentNode;if(p!==el&&p.tagName==='I'){var it=document.createElement('i');it.appendChild(w);inner.appendChild(it)}else inner.appendChild(w);if(j<l.items.length-1&&!l.items[j+1].classList.contains('dot'))inner.appendChild(document.createTextNode(' '))});ln.appendChild(inner);frag.appendChild(ln)});
    el.textContent='';el.appendChild(frag);
  }
  document.querySelectorAll('[data-split]').forEach(function(el){try{split(el)}catch(e){}});

  /* reveals */
  var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.1});
  document.querySelectorAll('.rv,.lines').forEach(function(e){io.observe(e)});

  /* capabilities stepper: the pinned stage follows the step nearest the middle of the viewport */
  var steps=document.querySelectorAll('.step'), vn=document.getElementById('viz-n'), vt=document.getElementById('viz-t'), active=null;
  function setActive(li){if(li===active)return;active=li;steps.forEach(function(s){s.classList.toggle('active',s===li)});vn.textContent=li.querySelector('.n').textContent;vt.textContent=li.querySelector('h3').textContent;if(window.ARDHOLT_VIZ)window.ARDHOLT_VIZ.set(li.dataset.viz)}
  var sio=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting)setActive(x.target)})},{rootMargin:'-45% 0px -45% 0px',threshold:0});
  steps.forEach(function(s){sio.observe(s)}); setActive(steps[0]);

  /* scrubbed statement + progress line + magnet + tilt: one rAF-throttled scroll handler */
  var scrub=document.getElementById('scrub'); if(scrub){scrub.innerHTML=scrub.textContent.trim().split(' ').map(function(w){return '<span class="w">'+w+'</span>'}).join(' ')}
  var words=scrub?scrub.querySelectorAll('.w'):[], stepsBox=document.getElementById('steps'), bar=stepsBox&&stepsBox.querySelector('.progress i'), ticking=false;
  function onScroll(){if(ticking)return;ticking=true;requestAnimationFrame(function(){ticking=false;if(!motionOn())return;var vh=innerHeight;
    if(scrub){var r=scrub.getBoundingClientRect();var p=Math.min(1,Math.max(0,(vh*.85-r.top)/(vh*.55)));var n=Math.round(p*words.length);words.forEach(function(w,i){w.classList.toggle('on',i<n)})}
    if(bar&&!CSS.supports('animation-timeline:view()')){var b=stepsBox.getBoundingClientRect();var q=Math.min(1,Math.max(0,(vh*.9-b.top)/(vh*.7)));bar.style.transform='scaleX('+q+')'}
  })}
  addEventListener('scroll',onScroll,{passive:true}); addEventListener('resize',onScroll); onScroll();
  addEventListener('ardholt:motion',function(){if(!motionOn()){words.forEach(function(w){w.classList.add('on')});if(bar)bar.style.transform='none'}else onScroll()});

  if(fine){
    document.querySelectorAll('.magnet').forEach(function(m){
      m.addEventListener('mousemove',function(e){if(!motionOn())return;var r=m.getBoundingClientRect();var dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);m.style.transform='translate('+(dx*.18)+'px,'+(dy*.28)+'px)';m.style.transition='transform .15s'});
      m.addEventListener('mouseleave',function(){m.style.transition='transform .6s cubic-bezier(.16,1,.3,1)';m.style.transform=''});
    });
    document.querySelectorAll('.tilt').forEach(function(c){
      c.addEventListener('mousemove',function(e){if(!motionOn())return;var r=c.getBoundingClientRect();var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform='perspective(900px) rotateX('+(-y*4)+'deg) rotateY('+(x*5)+'deg) translateY(-2px)';c.style.backgroundColor='rgba(255,255,255,.015)'});
      c.addEventListener('mouseleave',function(){c.style.transform='';c.style.backgroundColor=''});
    });
  }
})();
