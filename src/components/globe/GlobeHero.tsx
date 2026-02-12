import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, ScrollControls, Scroll, useScroll } from "@react-three/drei";
import { Bloom, EffectComposer, SMAA, SSAO } from "@react-three/postprocessing";
import { timelineNodes, type TimelineNode } from "./timeline";
import { clamp, latLonToVector3, vector3ToLatLon } from "./geo";

type QualityTier = "low" | "mid" | "high";

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function useDocumentVisibility(onHidden: () => void, onVisible: () => void) {
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "hidden") onHidden();
      else onVisible();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [onHidden, onVisible]);
}

function pickQualityTier(reducedMotion: boolean): QualityTier {
  if (reducedMotion) return "low";

  const cores = navigator.hardwareConcurrency ?? 4;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;

  if (deviceMemory && deviceMemory <= 4) return "mid";
  if (cores <= 4) return "mid";
  return "high";
}

function Atmosphere({ radius = 1.03 }: { radius?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const shader = useMemo(() => {
    return {
      uniforms: {
        uColor: { value: new THREE.Color("#6fe7ff") },
        uIntensity: { value: 1.35 },
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uIntensity;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 345.45));
          p += dot(p, p + 34.345);
          return fract(p.x * p.y);
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 5.0);

          // Subtle animated noise so bloom catches "alive" highlights.
          float n = hash(vNormal.xy * 70.0 + uTime * 0.07);
          float shimmer = smoothstep(0.55, 1.0, n) * 0.15;

          float alpha = clamp(fresnel * uIntensity + shimmer, 0.0, 1.0);
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    } satisfies Partial<THREE.ShaderMaterialParameters>;
  }, []);

  useFrame((_s, dt) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <mesh scale={radius}>
      <sphereGeometry args={[1, 128, 128]} />
      <shaderMaterial ref={matRef} attach="material" {...shader} />
    </mesh>
  );
}

function EarthBase() {
  return (
    <mesh>
      <sphereGeometry args={[1, 192, 192]} />
      <meshStandardMaterial
        color="#0b1530"
        metalness={0.08}
        roughness={0.95}
        emissive="#050a14"
        emissiveIntensity={0.6}
      />
    </mesh>
  );
}

