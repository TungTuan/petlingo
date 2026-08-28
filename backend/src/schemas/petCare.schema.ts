import { z } from "zod";

export const careActionSchema = z.object({
  action: z.enum(["feed", "bathe", "play", "sleep", "pat"]),
});
export type CareActionInput = z.infer<typeof careActionSchema>;
