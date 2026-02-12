import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer, SMAA, SSAO } from "@react-three/postprocessing";
import { timelineNodes, type TimelineNode } from "./timeline";
import { clamp, latLonToVector3, vector3ToLatLon } from "./geo";
import { theme } from "../../styles/theme";

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
        uColorA: { value: new THREE.Color(theme.colors.primary) },
        uColorB: { value: new THREE.Color(theme.colors.accent) },
        uIntensity: { value: 1.1 },
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
        uniform vec3 uColorA;
        uniform vec3 uColorB;
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

          // Time-based subtle noise + mild color shift (cheap tier, no scattering).
          float n0 = hash(vNormal.xy * 70.0 + uTime * 0.05);
          float n1 = hash(vNormal.yz * 70.0 - uTime * 0.04);
          float shimmer = (n0 * 0.6 + n1 * 0.4);
          shimmer = smoothstep(0.55, 1.0, shimmer) * 0.10;

          float band = sin((uTime * 0.5) + vNormal.y * 9.0) * 0.5 + 0.5;
          vec3 col = mix(uColorA, uColorB, clamp(band, 0.0, 1.0));

          float alpha = clamp(fresnel * uIntensity + shimmer, 0.0, 0.85);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
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
        color={new THREE.Color(theme.colors.bg).offsetHSL(0, 0, 0.06)}
        metalness={0.08}
        roughness={0.95}
        emissive={new THREE.Color(theme.colors.bg)}
        emissiveIntensity={0.35}
      />
    </mesh>
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
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const items = useMemo(() => {
    return nodes.map((n) => ({
      id: n.id,
      pos: latLonToVector3(n.coordinates.lat, n.coordinates.lon, 1.012)
    }));
  }, [nodes]);

  // Build/update instance matrices (discs oriented to the surface normal).
  useEffect(() => {
    if (!instancedRef.current) return;
    const mesh = instancedRef.current;
    const zAxis = new THREE.Vector3(0, 0, 1);
    const pos = new THREE.Vector3();
    const normal = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const m = new THREE.Matrix4();

    for (let i = 0; i < items.length; i++) {
      pos.copy(items[i].pos);
      normal.copy(pos).normalize();
      quat.setFromUnitVectors(zAxis, normal);
      scale.setScalar(1);
      m.compose(pos, quat, scale);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [items]);

  useFrame((state) => {
    if (!matRef.current) return;
    // Subtle pulse to feel holographic; shared across instances.
    const t = state.clock.getElapsedTime();
    matRef.current.emissiveIntensity = 1.5 + Math.sin(t * 2.0) * 0.18;
  });

  return (
    <group>
      <instancedMesh
        ref={instancedRef}
        args={[undefined as never, undefined as never, items.length]}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (e.instanceId == null) return;
          onSelect(items[e.instanceId]?.id);
        }}
      >
        {/* Disc anchors */}
        <circleGeometry args={[0.03, 28]} />
        <meshStandardMaterial
          ref={matRef}
          color={theme.colors.node}
          emissive={theme.colors.node}
          emissiveIntensity={1.5}
          roughness={0.35}
          metalness={0.05}
          transparent
          opacity={0.92}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
}

