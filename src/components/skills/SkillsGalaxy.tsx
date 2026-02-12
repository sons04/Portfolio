import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, OrbitControls } from "@react-three/drei";
import { theme } from "../../styles/theme";

type Skill = {
  id: string;
  label: string;
  detail: string;
};

const skills: Skill[] = [
  {
    id: "aws",
    label: "AWS",
    detail: "Cloud architecture: IAM, networking, serverless, storage, CDN."
  },
  {
    id: "terraform",
    label: "Terraform",
    detail: "Infrastructure-as-Code modules and repeatable environments."
  },
  {
    id: "react",
    label: "React",
    detail: "UI engineering with performance-aware component design."
  },
  {
    id: "angular",
    label: "Angular",
    detail: "Enterprise-grade frontend development and structured architecture."
  },
  {
    id: "web3",
    label: "Web3",
    detail: "Solidity + smart contracts, decentralised storage, token-gated UX."
  },
  {
    id: "security",
    label: "Security",
    detail: "SOC workflows: SIEM/EDR, threat hunting, forensics, scripting."
  }
];

function Starfield({ count = 1800 }: { count?: number }) {
  const geom = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      sizes[i] = 0.6 + Math.random() * 1.8;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [count]);

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(theme.colors.star) },
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float aSize;
        uniform float uTime;
        varying float vA;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float tw = 0.55 + 0.45 * sin(uTime * 0.9 + position.x * 0.2 + position.y * 0.3);
          vA = tw;
          gl_PointSize = aSize * tw * (220.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vA;
        void main() {
          vec2 c = gl_PointCoord - vec2(0.5);
          float d = dot(c,c);
          float a = smoothstep(0.22, 0.0, d);
          gl_FragColor = vec4(uColor, a * vA);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
  }, []);

  useFrame((_s, dt) => {
    (mat.uniforms.uTime.value as number) += dt;
  });

  return <points geometry={geom} material={mat} />;
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
    groupRef.current.rotation.y = t * 0.05;
    groupRef.current.rotation.x = Math.sin(t * 0.12) * 0.04;
  });

  return (
    <group ref={groupRef}>
      {/* central hub */}
      <mesh>
        <sphereGeometry args={[0.24, 48, 48]} />
        <meshStandardMaterial
          color={theme.colors.bg}
          emissive={theme.colors.primary}
          emissiveIntensity={0.55}
          roughness={0.65}
          metalness={0.2}
          toneMapped={false}
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
          color={theme.colors.node}
          emissive={theme.colors.accent}
          emissiveIntensity={0.55}
          roughness={0.25}
          metalness={0.05}
          toneMapped={false}
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
          <color attach="background" args={[theme.colors.bg]} />
          <ambientLight intensity={0.25} />
          <directionalLight position={[3, 2, 4]} intensity={1.2} />
          <pointLight position={[-4, -2, -4]} intensity={0.22} />
          <Environment preset="night" environmentIntensity={0.55} />

          <Starfield />

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

