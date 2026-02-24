/**
 * Fire shaders for Luffy — V4
 * Back to basics: beautiful organic fire, no forced humanoid shape
 * Humanoid form will come from 3D mesh later, not shader hacks
 */

export const fireVertexShader = /* glsl */`
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const fireFragmentShader = /* glsl */`
uniform float uTime;
uniform float uScale;
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform float uFlickerSpeed;
uniform float uFlickerIntensity;
uniform float uPulseSpeed;
uniform float uAudioLevel;
uniform float uHumanoid;
uniform float uGlowRadius;

varying vec2 vUv;

// --- Noise (compact) ---
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g,l.zxy);
  vec3 i2=max(g,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.,i1.z,i2.z,1.))
    +i.y+vec4(0.,i1.y,i2.y,1.))
    +i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

// 7-octave FBM for rich detail
float fbm7(vec3 p){
  float v=0.,a=.5,f=1.;
  for(int i=0;i<7;i++){v+=a*snoise(p*f);f*=2.02;a*=.49;}
  return v;
}

// Turbulence for wispy edges
float turb(vec3 p){
  float v=0.,a=.5,f=1.;
  for(int i=0;i<5;i++){v+=a*abs(snoise(p*f));f*=2.3;a*=.45;}
  return v;
}

void main(){
  vec2 uv=vUv;
  float t=uTime*uFlickerSpeed;
  
  // Centered coords
  float cx=uv.x-.5;  // -0.5 to 0.5
  float cy=uv.y;      // 0 to 1
  
  // === FLAME SHAPE ===
  // Classic teardrop: wide at bottom, narrow at top with smooth taper
  float width=mix(.42,.05,pow(cy,1.3));
  // Sphere mode for tired (uHumanoid=0): circular
  float sphereR=.2;
  float sphereDist=length(vec2(cx,cy-.35));
  float sphereMask=smoothstep(sphereR+.08,sphereR*.3,sphereDist);
  // Flame mask
  float flameMask=smoothstep(width+.05,width*.25,abs(cx));
  flameMask*=smoothstep(0.,.08,cy)*smoothstep(1.,.78,cy);
  // Blend
  flameMask=mix(sphereMask,flameMask,uHumanoid);
  
  // === NOISE LAYERS ===
  // Layer 1: large billowing movement
  vec3 n1p=vec3(cx*3.5,cy*4.-t*1.5,t*.2);
  float n1=fbm7(n1p);
  
  // Layer 2: medium swirl (offset seed)
  vec3 n2p=vec3(cx*6.+3.,cy*6.-t*2.2,t*.35+5.);
  float n2=fbm7(n2p);
  
  // Layer 3: fine wispy detail
  vec3 n3p=vec3(cx*12.+7.,cy*10.-t*3.,t*.5+11.);
  float n3=turb(n3p);
  
  // Layer 4: ultra-fine grain
  vec3 n4p=vec3(cx*22.+13.,cy*18.-t*4.,t*.7+17.);
  float n4=snoise(n4p)*.5+.5;
  
  // === COMBINE ===
  float flame=flameMask;
  
  // Noise displacement: stronger at top (fire licks), weaker at base (stable)
  float noiseStrength=uFlickerIntensity*(.3+cy*.9);
  flame+=n1*noiseStrength*.7;
  flame+=n2*noiseStrength*.3;
  // Fine detail adds texture
  flame+=n3*.06*flameMask;
  
  // Very soft threshold for organic edges
  flame=smoothstep(.02,.5,flame);
  
  // Audio
  flame*=1.+uAudioLevel*.35;
  
  // Pulse
  if(uPulseSpeed>0.)flame*=1.+sin(uTime*uPulseSpeed*6.28)*.12;
  
  // === COLOR ===
  // Core mask: hottest at center-bottom
  float coreDist=length(vec2(cx*2.5,cy-.3));
  float core=exp(-coreDist*coreDist*4.)*flame;
  
  vec3 col=uColor;
  
  // Hot yellow-white center
  col=mix(col,vec3(1.,.92,.65),core*.6);
  // Core color (blue for thinking, subtle for idle)
  col=mix(col,uCoreColor,core*.55);
  
  // Outer edges: darker red
  float edge=1.-smoothstep(.15,.55,flame);
  col=mix(col,uColor*vec3(.55,.2,.08),edge*.5);
  
  // Subtle grain variation
  col+=vec3(.04,.015,0.)*n4*flame;
  
  // Fire tips: bright flicker
  float tips=smoothstep(.65,.85,cy)*flame;
  col+=vec3(.12,.04,0.)*tips*n2;
  
  // === GLOW ===
  float gd=length(vec2(cx,cy-.38));
  float glow=exp(-gd*gd/(uGlowRadius*uGlowRadius+.001))*.1;
  
  // === ALPHA ===
  float alpha=flame*smoothstep(0.,.05,flame);
  alpha=clamp(alpha,0.,1.);
  alpha=max(alpha,glow*.35);
  
  // Glow color
  vec3 glowCol=mix(uColor*.35,col,step(.01,flame));
  col=mix(glowCol,col,step(.01,flame));
  
  gl_FragColor=vec4(col,alpha);
}
`;