function EarthHoloGrid({ radius = 1.005 }: { radius?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const shader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color("#6fe7ff") },
        uColorB: { value: new THREE.Color("#7aa7ff") },
        uOpacity: { value: 0.5 }
      },
      vertexShader: `
        varying vec3 vPos;
        varying vec3 vNormal;
        void main() {
          vPos = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform float uOpacity;
        varying vec3 vPos;
        varying vec3 vNormal;

        float line(float v, float width) {
          float a = abs(fract(v) - 0.5);
          return 1.0 - smoothstep(width, width + 0.01, a);
        }

        void main() {
          // Spherical-ish UV from normal; good enough for stylised grid.
          vec3 n = normalize(vPos);
          float u = atan(n.z, n.x) / 6.2831853 + 0.5;
          float v = asin(n.y) / 3.1415926 + 0.5;

          float lat = line(v * 36.0, 0.03);
          float lon = line(u * 72.0, 0.03);
          float grid = max(lat, lon);

          // Animated scanning band.
          float scan = smoothstep(0.0, 0.2, sin((v * 12.0 - uTime * 0.6) * 6.2831853) * 0.5 + 0.5);
          float glow = grid * (0.45 + 0.55 * scan);

          // Rim boost for "hologram shell"
          float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vec3(0.0,0.0,1.0))), 0.0), 3.0);

          vec3 col = mix(uColorB, uColorA, glow);
          float alpha = clamp((glow * 0.75 + fresnel * 0.22) * uOpacity, 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    } satisfies Partial<THREE.ShaderMaterialParameters>;
  }, []);

  useFrame((_s, dt) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <mesh scale={radius}>
      <sphereGeometry args={[1, 192, 192]} />
      <shaderMaterial ref={matRef} attach="material" {...shader} />
    </mesh>
  );
}

function surfacePoints(count: number, radius = 1.001) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // Uniform distribution on sphere.
    const u = Math.random();
    const v = Math.random();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    const x = Math.sin(phi) * Math.cos(theta);
    const y = Math.cos(phi);
    const z = Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 0] = x * radius;
    positions[i * 3 + 1] = y * radius;
    positions[i * 3 + 2] = z * radius;
    seeds[i] = Math.random();
  }
  return { positions, seeds };
}

function GlowPoints({
  count,
  color = "#6fe7ff",
  baseSize = 2.0,
  opacity = 0.8
}: {
  count: number;
  color?: string;
  baseSize?: number;
  opacity?: number;
}) {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, seeds } = useMemo(() => surfacePoints(count), [count]);

  const shader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uBaseSize: { value: baseSize }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBaseSize;
        attribute float aSeed;
        varying float vAlpha;

        void main() {
          vec3 p = position;
          vec4 mvPos = modelViewMatrix * vec4(p, 1.0);

          // Twinkle without chaos.
          float tw = 0.55 + 0.45 * sin(uTime * 1.3 + aSeed * 10.0);
          vAlpha = tw;
          gl_PointSize = uBaseSize * tw * (300.0 / -mvPos.z);

          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vAlpha;

        void main() {
          // Soft circular point sprite.
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = dot(c, c);
          float a = smoothstep(0.25, 0.0, d);
          gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    } satisfies Partial<THREE.ShaderMaterialParameters>;
  }, [baseSize, color, opacity]);

  useEffect(() => {
    if (!geomRef.current) return;
    geomRef.current.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    geomRef.current.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geomRef.current.computeBoundingSphere();
  }, [positions, seeds]);

  useFrame((_s, dt) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <points frustumCulled>
      <bufferGeometry ref={geomRef} />
      <shaderMaterial ref={matRef} attach="material" {...shader} />
    </points>
  );
}

function buildArcs(arcCount: number, segments = 48) {
  const vertsPerArc = segments;
  const positions = new Float32Array(arcCount * vertsPerArc * 2 * 3);
  const tAttr = new Float32Array(arcCount * vertsPerArc * 2);

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();

  let vIndex = 0;
  let tIndex = 0;

  for (let arc = 0; arc < arcCount; arc++) {
    // Random endpoints, biased toward mid-latitudes for a "network" look.
    const lat1 = (Math.random() * 120 - 60) * (Math.PI / 180);
    const lon1 = (Math.random() * 360 - 180) * (Math.PI / 180);
    const lat2 = (Math.random() * 120 - 60) * (Math.PI / 180);
    const lon2 = (Math.random() * 360 - 180) * (Math.PI / 180);

    a.set(
      Math.cos(lat1) * Math.cos(lon1),
      Math.sin(lat1),
      Math.cos(lat1) * Math.sin(lon1)
    ).normalize();
    b.set(
      Math.cos(lat2) * Math.cos(lon2),
      Math.sin(lat2),
      Math.cos(lat2) * Math.sin(lon2)
    ).normalize();

    let prev = new THREE.Vector3().copy(a);
    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const cur = new THREE.Vector3().copy(a).lerp(b, t).normalize();
      const lift = 1.0 + Math.sin(Math.PI * t) * 0.28;
      cur.multiplyScalar(lift);

      // segment (prev -> cur)
      positions[vIndex++] = prev.x;
      positions[vIndex++] = prev.y;
      positions[vIndex++] = prev.z;
      tAttr[tIndex++] = t;

      positions[vIndex++] = cur.x;
      positions[vIndex++] = cur.y;
      positions[vIndex++] = cur.z;
      tAttr[tIndex++] = t;

      prev.copy(cur);
    }
  }

  return { positions, tAttr };
}

function ArcLines({ arcCount = 18 }: { arcCount?: number }) {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, tAttr } = useMemo(() => buildArcs(arcCount), [arcCount]);

  const shader = useMemo(() => {
    return {
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#6fe7ff") },
        uOpacity: { value: 0.65 }
      },
      vertexShader: `
        uniform float uTime;
        attribute float aT;
        varying float vT;
        void main() {
          vT = aT;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vT;

        void main() {
          // Moving pulse along arc, kept subtle.
          float p = sin((vT * 6.2831853) - uTime * 1.2) * 0.5 + 0.5;
          float pulse = pow(p, 6.0);
          float alpha = (0.18 + pulse * 0.82) * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    } satisfies Partial<THREE.ShaderMaterialParameters>;
  }, []);

  useEffect(() => {
    if (!geomRef.current) return;
    geomRef.current.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    geomRef.current.setAttribute("aT", new THREE.BufferAttribute(tAttr, 1));
    geomRef.current.computeBoundingSphere();
  }, [positions, tAttr]);

  useFrame((_s, dt) => {
    if (!matRef.current) return;
    matRef.current.uniforms.uTime.value += dt;
  });

  return (
    <lineSegments>
      <bufferGeometry ref={geomRef} />
      <shaderMaterial ref={matRef} attach="material" {...shader} />
    </lineSegments>
  );
}

