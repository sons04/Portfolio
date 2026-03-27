import React, { useState } from "react";
import { GlassCard } from "../../ui/GlassCard";
import { Pill } from "../../ui/Pill";

type Project = {
  title: string;
  summary: string;
  outcomes: string[];
  metric: string;
  systemBoundaries: string;
  tags: string[];
};

const projects: Project[] = [
  {
    title: "Geospatial media pipeline (AWS + Terraform)",
    summary:
      "Infrastructure-as-Code for ingestion, transcoding, and distribution of geospatial video and imagery.",
    outcomes: [
      "Designed and implemented scalable AWS infrastructure with Terraform (IaC).",
      "Automated deployment of networks, compute, and databases with CDN delivery.",
      "Integrated AWS Elemental MediaConvert for multi-format transcoding."
    ],
    metric: "Reduced deployment time from hours to ~15 minutes per environment.",
    systemBoundaries: "Owned: IaC, pipelines, security controls. Integrated: MediaConvert, CloudFront.",
    tags: ["Terraform", "AWS", "MediaConvert", "CloudFront"]
  },
  {
    title: "IoT agriculture platform",
    summary:
      "Cloud-backed sensor and robotics telemetry platform for sustainable agriculture.",
    outcomes: [
      "Built AWS-based IoT infrastructure supporting sensors and agricultural robotics.",
      "Reduced production costs through sustainable technology and IoT integration.",
      "Enabled evidence-driven decision-making via real-time telemetry."
    ],
    metric: "Reduced production costs by 70% through sustainable technology and IoT integration.",
    systemBoundaries: "Owned: IoT pipeline, backend services. Integrated: AWS IoT Core, DynamoDB.",
    tags: ["AWS IoT", "Lambda", "DynamoDB", "MicroPython"]
  },
  {
    title: "Web3 fan engagement",
    summary:
      "Membership and engagement primitives backed by smart contracts and decentralised storage.",
    outcomes: [
      "Developed smart-contract–driven systems and NFT-based membership mechanisms.",
      "Built React interface for low-friction onboarding.",
      "Managed distributed team across multiple time zones."
    ],
    metric: "Delivered end-to-end decentralised infrastructure with token-gated UX.",
    systemBoundaries: "Owned: Smart contracts, frontend. Integrated: IPFS, Ethereum.",
    tags: ["Solidity", "Ethereum", "IPFS", "React"]
  }
];

function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <GlassCard variant="panel" as="article" className="projectCard">
      <button
        type="button"
        className="projectCardHeader"
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
        aria-expanded={expanded}
        aria-controls={`project-${project.title.replace(/\s/g, "-")}`}
      >
        <div className="projectTitle">{project.title}</div>
        <div className="projectSummary">{project.summary}</div>
        <div className="projectTags" aria-label="Technologies">
          {project.tags.map((t) => (
            <Pill key={t} size="sm">
              {t}
            </Pill>
          ))}
        </div>
        <span className="projectExpandIcon" aria-hidden>
          {expanded ? "−" : "+"}
        </span>
      </button>

      <div
        id={`project-${project.title.replace(/\s/g, "-")}`}
        className={`projectExpanded ${expanded ? "projectExpanded--open" : ""}`}
        hidden={!expanded}
      >
        <ul className="projectOutcomes">
          {project.outcomes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <div className="projectMetric">{project.metric}</div>
        <div className="projectBoundaries">{project.systemBoundaries}</div>
      </div>
    </GlassCard>
  );
}

export default function ProjectsCarousel() {
  return (
    <section id="projects" className="section" aria-label="Projects">
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Projects
      </div>
      <h2 className="sectionTitle">Selected work, summarised for scanning.</h2>
      <p className="sectionSubtitle">
        Each item focuses on outcomes, system boundaries, and the technologies
        used. Expand for quantified metrics and details.
      </p>

      <div className="projectsGrid" role="list">
        {projects.map((p) => (
          <ProjectCard key={p.title} project={p} />
        ))}
      </div>
    </section>
  );
}

