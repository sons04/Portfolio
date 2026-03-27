import React, { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { theme } from "../../styles/theme";

const EARTH_DAY_URL =
  "https://upload.wikimedia.org/wikipedia/commons/c/c3/Solarsystemscope_texture_2k_earth_daymap.jpg";
const EARTH_NIGHT_URL =
  "https://threejs.org/examples/textures/planets/earth_lights_2048.png";
const EARTH_NORMAL_URL =
  "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg";
const EARTH_SPECULAR_URL =
  "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg";
const EARTH_CLOUDS_URL =
  "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";
const DEFAULT_SUN_DIRECTION = new THREE.Vector3(4, 2.5, 3).normalize();

function configureTexture(
  texture: THREE.Texture,
  anisotropy: number,
  colorSpace: THREE.ColorSpace = THREE.NoColorSpace
) {
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = anisotropy;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
}

function RealisticEarth({ sunDirection }: { sunDirection: THREE.Vector3 }) {
  const { gl } = useThree();
  const loader = useMemo(() => {
    const instance = new THREE.TextureLoader();
    instance.setCrossOrigin("anonymous");
    return instance;
  }, []);

  const [dayTex, normalTex, specularTex, nightTex, cloudsTex] = useLoader(loader, [
    EARTH_DAY_URL,
    EARTH_NORMAL_URL,
    EARTH_SPECULAR_URL,
    EARTH_NIGHT_URL,
    EARTH_CLOUDS_URL
  ]) as THREE.Texture[];

  useEffect(() => {
    const anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
    configureTexture(dayTex, anisotropy, THREE.SRGBColorSpace);
    configureTexture(normalTex, anisotropy);
    configureTexture(specularTex, anisotropy);
    configureTexture(nightTex, anisotropy, THREE.SRGBColorSpace);
    configureTexture(cloudsTex, anisotropy, THREE.SRGBColorSpace);
  }, [cloudsTex, dayTex, gl, nightTex, normalTex, specularTex]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 192, 192]} />
        <meshPhongMaterial
          map={dayTex}
          normalMap={normalTex}
          normalScale={new THREE.Vector2(0.55, 0.55)}
          specularMap={specularTex}
          specular={new THREE.Color("#88b7e8")}
          shininess={20}
          color={new THREE.Color("#ffffff")}
          emissive={new THREE.Color("#01040a")}
          emissiveIntensity={0.008}
        />
      </mesh>
      <OceanHighlights specularTex={specularTex} sunDirection={sunDirection} />
      <NightLights nightTex={nightTex} sunDirection={sunDirection} />
      <CloudLayer cloudTex={cloudsTex} scale={1.012} opacity={0.1} speed={0.024} />
      <CloudLayer cloudTex={cloudsTex} scale={1.018} opacity={0.05} speed={0.016} />
      <Atmosphere sunDirection={sunDirection} />
    </group>
  );
}

function ProceduralEarthFallback() {
  const { gl } = useThree();
  const { tex } = useMemo(() => makeProceduralTexture(1024), []);

  useEffect(() => {
    tex.anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
  }, [gl, tex]);

  return (
    <mesh>
      <sphereGeometry args={[1, 128, 128]} />
      <meshStandardMaterial
        map={tex}
        color={new THREE.Color(0xffffff)}
        metalness={0}
        roughness={0.9}
        emissive={new THREE.Color(theme.colors.bg)}
        emissiveIntensity={0}
      />
    </mesh>
  );
}