function TimelineMarkers({
  nodes,
  activeId,
  onSelect
}: {
  nodes: TimelineNode[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const group = useMemo(() => {
    return nodes.map((n) => ({
      id: n.id,
      pos: latLonToVector3(n.coordinates.lat, n.coordinates.lon, 1.01)
    }));
  }, [nodes]);

  return (
    <group>
      {group.map((m) => {
        const isActive = m.id === activeId;
        return (
          <mesh
            key={m.id}
            position={m.pos}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(m.id);
            }}
          >
            <sphereGeometry args={[isActive ? 0.022 : 0.016, 16, 16]} />
            <meshStandardMaterial
              color={isActive ? "#ffffff" : "#6fe7ff"}
              emissive={isActive ? "#6fe7ff" : "#2aa9c8"}
              emissiveIntensity={isActive ? 2.2 : 1.2}
              roughness={0.4}
              metalness={0.1}
              transparent
              opacity={isActive ? 1 : 0.9}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function CameraTimelineRig({
  nodes,
  activeIndex,
  paused,
  autoRotate,
  controlsRef
}: {
  nodes: TimelineNode[];
  activeIndex: number;
  paused: boolean;
  autoRotate: boolean;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();

  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const desiredPos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_s, dt) => {
    const node = nodes[clamp(activeIndex, 0, nodes.length - 1)];
    const target = latLonToVector3(node.coordinates.lat, node.coordinates.lon, 0.98);
    desiredTarget.copy(target);

    // Put camera a fixed distance “in front” of the target direction.
    const dist = 3.1;
    desiredPos.copy(target).normalize().multiplyScalar(dist);

    const t = 1 - Math.pow(0.0008, dt); // smooth, framerate-independent
    camera.position.lerp(desiredPos, t);

    if (controlsRef.current) {
      controlsRef.current.enableDamping = true;
      controlsRef.current.dampingFactor = 0.1;
      controlsRef.current.enablePan = false;
      controlsRef.current.autoRotate = autoRotate && !paused;
      controlsRef.current.autoRotateSpeed = 0.35;
      controlsRef.current.target.lerp(desiredTarget, t);
      controlsRef.current.update();
    } else {
      camera.lookAt(desiredTarget);
    }
  });

  return null;
}

function Scene({
  quality,
  paused,
  autoRotate,
  activeIndex,
  onSelectNode,
  onSurfacePick
}: {
  quality: QualityTier;
  paused: boolean;
  autoRotate: boolean;
  activeIndex: number;
  onSelectNode: (id: string) => void;
  onSurfacePick: (p: THREE.Vector3) => void;
}) {
  const controlsRef = useRef<any>(null);

  const enablePost = quality !== "low" && !paused;
  const enableSSAO = quality === "high" && !paused;

  return (
    <>
      <color attach="background" args={["#05060a"]} />

      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 2, 4]} intensity={1.25} />
      <pointLight position={[-3, -1.5, -4]} intensity={0.35} />

      <group
        onClick={(e) => {
          e.stopPropagation();
          onSurfacePick(e.point.clone());
        }}
      >
        <EarthBase />
        <EarthHoloGrid />
        <GlowPoints count={quality === "low" ? 500 : 1400} opacity={0.55} />
        <ArcLines arcCount={quality === "low" ? 10 : 18} />
        <TimelineMarkers
          nodes={timelineNodes}
          activeId={timelineNodes[activeIndex]?.id ?? timelineNodes[0].id}
          onSelect={onSelectNode}
        />
        <Atmosphere />
      </group>

      <OrbitControls
        ref={controlsRef}
        rotateSpeed={0.6}
        minDistance={2.0}
        maxDistance={5.6}
      />
      <CameraTimelineRig
        nodes={timelineNodes}
        activeIndex={activeIndex}
        paused={paused}
        autoRotate={autoRotate}
        controlsRef={controlsRef}
      />

      {enablePost && (
        <EffectComposer multisampling={0}>
          {enableSSAO ? (
            <SSAO
              samples={8}
              rings={4}
              intensity={18}
              radius={0.14}
              worldDistanceThreshold={3}
            />
          ) : (
            <></>
          )}
          <Bloom
            intensity={0.65}
            luminanceThreshold={0.35}
            luminanceSmoothing={0.22}
            mipmapBlur
          />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}

export default function GlobeHero() {
  const reducedMotion = usePrefersReducedMotion();
  const [supported, setSupported] = useState(true);
  const [paused, setPaused] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [quality, setQuality] = useState<QualityTier>("high");
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollElRef = useRef<HTMLElement | null>(null);
  const [tooltip, setTooltip] = useState<{
    label: string;
    position: THREE.Vector3;
  } | null>(null);

  useEffect(() => {
    setSupported(isWebGLAvailable());
  }, []);

  useEffect(() => {
    const tier = pickQualityTier(reducedMotion);
    setQuality(tier);
    if (reducedMotion) {
      setPaused(true);
      setAutoRotate(false);
    }
  }, [reducedMotion]);

  useDocumentVisibility(
    () => setPaused(true),
    () => setPaused(reducedMotion)
  );

  const dpr: [number, number] = useMemo(() => {
    if (quality === "low") return [1, 1];
    if (quality === "mid") return [1, 1.35];
    return [1, 1.75];
  }, [quality]);

  if (!supported) {
    return (
      <div className="globeFallback">
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>
            WebGL isn’t available on this device.
          </p>
          <p style={{ margin: "10px 0 0" }}>
            You’re seeing a static fallback. The live globe uses hardware
            accelerated graphics.
          </p>
        </div>
      </div>
    );
  }

  const pages = timelineNodes.length;

  return (
    <>
      <Canvas
        className="globeCanvas"
        camera={{ position: [0, 0, 3.2], fov: 45, near: 0.1, far: 50 }}
        dpr={dpr}
        gl={{
          antialias: false,
          powerPreference: "high-performance"
        }}
      >
        <ScrollControls pages={pages} damping={0.22} distance={1}>
          <ScrollElBridge onReady={(el) => (scrollElRef.current = el)} />
          <TimelineScrollDriver
            paused={paused}
            reducedMotion={reducedMotion}
            onStage={(i) => setActiveIndex(i)}
          />

          <Scroll>
            <Suspense fallback={null}>
              <Scene
                quality={quality}
                paused={paused}
                autoRotate={autoRotate}
                activeIndex={activeIndex}
                onSelectNode={(id) => {
                  const idx = timelineNodes.findIndex((n) => n.id === id);
                  if (idx >= 0) {
                    setActiveIndex(idx);
                    const el = scrollElRef.current;
                    if (el && pages > 1) {
                      const maxScroll = el.scrollHeight - el.clientHeight;
                      el.scrollTop = (idx / (pages - 1)) * maxScroll;
                    }
                  }
                  setTooltip(null);
                }}
                onSurfacePick={(p) => {
                  const { lat, lon } = vector3ToLatLon(p);
                  setTooltip({
                    label: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`,
                    position: p.clone().normalize().multiplyScalar(1.07)
                  });
                }}
              />
            </Suspense>
          </Scroll>

          <Scroll html>
            <TimelineOverlay activeIndex={activeIndex} />
          </Scroll>
        </ScrollControls>
      </Canvas>

      <div className="globeHud" aria-label="Globe controls">
        <button
          type="button"
          className="btn"
          onClick={() => setAutoRotate((v) => !v)}
        >
          {autoRotate ? "Pause rotation" : "Resume rotation"}
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => setPaused((v) => !v)}
        >
          {paused ? "Play effects" : "Pause effects"}
        </button>
        <span className="hint">Drag to rotate • Scroll to zoom</span>
      </div>
    </>
  );
}

function ScrollElBridge({ onReady }: { onReady: (el: HTMLElement) => void }) {
  const scroll = useScroll();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (!scroll?.el) return;
    done.current = true;
    onReady(scroll.el);
  }, [onReady, scroll]);

  return null;
}

function TimelineScrollDriver({
  paused,
  reducedMotion,
  onStage
}: {
  paused: boolean;
  reducedMotion: boolean;
  onStage: (idx: number) => void;
}) {
  const scroll = useScroll();
  const last = useRef(-1);

  useFrame(() => {
    if (paused) return;
    if (reducedMotion) return;

    const n = timelineNodes.length;
    const idx = clamp(Math.round(scroll.offset * (n - 1)), 0, n - 1);
    if (idx !== last.current) {
      last.current = idx;
      onStage(idx);
    }
  });

  return null;
}

function TimelineOverlay({ activeIndex }: { activeIndex: number }) {
  const node = timelineNodes[clamp(activeIndex, 0, timelineNodes.length - 1)];
  return (
    <div className="timelineOverlay">
      <div className="glassCard" role="region" aria-label="Experience details">
        <div className="glassTop">
          <div className="glassKicker">{node.locationLabel}</div>
          <div className="glassTitleRow">
            <h3 className="glassTitle">{node.heading}</h3>
            {node.timeframe ? (
              <span className="glassMeta">{node.timeframe}</span>
            ) : null}
          </div>
        </div>

        <div className="glassBody">
          {node.sections.map((s) => {
            if (s.type === "text") {
              return (
                <div key={s.title} className="glassSection">
                  <div className="glassSectionTitle">{s.title}</div>
                  <div className="glassText">{s.text}</div>
                </div>
              );
            }
            return (
              <div key={s.title} className="glassSection">
                <div className="glassSectionTitle">{s.title}</div>
                <ul className="glassList">
                  {s.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {node.citations?.length ? (
          <div className="glassCitations" aria-label="Citations">
            <div className="glassSectionTitle">Citations</div>
            <ul className="glassCiteList">
              {node.citations.map((c) => (
                <li key={c.url}>
                  <a href={c.url} target="_blank" rel="noreferrer">
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="glassFooter">
          <div className="progressPips" aria-label="Timeline progress">
            {timelineNodes.map((n, i) => (
              <span
                key={n.id}
                className={i === activeIndex ? "pip pipActive" : "pip"}
                aria-hidden="true"
              />
            ))}
          </div>
          <div className="glassHint">Scroll to travel • Click nodes to focus</div>
        </div>
      </div>
    </div>
  );
}

