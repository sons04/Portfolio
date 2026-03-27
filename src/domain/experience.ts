export type ExperienceSection =
  | { type: "bullets"; title: string; items: string[] }
  | { type: "text"; title: string; text: string };

export interface ExperienceNode {
  id: string;
  stageTitle?: string;
  heading: string;
  locationLabel: string;
  coordinates: { lat: number; lon: number };
  timeframe?: string;
  sections: ExperienceSection[];
  citations?: Array<{ label: string; url: string }>;
}
