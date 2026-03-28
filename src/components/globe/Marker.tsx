import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { theme } from "../../styles/theme";
import type { TimelineNode } from "./timeline";
import { latLonToVector3 } from "./geo";

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

interface MarkerProps {
  node: TimelineNode;
  onSelect: (id: string) => void;
  onHover: (node: TimelineNode | null) => void;
  activeId: string;
  persistActiveTooltip?: boolean;
  sunDirection?: THREE.Vector3;
}

const SPHERE_RADIUS = 0.015;
const RING_INNER = 0.04;
const RING_OUTER = 0.065;
const RISE_AMOUNT = 1.018;
const HOVER_SCALE = 1.08;
const HOVER_LERP_SPEED = 6;

export function Marker({
  node,
  onSelect,
  onHover,
  activeId,
  persistActiveTooltip = false,
  sunDirection
}: MarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const hoverProgress = useRef(0);
  const isActive = node.id === activeId;
  const showTooltip = hovered || (persistActiveTooltip && isActive);

  const pos = useMemo(
    () =>
      latLonToVector3(
        node.coordinates.lat,
        node.coordinates.lon,
        RISE_AMOUNT
      ),
    [node.coordinates.lat, node.coordinates.lon]
  );

  const quat = useMemo(() => {
    const normal = pos.clone().normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }, [pos]);

  useFrame((_, dt) => {
    const target = hovered || isActive ? 1 : 0;
    hoverProgress.current += (target - hoverProgress.current) * Math.min(1, dt * HOVER_LERP_SPEED);
  });

  const p = easeOutCubic(Math.min(1, hoverProgress.current));
  const coreScale = hovered ? 1 + (HOVER_SCALE - 1) * p : 1 + (isActive ? 0.08 : 0) * p;
  const baseEmissive = 0.85 + (isActive ? 0.2 : 0) * p + (hovered ? 0.15 : 0) * p;
  const litFactor = sunDirection ? sunDirection.dot(pos.clone().normalize()) : 0;
  const emissiveIntensity = baseEmissive + (0.5 - 0.5 * litFactor) * 0.2;

  return (
    <group
      ref={groupRef}
      position={pos}
      quaternion={quat}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(node);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      <group scale={coreScale}>
        <GlowHalo />
        <mesh>
          <sphereGeometry args={[SPHERE_RADIUS, 20, 20]} />
          <meshStandardMaterial
          color={theme.colors.node}
          emissive={theme.colors.node}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0}
          transparent
          opacity={0.95}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
        </mesh>
      </group>
      <PulsingRing />
      <PinLine />
      {showTooltip && (
        <Html position={[0, 0.06, 0]} center>
          <div className="glass-tooltip markerTooltip">
            <span className="markerTooltipTitle">{node.heading}</span>
            <span className="markerTooltipLoc">{node.locationLabel}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

function GlowHalo() {
  return (
    <mesh scale={2.5}>
      <sphereGeometry args={[SPHERE_RADIUS, 16, 16]} />
      <meshBasicMaterial
        color={theme.colors.node}
        transparent
        opacity={0.15}
        depthWrite={false}
      />
    </mesh>
  );
}

const RING_CYCLE = 1.5;
const RING_SCALE_DUR = 1.2;

function PulsingRing() {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const shader = useMemo(
    () => ({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(theme.colors.node) }
      },
      vertexShader: `
        void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        void main() {
          float t = mod(uTime, ${RING_CYCLE.toFixed(2)});
          float fadeStart = ${RING_SCALE_DUR.toFixed(2)};
          float fadeDur = 0.3;
          float alpha = t < fadeStart ? 0.28 : 0.28 * max(0.0, 1.0 - (t - fadeStart) / fadeDur);
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime() % RING_CYCLE;
    const scalePhase = Math.min(1, t / RING_SCALE_DUR);
    const scale = 1 + easeOutQuad(scalePhase);
    if (groupRef.current) groupRef.current.scale.setScalar(scale);
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <ringGeometry args={[RING_INNER, RING_OUTER, 32]} />
        <shaderMaterial ref={matRef} {...shader} />
      </mesh>
    </group>
  );
}

function PinLine() {
  const h = 0.05;
  return (
    <mesh position={[0, 0, h / 2]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.0015, 0.0015, h, 8]} />
      <meshBasicMaterial
        color={theme.colors.node}
        transparent
        opacity={0.5}
        depthWrite={false}
      />
    </mesh>
  );
}
