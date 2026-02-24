/**
 * Fire shaders V5 — 3D mesh fire material
 * Applied to humanoid mesh: vertex displacement along normals + volumetric fire coloring
 * Key insight: the mesh gives us shape, the shader gives us fire
 */

export const fireVertexShader = /* glsl */`
uniform float uTime;
uniform float uDisplaceStrength;
uniform float uScale;
uniform float uFlickerSpeed;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;
varying float vDisplacement;
varying float vHeight;

// Simplex noise (compact)
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

float fbm(vec3 p, int octaves){
  float v=0.,a=.5,f=1.;
  for(int i=0;i<7;i++){
    if(i>=octaves) break;
    v+=a*snoise(p*f);
    f*=2.03;
    a*=.48;
  }
  return v;
}

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // World position for noise sampling
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vHeight = worldPos.y;
  
  // Fire displacement: rises upward, stronger at top and edges
  float t = uTime * uFlickerSpeed;
  
  // Multiple noise layers for organic displacement
  vec3 noisePos = worldPos.xyz * 3.0 + vec3(0.0, -t * 1.8, 0.0);
  float n1 = fbm(noisePos, 5);
  
  // Higher frequency detail
  vec3 detailPos = worldPos.xyz * 7.0 + vec3(0.0, -t * 3.0, t * 0.3);
  float n2 = fbm(detailPos, 4) * 0.4;
  
  // Displacement: stronger at top (fire rises), subtle at base (feet stable)
  float heightFactor = smoothstep(-0.2, 1.8, worldPos.y);
  float displacement = (n1 + n2) * uDisplaceStrength * (0.3 + heightFactor * 0.7);
  
  // Outward puff at extremities (hands, head)
  float extremity = smoothstep(0.4, 0.0, abs(worldPos.x)) * 0.5 + 0.5;
  displacement *= extremity;
  
  vDisplacement = displacement;
  
  // Displace along normal
  vec3 displaced = position + normal * displacement;
  
  vWorldPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

export const fireFragmentShader = /* glsl */`
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform float uFlickerSpeed;
uniform float uFlickerIntensity;
uniform float uCoreIntensity;
uniform float uAudioLevel;
uniform float uEdgeGlow;

varying vec3 vWorldPos;
varying vec3 vNormal;
varying vec2 vUv;
varying float vDisplacement;
varying float vHeight;

// Reuse snoise
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

float fbm(vec3 p){
  float v=0.,a=.5,f=1.;
  for(int i=0;i<6;i++){v+=a*snoise(p*f);f*=2.02;a*=.49;}
  return v;
}

void main(){
  float t = uTime * uFlickerSpeed;
  
  // === FIRE TEXTURE ===
  // Scrolling noise for flame surface texture
  vec3 noiseP = vWorldPos * 4.0 + vec3(0.0, -t * 2.0, t * 0.15);
  float n = fbm(noiseP);
  
  // Fine detail
  vec3 detailP = vWorldPos * 10.0 + vec3(t * 0.3, -t * 4.0, 0.0);
  float detail = snoise(detailP) * 0.3;
  
  float fireNoise = n + detail;
  
  // === COLOR GRADIENT ===
  // Height-based: blue-white at core/bottom → orange → dark red at tips
  float heightNorm = smoothstep(-0.2, 1.8, vHeight);
  
  // Base fire color (orange)
  vec3 col = uColor;
  
  // Hot white-yellow center (strongest at chest height ~0.8-1.2)
  float coreHeight = exp(-pow(vHeight - 0.9, 2.0) * 3.0);
  float coreMask = coreHeight * uCoreIntensity;
  
  // Distance from center axis
  float centerDist = length(vWorldPos.xz);
  float innerCore = exp(-centerDist * centerDist * 30.0) * coreMask;
  
  // Blend core color
  col = mix(col, uCoreColor, innerCore * 0.8);
  col = mix(col, vec3(1.0, 0.95, 0.8), innerCore * 0.4); // hot white
  
  // Upper regions: brighter orange-yellow (fire tips)
  col = mix(col, vec3(1.0, 0.6, 0.15), heightNorm * 0.3);
  
  // Dark veins from noise (the "lava-like" texture from concept art)
  float veins = smoothstep(0.0, 0.3, -fireNoise);
  col = mix(col, uColor * vec3(0.4, 0.12, 0.05), veins * 0.6);
  
  // Bright noise ridges
  float ridges = smoothstep(0.2, 0.5, fireNoise);
  col += vec3(0.15, 0.06, 0.01) * ridges;
  
  // Audio reactivity
  col += vec3(0.1, 0.04, 0.0) * uAudioLevel;
  
  // === EDGE GLOW ===
  // Fresnel-like edge brightening (fire edges are luminous)
  float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
  fresnel = pow(fresnel, 2.0);
  col += uColor * fresnel * uEdgeGlow * 0.5;
  
  // === FLICKER ===
  // Random brightness variation
  float flicker = 1.0 + fireNoise * uFlickerIntensity;
  flicker += sin(uTime * 13.7 + vWorldPos.y * 5.0) * 0.05;
  col *= flicker;
  
  // === ALPHA ===
  // Mostly opaque body, soft fade at extreme edges and top
  float alpha = 0.92;
  // Soften at head top
  alpha *= smoothstep(1.8, 1.5, vHeight);
  // Fresnel edge softness (wispy fire edges)
  alpha *= 1.0 - fresnel * 0.3;
  // Displacement-based: highly displaced areas more transparent (wispy)
  alpha *= 1.0 - smoothstep(0.05, 0.15, abs(vDisplacement)) * 0.2;
  
  // HDR: allow values > 1.0 for bloom to pick up
  col *= 1.5;
  
  gl_FragColor = vec4(col, alpha);
}
`;

/**
 * Straw hat shader — non-burning, warm-lit physical material
 */
export const hatVertexShader = /* glsl */`
varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const hatFragmentShader = /* glsl */`
uniform vec3 uHatColor;
uniform float uFireLight;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;

void main() {
  // Straw hat: warm beige/tan color
  vec3 col = uHatColor;
  
  // Simple lighting from fire below
  float upLight = max(0.0, dot(vNormal, normalize(vec3(0.0, -1.0, 0.5))));
  col *= 0.4 + upLight * 0.6 * uFireLight;
  
  // Warm fire-lit tint
  col += vec3(0.15, 0.06, 0.02) * uFireLight * upLight;
  
  // Subtle straw texture (noise-based)
  float straw = fract(sin(dot(vUv * 40.0, vec2(12.9898, 78.233))) * 43758.5453);
  col *= 0.9 + straw * 0.1;
  
  // Dark band around crown
  float band = smoothstep(0.03, 0.06, vWorldPos.y) * smoothstep(0.1, 0.07, vWorldPos.y);
  col = mix(col, vec3(0.15, 0.08, 0.04), band * 0.7);
  
  gl_FragColor = vec4(col, 1.0);
}
`;
