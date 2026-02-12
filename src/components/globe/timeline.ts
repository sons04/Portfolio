import raw from "../../data/timeline.json";

export type TimelineNode = {
  id: string;
  stageTitle: string;
  heading: string;
  locationLabel: string;
  coordinates: { lat: number; lon: number };
  timeframe?: string;
  sections: Array<
    | { type: "bullets"; title: string; items: string[] }
    | { type: "text"; title: string; text: string }
  >;
  citations?: Array<{ label: string; url: string }>;
};

export const timelineNodes = raw as TimelineNode[];