function NightLights({
  nightTex,
  sunDirection
}: {
  nightTex: THREE.Texture;
  sunDirection: THREE.Vector3;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uNightMap: { value: nightTex },
          uSunDirection: { value: sunDirection.clone().normalize() },
          uTime: { value: 0 }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormalW;

          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vUv = uv;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D uNightMap;
          uniform vec3 uSunDirection;
          uniform float uTime;
          varying vec2 vUv;
          varying vec3 vNormalW;

          void main() {
            float daylight = max(dot(normalize(vNormalW), normalize(uSunDirection)), 0.0);
            float nightMask = smoothstep(0.2, -0.12, daylight);
            vec3 lights = texture2D(uNightMap, vUv).rgb;
            float twinkle = 0.92 + 0.08 * sin(uTime * 0.5 + vUv.x * 42.0 + vUv.y * 17.0);
            vec3 color = lights * nightMask * twinkle * 1.15;
            gl_FragColor = vec4(color, nightMask * 0.92);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      }),
    [nightTex, sunDirection]
  );

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  useEffect(() => {
    material.uniforms.uSunDirection.value = sunDirection.clone().normalize();
  }, [material, sunDirection]);

  return (
    <mesh scale={1.001}>
      <sphereGeometry args={[1, 128, 128]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function makeProceduralTexture(size: number) {
  const w = size;
  const h = Math.floor(size / 2);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const ocean = new THREE.Color("#0a2a4a");
  const land = new THREE.Color("#2d5a3d");
  const ice = new THREE.Color("#e8f4fc");

  let s = 1337;
  const rand = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
  const grid = new Map<string, number>();
  const g = (x: number, y: number) => {
    const k = `${x}|${y}`;
    const v = grid.get(k);
    if (v != null) return v;
    grid.set(k, rand());
    return grid.get(k)!;
  };
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const noise2 = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const u = smooth(xf);
    const v = smooth(yf);
    return lerp(
      lerp(g(xi, yi), g(xi + 1, yi), u),
      lerp(g(xi, yi + 1), g(xi + 1, yi + 1), u),
      v
    );
  };
  const fbm = (x: number, y: number) => {
    let f = 0;
    let amp = 0.5;
    let freq = 1;
    for (let i = 0; i < 5; i++) {
      f += noise2(x * freq, y * freq) * amp;
      freq *= 2;
      amp *= 0.5;
    }
    return f;
  };

  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const lat = (v - 0.5) * Math.PI;
    const iceMask = Math.max(0, (Math.abs(lat) - 1.05) / (Math.PI / 2 - 1.05));
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const n = fbm(u * 3.2, v * 1.9);
      const m = fbm(u * 10, v * 6);
      const elev = n * 0.75 + m * 0.25;
      const isLand = elev > 0.52;
      const col = new THREE.Color();
      if (!isLand) {
        col.copy(ocean);
      } else {
        col.copy(land);
      }
      if (iceMask > 0) col.lerp(ice, Math.min(1, iceMask * 1.2));
      const i = (y * w + x) * 4;
      img.data[i + 0] = Math.floor(col.r * 255);
      img.data[i + 1] = Math.floor(col.g * 255);
      img.data[i + 2] = Math.floor(col.b * 255);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 8;
  return { tex };
}

function OceanHighlights({
  specularTex,
  sunDirection
}: {
  specularTex: THREE.Texture;
  sunDirection: THREE.Vector3;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uSpecularMap: { value: specularTex },
          uSunDirection: { value: sunDirection.clone().normalize() }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormalW;
          varying vec3 vWorldPos;

          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vUv = uv;
            vWorldPos = worldPosition.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D uSpecularMap;
          uniform vec3 uSunDirection;
          varying vec2 vUv;
          varying vec3 vNormalW;
          varying vec3 vWorldPos;

          void main() {
            vec3 normal = normalize(vNormalW);
            vec3 lightDir = normalize(uSunDirection);
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            vec3 halfVec = normalize(lightDir + viewDir);
            float daylight = max(dot(normal, lightDir), 0.0);
            float oceanMask = texture2D(uSpecularMap, vUv).r;
            float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 4.5);
            float specular = pow(max(dot(normal, halfVec), 0.0), 110.0);
            float alpha = oceanMask * daylight * (specular * 0.85 + fresnel * 0.12);
            vec3 color = mix(vec3(0.18, 0.34, 0.55), vec3(0.84, 0.94, 1.0), clamp(specular, 0.0, 1.0));
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      }),
    [specularTex, sunDirection]
  );

  useEffect(() => {
    material.uniforms.uSunDirection.value = sunDirection.clone().normalize();
  }, [material, sunDirection]);

  return (
    <mesh scale={1.002}>
      <sphereGeometry args={[1, 192, 192]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function CloudLayer({
  cloudTex,
  scale,
  opacity,
  speed
}: {
  cloudTex: THREE.Texture;
  scale: number;
  opacity: number;
  speed: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * speed;
  });

  return (
    <mesh ref={ref} scale={scale}>
      <sphereGeometry args={[1, 96, 96]} />
      <meshStandardMaterial
        alphaMap={cloudTex}
        color="#dfefff"
        transparent
        opacity={opacity}
        depthWrite={false}
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

function Atmosphere({ sunDirection }: { sunDirection: THREE.Vector3 }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uSunDirection: { value: sunDirection.clone().normalize() },
          uGlowColor: { value: new THREE.Color("#5ea8ff") }
        },
        vertexShader: `
          varying vec3 vNormalW;
          varying vec3 vWorldPos;

          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPosition.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uSunDirection;
          uniform vec3 uGlowColor;
          varying vec3 vNormalW;
          varying vec3 vWorldPos;

          void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormalW)), 0.0), 3.5);
            float sunScatter = pow(max(dot(normalize(vNormalW), normalize(uSunDirection)), 0.0), 1.8);
            float alpha = fresnel * (0.18 + sunScatter * 0.28);
            gl_FragColor = vec4(uGlowColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        toneMapped: false
      }),
    [sunDirection]
  );

  useEffect(() => {
    material.uniforms.uSunDirection.value = sunDirection.clone().normalize();
  }, [material, sunDirection]);

  return (
    <mesh scale={1.07}>
      <sphereGeometry args={[1, 96, 96]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function EarthBase({ sunDirection }: { sunDirection: THREE.Vector3 }) {
  return (
    <group>
      <Suspense
        fallback={
          <group>
            <ProceduralEarthFallback />
            <Atmosphere sunDirection={sunDirection} />
          </group>
        }
      >
        <RealisticEarth sunDirection={sunDirection} />
      </Suspense>
    </group>
  );
}

export function Earth({
  sunDirection = DEFAULT_SUN_DIRECTION
}: {
  sunDirection?: THREE.Vector3;
}) {
  return <EarthBase sunDirection={sunDirection} />;
}
