import React from "react";
import { GlassCard } from "../../ui/GlassCard";
import { Pill } from "../../ui/Pill";

type CapabilityGroup = {
  title: string;
  summary: string;
  skills: string[];
  evidence: string[];
};

const highlightItems = [
  {
    label: "Core profile",
    value: "Technical leadership across cloud, product, and security"
  },
  {
    label: "Strength areas",
    value: "AWS, Terraform, React, Angular, Solidity, Python"
  },
  {
    label: "Context",
    value: "Experience across IoT, geospatial, Web3, SOC, and hardware repair"
  }
];

const capabilityGroups: CapabilityGroup[] = [
  {
    title: "Cloud architecture and platform delivery",
    summary:
      "Builds AWS platforms with repeatable infrastructure and production-ready delivery.",
    skills: ["AWS", "Terraform", "Lambda", "API Gateway", "CloudFront", "IAM", "MediaConvert"],
    evidence: [
      "Built AWS IoT infrastructure for agricultural operations.",
      "Delivered Terraform-based geospatial media pipelines with CDN delivery.",
      "Automated environment setup to reduce deployment effort and increase consistency."
    ]
  },
  {
    title: "Frontend and product engineering",
    summary:
      "Builds clear interfaces and product experiences with strong structure and usability.",
    skills: ["React", "Angular", "TypeScript", "UI architecture", "Interaction design"],
    evidence: [
      "Shipped React interfaces for decentralised products and token-gated experiences.",
      "Built structured Angular-based tooling for operational platforms.",
      "Combines product thinking with implementation leadership in CTO roles."
    ]
  },
  {
    title: "Web3 and distributed systems",
    summary:
      "Delivers smart-contract products with practical attention to reliability and onboarding.",
    skills: ["Solidity", "Ethereum", "IPFS", "NFT membership", "Wallet-connected UX"],
    evidence: [
      "Developed smart-contract systems and NFT-based membership mechanisms.",
      "Led distributed teams delivering Web3 products across time zones.",
      "Balanced decentralised infrastructure with user-facing product decisions."
    ]
  },
  {
    title: "Security, operations, and hardware",
    summary:
      "Applies a security mindset shaped by SOC workflows, forensics, and component-level work.",
    skills: ["Threat hunting", "Digital forensics", "SIEM", "EDR", "Python scripting", "Hardware diagnostics"],
    evidence: [
      "Worked in enterprise SOC and incident-response environments.",
      "Handled certified data sanitisation and audit-oriented workflows.",
      "Performed advanced board-level diagnostics and micro-soldering repair."
    ]
  }
];

export default function SkillsGalaxy() {
  return (
    <section id="skills" className="section skillsOverview" aria-label="Capabilities">
      <div className="kicker">
        <span className="kickerDot" aria-hidden="true" />
        Capabilities
      </div>
      <h2 className="sectionTitle">Clearer strengths, grouped for fast scanning.</h2>
      <p className="sectionSubtitle">
        Core strengths grouped for quick review.
      </p>

      <div className="skillsOverviewHighlights" role="list">
        {highlightItems.map((item) => (
          <GlassCard
            key={item.label}
            variant="panel"
            as="article"
            className="skillsOverviewHighlight"
          >
            <div className="skillsOverviewLabel">{item.label}</div>
            <div className="skillsOverviewValue">{item.value}</div>
          </GlassCard>
        ))}
      </div>

      <div className="skillsOverviewGrid" role="list">
        {capabilityGroups.map((group) => (
          <GlassCard
            key={group.title}
            variant="panel"
            as="article"
            className="skillsOverviewCard"
          >
            <div className="skillsOverviewCardTitle">{group.title}</div>
            <p className="skillsOverviewCardSummary">{group.summary}</p>

            <div className="skillsOverviewPills" aria-label={`${group.title} skills`}>
              {group.skills.map((skill) => (
                <Pill key={skill} size="sm">
                  {skill}
                </Pill>
              ))}
            </div>

            <div className="skillsOverviewEvidenceTitle">Evidence</div>
            <ul className="skillsOverviewEvidence">
              {group.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
