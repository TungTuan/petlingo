import { z } from "zod";

export const createRoomSchema = z.object({
  childId: z.string().trim().min(1, "Thiếu hồ sơ trẻ."),
  lessonId: z.string().trim().min(1, "Thiếu bài học để đấu."),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const joinRoomSchema = z.object({
  childId: z.string().trim().min(1, "Thiếu hồ sơ trẻ."),
});
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
