import React, { Suspense } from "react";

const GlobeHero = React.lazy(() => import("./components/globe/GlobeHero"));

export function App() {
  return (
    <div className="page">
      <section className="hero">
        <div className="card">
          <div className="copy">
            <div className="kicker">
              <span className="kickerDot" aria-hidden="true" />
              Futuristic Globe Motif
            </div>
            <h1 className="title">React portfolio hero, upgraded.</h1>
            <p className="subtitle">
              A premium 3D globe built with Three.js via React Three Fiber:
              atmosphere rim glow, network points, arcs, and gated
              postprocessing—plus pause and reduced-motion support.
            </p>

            <div className="pillRow" aria-label="Stack">
              <span className="pill">React</span>
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
                    This is lazy-loaded so the rest of the portfolio stays fast.
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
  );
}

