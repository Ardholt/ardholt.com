/* Hero: the Summit mark cast as a solid, lit object, drawn by hand in raw WebGL.
   A graphite form with chamfered edges under a bone key light, a faint warm rim from below right, a soft contact
   shadow and a 6% reflection on an unseen floor, with fine dust catching the light. Owns <canvas id="truss">.
   Motion contract: everything autonomous obeys window.ARDHOLT.motionOn() and the 'ardholt:motion' event. */
(function(){
  'use strict';
  var cv=document.getElementById('truss'); if(!cv) return;
  var gl=cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});
  if(!gl) return;
  var hero=cv.parentNode, DPR=Math.min(2,window.devicePixelRatio||1), W=0, H=0, logs=[];
  function motionOn(){return !!(window.ARDHOLT&&window.ARDHOLT.motionOn())}

  /* ---------- geometry: a polygon extruded to depth d, with a chamfer c on every edge ---------- */
  function dir(a,b){var x=b[0]-a[0],y=b[1]-a[1],l=Math.hypot(x,y)||1;return [x/l,y/l]}
  function cross(a,b,c){return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])}
  function inTri(p,a,b,c){var e=-1e-9;return cross(a,b,p)>e&&cross(b,c,p)>e&&cross(c,a,p)>e}
  function ears(poly){ /* ear clipping for a simple CCW polygon */
    var idx=[],out=[],i,guard=0; for(i=0;i<poly.length;i++)idx.push(i);
    while(idx.length>3&&guard++<400){var found=false;
      for(i=0;i<idx.length;i++){var i0=idx[(i+idx.length-1)%idx.length],i1=idx[i],i2=idx[(i+1)%idx.length],A=poly[i0],B=poly[i1],C=poly[i2];
        if(cross(A,B,C)<=1e-12)continue; var ok=true;
        for(var j=0;j<idx.length;j++){var k=idx[j];if(k===i0||k===i1||k===i2)continue;if(inTri(poly[k],A,B,C)){ok=false;break}}
        if(ok){out.push(i0,i1,i2);idx.splice(i,1);found=true;break}}
      if(!found)break}
    if(idx.length===3)out.push(idx[0],idx[1],idx[2]); return out}
  function build(pts,d,c,zc,o){
    var n=pts.length,i,area=0;
    for(i=0;i<n;i++){var a0=pts[i],a1=pts[(i+1)%n];area+=a0[0]*a1[1]-a1[0]*a0[1]} if(area<0)pts=pts.slice().reverse();
    /* per corner: the vertical edge cut back by c along both edges, and the mitred inset point of the caps */
    var cut=[],ins=[],bis=[];
    for(i=0;i<n;i++){var p0=pts[(i+n-1)%n],p1=pts[i],p2=pts[(i+1)%n],u=dir(p0,p1),v=dir(p1,p2);
      cut.push([p1[0]-u[0]*c,p1[1]-u[1]*c],[p1[0]+v[0]*c,p1[1]+v[1]*c]);
      var bx=u[1]+v[1],by=-u[0]-v[0],l=Math.hypot(bx,by)||1;bx/=l;by/=l;           /* outward bisector */
      var k=c/Math.max(0.3,bx*u[1]-by*u[0]); ins.push([p1[0]-bx*k,p1[1]-by*k]); bis.push([bx,by])}
    var h=d/2,zf=zc+h,zb=zc-h,s=Math.SQRT1_2;
    function P(p,z){return [p[0],p[1],z]}
    function T(A,B,C,nx,ny,nz,e){o.p.push(A[0],A[1],A[2],B[0],B[1],B[2],C[0],C[1],C[2]);for(var q=0;q<3;q++){o.n.push(nx,ny,nz);o.e.push(e)}}
    function Q(A,B,C,D,nx,ny,nz,e){T(A,B,C,nx,ny,nz,e);T(A,C,D,nx,ny,nz,e)}
    var tri=ears(ins); for(i=0;i<tri.length;i+=3){var A=ins[tri[i]],B=ins[tri[i+1]],C=ins[tri[i+2]];
      T(P(A,zf),P(B,zf),P(C,zf),0,0,1,0); T(P(A,zb),P(C,zb),P(B,zb),0,0,-1,0)}                      /* caps */
    for(i=0;i<n;i++){var j=(i+1)%n,c0=cut[2*i],c1=cut[2*i+1],e0=cut[2*j],ia=ins[i],ib=ins[j],ud=dir(c1,e0),nx=ud[1],ny=-ud[0],bx=bis[i][0],by=bis[i][1];
      Q(P(c1,zb+c),P(e0,zb+c),P(e0,zf-c),P(c1,zf-c),nx,ny,0,0);                                      /* wall */
      Q(P(c1,zf-c),P(e0,zf-c),P(ib,zf),P(ia,zf),nx*s,ny*s,s,1);                                     /* front chamfer */
      Q(P(c1,zb+c),P(ia,zb),P(ib,zb),P(e0,zb+c),nx*s,ny*s,-s,1);                                    /* back chamfer */
      Q(P(c0,zb+c),P(c1,zb+c),P(c1,zf-c),P(c0,zf-c),bx,by,0,1);                                      /* vertical edge chamfer */
      T(P(c0,zf-c),P(c1,zf-c),P(ia,zf),bx*s,by*s,s,1); T(P(c0,zb+c),P(ia,zb),P(c1,zb+c),bx*s,by*s,-s,1)} /* corner facets */
  }
  /* the mark in a 32-unit box (y down) → model space x,y in [-1,1], 2 units tall */
  function M(x,y){return [(x-16)/13,(16-y)/13]}
  var geo={p:[],n:[],e:[]}, DEPTH=0.36, CH=0.04; /* depth 0.18 and chamfer 0.02 of the mark's height */
  build([M(3,29),M(16,3),M(29,29),M(25.4,29),M(16,10.2),M(6.6,29)],DEPTH,CH,0,geo);
  build([M(11,29),M(16,19),M(21,29)],DEPTH,CH,0.03,geo); /* the inner peak, a hair proud of the band */
  var NV=geo.p.length/3, FLOOR=-1-0.004;

  /* ---------- shaders ---------- */
  var PREC='#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  var objVS=[
    'attribute vec3 p;attribute vec3 n;attribute float e;',
    'uniform mat4 uM,uVP;uniform vec2 uOff;',
    'varying vec3 vP,vN;varying float vE;',
    'void main(){vec4 w=uM*vec4(p,1.);vP=w.xyz;vN=mat3(uM)*n;vE=e;',
    'gl_Position=uVP*w;gl_Position.xy+=uOff*gl_Position.w;}'].join('\n');
  var objFS=PREC+[
    'varying vec3 vP,vN;varying float vE;',
    'uniform vec3 uEye,uKey;uniform float uAmb,uFloor,uRefl,uFade,uMode;',
    'const vec3 BONE=vec3(.945,.925,.902);const vec3 WARM=vec3(1.,.23,.12);',
    'void main(){',
    ' if(uMode<.5&&vP.y<uFloor)discard; if(uMode>.5&&vP.y>uFloor)discard;',
    ' vec3 N=normalize(vN),V=normalize(uEye-vP),L=uKey;',
    ' float ndl=max(dot(N,L),0.),ndv=max(dot(N,V),0.);',
    ' vec3 H=normalize(L+V);float ndh=max(dot(N,H),0.);',
    ' vec3 base=vec3(.102,.094,.094)*(1.+.5*max(N.y,0.));',                    /* graphite, lighter on top faces */
    ' float fall=.58+.42*clamp(dot(vP,L)*.5+.5,0.,1.);',                       /* the key falls off away from the lamp: apex lit, base darker */
    ' vec3 col=base*uAmb*(.55+.45*(N.y*.5+.5));',                              /* ambient from a near-black room */
    ' col+=base*BONE*3.0*ndl*fall;',                                           /* key: Lambert */
    ' float F=.05+.95*pow(1.-ndv,5.);',                                        /* Schlick fresnel */
    ' vec3 R=reflect(-V,N);float box=smoothstep(.40,.985,dot(R,L));',          /* broad softbox reflection */
    ' col+=BONE*box*(.10+.9*F)*fall*(1.+.9*vE);',
    ' col+=BONE*pow(ndh,80.)*.45;',                                            /* the hot spot */
    ' col+=BONE*F*.22*vE;',                                                    /* chamfers catch the room */
    ' vec3 Lr=normalize(vec3(.8,-.5,.3));float rim=pow(1.-ndv,3.)*max(dot(N,Lr),0.);',
    ' col+=WARM*.2*rim*1.5;',                                                  /* warm rim, silhouette only */
    ' col=1.-exp(-col*1.25);',                                                 /* soft shoulder: highlights roll to bone, never clip */
    ' float a=1.;',
    ' if(uMode>.5){a=uRefl*pow(1.-clamp((uFloor-vP.y)/1.1,0.,1.),1.6);col*=.9;}',
    ' a*=uFade; gl_FragColor=vec4(col*a,a);}'].join('\n');
  var quadVS='attribute vec2 q;varying vec2 vQ;void main(){vQ=q;gl_Position=vec4(q,0.,1.);}';
  var vigFS=PREC+[
    'varying vec2 vQ;uniform vec2 uC,uAsp;uniform float uV;',
    'void main(){vec2 d=(vQ-uC)*uAsp;float v=smoothstep(.55,1.45,length(d))*uV;gl_FragColor=vec4(vec3(.043,.039,.039)*v,v);}'].join('\n');
  var floorVS=[
    'attribute vec2 q;uniform mat4 uM,uVP;uniform vec2 uOff;uniform float uY;varying vec2 vQ;',
    'void main(){vQ=q;vec4 w=uM*vec4(q.x,uY,q.y,1.);gl_Position=uVP*w;gl_Position.xy+=uOff*gl_Position.w;}'].join('\n');
  var floorFS=PREC+[
    'varying vec2 vQ;uniform float uFade;',
    'float box(vec2 p,vec2 b){vec2 q=abs(p)-b;return length(max(q,0.))+min(max(q.x,q.y),0.);}',
    'void main(){',
    ' float feet=(1.-smoothstep(0.,.42,box(vQ-vec2(-.86,0.),vec2(.14,.18))))',
    '           +(1.-smoothstep(0.,.42,box(vQ-vec2(.86,0.),vec2(.14,.18))))',
    '           +(1.-smoothstep(0.,.42,box(vQ-vec2(0.,.03),vec2(.385,.18))));',
    ' float soft=1.-smoothstep(0.,1.15,box(vQ,vec2(.9,.2)));',
    ' float thrown=1.-smoothstep(.1,1.,length((vQ-vec2(.45,-.35))/vec2(1.25,.8)));',  /* the key\'s thrown shadow, right and back */
    ' float a=clamp(min(feet,1.)*.55+soft*.32+thrown*.22,0.,.9)*uFade;',
    ' gl_FragColor=vec4(0.,0.,0.,a);}'].join('\n');
  var dustVS=[
    'attribute vec4 a;uniform mat4 uVP;uniform vec2 uOff;uniform vec3 uKey;uniform float uT,uDpr,uLit;varying float vB;',
    'void main(){float s=a.w;vec3 p=a.xyz;',
    ' p.x+=.14*sin(uT*.09+s*6.28)+.05*sin(uT*.21+s*12.);',
    ' p.z+=.12*cos(uT*.07+s*9.4);',
    ' float f=fract(uT*.012*(.6+s)+s*7.);p.y+=f*1.3-.6;',                      /* slow rise, wrapped and faded at the ends */
    ' float life=smoothstep(0.,.15,f)*(1.-smoothstep(.85,1.,f));',
    ' vec3 Lp=uKey*6.;vec3 d=normalize(p-Lp);float c=dot(d,-uKey);',
    ' float cone=smoothstep(.950,.984,c)*uLit;',                               /* inside the key light\'s cone */
    ' vB=(.03+.8*cone)*life;',
    ' vec4 cl=uVP*vec4(p,1.);cl.xy+=uOff*cl.w;gl_Position=cl;',
    ' gl_PointSize=uDpr*(.9+1.3*s)*(6.5/max(cl.w,1.));}'].join('\n');
  var dustFS='precision mediump float;varying float vB;uniform float uFade;void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d);if(r>.25)discard;float a=(1.-smoothstep(.04,.25,r))*vB*uFade;gl_FragColor=vec4(vec3(.945,.925,.902)*a,a);}';

  function sh(type,src){var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){logs.push(gl.getShaderInfoLog(s));console.error('hero shader',gl.getShaderInfoLog(s))}return s}
  function prog(vs,fs,attrs,unis){var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,vs));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)){logs.push(gl.getProgramInfoLog(p));console.error('hero program',gl.getProgramInfoLog(p))}
    var o={p:p,a:{},u:{}};attrs.forEach(function(n){o.a[n]=gl.getAttribLocation(p,n)});unis.forEach(function(n){o.u[n]=gl.getUniformLocation(p,n)});return o}
  var PO=prog(objVS,objFS,['p','n','e'],['uM','uVP','uOff','uEye','uKey','uAmb','uFloor','uRefl','uFade','uMode']);
  var PV=prog(quadVS,vigFS,['q'],['uC','uAsp','uV']);
  var PF=prog(floorVS,floorFS,['q'],['uM','uVP','uOff','uY','uFade']);
  var PD=prog(dustVS,dustFS,['a'],['uVP','uOff','uKey','uT','uDpr','uLit','uFade']);

  /* ---------- buffers ---------- */
  function buf(arr){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);return b}
  var bP=buf(geo.p),bN=buf(geo.n),bE=buf(geo.e);
  var bQ=buf([-1,-1,1,-1,1,1,-1,1]), bF=buf([-3.4,-2.6,3.4,-2.6,3.4,2.6,-3.4,2.6]);
  var ND=1500,dust=[],seed=7; function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}
  for(var i=0;i<ND;i++){dust.push((rnd()+rnd()-1)*2.4,-0.98+rnd()*2.9,(rnd()+rnd()-1)*1.8,rnd())} /* denser near the object */
  var bD=buf(dust);

  /* ---------- small matrix kit (column-major) ---------- */
  function mul(a,b){var o=new Float32Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++){var s=0;for(var k=0;k<4;k++)s+=a[k*4+j]*b[i*4+k];o[i*4+j]=s}return o}
  function persp(f,asp,n,fa){return new Float32Array([f/asp,0,0,0, 0,f,0,0, 0,0,(fa+n)/(n-fa),-1, 0,0,2*fa*n/(n-fa),0])}
  function rotY(a){var c=Math.cos(a),s=Math.sin(a);return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1])}
  function rotX(a){var c=Math.cos(a),s=Math.sin(a);return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1])}
  function trans(x,y,z){return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1])}
  var MIRROR=mul(trans(0,FLOOR,0),mul(new Float32Array([1,0,0,0, 0,-1,0,0, 0,0,1,0, 0,0,0,1]),trans(0,-FLOOR,0)));

  /* ---------- composition: where the object sits, in CSS pixels of the canvas ---------- */
  var FOV=1/Math.tan(0.21), EXT=1.34, narrow=false, room=true, rect={cx:0,cy:0,w:1,h:1}, h1=document.getElementById('h1');
  function size(){
    W=cv.clientWidth||1;H=cv.clientHeight||1;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);gl.viewport(0,0,cv.width,cv.height);
    narrow=innerWidth<=840; var g=parseFloat(getComputedStyle(hero).paddingLeft)||24;
    if(narrow){ /* the top band: under the 70px header, above the headline, inside the unmasked top 30% */
      var top=80, bot=Math.min(H*0.29,(h1?h1.offsetTop:H*0.3)-12); room=bot-top>=90;
      rect={cx:W/2,cy:(top+bot)/2,w:W-2*g,h:Math.max(1,bot-top)};
    }else{ /* the right 55%, the headline at bottom left */
      var x0=W*0.47, x1=W-g, y0=Math.max(H*0.10,80), y1=H*0.86; room=true; rect={cx:(x0+x1)/2,cy:(y0+y1)/2-H*0.025,w:x1-x0,h:y1-y0};
    }
  }

  /* ---------- state ---------- */
  var t0=0, tPrev=0, swept=false, sweep=1, px=0,py=0, tx=0,ty=0, yawIdle=0, scrollP=0, inView=true, raf=0, lost=false;
  var stats={frames:0,ms:0}, lastVP=null, lastOff=[0,0], lastM=null;
  var fine=matchMedia('(pointer:fine)').matches;
  function ease(x){return 1-Math.pow(1-x,3)}
  function keyDir(k){ /* the key light sweeps from behind the object to its resting angle (upper left, in front) */
    var az=(-165+125*k)*Math.PI/180, el=(8+34*k)*Math.PI/180, c=Math.cos(el);
    return [Math.sin(az)*c,Math.sin(el),Math.cos(az)*c]}

  function frame(now){
    if(lost)return; var on=motionOn(), dt=tPrev?Math.min(0.05,(now-tPrev)/1000):0.016; tPrev=now;
    if(!t0){t0=now; if(!on||navigator.webdriver){swept=true}}                 /* no sweep for automated or motion-off views */
    var t=(now-t0)/1000;
    if(!swept){sweep=Math.min(1,t/2.2);if(sweep>=1)swept=true}else sweep=1;
    if(on){var k=1-Math.exp(-dt*5);px+=(tx-px)*k;py+=(ty-py)*k;yawIdle=0.05*Math.sin(t*0.571)}  /* ≈0.03 rad/s peak */
    else{px=tx;py=ty;yawIdle=0}
    var hh=hero.offsetHeight||H; scrollP=Math.min(1,Math.max(0,scrollY/(hh*0.85)));
    var fade=1-Math.min(1,Math.max(0,(scrollP-0.5)/0.5)); fade=fade*fade;
    var sink=ease(scrollP)*2.4, pull=1+0.5*ease(scrollP);

    /* camera: fixed distance for the frame, pitch orbits with the pointer, the object yaws toward it */
    var yaw=0.30+yawIdle+px*0.21, elev=(12+py*8)*Math.PI/180, D=EXT*FOV*H/Math.min(rect.w,rect.h)*pull; /* cursor above: camera drops, the object looks up to it */
    var target=[0,-0.16,0];
    var view=mul(trans(0,0,-D),mul(rotX(elev),trans(-target[0],-target[1],-target[2])));
    var VP=mul(persp(FOV,W/H,0.5,60),view);
    var off=[2*rect.cx/W-1,1-2*rect.cy/H];
    var eye=[target[0],target[1]+D*Math.sin(elev),target[2]+D*Math.cos(elev)];
    var Mo=mul(trans(0,-sink,0),rotY(yaw)), Mf=rotY(yaw), Mr=mul(MIRROR,Mo);
    var key=keyDir(ease(sweep)), amb=0.9*Math.min(1,sweep*1.4);
    lastVP=VP;lastOff=off;lastM=Mo;

    gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0,0,0,0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    if(!room)return; /* a phone too short for a band above the headline keeps a typographic hero */
    /* 1. vignette: the room darkens away from the object */
    gl.disable(gl.DEPTH_TEST); gl.useProgram(PV.p);
    gl.bindBuffer(gl.ARRAY_BUFFER,bQ); gl.enableVertexAttribArray(PV.a.q); gl.vertexAttribPointer(PV.a.q,2,gl.FLOAT,false,0,0);
    gl.uniform2f(PV.u.uC,off[0],off[1]); gl.uniform2f(PV.u.uAsp,W>H?W/H:1,W>H?1:H/W); gl.uniform1f(PV.u.uV,0.5*Math.min(1,sweep*2));
    gl.drawArrays(gl.TRIANGLE_FAN,0,4);
    /* 2. the floor: a contact shadow, turning with the object */
    gl.useProgram(PF.p); gl.bindBuffer(gl.ARRAY_BUFFER,bF); gl.enableVertexAttribArray(PF.a.q); gl.vertexAttribPointer(PF.a.q,2,gl.FLOAT,false,0,0);
    gl.uniformMatrix4fv(PF.u.uM,false,Mf); gl.uniformMatrix4fv(PF.u.uVP,false,VP); gl.uniform2f(PF.u.uOff,off[0],off[1]);
    gl.uniform1f(PF.u.uY,FLOOR); gl.uniform1f(PF.u.uFade,fade*amb*Math.pow(1-ease(scrollP),1.5)); /* less object above the floor, less shadow */
    gl.drawArrays(gl.TRIANGLE_FAN,0,4);
    /* 3. the object twice: mirrored and faded below the floor, then itself */
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.useProgram(PO.p);
    gl.bindBuffer(gl.ARRAY_BUFFER,bP); gl.enableVertexAttribArray(PO.a.p); gl.vertexAttribPointer(PO.a.p,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,bN); gl.enableVertexAttribArray(PO.a.n); gl.vertexAttribPointer(PO.a.n,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,bE); gl.enableVertexAttribArray(PO.a.e); gl.vertexAttribPointer(PO.a.e,1,gl.FLOAT,false,0,0);
    gl.uniformMatrix4fv(PO.u.uVP,false,VP); gl.uniform2f(PO.u.uOff,off[0],off[1]); gl.uniform3f(PO.u.uEye,eye[0],eye[1],eye[2]);
    gl.uniform3f(PO.u.uKey,key[0],key[1],key[2]); gl.uniform1f(PO.u.uAmb,amb); gl.uniform1f(PO.u.uFloor,FLOOR); gl.uniform1f(PO.u.uFade,fade);
    gl.uniform1f(PO.u.uRefl,0.06+0.4*ease(scrollP)); gl.uniform1f(PO.u.uMode,1); gl.uniformMatrix4fv(PO.u.uM,false,Mr); gl.drawArrays(gl.TRIANGLES,0,NV);
    gl.uniform1f(PO.u.uMode,0); gl.uniformMatrix4fv(PO.u.uM,false,Mo); gl.drawArrays(gl.TRIANGLES,0,NV);
    /* 4. dust: drifting, brighter inside the key light's cone, hidden behind the object */
    gl.depthMask(false); gl.useProgram(PD.p); gl.bindBuffer(gl.ARRAY_BUFFER,bD); gl.enableVertexAttribArray(PD.a.a); gl.vertexAttribPointer(PD.a.a,4,gl.FLOAT,false,0,0);
    gl.uniformMatrix4fv(PD.u.uVP,false,VP); gl.uniform2f(PD.u.uOff,off[0],off[1]); gl.uniform3f(PD.u.uKey,key[0],key[1],key[2]);
    gl.uniform1f(PD.u.uT,on?t:0); gl.uniform1f(PD.u.uDpr,DPR); gl.uniform1f(PD.u.uLit,Math.min(1,sweep*1.5)); gl.uniform1f(PD.u.uFade,fade*Math.min(1,0.3+sweep));
    gl.drawArrays(gl.POINTS,0,ND); gl.depthMask(true);
  }
  function tick(now){var a=performance.now();frame(now);stats.ms+=performance.now()-a;stats.frames++}

  /* ---------- the loop runs only in view and only while motion is on; otherwise one settled frame ---------- */
  function loop(){cancelAnimationFrame(raf);if(!inView||lost)return;raf=requestAnimationFrame(function step(now){tick(now);if(inView&&motionOn()&&!lost)raf=requestAnimationFrame(step)})}
  function once(){cancelAnimationFrame(raf);if(!inView||lost)return;raf=requestAnimationFrame(tick)}
  new IntersectionObserver(function(en){inView=en[0].isIntersecting;loop()},{threshold:0}).observe(cv);
  addEventListener('ardholt:motion',function(){tPrev=0;loop()});
  addEventListener('resize',function(){size();if(motionOn())loop();else once()});
  addEventListener('scroll',function(){if(!motionOn())once()},{passive:true});
  if(fine){addEventListener('mousemove',function(e){tx=(e.clientX/innerWidth-0.5)*2;ty=(e.clientY/innerHeight-0.5)*2;if(!motionOn())once()},{passive:true});
    document.addEventListener('mouseleave',function(){tx=0;ty=0;if(!motionOn())once()})}
  cv.addEventListener('webglcontextlost',function(e){e.preventDefault();lost=true;cancelAnimationFrame(raf)});
  cv.addEventListener('webglcontextrestored',function(){location.reload()});

  /* ---------- verification hooks: object bounds in CSS px, frame cost, GL errors ---------- */
  window.ARDHOLT_HERO={
    bounds:function(){if(!lastVP||!room)return null;var o={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};
      [-1,1].forEach(function(x){[-1,1].forEach(function(y){[-0.18,0.24].forEach(function(z){
        var w=[0,0,0,0],v=[x,y,z,1],i;for(i=0;i<4;i++)w[i]=lastM[i]*v[0]+lastM[4+i]*v[1]+lastM[8+i]*v[2]+lastM[12+i];
        var c=[0,0,0,0];for(i=0;i<4;i++)c[i]=lastVP[i]*w[0]+lastVP[4+i]*w[1]+lastVP[8+i]*w[2]+lastVP[12+i]*w[3];
        var nx=c[0]/c[3]+lastOff[0],ny=c[1]/c[3]+lastOff[1],sx=(nx+1)/2*W,sy=(1-ny)/2*H;
        o.x0=Math.min(o.x0,sx);o.x1=Math.max(o.x1,sx);o.y0=Math.min(o.y0,sy);o.y1=Math.max(o.y1,sy)})})});return o},
    stats:function(){return {frames:stats.frames,avgMs:stats.frames?stats.ms/stats.frames:0}},
    errors:function(){return {gl:gl.getError(),logs:logs.slice(),lost:lost}},
    rect:function(){return rect}
  };
  size(); loop();
})();
