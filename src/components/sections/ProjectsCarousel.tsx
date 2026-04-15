import React, { useState } from "react";
import { GlassCard } from "../../ui/GlassCard";
import { Pill } from "../../ui/Pill";
import { Fade } from "../../ui/Fade";

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
      "Built the AWS infrastructure for ingesting, transcoding, and delivering geospatial video and imagery.",
    outcomes: [
      "Designed and delivered the AWS infrastructure in Terraform.",
      "Automated networks, compute, and database provisioning, including CDN delivery.",
      "Integrated AWS Elemental MediaConvert for multi-format transcoding."
    ],
    metric: "Cut environment setup time from hours to about 15 minutes.",
    systemBoundaries: "Ownership covered the IaC, deployment pipeline, and security setup, with MediaConvert and CloudFront integrations.",
    tags: ["Terraform", "AWS", "MediaConvert", "CloudFront"]
  },
  {
    title: "IoT agriculture platform",
    summary:
      "Built the cloud platform behind sensor data and robotics telemetry for sustainable agriculture.",
    outcomes: [
      "Built AWS-based IoT infrastructure to support sensors and agricultural robotics.",
      "Helped lower production costs through practical IoT adoption.",
      "Made real-time telemetry available for day-to-day operational decisions."
    ],
    metric: "Contributed to a 70% reduction in production costs.",
    systemBoundaries: "Ownership covered the IoT pipeline and backend services, with AWS IoT Core and DynamoDB integrations.",
    tags: ["AWS IoT", "Lambda", "DynamoDB", "MicroPython"]
  },
  {
    title: "Web3 fan engagement",
    summary:
      "Built Web3 membership and engagement features around smart contracts and token-gated access.",
    outcomes: [
      "Developed smart contract systems and NFT-based membership features.",
      "Built the React experience for simpler user onboarding.",
      "Led delivery across a distributed team working across time zones."
    ],
    metric: "Delivered a full token-gated product experience from contracts to frontend.",
    systemBoundaries: "Ownership covered the smart contracts and frontend, with IPFS and Ethereum integrations.",
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
      <Fade triggerOnView>
        <div className="kicker">
          <span className="kickerDot" aria-hidden="true" />
          Projects
        </div>
      </Fade>
      <Fade triggerOnView className="fade--delay-1">
        <h2 className="sectionTitle">Selected projects and the results behind them.</h2>
      </Fade>
      <Fade triggerOnView className="fade--delay-2">
        <p className="sectionSubtitle">A few examples of delivered systems and the outcomes behind them.</p>
      </Fade>

      <div className="projectsGrid" role="list">
        {projects.map((p, index) => (
          <Fade
            key={p.title}
            triggerOnView
            className={`fade--delay-${Math.min(index + 1, 4)} fade--slide-sm`}
          >
            <ProjectCard project={p} />
          </Fade>
        ))}
      </div>
    </section>
  );
}

