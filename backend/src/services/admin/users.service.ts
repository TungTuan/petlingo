import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/errorHandler.js";
import type { ListQuery, UpdateUserInput } from "../../schemas/admin.schema.js";

export interface AdminUserSummary {
  id: string;
  email: string;
  phone: string | null;
  role: "PARENT" | "ADMIN";
  isActive: boolean;
  createdAt: Date;
  childrenCount: number;
}

export interface AdminUserDetail extends AdminUserSummary {
  children: { id: string; displayName: string; avatarId: string; birthYear: number | null; createdAt: Date }[];
}

export async function listUsers(query: ListQuery): Promise<{ users: AdminUserSummary[]; total: number; page: number; pageSize: number }> {
  const where = query.search
    ? { OR: [{ email: { contains: query.search, mode: "insensitive" as const } }, { phone: { contains: query.search, mode: "insensitive" as const } }] }
    : {};

  const [rows, total] = await Promise.all([
    prisma.parent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: { id: true, email: true, phone: true, role: true, isActive: true, createdAt: true, _count: { select: { children: true } } },
    }),
    prisma.parent.count({ where }),
  ]);

  return {
    users: rows.map((r) => ({ id: r.id, email: r.email, phone: r.phone, role: r.role, isActive: r.isActive, createdAt: r.createdAt, childrenCount: r._count.children })),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function getUser(id: string): Promise<AdminUserDetail> {
  const parent = await prisma.parent.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      children: { select: { id: true, displayName: true, avatarId: true, birthYear: true, createdAt: true } },
    },
  });
  if (!parent) throw new AppError(404, "Không tìm thấy người dùng.", "USER_NOT_FOUND");
  return { ...parent, childrenCount: parent.children.length };
}

export async function updateUser(id: string, requesterId: string, input: UpdateUserInput): Promise<AdminUserDetail> {
  if (id === requesterId && (input.isActive === false || input.role === "PARENT")) {
    throw new AppError(400, "Không thể tự khoá hoặc tự hạ quyền tài khoản đang đăng nhập.", "CANNOT_SELF_DEMOTE");
  }
  const exists = await prisma.parent.findUnique({ where: { id } });
  if (!exists) throw new AppError(404, "Không tìm thấy người dùng.", "USER_NOT_FOUND");

  await prisma.parent.update({ where: { id }, data: input });
  return getUser(id);
}

export async function deleteUser(id: string, requesterId: string): Promise<void> {
  if (id === requesterId) {
    throw new AppError(400, "Không thể tự xoá tài khoản đang đăng nhập.", "CANNOT_SELF_DELETE");
  }
  const exists = await prisma.parent.findUnique({ where: { id } });
  if (!exists) throw new AppError(404, "Không tìm thấy người dùng.", "USER_NOT_FOUND");
  await prisma.parent.delete({ where: { id } }); // cascades to children/progress
}