function NetworkArcs({ nodes }: { nodes: TimelineNode[] }) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(theme.colors.accent) },
        uOpacity: { value: 0.30 }
      },
      vertexShader: `
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
          // Moving dash pattern along the line.
          float repeats = 18.0;
          float duty = 0.38;
          float x = fract(vT * repeats + uTime * 0.55);
          float dash = step(x, duty);
          float alpha = dash * uOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
  }, []);

  const lines = useMemo(() => {
    const objs: THREE.Line[] = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = latLonToVector3(
        nodes[i].coordinates.lat,
        nodes[i].coordinates.lon,
        1.012
      );
      const b = latLonToVector3(
        nodes[i + 1].coordinates.lat,
        nodes[i + 1].coordinates.lon,
        1.012
      );
      const mid = a.clone().add(b).normalize().multiplyScalar(1.35);
      const curve = new THREE.CatmullRomCurve3([a, mid, b]);
      const pts = curve.getPoints(80);

      const positions = new Float32Array(pts.length * 3);
      const tAttr = new Float32Array(pts.length);
      for (let p = 0; p < pts.length; p++) {
        positions[p * 3 + 0] = pts[p].x;
        positions[p * 3 + 1] = pts[p].y;
        positions[p * 3 + 2] = pts[p].z;
        tAttr[p] = p / (pts.length - 1);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("aT", new THREE.BufferAttribute(tAttr, 1));
      geo.computeBoundingSphere();

      const line = new THREE.Line(geo, material);
      objs.push(line);
    }
    return objs;
  }, [material, nodes]);

  useFrame((_s, dt) => {
    (material.uniforms.uTime.value as number) += dt;
  });

  return (
    <group>
      {lines.map((l, i) => (
        <primitive object={l} key={i} />
      ))}
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
      <directionalLight position={[3, 2, 4]} intensity={1.6} />
      <pointLight position={[-3, -1.5, -4]} intensity={0.15} />
      <Environment preset="studio" environmentIntensity={0.6} />

      <group
        onClick={(e) => {
          e.stopPropagation();
          onSurfacePick(e.point.clone());
        }}
      >
        {/* Globe + atmosphere + timeline-driven nodes (design-system mode) */}
        <EarthBase />
        <TimelineMarkers
          nodes={timelineNodes}
          activeId={timelineNodes[activeIndex]?.id ?? timelineNodes[0].id}
          onSelect={onSelectNode}
        />
        <NetworkArcs nodes={timelineNodes} />
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
            intensity={0.5}
            luminanceThreshold={theme.bloomThreshold}
            luminanceSmoothing={0.15}
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
  const [tooltip, setTooltip] = useState<{
    label: string;
    position: THREE.Vector3;
  } | null>(null);
  const [cardVisible, setCardVisible] = useState(false);

  useEffect(() => {
    setSupported(isWebGLAvailable());
  }, []);

  useEffect(() => {
    // EXPLICIT INGESTION LOG (verification)
    // eslint-disable-next-line no-console
    console.log("TIMELINE LOADED", timelineNodes.length, timelineNodes);
  }, []);

  useEffect(() => {
    const tier = pickQualityTier(reducedMotion);
    setQuality(tier);
    if (reducedMotion) {
      setPaused(true);
      setAutoRotate(false);
    }
  }, [reducedMotion]);

  useEffect(() => {
    // Cinematic rhythm: focus first, then fade card.
    setActiveIndex(0);
    const t = window.setTimeout(() => setCardVisible(true), 420);
    return () => window.clearTimeout(t);
  }, []);

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

  return (
    <>
      <div className="globeStage" aria-label="Interactive 3D globe">
        <Canvas
          className="globeCanvas"
          camera={{ position: [0, 2.1, 6.2], fov: 45, near: 0.1, far: 50 }}
          dpr={dpr}
          gl={{
            antialias: false,
            powerPreference: "high-performance"
          }}
        >
          <Suspense fallback={null}>
            <Scene
              quality={quality}
              paused={paused}
              autoRotate={autoRotate && !reducedMotion}
              activeIndex={activeIndex}
              onSelectNode={(id) => {
                const idx = timelineNodes.findIndex((n) => n.id === id);
                if (idx >= 0) setActiveIndex(idx);
                setCardVisible(true);
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
        </Canvas>

        {/* Dim the globe behind the narrative card */}
        <div
          className={cardVisible ? "globeDim globeDimOn" : "globeDim"}
          aria-hidden="true"
        />

        <ExperienceCard
          visible={cardVisible}
          node={timelineNodes[clamp(activeIndex, 0, timelineNodes.length - 1)]}
          onClose={() => setCardVisible(false)}
          onPrev={() =>
            setActiveIndex((v) => clamp(v - 1, 0, timelineNodes.length - 1))
          }
          onNext={() =>
            setActiveIndex((v) => clamp(v + 1, 0, timelineNodes.length - 1))
          }
        />

        <div className="globeToggleRow" aria-label="Globe toggles">
          <button
            type="button"
            className="globeToggle"
            onClick={() => setAutoRotate((v) => !v)}
          >
            {autoRotate ? "Orbit on" : "Orbit off"}
          </button>
          <button
            type="button"
            className="globeToggle"
            onClick={() => setPaused((v) => !v)}
          >
            {paused ? "Play" : "Pause"}
          </button>
        </div>
      </div>
    </>
  );
}

function ExperienceCard({
  visible,
  node,
  onClose,
  onPrev,
  onNext
}: {
  visible: boolean;
  node: TimelineNode;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={visible ? "glassWrap glassWrapOn" : "glassWrap"} role="region">
      <div className="glassCard" aria-label="Experience card">
        <div className="glassTop">
          <div className="glassKicker">{node.locationLabel}</div>
          <div className="glassTitleRow">
            <h3 className="glassTitle">{node.heading}</h3>
            {node.timeframe ? <span className="glassMeta">{node.timeframe}</span> : null}
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

        <div className="glassFooter">
          <div className="glassNav">
            <button type="button" className="glassBtn" onClick={onPrev} aria-label="Previous">
              ‹
            </button>
            <button type="button" className="glassBtn" onClick={onNext} aria-label="Next">
              ›
            </button>
          </div>
          <button type="button" className="glassBtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
