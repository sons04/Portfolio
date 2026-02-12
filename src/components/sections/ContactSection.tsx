import React from "react";

export default function ContactSection() {
  return (
    <section className="section" aria-label="Contact">
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Contact
      </div>
      <h2 className="sectionTitle">Let’s discuss outcomes and constraints.</h2>
      <p className="sectionSubtitle">
        If you are hiring or scoping a project, send a short brief. I respond
        best to clear context: constraints, timelines, and success criteria.
      </p>

      <div className="contactGrid">
        <div className="contactCard">
          <div className="contactTitle">Direct</div>
          <div className="contactRow">
            <span className="contactLabel">Email</span>
            <a className="contactLink" href="mailto:your.email@example.com">
              your.email@example.com
            </a>
          </div>
          <div className="contactRow">
            <span className="contactLabel">LinkedIn</span>
            <a
              className="contactLink"
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noreferrer"
            >
              Profile link
            </a>
          </div>
          <div className="contactRow">
            <span className="contactLabel">GitHub</span>
            <a
              className="contactLink"
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
            >
              Profile link
            </a>
          </div>
          <div className="contactNote">
            Replace the placeholders with your real links in
            <code style={{ paddingLeft: 6 }}>ContactSection.tsx</code>.
          </div>
        </div>

        <form
          className="contactCard"
          onSubmit={(e) => e.preventDefault()}
          aria-label="Contact form"
        >
          <div className="contactTitle">Message</div>
          <label className="field">
            <span>Name</span>
            <input placeholder="Your name" />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" placeholder="name@company.com" />
          </label>
          <label className="field">
            <span>Brief</span>
            <textarea
              placeholder="What are you building, what constraints matter, and what does success look like?"
              rows={5}
            />
          </label>
          <button className="btn" type="submit">
            Send (demo)
          </button>
          <div className="hint" style={{ marginTop: 10 }}>
            This is a static demo form (no backend yet).
          </div>
        </form>
      </div>
    </section>
  );
}

