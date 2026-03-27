import raw from "../../data/timeline.json";
import { validateTimeline } from "../../domain/validateTimeline";
import type { ExperienceNode } from "../../domain/experience";

export type TimelineNode = ExperienceNode;

export const timelineNodes: TimelineNode[] = validateTimeline(raw);

