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

interface DeferredSectionProps {
  anchorId: string;
  minHeight: number;
  children: React.ReactNode;
}

function DeferredSection({ anchorId, minHeight, children }: DeferredSectionProps) {
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(
    () => window.location.hash === `#${anchorId}`
  );

  useEffect(() => {
    const loadFromHash = () => {
      if (window.location.hash === `#${anchorId}`) {
        setShouldRender(true);
      }
    };

    loadFromHash();
    window.addEventListener("hashchange", loadFromHash);
    return () => window.removeEventListener("hashchange", loadFromHash);
  }, [anchorId]);

  useEffect(() => {
    if (shouldRender) return;
    if (!("IntersectionObserver" in window)) {
      setShouldRender(true);
      return;
    }

    const node = placeholderRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldRender]);

  useEffect(() => {
    if (!shouldRender || window.location.hash !== `#${anchorId}`) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(anchorId)?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [anchorId, shouldRender]);

  if (shouldRender) {
    return <>{children}</>;
  }

  return (
    <div
      ref={placeholderRef}
      id={anchorId}
      aria-hidden="true"
      style={{ minHeight }}
    />
  );
}

export function App() {
  const [navHidden, setNavHidden] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const lastScrollYRef = useRef(0);

  const closeMobileNav = () => setMobileNavOpen(false);

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 980) {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (window.innerWidth > 980) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  return (
    <div className="appShell">
      <header className={`siteNavWrap ${navHidden ? "siteNavWrapHidden" : ""}`}>
        <nav className={`siteNav ${mobileNavOpen ? "siteNavOpen" : ""}`} aria-label="Primary">
          <a className="siteBrand" href="#hero" onClick={closeMobileNav}>
            <span className="siteBrandDot" aria-hidden="true" />
            <span className="siteBrandText">Sergio Acosta</span>
            <span className="siteBrandTextCompact" aria-hidden="true">
              SA
            </span>
          </a>

          <button
            type="button"
            className={`siteNavToggle ${mobileNavOpen ? "siteNavToggleOpen" : ""}`}
            aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="site-nav-menu"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>

          <div
            id="site-nav-menu"
            className={`siteNavMenu ${mobileNavOpen ? "siteNavMenuOpen" : ""}`}
          >
            <div className="siteNavLinks">
              <a href="#hero" onClick={closeMobileNav}>Home</a>
              <a href="#skills" onClick={closeMobileNav}>Skills</a>
              <a href="#projects" onClick={closeMobileNav}>Projects</a>
              <a href="#contact" onClick={closeMobileNav}>Contact</a>
            </div>

            <a className="siteNavCta" href="#contact" onClick={closeMobileNav}>
              Let&apos;s talk
            </a>
          </div>
        </nav>
      </header>
      <button
        type="button"
        className={`siteNavBackdrop ${mobileNavOpen ? "siteNavBackdropVisible" : ""}`}
        aria-label="Close navigation menu"
        aria-hidden={!mobileNavOpen}
        tabIndex={mobileNavOpen ? 0 : -1}
        onClick={closeMobileNav}
      />

      <section id="hero" className="heroShell">
        <div className="heroIntro">
          <GlassCard variant="hero" className="heroCard">
            <div className="copy">
              <h1 className="title">
                Cloud architect, technical leader, microsoldering specialist, and
                security-minded builder.
              </h1>
              <p className="subtitle">
                A concise portfolio of delivery work, technical leadership, and
                hands-on engineering across cloud, security, embedded systems,
                and repair.
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
        <DeferredSection anchorId="projects" minHeight={620}>
          <Suspense fallback={null}>
            <ProjectsCarousel />
          </Suspense>
        </DeferredSection>

        <DeferredSection anchorId="skills" minHeight={540}>
          <Suspense fallback={null}>
            <SkillsGalaxy />
          </Suspense>
        </DeferredSection>

        <DeferredSection anchorId="contact" minHeight={420}>
          <Suspense fallback={null}>
            <ContactSection />
          </Suspense>
        </DeferredSection>
      </main>
    </div>
  );
}

