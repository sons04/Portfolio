import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  Bloom,
  EffectComposer,
  SMAA,
  SSAO,
  Vignette
} from "@react-three/postprocessing";
import { timelineNodes, type TimelineNode } from "./timeline";
import { Fade } from "../../ui/Fade";
import { IconButton } from "../../ui/IconButton";
import { clamp, latLonToVector3, vector3ToLatLon } from "./geo";
import { theme } from "../../styles/theme";
import { EarthView } from "./EarthView";
import { Marker } from "./Marker";
import { useExploreMode } from "../../hooks/useExploreMode";

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type QualityTier = "low" | "mid" | "high";
const GLOBE_DIM = 0.08;

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

const FLY_DURATION = 0.9;
const GLOBE_TILT_RAD = (23.5 * Math.PI) / 180;
const EXPLORE_MIN_DISTANCE = 2.45;
const EXPLORE_DEFAULT_DISTANCE = 2.9;
const EXPLORE_MAX_DISTANCE = 4.4;

function SpaceBackdrop({ quality }: { quality: QualityTier }) {
  const groupRef = useRef<THREE.Group>(null);
  const count = quality === "high" ? 2400 : quality === "mid" ? 1400 : 800;

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const warm = new THREE.Color("#ffe6c7");
    const cool = new THREE.Color("#cfe6ff");
    const white = new THREE.Color("#f8fbff");

    for (let i = 0; i < count; i++) {
      const radius = 12 + Math.random() * 18;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const roll = Math.random();
      const color = roll < 0.08 ? warm : roll < 0.16 ? cool : white;
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return starGeometry;
  }, [count]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.003;
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          size={0.05}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
      <mesh position={[0, 0, -16]} scale={[34, 24, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          color="#17345c"
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CameraTimelineRig({
  nodes,
  activeIndex,
  paused,
  autoRotate,
  controlsRef,
  globeRef,
  isExplore,
  mouseParallax
}: {
  nodes: TimelineNode[];
  activeIndex: number;
  paused: boolean;
  autoRotate: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  globeRef: React.RefObject<THREE.Group | null>;
  isExplore: boolean;
  mouseParallax: { x: number; y: number };
}) {
  const { camera } = useThree();
  const flyStartRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const flyProgressRef = useRef(1);
  const prevIndexRef = useRef(activeIndex);

  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const desiredPos = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (activeIndex !== prevIndexRef.current) {
      flyStartRef.current = {
        pos: camera.position.clone(),
        target: controlsRef.current?.target?.clone() ?? new THREE.Vector3(0, 0, 0)
      };
      flyProgressRef.current = 0;
      prevIndexRef.current = activeIndex;
    }
  }, [activeIndex, camera.position, controlsRef]);

  useFrame((_s, dt) => {
    if (isExplore || !globeRef.current) return;

    const node = nodes[clamp(activeIndex, 0, nodes.length - 1)];
    const localLookTarget = latLonToVector3(node.coordinates.lat, node.coordinates.lon, 0.98);
    desiredTarget.copy(globeRef.current.localToWorld(localLookTarget.clone()));

    // Base position “in front” of the target direction.
    const dist = 3.1;
    const localBasePos = localLookTarget.clone().normalize().multiplyScalar(dist);
    const drift = 0.0008 * Math.sin(_s.clock.getElapsedTime() * 0.3);
    const driftY = 0.0006 * Math.cos(_s.clock.getElapsedTime() * 0.23);
    const parallaxOffset = new THREE.Vector3(
      mouseParallax.x * 0.15 + drift,
      mouseParallax.y * 0.15 + driftY,
      0
    );
    desiredPos.copy(globeRef.current.localToWorld(localBasePos)).add(parallaxOffset);

    if (flyStartRef.current && flyProgressRef.current < 1) {
      flyProgressRef.current = Math.min(1, flyProgressRef.current + dt / FLY_DURATION);
      const t = easeInOutCubic(flyProgressRef.current);
      camera.position.lerpVectors(flyStartRef.current.pos, desiredPos, t);
      const target = new THREE.Vector3().lerpVectors(flyStartRef.current.target, desiredTarget, t);
      if (controlsRef.current) {
        controlsRef.current.target.copy(target);
      }
      camera.lookAt(target);
      if (flyProgressRef.current >= 1) {
        flyStartRef.current = null;
      }
    } else {
      const lerpFactor = 1 - Math.pow(0.0008, dt);
      camera.position.lerp(desiredPos, lerpFactor);
      if (controlsRef.current) {
        controlsRef.current.enableDamping = true;
        controlsRef.current.dampingFactor = 0.12;
        controlsRef.current.enablePan = false;
        controlsRef.current.autoRotate = autoRotate && !paused;
        controlsRef.current.autoRotateSpeed = 0.35;
        controlsRef.current.target.lerp(desiredTarget, lerpFactor);
        controlsRef.current.update();
      } else {
        camera.lookAt(desiredTarget);
      }
    }
  });

  return null;
}

function ExploreCenterRig({
  active,
  controlsRef
}: {
  active: boolean;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const center = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!active || !controls) return;

    if (camera.position.lengthSq() < 1e-6) {
      camera.position.set(0, 0, EXPLORE_DEFAULT_DISTANCE);
    }

    const radius = THREE.MathUtils.clamp(
      camera.position.length(),
      EXPLORE_MIN_DISTANCE,
      EXPLORE_MAX_DISTANCE
    );

    camera.position.normalize().multiplyScalar(Math.max(radius, EXPLORE_DEFAULT_DISTANCE));
    controls.target.copy(center);
    controls.enablePan = false;
    controls.minDistance = EXPLORE_MIN_DISTANCE;
    controls.maxDistance = EXPLORE_MAX_DISTANCE;
    controls.update();
  }, [active, camera, center, controlsRef]);

  return null;
}

