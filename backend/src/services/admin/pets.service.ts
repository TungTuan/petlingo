import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { PetInput, UpdatePetInput } from "../../schemas/admin.schema.js";

export async function listPets() {
  return prisma.pet.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}

export async function createPet(input: PetInput) {
  const existing = await prisma.pet.findUnique({ where: { key: input.key } });
  if (existing) throw new AppError(409, "Đã có pet dùng key này.", "PET_KEY_TAKEN");
  return prisma.pet.create({ data: input });
}

export async function updatePet(id: string, input: UpdatePetInput) {
  const existing = await prisma.pet.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Không tìm thấy pet.", "PET_NOT_FOUND");
  if (input.key && input.key !== existing.key) {
    const clash = await prisma.pet.findUnique({ where: { key: input.key } });
    if (clash) throw new AppError(409, "Đã có pet dùng key này.", "PET_KEY_TAKEN");
  }
  return prisma.pet.update({ where: { id }, data: input });
}

export async function deletePet(id: string) {
  const existing = await prisma.pet.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "Không tìm thấy pet.", "PET_NOT_FOUND");
  await prisma.pet.delete({ where: { id } });
}
