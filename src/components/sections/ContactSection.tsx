import React, { useState } from "react";
import { GlassCard } from "../../ui/GlassCard";
import { IconButton } from "../../ui/IconButton";
import { submitContactForm } from "../../lib/contactApi";
import { Fade } from "../../ui/Fade";

const CONTACT = {
  email: "work.sergioacosta@gmail.com",
  linkedIn: "https://www.linkedin.com/in/sergio-acosta-8b6277171/",
  github: "https://github.com/sons04"
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <IconButton
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      onClick={copy}
      className="contactCopyBtn"
    >
      {copied ? "✓" : "⎘"}
    </IconButton>
  );
}

export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [brief, setBrief] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    brief?: string;
  }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Please enter your name";
    if (!email.trim()) next.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Please enter a valid email";
    if (!brief.trim()) next.brief = "Please add a short message";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSending(true);
      setStatus(null);

      const message = await submitContactForm({ name, email, brief });

      setStatus({ type: "success", message });
      setName("");
      setEmail("");
      setBrief("");
      setErrors({});
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to send your message right now.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="contact" className="section" aria-label="Contact">
      <Fade triggerOnView>
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Contact
        </div>
      </Fade>
      <Fade triggerOnView className="fade--delay-1">
        <h2 className="sectionTitle">Let&apos;s talk about your project.</h2>
      </Fade>
      <Fade triggerOnView className="fade--delay-2">
        <p className="sectionSubtitle">Available for freelance, contract, and project-based work through an Australian ABN. Send a short note to start the conversation.</p>
      </Fade>

      <div className="contactGrid">
        <Fade triggerOnView className="fade--delay-1 fade--slide-sm">
          <GlassCard variant="panel" className="contactCard">
            <div className="contactTitle">Get in touch</div>
            <div className="hint" style={{ marginBottom: 16 }}>
              Available to hire through an Australian ABN.
            </div>
            <div className="contactRow">
              <span className="contactLabel">Email</span>
              <span className="contactRowRight">
                <a className="contactLink" href={`mailto:${CONTACT.email}`}>
                  {CONTACT.email}
                </a>
                <CopyButton text={CONTACT.email} />
              </span>
            </div>
            <div className="contactRow">
              <span className="contactLabel">LinkedIn</span>
              <span className="contactRowRight">
                <a
                  className="contactLink"
                  href={CONTACT.linkedIn}
                  target="_blank"
                  rel="noreferrer"
                >
                  Profile link
                </a>
                <CopyButton text={CONTACT.linkedIn} />
              </span>
            </div>
            <div className="contactRow">
              <span className="contactLabel">GitHub</span>
              <span className="contactRowRight">
                <a
                  className="contactLink"
                  href={CONTACT.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  Profile link
                </a>
                <CopyButton text={CONTACT.github} />
              </span>
            </div>
          </GlassCard>
        </Fade>

        <Fade triggerOnView className="fade--delay-2 fade--slide-sm">
          <GlassCard variant="panel" as="div" className="contactFormCard">
            <form
              onSubmit={handleSubmit}
              aria-label="Contact form"
              className="contactForm"
            >
              <div className="contactTitle">Send a message</div>
              <label className="field">
                <span>Name</span>
                <input
                  id="contact-name"
                  name="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "err-name" : undefined}
                />
                {errors.name && (
                  <span id="err-name" className="fieldError">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "err-email" : undefined}
                />
                {errors.email && (
                  <span id="err-email" className="fieldError">
                    {errors.email}
                  </span>
                )}
              </label>
              <label className="field">
                <span>Brief</span>
                <textarea
                  id="contact-brief"
                  name="brief"
                  placeholder="A few lines about the project, timeline, or where you need help."
                  rows={5}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  aria-invalid={!!errors.brief}
                  aria-describedby={errors.brief ? "err-brief" : undefined}
                />
                {errors.brief && (
                  <span id="err-brief" className="fieldError">
                    {errors.brief}
                  </span>
                )}
              </label>
              <button
                type="submit"
                className="contactSubmitBtn"
                disabled={isSending}
              >
                {isSending ? "Sending..." : "Send message"}
              </button>
              {status ? (
                <div
                  className="hint"
                  style={{
                    marginTop: 10,
                    whiteSpace: "pre-wrap",
                    color:
                      status.type === "success"
                        ? "var(--accent)"
                        : "var(--text-muted)",
                  }}
                >
                  {status.message}
                </div>
              ) : (
                <div className="hint" style={{ marginTop: 10 }}>
                  Helpful context: project type, timeline, scope, and preferred engagement.
                </div>
              )}
            </form>
          </GlassCard>
        </Fade>
      </div>
    </section>
  );
}
