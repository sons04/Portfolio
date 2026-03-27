import React, { Suspense, useEffect, useRef, useState } from "react";
import { GlassCard } from "./ui/GlassCard";
import { Pill } from "./ui/Pill";

const GlobeHero = React.lazy(() => import("./components/globe/GlobeHero"));
const SkillsGalaxy = React.lazy(() => import("./components/skills/SkillsGalaxy"));
const ProjectsCarousel = React.lazy(
  () => import("./components/sections/ProjectsCarousel")
);
const ContactSection = React.lazy(
  () => import("./components/sections/ContactSection")
);

export function App() {
  const [navHidden, setNavHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY < 24) {
        setNavHidden(false);
      } else if (delta > 8) {
        setNavHidden(true);
      } else if (delta < -8) {
        setNavHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="appShell">
      <header className={`siteNavWrap ${navHidden ? "siteNavWrapHidden" : ""}`}>
        <nav className="siteNav" aria-label="Primary">
          <a className="siteBrand" href="#hero">
            <span className="siteBrandDot" aria-hidden="true" />
            Sergio Acosta
          </a>

          <div className="siteNavLinks">
            <a href="#hero">Home</a>
            <a href="#skills">Skills</a>
            <a href="#projects">Projects</a>
            <a href="#contact">Contact</a>
          </div>

          <a className="siteNavCta" href="#contact">
            Let&apos;s talk
          </a>
        </nav>
      </header>

      <section id="hero" className="heroShell">
        <div className="heroIntro">
          <GlassCard variant="hero" className="heroCard">
            <div className="copy">
              <h1 className="title">
                Cloud architect, technical leader, microsoldering specialist, and
                security-minded builder.
              </h1>
              <p className="subtitle">
                Explore the globe to follow work across CTO leadership, cloud
                architecture, cybersecurity, MicroPython systems, and
                microsoldering services. Each stop is summarised for fast
                recruiter scanning with outcomes, technologies, and context.
              </p>

              <div className="pillRow" aria-label="Stack">
                <Pill>AWS</Pill>
                <Pill>Terraform</Pill>
                <Pill>React</Pill>
                <Pill>Angular</Pill>
                <Pill>MicroPython</Pill>
                <Pill>Microsoldering</Pill>
                <Pill>Cybersecurity</Pill>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="heroStage">
          <div className="card globeWrap globeWrapHero" aria-label="Interactive 3D globe">
            <Suspense
              fallback={
                <div className="globeFallback">
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      Loading 3D globe…
                    </p>
                    <p style={{ margin: "10px 0 0" }}>
                      The globe loads as a separate chunk to keep the initial
                      page responsive.
                    </p>
                  </div>
                </div>
              }
            >
              <GlobeHero />
            </Suspense>
          </div>
        </div>
      </section>

      <main className="page">
        <Suspense fallback={null}>
          <SkillsGalaxy />
        </Suspense>

        <Suspense fallback={null}>
          <ProjectsCarousel />
        </Suspense>

        <Suspense fallback={null}>
          <ContactSection />
        </Suspense>
      </main>
    </div>
  );
}

