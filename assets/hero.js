/* Hero: the Summit mark cast as a solid, lit object, drawn by hand in raw WebGL.
   A graphite form with chamfered edges under a bone key light, a faint warm rim from below right, a soft contact
   shadow and a 6% reflection on an unseen floor, with fine dust catching the light. Owns <canvas id="truss">.
   Motion contract: everything autonomous obeys window.ARDHOLT.motionOn() and the 'ardholt:motion' event.
   Render styles: window.ARDHOLT_HERO_MATERIAL={style:'graphite'|'chrome'|'flake'|'dither'|'pixel'|'halftone'|'film'|'glass'|
   'wire'|'brushed'} before this file loads picks one of ten materials, each with the orange spot above and to the right
   of the mark. With no style the live graphite renders exactly as before. */
(function(){
  'use strict';
  var cv=document.getElementById('truss'); if(!cv) return;
  var gl=cv.getContext('webgl',{antialias:true,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance'});
  if(!gl) return;
  var hero=cv.parentNode, DPR=Math.min(2,window.devicePixelRatio||1), W=0, H=0, logs=[];
  /* material: base colour, lift of upward faces, specular power/intensity, softbox intensity, fresnel floor, metal tint, orange spot */
  var MAT=Object.assign({base:[.102,.094,.094],top:.5,specP:80,specI:.45,boxI:.9,f0:.05,metal:0,orange:0,keyI:3.0},window.ARDHOLT_HERO_MATERIAL||{});
  var STYLES={graphite:1,chrome:1,flake:1,dither:1,pixel:1,halftone:1,film:1,glass:1,wire:1,brushed:1};
  var STYLE=STYLES[MAT.style]?MAT.style:'';                                   /* '' = the live graphite, untouched */
  if(STYLE&&!(window.ARDHOLT_HERO_MATERIAL&&'orange' in window.ARDHOLT_HERO_MATERIAL))MAT.orange=1; /* a chosen style carries the spot */
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
    /* each vertex also carries a coordinate across its chamfer (0 at the wall side, 1 at the cap side; 0 on caps and walls) */
    function T(A,B,C,nx,ny,nz,e,ca,cb,cc){o.p.push(A[0],A[1],A[2],B[0],B[1],B[2],C[0],C[1],C[2]);for(var q=0;q<3;q++){o.n.push(nx,ny,nz);o.e.push(e)}o.c.push(ca||0,cb||0,cc||0)}
    function Q(A,B,C,D,nx,ny,nz,e,ca,cb,cc,cd){T(A,B,C,nx,ny,nz,e,ca,cb,cc);T(A,C,D,nx,ny,nz,e,ca,cc,cd)}
    var tri=ears(ins); for(i=0;i<tri.length;i+=3){var A=ins[tri[i]],B=ins[tri[i+1]],C=ins[tri[i+2]];
      T(P(A,zf),P(B,zf),P(C,zf),0,0,1,0); T(P(A,zb),P(C,zb),P(B,zb),0,0,-1,0)}                      /* caps */
    for(i=0;i<n;i++){var j=(i+1)%n,c0=cut[2*i],c1=cut[2*i+1],e0=cut[2*j],ia=ins[i],ib=ins[j],ud=dir(c1,e0),nx=ud[1],ny=-ud[0],bx=bis[i][0],by=bis[i][1];
      Q(P(c1,zb+c),P(e0,zb+c),P(e0,zf-c),P(c1,zf-c),nx,ny,0,0);                                      /* wall */
      Q(P(c1,zf-c),P(e0,zf-c),P(ib,zf),P(ia,zf),nx*s,ny*s,s,1,0,0,1,1);                             /* front chamfer */
      Q(P(c1,zb+c),P(ia,zb),P(ib,zb),P(e0,zb+c),nx*s,ny*s,-s,1,0,1,1,0);                            /* back chamfer */
      Q(P(c0,zb+c),P(c1,zb+c),P(c1,zf-c),P(c0,zf-c),bx,by,0,1,0,1,1,0);                              /* vertical edge chamfer */
      T(P(c0,zf-c),P(c1,zf-c),P(ia,zf),bx*s,by*s,s,1,0,1,.5); T(P(c0,zb+c),P(ia,zb),P(c1,zb+c),bx*s,by*s,-s,1,0,.5,1)} /* corner facets */
  }
  /* the mark in a 32-unit box (y down) → model space x,y in [-1,1], 2 units tall */
  function M(x,y){return [(x-16)/13,(16-y)/13]}
  var geo={p:[],n:[],e:[],c:[]}, DEPTH=0.36, CH=0.04; /* depth 0.18 and chamfer 0.02 of the mark's height */
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
    'uniform vec3 uEye,uKey,uBase;uniform float uAmb,uFloor,uRefl,uFade,uMode,uTop,uSpecP,uSpecI,uBoxI,uF0,uMetal,uOr,uKeyI;',
    'const vec3 BONE=vec3(.945,.925,.902);const vec3 WARM=vec3(1.,.23,.12);',
    'void main(){',
    ' if(uMode<.5&&vP.y<uFloor)discard; if(uMode>.5&&vP.y>uFloor)discard;',
    ' vec3 N=normalize(vN),V=normalize(uEye-vP),L=uKey;',
    ' float ndl=max(dot(N,L),0.),ndv=max(dot(N,V),0.);',
    ' vec3 H=normalize(L+V);float ndh=max(dot(N,H),0.);',
    ' vec3 base=uBase*(1.+uTop*max(N.y,0.));vec3 tint=mix(vec3(1.),base/max(max(base.r,base.g),max(base.b,.05)),uMetal);',                    /* graphite, lighter on top faces */
    ' float fall=.58+.42*clamp(dot(vP,L)*.5+.5,0.,1.);',                       /* the key falls off away from the lamp: apex lit, base darker */
    ' vec3 col=base*uAmb*(.55+.45*(N.y*.5+.5));',                              /* ambient from a near-black room */
    ' col+=base*BONE*uKeyI*ndl*fall;',                                           /* key: Lambert */
    ' float F=uF0+(1.-uF0)*pow(1.-ndv,5.);',                                        /* Schlick fresnel */
    ' vec3 R=reflect(-V,N);float box=smoothstep(.40,.985,dot(R,L));',          /* broad softbox reflection */
    ' col+=BONE*tint*box*uBoxI*(.10+.9*F)*fall*(1.+.9*vE);',
    ' col+=BONE*tint*pow(ndh,uSpecP)*uSpecI;',                                            /* the hot spot */
    ' col+=BONE*tint*F*.22*vE;',                                                    /* chamfers catch the room */
    ' vec3 Lr=normalize(vec3(.8,-.5,.3));float rim=pow(1.-ndv,3.)*max(dot(N,Lr),0.);',
    ' col+=WARM*.2*rim*1.5;',
    ' vec3 Lo=normalize(vec3(.55,.85,.25));float ndlo=max(dot(N,Lo),0.);vec3 Ho=normalize(Lo+V);',        /* the orange spot: above and to the right */
    ' col+=WARM*base*.55*ndlo*uOr;col+=WARM*tint*pow(max(dot(N,Ho),0.),uSpecP*.7)*1.3*uOr;col+=WARM*F*.16*uOr*(.5+1.2*vE);',                                                  /* warm rim, silhouette only */
    ' col=1.-exp(-col*1.25);',                                                 /* soft shoulder: highlights roll to bone, never clip */
    ' float a=1.;',
    ' if(uMode>.5){a=uRefl*pow(1.-clamp((uFloor-vP.y)/1.1,0.,1.),1.6);col*=.9;}',
    ' a*=uFade; gl_FragColor=vec4(col*a,a);}'].join('\n');

  /* ---------- the ten styles: one fragment shader each on the same geometry, sharing the lights, the orange spot and the finish ----------
     The orange spot LO sits above the mark, to the right and in front (+z is toward the camera), and falls off across the
     object toward the lower left, so it lands on the front faces, the upper chamfers and the right-hand faces while the
     key from the upper left keeps the left walls bone. */
  var DERIV=!!gl.getExtension('OES_standard_derivatives');
  var styVS=[
    'attribute vec3 p;attribute vec3 n;attribute float e;attribute float c;',
    'uniform mat4 uM,uVP;uniform vec2 uOff;',
    'varying vec3 vP,vN,vPm,vNm;varying float vE,vC;',
    'void main(){vec4 w=uM*vec4(p,1.);vP=w.xyz;vN=mat3(uM)*n;vPm=p;vNm=n;vE=e;vC=c;',
    'gl_Position=uVP*w;gl_Position.xy+=uOff*gl_Position.w;}'].join('\n');
  var HEAD=(DERIV?'#extension GL_OES_standard_derivatives : enable\n':'')+PREC+[
    'varying vec3 vP,vN,vPm,vNm;varying float vE,vC;',
    'uniform mat4 uM;uniform vec3 uEye,uKey,uBase;uniform vec2 uTexel,uBlur;uniform sampler2D uTex;',
    'uniform float uAmb,uFloor,uRefl,uFade,uMode,uTop,uSpecP,uSpecI,uBoxI,uF0,uMetal,uOr,uKeyI,uT,uDpr;',
    'const vec3 BONE=vec3(.945,.925,.902);const vec3 WARM=vec3(1.,.23,.12);',
    'const vec3 LO=vec3(.619,.579,.529);',
    DERIV?'#define AA(x) (fwidth(x)*1.2)':'#define AA(x) 0.2',
    'float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}',
    'float bayer(vec2 p){float v=0.,w=16.;for(int i=0;i<3;i++){vec2 b=mod(p,2.);v+=w*(2.*b.x+3.*b.y-4.*b.x*b.y);p=floor(p*.5);w*=.25;}return (v+.5)/64.;}',
    'float ward(vec3 T,vec3 B,vec3 N,vec3 H,float ax,float ay){float th=dot(H,T),bh=dot(H,B),nh=max(dot(N,H),.001);return exp(-(th*th/(ax*ax)+bh*bh/(ay*ay))/(nh*nh));}',
    'float refl(){return uRefl*pow(1.-clamp((uFloor-vP.y)/1.1,0.,1.),1.6);}',
    'void main(){',
    ' if(uMode<.5&&vP.y<uFloor)discard; if(uMode>.5&&vP.y>uFloor)discard;'].join('\n')+'\n';
  var LIT=[ /* the lights, given N: key terms as the graphite has them, plus the orange spot */
    ' vec3 V=normalize(uEye-vP),L=uKey;float ndl=max(dot(N,L),0.),ndv=max(dot(N,V),0.);vec3 H=normalize(L+V);float ndh=max(dot(N,H),0.);',
    ' float fall=.58+.42*clamp(dot(vP,L)*.5+.5,0.,1.);float F=uF0+(1.-uF0)*pow(1.-ndv,5.);vec3 R=reflect(-V,N);float box=smoothstep(.40,.985,dot(R,L));',
    ' float ndlo=max(dot(N,LO),0.);vec3 Ho=normalize(LO+V);float ndho=max(dot(N,Ho),0.);float ofall=smoothstep(-.8,1.,dot(vP,LO))*uOr;'].join('\n')+'\n';
  var GRA=[ /* the graphite shading, as the live shader has it */
    ' vec3 base=uBase*(1.+uTop*max(N.y,0.));vec3 tint=mix(vec3(1.),base/max(max(base.r,base.g),max(base.b,.05)),uMetal);',
    ' vec3 col=base*uAmb*(.55+.45*(N.y*.5+.5));col+=base*BONE*uKeyI*ndl*fall;',
    ' col+=BONE*tint*box*uBoxI*(.10+.9*F)*fall*(1.+.9*vE);col+=BONE*tint*pow(ndh,uSpecP)*uSpecI;col+=BONE*tint*F*.22*vE;',
    ' vec3 Lr=normalize(vec3(.8,-.5,.3));float rim=pow(1.-ndv,3.)*max(dot(N,Lr),0.);col+=WARM*.2*rim*1.5;'].join('\n')+'\n';
  /* the spot: a diffuse term, a specular highlight and an edge glint, each fading toward the lower left */
  var SPOT=' col+=WARM*base*ndlo*ofall*3.4;col+=WARM*tint*pow(ndho,uSpecP*.7)*1.4*ofall;col+=WARM*F*.3*ofall*(.4+1.3*vE)*(.3+.7*ndlo);\n';
  var FIN=' col=1.-exp(-col*1.25);float a=1.;if(uMode>.5){a=refl();col*=.9;}a*=uFade;gl_FragColor=vec4(col*a,a);}';
  var STY={
    /* S1 graphite matte: the live material with the corrected spot */
    graphite:HEAD+' vec3 N=normalize(vN);\n'+LIT+GRA+SPOT+FIN,
    /* S2 liquid chrome: a mirror reflecting a studio dome with a bone bar and an orange bar; the normal flows over time */
    chrome:HEAD+[
      ' vec3 N=normalize(vN+.09*vec3(sin(vP.y*3.1+uT*.7)+.6*sin(vP.x*4.3-uT*.5),sin(vP.x*2.7+uT*.6)+.6*sin(vP.y*5.2-uT*.45),sin((vP.x+vP.y)*2.3-uT*.4)));',
      LIT,
      ' vec3 base=vec3(.03,.029,.028);vec3 tint=vec3(.97,.95,.92);float up=R.y;',
      /* the studio: a dark room behind the object, a floor sweep brightening to a bone horizon line in front of it, a dark sky */
      ' float fl=smoothstep(-.7,-.04,up);vec3 env=mix(vec3(.012,.011,.011),vec3(.46,.44,.42),fl*fl);',
      ' env=mix(env,vec3(.03,.028,.027),smoothstep(0.,.12,up));env+=vec3(.9,.88,.85)*exp(-pow((up+.01)*16.,2.));',
      ' env*=.25+.75*smoothstep(-.6,.5,R.z);',
      ' vec3 Bk=vec3(-.55,-.12,-.83);vec3 kx=normalize(cross(Bk,vec3(0.,1.,0.)));vec3 kd=R-Bk*dot(R,Bk);',
      ' float kb=exp(-(pow(dot(kd,kx)/.75,2.)+pow(dot(kd,cross(Bk,kx))/.26,2.)))*step(0.,dot(R,Bk));',     /* the bone bar the left walls see */
      ' vec3 Bc=vec3(-.25,.55,.8);kd=R-Bc*dot(R,Bc);kx=normalize(cross(Bc,vec3(0.,1.,0.)));',
      ' kb+=.8*exp(-(pow(dot(kd,kx)/.8,2.)+pow(dot(kd,cross(Bc,kx))/.2,2.)))*step(0.,dot(R,Bc));',         /* and the one the top chamfers see */
      ' vec3 Bo=vec3(.7,-.08,.71);vec3 ox=normalize(cross(Bo,vec3(0.,1.,0.)));vec3 od=R-Bo*dot(R,Bo);float of2=ofall*ofall;',
      ' float ob=exp(-(pow(dot(od,ox)/.5,2.)+pow(dot(od,cross(Bo,ox))/.13,2.)))*step(0.,dot(R,Bo));',      /* the orange bar: to the right, a hair above where the front faces look, so the flow carries it across them */
      ' env+=BONE*1.6*kb;env+=WARM*2.2*ob*of2;',
      ' float Fm=.86+.14*pow(1.-ndv,5.);vec3 col=env*tint*Fm*(1.+.25*vE);',
      ' col+=BONE*tint*pow(ndh,420.)*1.8;col+=BONE*tint*F*.35*vE;',
      ' col+=WARM*tint*pow(ndho,320.)*1.5*ofall;col+=WARM*.22*ndlo*of2;col+=WARM*F*.3*of2*(.4+1.3*vE);',
      FIN].join('\n'),
    /* S3 metallic flake: a deep warm black under a clear coat, with view-dependent flakes that glint in both lights */
    flake:HEAD+[
      ' vec3 N=normalize(vN);',LIT,
      ' vec3 base=vec3(.05,.04,.036)*(1.+.4*max(N.y,0.));vec3 tint=vec3(1.);',
      ' vec3 col=base*uAmb*(.55+.45*(N.y*.5+.5))+base*BONE*2.4*ndl*fall;',
      ' vec3 cell=floor(vPm*110.+.5);float on=step(.5,hash(cell+1.7));',
      ' vec3 Nf=normalize(N+(vec3(hash(cell),hash(cell+7.1),hash(cell+13.7))-.5)*1.1);',                   /* each flake leans its own way */
      ' float gk=pow(max(dot(Nf,H),0.),64.)*on;float go=pow(max(dot(Nf,Ho),0.),64.)*on;',
      ' col+=BONE*gk*1.6*(.25+ndl)*fall;col+=WARM*go*2.6*ofall;',
      ' float Fc=.04+.96*pow(1.-ndv,5.);',                                                                   /* the clear coat */
      ' col+=BONE*box*uBoxI*.8*(.08+.92*Fc)*fall*(1.+.9*vE);col+=BONE*pow(ndh,260.)*1.2;col+=BONE*Fc*.3*vE;',
      ' col+=WARM*base*ndlo*ofall*6.;col+=WARM*pow(ndho,200.)*1.3*ofall;col+=WARM*Fc*.3*ofall*(.4+1.3*vE)*(.3+.7*ndlo);',
      FIN].join('\n'),
    /* S4 dither veil: the graphite shading quantised to near-black, bone and orange through an 8x8 Bayer matrix, 2 device pixels a cell */
    dither:HEAD+[
      ' vec3 N=normalize(vN);',LIT,GRA,SPOT,
      ' col=1.-exp(-col*1.25);float a0=1.;if(uMode>.5){a0=refl();col*=.9;}',
      ' float lum=clamp(dot(col,vec3(.3,.59,.11))*1.35,0.,1.)*a0;float oc=clamp((col.r-max(col.g,col.b))*1.8,0.,1.)*a0;',
      ' float th=bayer(mod(floor(gl_FragCoord.xy*.5),8.));',
      ' vec3 q=vec3(0.);float qa=0.;if(lum>th){q=BONE;qa=1.;}if(oc>th){q=WARM;qa=1.;}',
      ' float fa=qa*uFade;gl_FragColor=vec4(q*fa,fa);}'].join('\n'),
    /* S6 halftone: a 45° bone dot screen and a 60° orange one, dot size by luminance; the chamfers keep a solid hairline */
    halftone:HEAD+[
      ' vec3 N=normalize(vN);',LIT,GRA,SPOT,
      ' col=1.-exp(-col*1.25);float a0=1.;if(uMode>.5){a0=refl();col*=.9;}',
      ' float lum=clamp(dot(col,vec3(.3,.59,.11))*1.3,0.,1.)*a0;float oc=clamp((col.r-max(col.g,col.b))*1.7,0.,1.)*a0;',
      ' vec2 sp=gl_FragCoord.xy/uDpr;float cs=5.5;',
      ' vec2 g1=fract(mat2(.7071,.7071,-.7071,.7071)*sp/cs)-.5;float d1=length(g1)*2.;',
      ' vec2 g2=fract(mat2(.5,.866,-.866,.5)*sp/cs)-.5;float d2=length(g2)*2.;',
      ' float r1=sqrt(lum)*1.08,r2=sqrt(oc)*1.0,w=AA(d1);',
      ' float k1=1.-smoothstep(r1-w,r1+w,d1),k2=1.-smoothstep(r2-w,r2+w,d2);',
      ' vec3 q=BONE*k1;float qa=k1;q=mix(q,WARM,k2);qa=max(qa,k2);',
      ' float ln=(1.-smoothstep(0.,AA(vC)*1.5,abs(vC-.5)))*vE;vec3 lc=mix(BONE,WARM,clamp(oc*2.,0.,1.))*(.5+.5*lum/max(a0,.001));',
      ' q=mix(q,lc,ln);qa=max(qa,ln*(.55+.45*lum/max(a0,.001)));',
      ' float fa=qa*uFade;gl_FragColor=vec4(q*fa,fa);}'].join('\n'),
    /* S7 thin film: an interference tint, bone through pale blue to orange, keyed on view angle and normal */
    film:HEAD+[
      ' vec3 N=normalize(vN);',LIT,
      ' vec3 base=vec3(.12,.115,.11)*(1.+.35*max(N.y,0.));vec3 tint=vec3(1.);',
      ' float ph=ndv*4.+vPm.y*1.2+vPm.x*.7+N.y*1.5;float s=abs(fract(ph*.5)*2.-1.);',                     /* the film's thickness, as the eye reads it */
      ' vec3 film=mix(BONE,vec3(.55,.70,.95),smoothstep(.15,.85,s));film=mix(film,vec3(1.,.62,.4),pow(1.-ndv,3.)*.6);',
      ' vec3 col=base*uAmb*(.55+.45*(N.y*.5+.5));col+=base*film*3.2*ndl*fall;',
      ' col+=film*box*uBoxI*1.1*(.1+.9*F)*fall*(1.+.9*vE);col+=film*pow(ndh,uSpecP)*uSpecI*1.8;col+=film*F*.7*(.5+vE);',
      ' col+=WARM*(base*3.4+.08)*ndlo*ofall;col+=WARM*pow(ndho,uSpecP*.7)*1.5*ofall;col+=WARM*F*.3*ofall*(.4+1.3*vE)*(.3+.7*ndlo);',
      FIN].join('\n'),
    /* S8 frosted glass, front faces: the blurred back-face pass shows through under fresnel and the lights */
    glass:HEAD+[
      ' vec3 N=normalize(vN);',LIT,
      ' vec2 uv=gl_FragCoord.xy*uTexel;vec3 tr=vec3(0.);',
      ' for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)tr+=texture2D(uTex,uv+vec2(float(i),float(j))*uBlur).rgb;tr/=9.;',
      ' float Fg=.04+.96*pow(1.-ndv,5.);',
      ' vec3 milk=BONE*(.05+.11*ndl*fall+.03*(N.y*.5+.5));',                                              /* the frost scatters the key */
      ' vec3 col=milk+tr*1.1*(1.-Fg)*vec3(.96,.98,1.);',
      ' col+=BONE*box*uBoxI*.6*(.08+.92*Fg)*fall*(1.+.9*vE);col+=BONE*pow(ndh,uSpecP*1.5)*uSpecI*2.;col+=BONE*Fg*.6*(.3+vE);',
      ' col+=WARM*ndlo*ofall*.8;col+=WARM*pow(ndho,200.)*1.4*ofall;col+=WARM*Fg*.35*ofall*(.4+1.3*vE);',
      ' float a=min(1.,.48+.5*Fg+.15*ndl*fall+.3*vE);',
      ' col=1.-exp(-col*1.25);if(uMode>.5){a*=refl();col*=.9;}a*=uFade;gl_FragColor=vec4(col*a,a);}'].join('\n'),
    /* S9 wire and glow: a glowing hairline on every chamfer, orange where the spot hits, over a 4% ghost with drifting scanlines */
    wire:HEAD+[
      ' vec3 N=normalize(vN);',LIT,
      ' float ln=1.-smoothstep(0.,AA(vC)*1.6,abs(vC-.5));float halo=pow(max(1.-abs(vC-.5)*2.,0.),2.5)*.7;',
      ' vec3 ec=mix(BONE,WARM,clamp(ndlo*ofall*2.2,0.,1.));float lit=.5+.5*clamp(ndl*fall*1.4+.35*box+.4*F,0.,1.);',
      ' float y=gl_FragCoord.y/uDpr;float scan=smoothstep(.75,1.,sin(y*.9-uT*14.))*.5+smoothstep(.9,1.,sin(y*.11+uT*2.))*.6;',
      ' float pool=ndlo*ofall;float ghost=.04*(1.+.6*(N.y*.5+.5))+.05*scan+.45*pool;vec3 gcol=mix(BONE,WARM*1.6,clamp(pool*2.,0.,1.));', /* the spot pools on the faces it hits */
      ' vec3 col=mix(gcol+BONE*pow(1.-ndv,4.)*.6,ec*(.6+ln+halo)*lit,vE);',                                  /* alpha carries the fill; colour stays full */
      ' float a=mix(min(1.,ghost+pow(1.-ndv,4.)*.15),min(1.,ln+halo*.8),vE);',
      ' col=1.-exp(-col*1.25);if(uMode>.5){a*=refl()*1.5;col*=.9;}a*=uFade;gl_FragColor=vec4(col*a,a);}'].join('\n'),
    /* S10 brushed metal: a dark steel with a Ward lobe stretched along each face's brush direction and fine brush-line noise */
    brushed:HEAD+[
      ' vec3 N=normalize(vN);',LIT,
      ' vec3 Nm=normalize(vNm);vec3 Tm=cross(Nm,vec3(0.,0.,1.));Tm=mix(cross(Nm,vec3(0.,1.,0.)),Tm,step(.2,length(Tm)));Tm=normalize(Tm);vec3 Bm=cross(Nm,Tm);',
      ' float u=dot(vPm,Bm),v=dot(vPm,Tm);float g=.7*hash(vec3(floor(u*300.),floor(v*.8),0.))+.3*hash(vec3(floor(u*95.),floor(v*.4),1.));', /* the brush lines */
      ' vec3 T=normalize(mat3(uM)*normalize(Tm+Bm*(g-.5)*.08)),B=normalize(cross(N,T));',
      ' vec3 base=vec3(.085,.09,.10)*(1.+.25*max(N.y,0.))*(.88+.24*g);vec3 tint=vec3(.86,.89,.95);',
      ' vec3 col=base*uAmb*(.55+.45*(N.y*.5+.5));col+=base*BONE*2.4*ndl*fall;',
      ' col+=BONE*tint*ward(T,B,N,H,1.2,.75)*ndl*.9*fall*(.45+1.1*g);',                                     /* the key sheen, broken into brush streaks */
      ' col+=BONE*tint*box*uBoxI*.5*(.1+.9*F)*fall*(1.+.9*vE)*(.7+.6*g);col+=BONE*tint*F*.22*vE;',
      ' float of2=ofall*ofall;col+=WARM*base*ndlo*of2*2.2;col+=WARM*tint*ward(T,B,N,Ho,1.2,.7)*ndlo*1.1*of2*(.45+1.1*g);col+=WARM*F*.25*ofall*(.4+1.3*vE)*(.3+.7*ndlo);',
      FIN].join('\n')};
  STY.pixel=STY.graphite; /* S5 renders the graphite into a low-resolution target; the JS below does the rest */
  /* S8, back faces: the body as seen from inside, warm near the spot, brighter at its edges; blurred when sampled */
  var backFS=HEAD+[
    ' vec3 N=normalize(vN);vec3 V=normalize(uEye-vP);float e=pow(1.-abs(dot(N,V)),1.5);float ofall=smoothstep(-.8,1.,dot(vP,LO))*uOr;',
    ' vec3 col=BONE*(.07+.5*e+.55*vE)+WARM*ofall*(.25+.55*e+.5*vE);col*=uFade;gl_FragColor=vec4(col,uFade);}'].join('\n');
  var quadVS='attribute vec2 q;varying vec2 vQ;void main(){vQ=q;gl_Position=vec4(q,0.,1.);}';
  var vigFS=PREC+[
    'varying vec2 vQ;uniform vec2 uC,uAsp;uniform float uV;',
    'void main(){vec2 d=(vQ-uC)*uAsp;float v=smoothstep(.55,1.45,length(d))*uV;gl_FragColor=vec4(vec3(.043,.039,.039)*v,v);}'].join('\n');
  var blitFS=PREC+'varying vec2 vQ;uniform sampler2D uTex;void main(){gl_FragColor=texture2D(uTex,vQ*.5+.5);}';
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
  var OBJU=['uM','uVP','uOff','uEye','uKey','uAmb','uFloor','uRefl','uFade','uMode','uBase','uTop','uSpecP','uSpecI','uBoxI','uF0','uMetal','uOr','uKeyI','uT','uDpr','uTexel','uBlur','uTex'];
  var PO=STYLE?prog(styVS,STY[STYLE],['p','n','e','c'],OBJU):prog(objVS,objFS,['p','n','e'],OBJU);
  var PB=STYLE==='glass'?prog(styVS,backFS,['p','n','e','c'],OBJU):null;
  var PX=STYLE==='pixel'?prog(quadVS,blitFS,['q'],['uTex']):null;
  var PV=prog(quadVS,vigFS,['q'],['uC','uAsp','uV']);
  var PF=prog(floorVS,floorFS,['q'],['uM','uVP','uOff','uY','uFade']);
  var PD=prog(dustVS,dustFS,['a'],['uVP','uOff','uKey','uT','uDpr','uLit','uFade']);

  /* ---------- buffers ---------- */
  function buf(arr){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);return b}
  var bP=buf(geo.p),bN=buf(geo.n),bE=buf(geo.e),bC=buf(geo.c);
  var bQ=buf([-1,-1,1,-1,1,1,-1,1]), bF=buf([-3.4,-2.6,3.4,-2.6,3.4,2.6,-3.4,2.6]);
  var ND=1500,dust=[],seed=7; function rnd(){seed=(seed*16807)%2147483647;return seed/2147483647}
  for(var i=0;i<ND;i++){dust.push((rnd()+rnd()-1)*2.4,-0.98+rnd()*2.9,(rnd()+rnd()-1)*1.8,rnd())} /* denser near the object */
  var bD=buf(dust);

  /* ---------- render targets: a 1/6-resolution frame for pixel, a 1/3-resolution back-face pass for glass ---------- */
  var RT=null, RTDIV=STYLE==='pixel'?6:STYLE==='glass'?3:0;
  function sizeRT(){ if(!RTDIV)return; var w=Math.max(1,Math.ceil(cv.width/RTDIV)),h=Math.max(1,Math.ceil(cv.height/RTDIV)),f=STYLE==='pixel'?gl.NEAREST:gl.LINEAR;
    if(RT){gl.deleteFramebuffer(RT.fb);gl.deleteTexture(RT.tex);gl.deleteRenderbuffer(RT.rb)}
    var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,f);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,f);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    var rb=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,rb);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);
    var fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindTexture(gl.TEXTURE_2D,null);RT={fb:fb,tex:tex,rb:rb,w:w,h:h}}

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
    W=cv.clientWidth||1;H=cv.clientHeight||1;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);gl.viewport(0,0,cv.width,cv.height);sizeRT();
    narrow=innerWidth<=840; var g=parseFloat(getComputedStyle(hero).paddingLeft)||24;
    if(narrow){ /* the top band: under the 70px header, above the headline, inside the unmasked top 30% */
      room=H>=60; rect={cx:W/2,cy:H*0.47,w:W-2*g,h:H*0.78}; /* the canvas is the band itself (site.css) */
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
    var fade=narrow?1-Math.min(1,Math.max(0,(scrollP-0.12)/0.4)):1-Math.min(1,Math.max(0,(scrollP-0.5)/0.5)); fade=fade*fade;
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
    var lowres=STYLE==='pixel'&&RT;
    if(lowres){ /* S5: the floor, the reflection and the object go into the small frame */
      gl.bindFramebuffer(gl.FRAMEBUFFER,RT.fb); gl.viewport(0,0,RT.w,RT.h); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)}
    /* 2. the floor: a contact shadow, turning with the object */
    gl.useProgram(PF.p); gl.bindBuffer(gl.ARRAY_BUFFER,bF); gl.enableVertexAttribArray(PF.a.q); gl.vertexAttribPointer(PF.a.q,2,gl.FLOAT,false,0,0);
    gl.uniformMatrix4fv(PF.u.uM,false,Mf); gl.uniformMatrix4fv(PF.u.uVP,false,VP); gl.uniform2f(PF.u.uOff,off[0],off[1]);
    gl.uniform1f(PF.u.uY,FLOOR); gl.uniform1f(PF.u.uFade,fade*amb*Math.pow(1-ease(scrollP),1.5)*(STYLE==='wire'?0.35:STYLE==='glass'?0.7:1)); /* less object above the floor, less shadow */
    gl.drawArrays(gl.TRIANGLE_FAN,0,4);
    /* 3. the object twice: mirrored and faded below the floor, then itself */
    function bindObj(P){gl.useProgram(P.p);
      gl.bindBuffer(gl.ARRAY_BUFFER,bP); gl.enableVertexAttribArray(P.a.p); gl.vertexAttribPointer(P.a.p,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,bN); gl.enableVertexAttribArray(P.a.n); gl.vertexAttribPointer(P.a.n,3,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,bE); gl.enableVertexAttribArray(P.a.e); gl.vertexAttribPointer(P.a.e,1,gl.FLOAT,false,0,0);
      if(P.a.c>=0){gl.bindBuffer(gl.ARRAY_BUFFER,bC); gl.enableVertexAttribArray(P.a.c); gl.vertexAttribPointer(P.a.c,1,gl.FLOAT,false,0,0)}
      gl.uniformMatrix4fv(P.u.uVP,false,VP); gl.uniform2f(P.u.uOff,off[0],off[1]); gl.uniform3f(P.u.uEye,eye[0],eye[1],eye[2]);
      gl.uniform3f(P.u.uKey,key[0],key[1],key[2]); gl.uniform1f(P.u.uAmb,amb); gl.uniform1f(P.u.uFloor,FLOOR); gl.uniform1f(P.u.uFade,fade);
      gl.uniform3f(P.u.uBase,MAT.base[0],MAT.base[1],MAT.base[2]); gl.uniform1f(P.u.uTop,MAT.top); gl.uniform1f(P.u.uSpecP,MAT.specP); gl.uniform1f(P.u.uSpecI,MAT.specI); gl.uniform1f(P.u.uBoxI,MAT.boxI); gl.uniform1f(P.u.uF0,MAT.f0); gl.uniform1f(P.u.uMetal,MAT.metal); gl.uniform1f(P.u.uOr,MAT.orange); gl.uniform1f(P.u.uKeyI,MAT.keyI);
      gl.uniform1f(P.u.uT,on?t:0); gl.uniform1f(P.u.uDpr,DPR); gl.uniform2f(P.u.uTexel,1/cv.width,1/cv.height);
      if(RT){gl.uniform2f(P.u.uBlur,1.6/RT.w,1.6/RT.h)} gl.uniform1i(P.u.uTex,0);
      gl.uniform1f(P.u.uRefl,0.06+0.4*ease(scrollP))}
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
    if(STYLE==='glass'&&RT){ /* S8: the back faces first, into the small frame; the mirror image flips which faces are 'back' */
      gl.bindFramebuffer(gl.FRAMEBUFFER,RT.fb); gl.viewport(0,0,RT.w,RT.h); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      bindObj(PB); gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK); gl.uniform1f(PB.u.uMode,1); gl.uniformMatrix4fv(PB.u.uM,false,Mr); gl.drawArrays(gl.TRIANGLES,0,NV);
      gl.cullFace(gl.FRONT); gl.uniform1f(PB.u.uMode,0); gl.uniformMatrix4fv(PB.u.uM,false,Mo); gl.drawArrays(gl.TRIANGLES,0,NV);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,cv.width,cv.height); gl.bindTexture(gl.TEXTURE_2D,RT.tex)}
    bindObj(PO);
    if(STYLE==='glass'||STYLE==='wire'){gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT)} /* only the faces that face the viewer; the mirror image is culled the other way */
    if(STYLE==='wire')gl.depthMask(false); /* a hologram hides nothing behind it */
    gl.uniform1f(PO.u.uMode,1); gl.uniformMatrix4fv(PO.u.uM,false,Mr); gl.drawArrays(gl.TRIANGLES,0,NV);
    if(STYLE==='glass'||STYLE==='wire')gl.cullFace(gl.BACK);
    gl.uniform1f(PO.u.uMode,0); gl.uniformMatrix4fv(PO.u.uM,false,Mo); gl.drawArrays(gl.TRIANGLES,0,NV);
    gl.disable(gl.CULL_FACE); gl.depthMask(true); gl.bindTexture(gl.TEXTURE_2D,null);
    if(lowres){ /* S5: the small frame, scaled up block for block, then the object's depth at full size so the dust still hides behind it */
      gl.bindFramebuffer(gl.FRAMEBUFFER,null); gl.viewport(0,0,cv.width,cv.height); gl.disable(gl.DEPTH_TEST);
      gl.useProgram(PX.p); gl.bindBuffer(gl.ARRAY_BUFFER,bQ); gl.enableVertexAttribArray(PX.a.q); gl.vertexAttribPointer(PX.a.q,2,gl.FLOAT,false,0,0);
      gl.bindTexture(gl.TEXTURE_2D,RT.tex); gl.uniform1i(PX.u.uTex,0); gl.drawArrays(gl.TRIANGLE_FAN,0,4); gl.bindTexture(gl.TEXTURE_2D,null);
      gl.enable(gl.DEPTH_TEST); gl.colorMask(false,false,false,false); bindObj(PO); gl.uniform1f(PO.u.uMode,0); gl.uniformMatrix4fv(PO.u.uM,false,Mo); gl.drawArrays(gl.TRIANGLES,0,NV); gl.colorMask(true,true,true,true)}
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

  /* ---------- verification hooks: object bounds in CSS px, frame cost, GL errors, the style in use ---------- */
  window.ARDHOLT_HERO={
    bounds:function(){if(!lastVP||!room)return null;var o={x0:1e9,y0:1e9,x1:-1e9,y1:-1e9};
      [-1,1].forEach(function(x){[-1,1].forEach(function(y){[-0.18,0.24].forEach(function(z){
        var w=[0,0,0,0],v=[x,y,z,1],i;for(i=0;i<4;i++)w[i]=lastM[i]*v[0]+lastM[4+i]*v[1]+lastM[8+i]*v[2]+lastM[12+i];
        var c=[0,0,0,0];for(i=0;i<4;i++)c[i]=lastVP[i]*w[0]+lastVP[4+i]*w[1]+lastVP[8+i]*w[2]+lastVP[12+i]*w[3];
        var nx=c[0]/c[3]+lastOff[0],ny=c[1]/c[3]+lastOff[1],sx=(nx+1)/2*W,sy=(1-ny)/2*H;
        o.x0=Math.min(o.x0,sx);o.x1=Math.max(o.x1,sx);o.y0=Math.min(o.y0,sy);o.y1=Math.max(o.y1,sy)})})});return o},
    stats:function(){return {frames:stats.frames,avgMs:stats.frames?stats.ms/stats.frames:0}},
    errors:function(){return {gl:gl.getError(),logs:logs.slice(),lost:lost}},
    rect:function(){return rect},
    style:function(){return STYLE||'default'}
  };
  size(); loop();
})();
