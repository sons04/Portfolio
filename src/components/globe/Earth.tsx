import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { theme } from "../../styles/theme";

function makeNoise(seed = 1) {
  let s = seed >>> 0;
  const rand = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const smooth = (t: number) => t * t * (3 - 2 * t);

  const grid = new Map<string, number>();
  const g = (x: number, y: number) => {
    const k = `${x}|${y}`;
    const v = grid.get(k);
    if (v != null) return v;
    const nv = rand();
    grid.set(k, nv);
    return nv;
  };

  const noise2 = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;
    const v00 = g(xi, yi);
    const v10 = g(xi + 1, yi);
    const v01 = g(xi, yi + 1);
    const v11 = g(xi + 1, yi + 1);
    const u = smooth(xf);
    const v = smooth(yf);
    return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
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

  return { fbm };
}

function makeEarthTextures(size = 1024) {
  const w = size;
  const h = Math.floor(size / 2);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const ocean = new THREE.Color(theme.colors.earthOcean);
  const land = new THREE.Color(theme.colors.earthLand);
  const ice = new THREE.Color(theme.colors.earthIce);

  const { fbm } = makeNoise(1337);
  const img = ctx.createImageData(w, h);

  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    const lat = (v - 0.5) * Math.PI; // -pi/2..pi/2
    const iceMask = Math.max(0, (Math.abs(lat) - 1.05) / (Math.PI / 2 - 1.05)); // polar caps

    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);

      // Low-frequency continents + higher detail
      const n = fbm(u * 3.2, v * 1.9);
      const m = fbm(u * 10.0, v * 6.0);
      const elev = n * 0.75 + m * 0.25;

      const coast = 0.52;
      const isLand = elev > coast;

      const col = new THREE.Color();
      if (!isLand) {
        col.copy(ocean).lerp(new THREE.Color(theme.colors.nebulaB), (coast - elev) * 0.9);
      } else {
        const t = (elev - coast) / (1 - coast);
        col.copy(land).lerp(new THREE.Color(theme.colors.primary), t * 0.25);
      }

      // Polar ice overlay
      if (iceMask > 0) {
        col.lerp(ice, Math.min(1, iceMask * 1.2));
      }

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

  // Clouds (alpha texture)
  const c2 = document.createElement("canvas");
  c2.width = w;
  c2.height = h;
  const cctx = c2.getContext("2d")!;
  const clouds = cctx.createImageData(w, h);
  const { fbm: fbmC } = makeNoise(4242);
  for (let y = 0; y < h; y++) {
    const v = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const f = fbmC(u * 6.0, v * 3.2);
      const a = Math.max(0, (f - 0.62) * 2.2);
      const i = (y * w + x) * 4;
      clouds.data[i + 0] = 255;
      clouds.data[i + 1] = 255;
      clouds.data[i + 2] = 255;
      clouds.data[i + 3] = Math.floor(Math.min(255, a * 255));
    }
  }
  cctx.putImageData(clouds, 0, 0);
  const cloudTex = new THREE.CanvasTexture(c2);
  cloudTex.colorSpace = THREE.SRGBColorSpace;
  cloudTex.wrapS = THREE.RepeatWrapping;
  cloudTex.wrapT = THREE.ClampToEdgeWrapping;
  cloudTex.anisotropy = 8;

  return { tex, cloudTex };
}

export function Earth() {
  const { gl } = useThree();

  const { tex, cloudTex } = useMemo(() => makeEarthTextures(1024), []);

  useEffect(() => {
    tex.anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
    cloudTex.anisotropy = Math.min(12, gl.capabilities.getMaxAnisotropy());
  }, [cloudTex, gl, tex]);

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 256, 256]} />
        <meshStandardMaterial
          map={tex}
          metalness={0.05}
          roughness={0.88}
          emissive={new THREE.Color(theme.colors.bg)}
          emissiveIntensity={0.20}
        />
      </mesh>

      {/* Cloud shell */}
      <mesh>
        <sphereGeometry args={[1.012, 192, 192]} />
        <meshStandardMaterial
          map={cloudTex}
          transparent
          opacity={0.65}
          depthWrite={false}
          roughness={0.95}
          metalness={0.0}
          emissive={new THREE.Color(theme.colors.earthCloud)}
          emissiveIntensity={0.05}
        />
      </mesh>
    </group>
  );
}

