import React, { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { feature } from "topojson-client";
import landAtlas from "world-atlas/land-110m.json";
import { latLonToVector3 } from "./geo";
import { theme } from "../../styles/theme";

const EARTH_DAY_URL =
  "/textures/earth-day-real.jpg";
const EARTH_NIGHT_URL =
  "/textures/earth-lights.png";
const EARTH_NORMAL_URL =
  "/textures/earth-normal.jpg";
const EARTH_SPECULAR_URL =
  "/textures/earth-specular.jpg";
const EARTH_CLOUDS_URL =
  "/textures/earth-clouds.png";
const DEFAULT_SUN_DIRECTION = new THREE.Vector3(-4.2, 3.3, 3).normalize();
type QualityTier = "low" | "mid" | "high";

function getBrightnessBoost(dimAmount: number) {
  return 1 - THREE.MathUtils.clamp(dimAmount, 0, 1);
}

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

type LonLat = [number, number];

function appendRingSegments(target: number[], ring: LonLat[], radius: number) {
  if (ring.length < 2) return;

  let prevLon = ring[0][0];
  let prev = latLonToVector3(ring[0][1], ring[0][0], radius);

  for (let i = 1; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const next = latLonToVector3(lat, lon, radius);

    if (Math.abs(lon - prevLon) > 180) {
      prev = next;
    } else {
      target.push(prev.x, prev.y, prev.z, next.x, next.y, next.z);
      prev = next;
    }

    prevLon = lon;
  }
}

function appendGeometrySegments(
  target: number[],
  coordinates: unknown,
  radius: number
) {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return;

  const first = coordinates[0];
  if (!Array.isArray(first)) return;

  if (typeof first[0] === "number") {
    appendRingSegments(target, coordinates as LonLat[], radius);
    return;
  }

  for (const nested of coordinates as unknown[]) {
    appendGeometrySegments(target, nested, radius);
  }
}

function makeFeatureLineGeometry(geojson: any, radius: number) {
  const features = geojson.type === "FeatureCollection" ? geojson.features : [geojson];
  const positions: number[] = [];

  for (const entry of features) {
    const geometry = entry?.geometry;
    if (!geometry?.coordinates) continue;
    appendGeometrySegments(positions, geometry.coordinates, radius);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

function RealisticEarth({
  sunDirection,
  dimAmount,
  quality
}: {
  sunDirection: THREE.Vector3;
  dimAmount: number;
  quality: QualityTier;
}) {
  const { gl } = useThree();
  const brightnessBoost = getBrightnessBoost(dimAmount);
  const earthSegments = quality === "high" ? 160 : quality === "mid" ? 128 : 96;
  const detailSegments = quality === "high" ? 144 : quality === "mid" ? 112 : 80;
  const cloudSegments = quality === "high" ? 72 : quality === "mid" ? 56 : 40;

  const [dayTex, normalTex, specularTex, nightTex, cloudsTex] = useLoader(THREE.TextureLoader, [
    EARTH_DAY_URL,
    EARTH_NORMAL_URL,
    EARTH_SPECULAR_URL,
    EARTH_NIGHT_URL,
    EARTH_CLOUDS_URL
  ]) as THREE.Texture[];

  useEffect(() => {
    const anisotropyCap = quality === "high" ? 12 : quality === "mid" ? 8 : 4;
    const anisotropy = Math.min(anisotropyCap, gl.capabilities.getMaxAnisotropy());
    configureTexture(dayTex, anisotropy, THREE.SRGBColorSpace);
    configureTexture(normalTex, anisotropy);
    configureTexture(specularTex, anisotropy);
    configureTexture(nightTex, anisotropy, THREE.SRGBColorSpace);
    configureTexture(cloudsTex, anisotropy, THREE.SRGBColorSpace);
  }, [cloudsTex, dayTex, gl, nightTex, normalTex, quality, specularTex]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, earthSegments, earthSegments]} />
        <meshPhongMaterial
          map={dayTex}
          normalMap={normalTex}
          normalScale={new THREE.Vector2(0.38, 0.38)}
          specularMap={specularTex}
          specular={new THREE.Color("#96c1ea")}
          shininess={24}
          color={new THREE.Color().setScalar(1.06 + brightnessBoost * 0.08)}
          emissiveMap={dayTex}
          emissive={new THREE.Color("#1a2026")}
          emissiveIntensity={0.08 + brightnessBoost * 0.04}
        />
      </mesh>
      <MapOverlay sunDirection={sunDirection} dimAmount={dimAmount} />
      <OceanHighlights
        specularTex={specularTex}
        sunDirection={sunDirection}
        segments={detailSegments}
      />
      <NightLights
        nightTex={nightTex}
        sunDirection={sunDirection}
        segments={detailSegments}
      />
      <CloudLayer
        cloudTex={cloudsTex}
        scale={1.012}
        opacity={0.08 + brightnessBoost * 0.04}
        speed={0.022}
        segments={cloudSegments}
      />
      {quality !== "low" ? (
        <CloudLayer
          cloudTex={cloudsTex}
          scale={1.018}
          opacity={0.035 + brightnessBoost * 0.02}
          speed={0.014}
          segments={cloudSegments}
        />
      ) : null}
      <Atmosphere sunDirection={sunDirection} segments={cloudSegments} />
    </group>
  );
}

function MapOverlay({
  sunDirection,
  dimAmount
}: {
  sunDirection: THREE.Vector3;
  dimAmount: number;
}) {
  const brightnessBoost = getBrightnessBoost(dimAmount);
  const landGeometry = useMemo(() => {
    const landGeo = feature(
      landAtlas as any,
      (landAtlas as { objects: { land: any } }).objects.land
    );
    return makeFeatureLineGeometry(landGeo, 1.0045);
  }, []);
  const daylight = sunDirection.z;
  const landOpacity = 0.16 + brightnessBoost * 0.05 + Math.max(0, daylight) * 0.03;

  useEffect(() => {
    return () => {
      landGeometry.dispose();
    };
  }, [landGeometry]);

  return (
    <group>
      <lineSegments geometry={landGeometry}>
        <lineBasicMaterial
          color="#98c6f0"
          transparent
          opacity={landOpacity}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function ProceduralEarthFallback({
  dimAmount,
  quality
}: {
  dimAmount: number;
  quality: QualityTier;
}) {
  const { gl } = useThree();
  const textureSize = quality === "high" ? 768 : quality === "mid" ? 640 : 512;
  const sphereSegments = quality === "high" ? 112 : quality === "mid" ? 88 : 64;
  const { tex } = useMemo(() => makeProceduralTexture(textureSize), [textureSize]);
  const brightnessBoost = getBrightnessBoost(dimAmount);

  useEffect(() => {
    const anisotropyCap = quality === "high" ? 12 : quality === "mid" ? 8 : 4;
    tex.anisotropy = Math.min(anisotropyCap, gl.capabilities.getMaxAnisotropy());
  }, [gl, quality, tex]);

  return (
    <mesh>
      <sphereGeometry args={[1, sphereSegments, sphereSegments]} />
      <meshStandardMaterial
        map={tex}
        color={new THREE.Color().setScalar(1 + brightnessBoost * 0.08)}
        metalness={0}
        roughness={0.9}
        emissive={new THREE.Color(theme.colors.bg)}
        emissiveIntensity={brightnessBoost * 0.08}
      />
    </mesh>
  );
}

function NightLights({
  nightTex,
  sunDirection,
  segments
}: {
  nightTex: THREE.Texture;
  sunDirection: THREE.Vector3;
  segments: number;
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
            float nightMask = smoothstep(0.08, -0.04, daylight);
            vec3 lights = texture2D(uNightMap, vUv).rgb;
            float twinkle = 0.96 + 0.04 * sin(uTime * 0.38 + vUv.x * 28.0 + vUv.y * 12.0);
            vec3 color = lights * nightMask * twinkle * 0.45;
            gl_FragColor = vec4(color, nightMask * 0.24);
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
      <sphereGeometry args={[1, segments, segments]} />
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
  sunDirection,
  segments
}: {
  specularTex: THREE.Texture;
  sunDirection: THREE.Vector3;
  segments: number;
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
            float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 4.15);
            float specular = pow(max(dot(normal, halfVec), 0.0), 88.0);
            float alpha = oceanMask * daylight * (specular * 0.54 + fresnel * 0.08);
            vec3 color = mix(vec3(0.18, 0.34, 0.55), vec3(0.78, 0.9, 1.0), clamp(specular, 0.0, 1.0));
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
      <sphereGeometry args={[1, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function CloudLayer({
  cloudTex,
  scale,
  opacity,
  speed,
  segments
}: {
  cloudTex: THREE.Texture;
  scale: number;
  opacity: number;
  speed: number;
  segments: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((_state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * speed;
  });

  return (
    <mesh ref={ref} scale={scale}>
      <sphereGeometry args={[1, segments, segments]} />
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

function Atmosphere({
  sunDirection,
  segments
}: {
  sunDirection: THREE.Vector3;
  segments: number;
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uSunDirection: { value: sunDirection.clone().normalize() },
          uGlowColor: { value: new THREE.Color("#69b4ff") }
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
            float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormalW)), 0.0), 3.7);
            float sunScatter = pow(max(dot(normalize(vNormalW), normalize(uSunDirection)), 0.0), 1.9);
            float alpha = fresnel * (0.16 + sunScatter * 0.22);
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
    <mesh scale={1.06}>
      <sphereGeometry args={[1, segments, segments]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

function EarthBase({
  sunDirection,
  dimAmount,
  quality
}: {
  sunDirection: THREE.Vector3;
  dimAmount: number;
  quality: QualityTier;
}) {
  return (
    <group>
      <Suspense
        fallback={
          <group>
            <ProceduralEarthFallback dimAmount={dimAmount} quality={quality} />
            <Atmosphere
              sunDirection={sunDirection}
              segments={quality === "high" ? 72 : quality === "mid" ? 56 : 40}
            />
          </group>
        }
      >
        <RealisticEarth
          sunDirection={sunDirection}
          dimAmount={dimAmount}
          quality={quality}
        />
      </Suspense>
    </group>
  );
}

export function EarthView({
  sunDirection = DEFAULT_SUN_DIRECTION,
  dimAmount = 0.5,
  quality = "high"
}: {
  sunDirection?: THREE.Vector3;
  dimAmount?: number;
  quality?: QualityTier;
}) {
  return (
    <EarthBase
      sunDirection={sunDirection}
      dimAmount={dimAmount}
      quality={quality}
    />
  );
}
