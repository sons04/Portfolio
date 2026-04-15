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
  const [isPhoneViewport, setIsPhoneViewport] = useState(() => window.innerWidth <= 640);
  const lastScrollYRef = useRef(0);

  const closeMobileNav = () => setMobileNavOpen(false);

  useEffect(() => {
    const getScrollY = () =>
      Math.max(
        window.pageYOffset,
        document.documentElement.scrollTop,
        document.body.scrollTop,
        0
      );

    const updateNavVisibility = () => {
      const currentScrollY = getScrollY();
      const delta = currentScrollY - lastScrollYRef.current;
      const movement = Math.abs(delta);

      if (mobileNavOpen) {
        setNavHidden(false);
      } else if (currentScrollY < 48) {
        setNavHidden(false);
      } else if (movement >= 1 && delta > 0 && currentScrollY > 120) {
        setNavHidden(true);
      } else if (movement >= 1 && delta < 0) {
        setNavHidden(false);
      }

      lastScrollYRef.current = currentScrollY;
    };

    lastScrollYRef.current = getScrollY();
    const interval = window.setInterval(updateNavVisibility, 50);

    return () => {
      window.clearInterval(interval);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    const handleResize = () => {
      setIsPhoneViewport(window.innerWidth <= 640);
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
      <header
        className={`siteNavWrap ${navHidden ? "siteNavWrapHidden" : ""}`}
        style={{
          transform: navHidden ? "translateY(calc(-100% - 24px))" : "translateY(0)",
          opacity: navHidden ? 0 : 1
        }}
      >
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
                {isPhoneViewport
                  ? "Cloud architect, technical leader, and hands-on builder."
                  : "Cloud architect, technical leader, and hands-on builder across software, security, and hardware."}
              </h1>
              <p className="subtitle">
                Portfolio covering cloud infrastructure, frontend delivery,
                cybersecurity, embedded systems, and board-level repair.
                Available for freelance and contract work through an Australian
                ABN.
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
                      Loading interactive globe...
                    </p>
                    <p style={{ margin: "10px 0 0" }}>
                      It loads separately so the rest of the page stays fast.
                    </p>
                  </div>
                </div>
              }
            >
              <GlobeHero mobileCardHostId="globe-mobile-card-host" />
            </Suspense>
          </div>
          <div id="globe-mobile-card-host" className="globeMobileCardHost" />
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

