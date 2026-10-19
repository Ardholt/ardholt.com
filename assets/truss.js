/* Hero: the Summit mark as a three-dimensional structure, drawn with raw WebGL, taking a load.
   Concept: "engineering for the moment it has to hold". A beam descends onto the apex; the members carry it
   (stress shown as warmth that settles), the structure holds. The pointer shifts the load; the camera follows. */
(function(){
  var cv=document.getElementById('truss'); if(!cv) return;
  var gl=cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false}); if(!gl) return;
  var hero=cv.parentNode, W=0,H=0,DPR=Math.min(2,devicePixelRatio||1);
  function size(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;gl.viewport(0,0,cv.width,cv.height)} size(); addEventListener('resize',function(){size();requestAnimationFrame(frame)});

  /* the mark's nodes (32-unit box, y down) in two layers */
  var P={A:[16,3],B:[3,29],C:[29,29],D:[16,10.2],E:[6.6,29],F:[25.4,29],G:[16,19],H:[11,29],I:[21,29]};
  var keys=Object.keys(P), Z=0.5, S=12.2, nodes=[];
  keys.forEach(function(k){var x=(P[k][0]-16)/S,y=(16-P[k][1])/S+0.12;nodes.push([x,y,Z]);nodes.push([x,y,-Z])});
  function id(k,l){return keys.indexOf(k)*2+l}
  /* members: outer band + inner peak + ties; stress weight = how much of the apex load each carries */
  var M=[]; function mem(a,b,s,faint){M.push([id(a,0),id(b,0),s,faint]);M.push([id(a,1),id(b,1),s,faint])}
  mem('A','B',1);mem('A','C',1);mem('A','D',.9);mem('D','E',.7);mem('D','F',.7);mem('B','E',.3);mem('C','F',.3);mem('E','F',.2);mem('B','C',.15);
  mem('G','H',.5);mem('G','I',.5);mem('H','I',.15);mem('D','G',.8);mem('E','H',.2);mem('F','I',.2);
  keys.forEach(function(k){M.push([id(k,0),id(k,1),k==='A'?.9:.2,true])});
  [['A','D'],['B','E'],['C','F'],['D','G']].forEach(function(e){M.push([id(e[0],0),id(e[1],1),.3,true]);M.push([id(e[0],1),id(e[1],0),.3,true])});
  /* faces of the solid inner peak */
  var F=[[id('G',0),id('H',0),id('I',0)],[id('G',1),id('H',1),id('I',1)],[id('G',0),id('H',0),id('H',1)],[id('G',0),id('H',1),id('G',1)],[id('G',0),id('I',0),id('I',1)],[id('G',0),id('I',1),id('G',1)]];
  var N=nodes.length, apex=nodes[0];

  var vs='attribute vec3 p;attribute vec4 c;uniform mat4 m;uniform float ps;varying vec4 vc;void main(){gl_Position=m*vec4(p,1.0);gl_PointSize=ps*(1.0/gl_Position.w)*2.2;vc=c;}';
  var fs='precision mediump float;varying vec4 vc;uniform int round_;void main(){if(round_==1){vec2 d=gl_PointCoord-vec2(.5);float r=dot(d,d);if(r>.25)discard;gl_FragColor=vec4(vc.rgb,vc.a*(1.0-smoothstep(.12,.25,r)));}else gl_FragColor=vc;}';
  function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
  var aP=gl.getAttribLocation(pr,'p'),aC=gl.getAttribLocation(pr,'c'),uM=gl.getUniformLocation(pr,'m'),uPS=gl.getUniformLocation(pr,'ps'),uR=gl.getUniformLocation(pr,'round_');
  var bP=gl.createBuffer(),bC=gl.createBuffer(); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  function mat(rx,ry,aspect,sy){var cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),syy=Math.sin(ry),f=1/Math.tan(0.3),n=.1,fa=50,cz=6.2;
    var r=[cy,0,-syy,0, sx*syy*sy,cx*sy,sx*cy*sy,0, cx*syy,-sx,cx*cy,0, 0,0,0,1];
    var pm=[f/aspect,0,0,0, 0,f,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0];
    var t=[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-cz,1];
    function mul(a,b){var o=new Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o}
    return new Float32Array(mul(pm,mul(t,r)))}
  function draw(mode,Pp,C,n){gl.bindBuffer(gl.ARRAY_BUFFER,bP);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(Pp),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,bC);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(C),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(aC);gl.vertexAttribPointer(aC,4,gl.FLOAT,false,0,0);gl.drawArrays(mode,0,n)}

  var INK=[0.945,0.925,0.9], ACC=[1,0.23,0.12];
  function mix(g){return [INK[0]+(ACC[0]-INK[0])*g,INK[1]+(ACC[1]-INK[1])*g,INK[2]+(ACC[2]-INK[2])*g]}
  var px=0,py=0,tx=0,ty=0,t0=performance.now(),raf=0,inView=true,born=0;
  if(navigator.webdriver){born=1;t0-=6000} /* automated browsers see the settled structure */
  addEventListener('mousemove',function(e){tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2},{passive:true});
  new IntersectionObserver(function(en){inView=en[0].isIntersecting;loop()},{threshold:0}).observe(cv);
  function easeOut(x){return 1-Math.pow(1-x,3)}
  function frame(now){
    var on=window.ARDHOLT&&window.ARDHOLT.motionOn(), t=(now-t0)/1000;
    if(on){born=Math.min(1,born+0.011);px+=(tx-px)*.05;py+=(ty-py)*.05}else{born=1}
    var fade=1-Math.min(1,Math.max(0,(scrollY-hero.offsetHeight*.15)/(hero.offsetHeight*.75)));
    /* the load: descends after the structure stands, then rests on the apex; pointer shifts it sideways */
    var tl=Math.max(0,born-0.55)/0.45, land=easeOut(tl), hold=on?Math.min(1,Math.max(0,(t-2.2)/1.6)):1;
    var beamY=apex[1]+0.95-0.915*land, shift=px*.22*land;
    var settle=1-0.82*hold; /* stress peaks on landing then settles as the structure carries it */
    var compress=1-0.014*land;
    var ry=(on?Math.sin(t*.2)*.3:.22)+px*.28, rx=-.09+py*.16, m=mat(rx,ry,W/H,compress);
    var off=W*(innerWidth>840?.17:0); var m2=new Float32Array(m); if(innerWidth<=840){var ms=.58;[0,4,8,12,1,5,9,13].forEach(function(i){m2[i]*=ms});m2[13]+=0.5*m2[15]} m2[12]+=off/W*2*m2[15]; gl.uniformMatrix4fv(uM,false,m2);
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); gl.uniform1i(uR,0);
    var scat=1-easeOut(Math.min(1,born/0.55)); /* members assemble in from a loose cloud */
    function pos(i){var n=nodes[i];var j=(i*7919)%13/13-.5;return [n[0]+j*2.4*scat,n[1]+((i*104729)%11/11-.5)*1.6*scat,n[2]+((i*31)%7/7-.5)*2*scat]}
    /* faces */
    var fp=[],fc=[]; F.forEach(function(f){f.forEach(function(i){var p=pos(i);fp.push(p[0],p[1],p[2]);fc.push(INK[0],INK[1],INK[2],.07*(1-scat)*fade)})}); draw(gl.TRIANGLES,fp,fc,fp.length/3);
    /* members with stress */
    var lp=[],lc=[]; M.forEach(function(e){var a=pos(e[0]),b=pos(e[1]);var side=(nodes[e[0]][0]+nodes[e[1]][0])/2; var bias=1+Math.max(-0.6,Math.min(0.6,(side*px)*1.6)); /* load shifted toward the pointer side */
      var stress=Math.min(1,e[2]*land*settle*bias); var c=mix(Math.min(.55,stress*.55)); var al=(e[3]?.28:.78)*(1-scat)*fade+.02;
      lp.push(a[0],a[1],a[2],b[0],b[1],b[2]);lc.push(c[0],c[1],c[2],al,c[0],c[1],c[2],al)}); draw(gl.LINES,lp,lc,lp.length/3); var m3=new Float32Array(m2); m3[12]+=2/W*m3[15]; gl.uniformMatrix4fv(uM,false,m3); draw(gl.LINES,lp,lc,lp.length/3); gl.uniformMatrix4fv(uM,false,m2);
    /* nodes */
    var np=[],nc=[]; for(var i=0;i<N;i++){var p=pos(i);np.push(p[0],p[1],p[2]);var s=(i<2?1:.35)*land*settle;var c2=mix(s*.6);nc.push(c2[0],c2[1],c2[2],(.5+.5*(i<2?1:0))*(1-scat)*fade)}
    gl.uniform1i(uR,1); gl.uniform1f(uPS,DPR*18); draw(gl.POINTS,np,nc,N);
    /* the apex glow carries the load */
    gl.uniform1f(uPS,DPR*(60+30*(1-settle))); draw(gl.POINTS,[apex[0],apex[1],apex[2]],mix(.5*land*settle).concat([.14*land*fade]),1);
    /* the beam: a bar of two lines with end caps, lowering onto the apex */
    if(land>0){var bw=1.15,by=beamY,bz=0;var bp=[-bw/2+shift,by,bz, bw/2+shift,by,bz, -bw/2+shift,by+.045,bz, bw/2+shift,by+.045,bz, -bw/2+shift,by,bz, -bw/2+shift,by+.045,bz, bw/2+shift,by,bz, bw/2+shift,by+.045,bz];var ba=.9*land*fade;var bc=[];for(var k=0;k<8;k++)bc.push(INK[0],INK[1],INK[2],ba);gl.uniform1i(uR,0);draw(gl.LINES,bp,bc,8);
      /* a fine seam where the beam meets the apex */
      gl.uniform1i(uR,1);gl.uniform1f(uPS,DPR*10);draw(gl.POINTS,[shift,by,0],mix(.8*land*settle).concat([.9*land*fade]),1)}
  }
  function loop(){cancelAnimationFrame(raf);if(!inView)return;function step(now){frame(now);if(window.ARDHOLT&&window.ARDHOLT.motionOn()&&inView)raf=requestAnimationFrame(step)}raf=requestAnimationFrame(step)}
  addEventListener('ardholt:motion',loop); addEventListener('scroll',function(){if(!(window.ARDHOLT&&window.ARDHOLT.motionOn()))requestAnimationFrame(frame)},{passive:true});
  loop();
})();
