/* Hero: the Summit mark as a three-dimensional truss, drawn with raw WebGL. No libraries.
   Responds to the pointer (tilt, nearby nodes light), assembles on load, disassembles as you scroll. */
(function(){
  var cv=document.getElementById('truss'); if(!cv) return;
  var gl=cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:false}); if(!gl) return;
  var hero=cv.parentNode, W=0,H=0,DPR=Math.min(2,devicePixelRatio||1);
  function size(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;gl.viewport(0,0,cv.width,cv.height)} size(); addEventListener('resize',function(){size();requestAnimationFrame(frame)});

  /* geometry: the mark's nodes in a 32-unit box (y down), mirrored into two layers */
  var P={A:[16,3],B:[3,29],C:[29,29],D:[16,10.2],E:[6.6,29],F:[25.4,29],G:[16,19],H:[11,29],I:[21,29]};
  var E=[['A','B'],['A','C'],['B','C'],['D','E'],['D','F'],['E','F'],['A','D'],['B','E'],['C','F'],['G','H'],['G','I'],['H','I'],['D','G'],['E','H'],['F','I']];
  var keys=Object.keys(P), Z=0.55, nodes=[], edges=[];
  keys.forEach(function(k,i){var x=(P[k][0]-16)/12.6,y=(16-P[k][1])/12.6+0.24;nodes.push([x,y,Z]);nodes.push([x,y,-Z])});
  function idx(k,layer){return keys.indexOf(k)*2+layer}
  E.forEach(function(e){edges.push([idx(e[0],0),idx(e[1],0)]);edges.push([idx(e[0],1),idx(e[1],1)])});
  keys.forEach(function(k){edges.push([idx(k,0),idx(k,1)])});
  var nStruct=edges.length;[['A','D'],['B','E'],['C','F'],['D','G'],['E','H'],['F','I']].forEach(function(e){edges.push([idx(e[0],0),idx(e[1],1)]);edges.push([idx(e[0],1),idx(e[1],0)])});
  var N=nodes.length, scatter=nodes.map(function(){return [(Math.random()-.5)*5,(Math.random()-.5)*4,(Math.random()-.5)*4]});
  /* particles */
  var PN=520, pts=[]; for(var i=0;i<PN;i++){var r=1.4+Math.random()*2.4,th=Math.random()*6.283,ph=Math.acos(2*Math.random()-1);pts.push([r*Math.sin(ph)*Math.cos(th),r*Math.sin(ph)*Math.sin(th)*.7,r*Math.cos(ph),Math.random()])}

  var vs='attribute vec3 p;attribute vec4 c;uniform mat4 m;uniform float ps;varying vec4 vc;void main(){gl_Position=m*vec4(p,1.0);gl_PointSize=ps*(1.0/gl_Position.w)*2.2;vc=c;}';
  var fs='precision mediump float;varying vec4 vc;uniform int round_;void main(){if(round_==1){vec2 d=gl_PointCoord-vec2(.5);if(dot(d,d)>.25)discard;}gl_FragColor=vc;}';
  function sh(t,s){var o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
  var aP=gl.getAttribLocation(pr,'p'),aC=gl.getAttribLocation(pr,'c'),uM=gl.getUniformLocation(pr,'m'),uPS=gl.getUniformLocation(pr,'ps'),uR=gl.getUniformLocation(pr,'round_');
  var bP=gl.createBuffer(),bC=gl.createBuffer(); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);

  function mat(rx,ry,aspect){var cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),f=1/Math.tan(0.3),n=.1,fa=50,cz=6.2;
    /* rotateY then rotateX then translate(-cz) then perspective, column-major */
    var r=[cy,0,-sy,0, sx*sy,cx,sx*cy,0, cx*sy,-sx,cx*cy,0, 0,0,0,1];
    var pm=[f/aspect,0,0,0, 0,f,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0];
    var t=[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,-cz,1];
    function mul(a,b){var o=new Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o}
    return new Float32Array(mul(pm,mul(t,r)))}

  var px=0,py=0,tx=0,ty=0,hover=[],t0=performance.now(),build=0,running=false,raf=0,inView=true;
  addEventListener('mousemove',function(e){tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2;var r=cv.getBoundingClientRect();hover=[e.clientX-r.left,e.clientY-r.top]},{passive:true});
  var io=new IntersectionObserver(function(en){inView=en[0].isIntersecting;loop()},{threshold:0}); io.observe(cv);

  function project(v,m){var x=v[0],y=v[1],z=v[2];var cw=m[3]*x+m[7]*y+m[11]*z+m[15];return [((m[0]*x+m[4]*y+m[8]*z+m[12])/cw*.5+.5)*W,(.5-(m[1]*x+m[5]*y+m[9]*z+m[13])/cw*.5)*H]}
  var INK=[0.945,0.925,0.9], ACC=[1,0.23,0.12];
  function frame(now){
    var t=(now-t0)/1000, on=window.ARDHOLT&&window.ARDHOLT.motionOn();
    if(on){build=Math.min(1,build+0.012);px+=(tx-px)*.06;py+=(ty-py)*.06}else{build=1}
    var scroll=Math.min(1,Math.max(0,(scrollY)/(hero.offsetHeight*.9))); /* disassembles as you leave the hero */
    var ease=build<1?1-Math.pow(1-build,3):1, asm=ease*(1-scroll);
    var ry=(on?Math.sin(t*.22)*.26:.2)+px*.3, rx=-.1+py*.18, m=mat(rx,ry,W/H);
    var pos=[],col=[],off=W*(innerWidth>840?.2:0),sc=1;
    var cur=nodes.map(function(n,i){var s=scatter[i];return [n[0]*asm+s[0]*(1-asm),n[1]*asm+s[1]*(1-asm),n[2]*asm+s[2]*(1-asm)]});
    /* which nodes are near the pointer, in screen space */
    var glow=cur.map(function(v){var q=project(v,m);q[0]+=off;if(!hover.length||!on)return 0;var d=Math.hypot(q[0]-hover[0],q[1]-hover[1]);return Math.max(0,1-d/140)});
    var la=(.62+.1*Math.sin(t*.7))*asm+0.06;
    edges.forEach(function(e,ei){var a=cur[e[0]],b=cur[e[1]],g=Math.max(glow[e[0]],glow[e[1]]);var c=[INK[0]+(ACC[0]-INK[0])*g,INK[1]+(ACC[1]-INK[1])*g,INK[2]+(ACC[2]-INK[2])*g,(ei<nStruct?la:la*.35)+g*.5];pos.push(a[0],a[1],a[2],b[0],b[1],b[2]);col.push.apply(col,c);col.push.apply(col,c)});
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(uM,false,m); gl.uniform1i(uR,0);
    /* a screen-space shift keeps the structure to the right of the headline */
    var m2=new Float32Array(m); m2[12]+=off/W*2*m2[15]; gl.uniformMatrix4fv(uM,false,m2);
    function draw(mode,P,C,n){gl.bindBuffer(gl.ARRAY_BUFFER,bP);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(P),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(aP);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,bC);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(C),gl.DYNAMIC_DRAW);gl.enableVertexAttribArray(aC);gl.vertexAttribPointer(aC,4,gl.FLOAT,false,0,0);gl.drawArrays(mode,0,n)}
    draw(gl.LINES,pos,col,pos.length/3);
    /* nodes */
    var np=[],nc=[]; cur.forEach(function(v,i){np.push(v[0],v[1],v[2]);var g=glow[i];nc.push(INK[0]+(ACC[0]-INK[0])*g,INK[1]+(ACC[1]-INK[1])*g,INK[2]+(ACC[2]-INK[2])*g,(.55+.45*g)*Math.max(.15,asm))});
    gl.uniform1f(uPS,DPR*22); gl.uniform1i(uR,1); draw(gl.POINTS,np,nc,N);
    /* particles drift and brighten as the structure scatters */
    var pp=[],pc=[]; pts.forEach(function(p){var a=on?t*.03*(.5+p[3]):0;var x=p[0]*Math.cos(a)-p[2]*Math.sin(a),z=p[0]*Math.sin(a)+p[2]*Math.cos(a);pp.push(x,p[1]+Math.sin(t*.4+p[3]*9)*.05*(on?1:0),z);pc.push(INK[0],INK[1],INK[2],(.10+.25*p[3])*(.6+.4*scroll))});
    gl.uniform1f(uPS,DPR*7); draw(gl.POINTS,pp,pc,PN);
  }
  function loop(){cancelAnimationFrame(raf);if(!inView)return;function step(now){frame(now);if(window.ARDHOLT&&window.ARDHOLT.motionOn()&&inView)raf=requestAnimationFrame(step)}raf=requestAnimationFrame(step)}
  addEventListener('ardholt:motion',loop); addEventListener('scroll',function(){if(!(window.ARDHOLT&&window.ARDHOLT.motionOn()))requestAnimationFrame(frame)},{passive:true});
  loop();
})();
