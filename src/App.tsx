import React, { Suspense } from "react";

const GlobeHero = React.lazy(() => import("./components/globe/GlobeHero"));
const SkillsGalaxy = React.lazy(() => import("./components/skills/SkillsGalaxy"));
const ProjectsCarousel = React.lazy(
  () => import("./components/sections/ProjectsCarousel")
);
const ContactSection = React.lazy(
  () => import("./components/sections/ContactSection")
);

export function App() {
  return (
    <div>
      <div className="page">
        <section className="hero">
          <div className="card">
            <div className="copy">
              <div className="kicker">
                <span className="kickerDot" aria-hidden="true" />
                Futuristic Globe Portfolio
              </div>
              <h1 className="title">An interactive career timeline.</h1>
              <p className="subtitle">
                Scroll through milestones and watch the camera travel to each
                location. Each node opens a glassmorphism brief with outcomes
                and technologies, designed for quick recruiter readability.
              </p>

              <div className="pillRow" aria-label="Stack">
                <span className="pill">React</span>
                <span className="pill">Vite</span>
                <span className="pill">React Three Fiber</span>
                <span className="pill">Drei</span>
                <span className="pill">Postprocessing</span>
              </div>
            </div>
          </div>

          <div className="card globeWrap" aria-label="Interactive 3D globe">
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
        </section>
      </div>

      <Suspense fallback={null}>
        <SkillsGalaxy />
      </Suspense>

      <Suspense fallback={null}>
        <ProjectsCarousel />
      </Suspense>

      <Suspense fallback={null}>
        <ContactSection />
      </Suspense>
    </div>
  );
}

