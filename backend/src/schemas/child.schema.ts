import { z } from "zod";

const currentYear = new Date().getFullYear();

export const createChildSchema = z.object({
  displayName: z.string().trim().min(1, "Vui lòng nhập tên bé.").max(50),
  avatarId: z.string().trim().min(1, "Vui lòng chọn avatar."),
  birthYear: z.coerce
    .number()
    .int()
    .min(currentYear - 18, "Năm sinh không hợp lệ.")
    .max(currentYear, "Năm sinh không hợp lệ.")
    .optional(),
});
export type CreateChildInput = z.infer<typeof createChildSchema>;

export const updateChildSchema = z
  .object({
    displayName: z.string().trim().min(1).max(50).optional(),
    avatarId: z.string().trim().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Không có gì để cập nhật." });
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