function Scene({
  quality,
  dimAmount,
  paused,
  autoRotate,
  activeIndex,
  onSelectNode,
  onSurfacePick,
  onMarkerHover,
  tooltip,
  isExplore,
  mouseParallax
}: {
  quality: QualityTier;
  dimAmount: number;
  paused: boolean;
  autoRotate: boolean;
  activeIndex: number;
  onSelectNode: (id: string) => void;
  onSurfacePick: (localPoint: THREE.Vector3, tooltipWorld: THREE.Vector3) => void;
  onMarkerHover: (node: TimelineNode | null) => void;
  tooltip: { label: string; position: THREE.Vector3 } | null;
  isExplore: boolean;
  mouseParallax: { x: number; y: number };
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const globeRef = useRef<THREE.Group>(null);

  const enablePost = quality !== "low";
  const enableSSAO = quality === "high";
  const brightnessBoost = 1 - THREE.MathUtils.clamp(dimAmount, 0, 1);
  const ambientIntensity = 0.24 + brightnessBoost * 0.22;
  const hemisphereIntensity = 0.54 + brightnessBoost * 0.26;
  const keyLightIntensity = 3.1 + brightnessBoost * 1.1;
  const rimLightIntensity = 0.08 + brightnessBoost * 0.08;
  const bloomIntensity = 0.06 + brightnessBoost * 0.08;
  const vignetteDarkness = 0.46 - brightnessBoost * 0.16;

  const sunDir = useMemo(() => new THREE.Vector3(0.9, 0.5, 5.6).normalize(), []);
  const markersMemo = useMemo(
    () => timelineNodes.map((n) => (
      <Marker
        key={n.id}
        node={n}
        onSelect={onSelectNode}
        onHover={onMarkerHover}
        activeId={timelineNodes[activeIndex]?.id ?? timelineNodes[0].id}
        sunDirection={sunDir}
      />
    )),
    [activeIndex, onSelectNode, onMarkerHover, sunDir]
  );
  const handleSurfacePick = useCallback((worldPoint: THREE.Vector3) => {
    if (!globeRef.current) return;
    const localPoint = globeRef.current.worldToLocal(worldPoint.clone()).normalize();
    const tooltipWorld = globeRef.current.localToWorld(localPoint.clone().multiplyScalar(1.07));
    onSurfacePick(localPoint, tooltipWorld);
  }, [onSurfacePick]);

  return (
    <>
      <color attach="background" args={[theme.colors.bg]} />
      <fog attach="fog" args={["#020611", 8, 30]} />

      <SpaceBackdrop quality={quality} />

      <ambientLight intensity={ambientIntensity} />
      <hemisphereLight
        args={["#c9e4ff", "#0b1422", hemisphereIntensity]}
      />
      <directionalLight
        position={[1.2, 0.7, 5.8]}
        intensity={keyLightIntensity}
        castShadow={false}
      />
      <directionalLight position={[-2.2, 1.4, -3.5]} intensity={rimLightIntensity} castShadow={false} />

      <group
        onClick={(e) => {
          e.stopPropagation();
          handleSurfacePick(e.point.clone());
        }}
      >
        <RotatingGlobe paused={paused} isExplore={isExplore}>
          <group ref={globeRef} rotation={[GLOBE_TILT_RAD, 0, 0]}>
            <EarthView sunDirection={sunDir} dimAmount={dimAmount} />
            {markersMemo}
            <NetworkArcs nodes={timelineNodes} />
          </group>
        </RotatingGlobe>
      </group>

      {tooltip && (
        <Html position={tooltip.position} center>
          <div className="glass-tooltip">
            <span>{tooltip.label}</span>
          </div>
        </Html>
      )}

      <OrbitControls
        ref={controlsRef}
        enabled={isExplore}
        rotateSpeed={0.65}
        target={[0, 0, 0]}
        minDistance={EXPLORE_MIN_DISTANCE}
        maxDistance={EXPLORE_MAX_DISTANCE}
        minPolarAngle={0.6}
        maxPolarAngle={2.4}
        enablePan={false}
        enableDamping
        dampingFactor={0.1}
      />
      <ExploreCenterRig active={isExplore} controlsRef={controlsRef} />
      {!isExplore && (
        <CameraTimelineRig
          nodes={timelineNodes}
          activeIndex={activeIndex}
          paused={paused}
          autoRotate={autoRotate}
          controlsRef={controlsRef}
          globeRef={globeRef}
          isExplore={isExplore}
          mouseParallax={mouseParallax}
        />
      )}

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
            intensity={bloomIntensity}
            luminanceThreshold={0.7}
            luminanceSmoothing={0.2}
            mipmapBlur
          />
          <Vignette offset={0.2} darkness={vignetteDarkness} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}

function RotatingGlobe({
  paused,
  isExplore,
  children
}: {
  paused: boolean;
  isExplore: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_s, dt) => {
    if (!ref.current) return;
    if (paused || isExplore) return;
    ref.current.rotation.y += dt * (2 * Math.PI) / 120;
  });
  return <group ref={ref}>{children}</group>;
}

export default function GlobeHero() {
  const reducedMotion = usePrefersReducedMotion();
  const { isExplore, toggleExplore, setMode } = useExploreMode();
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
  const [panelFade, setPanelFade] = useState(true);
  const [transitionLock, setTransitionLock] = useState(false);
  const [mouseParallax, setMouseParallax] = useState({ x: 0, y: 0 });
  const wheelAccumRef = useRef(0);

  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const goToStageIndex = useCallback((targetIndex: number) => {
    if (transitionLock) return;
    const clamped = clamp(targetIndex, 0, timelineNodes.length - 1);
    setMode("narrative");
    setActiveIndex(clamped);
    setCardVisible(true);
    setTransitionLock(true);
    setPanelFade(false);
    setTimeout(() => {
      setPanelFade(true);
      setTimeout(() => setTransitionLock(false), 250);
    }, 150);
  }, [transitionLock, setMode]);

  const goToStage = useCallback((direction: 1 | -1) => {
    const target = clamp(
      activeIndexRef.current + direction,
      0,
      timelineNodes.length - 1
    );
    goToStageIndex(target);
  }, [goToStageIndex]);

  const handleWheel = (e: React.WheelEvent) => {
    if (reducedMotion || isExplore) return;
    e.preventDefault();
    wheelAccumRef.current += e.deltaY;
    const threshold = 80;
    if (wheelAccumRef.current >= threshold) {
      wheelAccumRef.current = 0;
      goToStage(1);
    } else if (wheelAccumRef.current <= -threshold) {
      wheelAccumRef.current = 0;
      goToStage(-1);
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isExplore) {
      const w = e.currentTarget.clientWidth;
      const h = e.currentTarget.clientHeight;
      const x = (e.clientX - w / 2) / (w / 2);
      const y = -(e.clientY - h / 2) / (h / 2);
      setMouseParallax({ x: x * 0.05, y: y * 0.05 });
    }
  }, [isExplore]);

  const handleMarkerHover = useCallback((node: TimelineNode | null) => {
    if (node) setTooltip(null);
  }, []);

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
    return [1, 1.5]; /* Cap DPR for performance */
  }, [quality]);
  const brightnessBoost = 1 - GLOBE_DIM;
  const toneMappingExposure = 1.1 + brightnessBoost * 0.6;
  const globeOverlayOpacity = cardVisible ? GLOBE_DIM * 0.04 : 0;

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
      <div
        className={`globeStage ${isExplore ? "globeStageExplore" : ""}`}
        aria-label="Interactive 3D globe"
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        style={{ touchAction: "none" }}
      >
        <Canvas
          className="globeCanvas"
          camera={{ position: [0, 2.1, 6.2], fov: 45, near: 0.18, far: 50 }}
          dpr={dpr}
          gl={{
            antialias: quality !== "low",
            powerPreference: "high-performance",
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure
          }}
          onCreated={({ gl }) => {
            THREE.ColorManagement.enabled = true;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = toneMappingExposure;
          }}
        >
          <Suspense fallback={null}>
            <Scene
              quality={quality}
              dimAmount={GLOBE_DIM}
              paused={paused}
              autoRotate={autoRotate && !reducedMotion}
              activeIndex={activeIndex}
              onSelectNode={(id) => {
                const idx = timelineNodes.findIndex((n) => n.id === id);
                if (idx >= 0) {
                  goToStageIndex(idx);
                  setTooltip(null);
                }
              }}
              onSurfacePick={(localPoint, tooltipWorld) => {
                const { lat, lon } = vector3ToLatLon(localPoint);
                setTooltip({
                  label: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}`,
                  position: tooltipWorld
                });
              }}
              onMarkerHover={handleMarkerHover}
              tooltip={tooltip}
              isExplore={isExplore}
              mouseParallax={mouseParallax}
            />
          </Suspense>
        </Canvas>

        {/* Dim the globe behind the narrative card */}
        <div
          className="globeDim"
          aria-hidden="true"
          style={{ background: `rgba(4, 8, 22, ${globeOverlayOpacity})` }}
        />

        <ExperienceCard
          visible={cardVisible}
          fadeActive={panelFade}
          node={timelineNodes[clamp(activeIndex, 0, timelineNodes.length - 1)]}
          onClose={() => setCardVisible(false)}
          onPrev={() => goToStage(-1)}
          onNext={() => goToStage(1)}
        />

        <div
          className={`globeExploreHint ${isExplore ? "globeExploreHint--visible" : ""}`}
          aria-live="polite"
        >
          Drag to explore. Click markers to focus.
        </div>

        <div className="globeToggleRow" aria-label="Globe toggles">
          <button
            type="button"
            className={`globeExplorePill ${isExplore ? "globeExplorePill--active" : ""}`}
            onClick={toggleExplore}
            aria-pressed={isExplore}
            aria-label={isExplore ? "Exit explore mode" : "Enter explore mode"}
          >
            Explore
          </button>
          {!isExplore && (
            <>
              <IconButton
                aria-label={autoRotate ? "Disable orbit" : "Enable orbit"}
                onClick={() => setAutoRotate((v) => !v)}
              >
                {autoRotate ? "⟳" : "⊙"}
              </IconButton>
              <IconButton
                aria-label={paused ? "Play" : "Pause"}
                onClick={() => setPaused((v) => !v)}
              >
                {paused ? "▶" : "‖"}
              </IconButton>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ExperienceCard({
  visible,
  fadeActive,
  node,
  onClose,
  onPrev,
  onNext
}: {
  visible: boolean;
  fadeActive: boolean;
  node: TimelineNode;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className={visible ? "glassWrap glassWrapOn" : "glassWrap"} role="region">
      <Fade key={node.id} active={fadeActive} className="glassCardWrap">
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
              <svg
                className="glassBtnIcon"
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M9.5 3.5L5.5 8l4 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button type="button" className="glassBtn" onClick={onNext} aria-label="Next">
              <svg
                className="glassBtnIcon"
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M6.5 3.5L10.5 8l-4 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <button type="button" className="glassBtn" onClick={onClose} aria-label="Close">
            <svg
              className="glassBtnIcon glassBtnIconClose"
              aria-hidden="true"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      </Fade>
    </div>
  );
}
