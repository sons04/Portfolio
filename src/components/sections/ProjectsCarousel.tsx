import React from "react";

type Project = {
  title: string;
  description: string;
  tags: string[];
};

const projects: Project[] = [
  {
    title: "Geospatial media pipeline (AWS + Terraform)",
    description:
      "Infrastructure-as-Code for ingestion, transcoding, and distribution of geospatial video and imagery. Emphasis on security boundaries, repeatable environments, and delivery automation.",
    tags: ["Terraform", "AWS", "MediaConvert", "CloudFront"]
  },
  {
    title: "IoT agriculture platform",
    description:
      "Cloud-backed sensor and robotics telemetry platform to reduce operational costs and enable evidence-driven decision-making in sustainable agriculture.",
    tags: ["AWS IoT", "Lambda", "DynamoDB", "MicroPython"]
  },
  {
    title: "Web3 fan engagement",
    description:
      "Membership and engagement primitives backed by smart contracts, decentralised storage, and a React interface designed for low-friction onboarding.",
    tags: ["Solidity", "Ethereum", "IPFS", "React"]
  }
];

export default function ProjectsCarousel() {
  return (
    <section className="section" aria-label="Projects">
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Projects
      </div>
      <h2 className="sectionTitle">Selected work, summarised for scanning.</h2>
      <p className="sectionSubtitle">
        Each item focuses on outcomes, system boundaries, and the technologies
        used. This section is intentionally concise to keep attention on the
        narrative flow above.
      </p>

      <div className="projectsGrid" role="list">
        {projects.map((p) => (
          <article key={p.title} className="projectCard" role="listitem">
            <div className="projectTitle">{p.title}</div>
            <div className="projectDesc">{p.description}</div>
            <div className="projectTags" aria-label="Project technologies">
              {p.tags.map((t) => (
                <span key={t} className="projectTag">
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

