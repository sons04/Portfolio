import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";

type Skill = {
  id: string;
  label: string;
  detail: string;
  color: string;
};

const skills: Skill[] = [
  {
    id: "aws",
    label: "AWS",
    detail: "Cloud architecture: IAM, networking, serverless, storage, CDN.",
    color: "#6fe7ff"
  },
  {
    id: "terraform",
    label: "Terraform",
    detail: "Infrastructure-as-Code modules and repeatable environments.",
    color: "#bf7bff"
  },
  {
    id: "react",
    label: "React",
    detail: "UI engineering with performance-aware component design.",
    color: "#7aa7ff"
  },
  {
    id: "angular",
    label: "Angular",
    detail: "Enterprise-grade frontend development and structured architecture.",
    color: "#ff5c7a"
  },
  {
    id: "web3",
    label: "Web3",
    detail: "Solidity + smart contracts, decentralised storage, token-gated UX.",
    color: "#a3ff6b"
  },
  {
    id: "security",
    label: "Security",
    detail: "SOC workflows: SIEM/EDR, threat hunting, forensics, scripting.",
    color: "#ffd36f"
  }
];

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

function SkillOrbits({
  onHover
}: {
  onHover: (skill: Skill | null, pos?: THREE.Vector3) => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const groupRef = useRef<THREE.Group>(null);

  const orbitRadii = useMemo(() => skills.map((_s, i) => 1.15 + i * 0.12), []);
  const phases = useMemo(() => skills.map((_s) => Math.random() * Math.PI * 2), []);
  const speeds = useMemo(() => skills.map((_s, i) => 0.22 + i * 0.03), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.07;
  });

  return (
    <group ref={groupRef}>
      {/* central hub */}
      <mesh>
        <sphereGeometry args={[0.24, 48, 48]} />
        <meshStandardMaterial
          color="#0c1222"
          emissive="#6fe7ff"
          emissiveIntensity={0.8}
          roughness={0.65}
          metalness={0.2}
        />
      </mesh>

      {skills.map((s, i) => (
        <OrbitingSkill
          key={s.id}
          skill={s}
          radius={orbitRadii[i]}
          phase={phases[i]}
          speed={speeds[i]}
          reducedMotion={reducedMotion}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

function OrbitingSkill({
  skill,
  radius,
  phase,
  speed,
  reducedMotion,
  onHover
}: {
  skill: Skill;
  radius: number;
  phase: number;
  speed: number;
  reducedMotion: boolean;
  onHover: (skill: Skill | null, pos?: THREE.Vector3) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = reducedMotion ? 0 : state.clock.getElapsedTime() * speed;
    const a = phase + t;
    pos.set(Math.cos(a) * radius, Math.sin(a * 0.7) * 0.24, Math.sin(a) * radius);
    ref.current.position.copy(pos);
  });

  return (
    <mesh
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(skill, (e.point as THREE.Vector3).clone());
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onHover(null);
      }}
    >
      <sphereGeometry args={[0.09, 24, 24]} />
      <meshStandardMaterial
        color={skill.color}
        emissive={skill.color}
        emissiveIntensity={0.8}
        roughness={0.35}
        metalness={0.15}
      />
    </mesh>
  );
}

export default function SkillsGalaxy() {
  const [hover, setHover] = useState<{ skill: Skill; pos: THREE.Vector3 } | null>(
    null
  );

  return (
    <div className="skillsGalaxy">
      <div className="skillsGalaxyHeader">
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Skills Galaxy
        </div>
        <h2 className="sectionTitle">A compact, interactive overview.</h2>
        <p className="sectionSubtitle">
          Hover a sphere to see a succinct capability statement. Motion is
          reduced automatically when the user prefers reduced motion.
        </p>
      </div>

      <div className="card skillsCanvasWrap" aria-label="Skills galaxy visualization">
        <Canvas
          className="skillsCanvas"
          camera={{ position: [0, 0.5, 3.2], fov: 50, near: 0.1, far: 50 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#05060a"]} />
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 2, 4]} intensity={1.1} />
          <pointLight position={[-4, -2, -4]} intensity={0.35} />

          <Suspense fallback={null}>
            <SkillOrbits
              onHover={(skill, p) => {
                if (!skill || !p) {
                  setHover(null);
                  return;
                }
                setHover({ skill, pos: p.clone() });
              }}
            />

            {hover ? (
              <Html position={hover.pos} center>
                <div className="skillTooltip">
                  <div className="skillTooltipTitle">{hover.skill.label}</div>
                  <div className="skillTooltipText">{hover.skill.detail}</div>
                </div>
              </Html>
            ) : null}
          </Suspense>

          <OrbitControls enablePan={false} enableDamping dampingFactor={0.08} />
        </Canvas>
      </div>
    </div>
  );
}

