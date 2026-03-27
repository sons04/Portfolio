import { z } from "zod";
import type { ExperienceNode } from "./experience";

const experienceSectionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("bullets"),
    title: z.string(),
    items: z.array(z.string())
  }),
  z.object({
    type: z.literal("text"),
    title: z.string(),
    text: z.string()
  })
]);

const citationSchema = z.object({
  label: z.string(),
  url: z.string().url()
});

const experienceNodeSchema = z.object({
  id: z.string(),
  stageTitle: z.string().optional(),
  heading: z.string(),
  locationLabel: z.string(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180)
  }),
  timeframe: z.string().optional(),
  sections: z.array(experienceSectionSchema),
  citations: z.array(citationSchema).optional()
});

const timelineSchema = z.array(experienceNodeSchema);

export function validateTimeline(data: unknown): ExperienceNode[] {
  const result = timelineSchema.safeParse(data);
  if (!result.success) {
    console.error(
      "[validateTimeline] Invalid timeline.json:",
      result.error.flatten()
    );
    return [];
  }
  return result.data;
}
