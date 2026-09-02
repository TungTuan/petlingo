import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";
import { getProgress, type ProgressState } from "./progress.service.js";
import { grantReward } from "./rewards.service.js";
import type { ShopPackageContentEntry, ShopPackageInput, UpdateShopPackageInput } from "../schemas/admin.schema.js";

/**
 * Shop packages — 2 kinds sharing 1 model (see schema.prisma's
 * ShopPackageKind doc comment): "combo" (bundle of items/coins/gems bought
 * with real coin/gem, repeatable) and "firstPurchase" ("Nạp lần đầu" — a
 * real-money-labeled demo claim, exactly once per child, no App Store/Google
 * Play integration exists — same "demo activation" pattern as
 * activatePremium()/activateVipSeason()). Admin-authored only, no
 * self-serve — same call as Battle Pass (business/monetization content, not
 * something a parent composes for their own kid).
 */

async function getOwnedChildOrThrow(childId: string, parentId: string) {
  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child || child.parentId !== parentId) {
    throw new AppError(404, "Không tìm thấy hồ sơ trẻ.", "CHILD_NOT_FOUND");
  }
  return child;
}

type RawPackage = {
  id: string;
  key: string;
  name: string;
  description: string;
  kind: string;
  color: string;
  imagePath: string;
  price: number;
  currency: string;
  realPriceLabel: string;
  contents: unknown;
};

export interface ShopPackageDto {
  id: string;
  key: string;
  name: string;
  description: string;
  kind: "combo" | "firstPurchase";
  color: string;
  imagePath: string;
  price: number;
  currency: "coin" | "gem";
  realPriceLabel: string;
  contents: ShopPackageContentEntry[];
  /** "combo" mua lại thoải mái nên luôn false; "firstPurchase" true khi trẻ
   * này đã nhận rồi (ẩn/khoá nút mua ở FE). */
  claimed: boolean;
}

function toDto(row: RawPackage, claimed: boolean): ShopPackageDto {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    kind: row.kind as "combo" | "firstPurchase",
    color: row.color,
    imagePath: row.imagePath,
    price: row.price,
    currency: row.currency as "coin" | "gem",
    realPriceLabel: row.realPriceLabel,
    contents: (row.contents ?? []) as ShopPackageContentEntry[],
    claimed,
  };
}

// ---- Child-facing --------------------------------------------------------

export async function listActivePackages(childId: string, parentId: string): Promise<ShopPackageDto[]> {
  await getOwnedChildOrThrow(childId, parentId);
  const [packages, claims] = await Promise.all([
    prisma.shopPackage.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.childPackageClaim.findMany({ where: { childId } }),
  ]);
  const claimedIds = new Set(claims.map((c) => c.packageId));
  return packages.map((p) => toDto(p, p.kind === "firstPurchase" && claimedIds.has(p.id)));
}

export interface PurchasePackageResult {
  progress: ProgressState;
  package: ShopPackageDto;
}

export async function purchasePackage(childId: string, parentId: string, packageId: string): Promise<PurchasePackageResult> {
  await getOwnedChildOrThrow(childId, parentId);
  const pkg = await prisma.shopPackage.findFirst({ where: { id: packageId, isActive: true } });
  if (!pkg) throw new AppError(404, "Không tìm thấy gói này.", "SHOP_PACKAGE_NOT_FOUND");
  const contents = (pkg.contents ?? []) as ShopPackageContentEntry[];

  if (pkg.kind === "firstPurchase") {
    // DB-constraint-based anti-double-claim — the claim row is created FIRST,
    // inside error handling, exact same pattern as battlePass.service.ts's
    // claimTier() (a unique-violation race just means "someone already
    // claimed it", never a double-grant).
    try {
      await prisma.childPackageClaim.create({ data: { childId, packageId } });
    } catch {
      throw new AppError(400, "Gói này chỉ nhận được 1 lần và bạn đã nhận rồi.", "SHOP_PACKAGE_ALREADY_CLAIMED");
    }
  } else {
    const progress = await prisma.progress.findUnique({ where: { childId } });
    if (!progress) throw new AppError(404, "Chưa có dữ liệu tiến độ.", "PROGRESS_NOT_FOUND");
    const balance = pkg.currency === "coin" ? progress.coins : progress.gems;
    if (balance < pkg.price) throw new AppError(409, pkg.currency === "coin" ? "Không đủ coin." : "Không đủ kim cương.", "INSUFFICIENT_FUNDS");
    await prisma.progress.update({
      where: { childId },
      data: pkg.currency === "coin" ? { coins: { decrement: pkg.price } } : { gems: { decrement: pkg.price } },
    });
  }

  for (const c of contents) {
    await grantReward(childId, c.kind, c.amount, c.itemKey ?? null);
  }

  return {
    progress: await getProgress(childId, parentId),
    package: toDto(pkg, pkg.kind === "firstPurchase"),
  };
}

// ---- Admin CRUD -----------------------------------------------------------

export async function adminListPackages() {
  return prisma.shopPackage.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
}

export async function adminGetPackage(id: string) {
  const pkg = await prisma.shopPackage.findUnique({ where: { id } });
  if (!pkg) throw new AppError(404, "Không tìm thấy gói này.", "SHOP_PACKAGE_NOT_FOUND");
  return pkg;
}

export async function adminCreatePackage(input: ShopPackageInput) {
  return prisma.shopPackage.create({
    data: { ...input, contents: input.contents.map((c) => ({ ...c, itemKey: c.itemKey ?? null })) },
  });
}

export async function adminUpdatePackage(id: string, input: UpdateShopPackageInput) {
  await adminGetPackage(id);
  return prisma.shopPackage.update({
    where: { id },
    data: { ...input, contents: input.contents ? input.contents.map((c) => ({ ...c, itemKey: c.itemKey ?? null })) : undefined },
  });
}

export async function adminDeletePackage(id: string) {
  await adminGetPackage(id);
  await prisma.shopPackage.delete({ where: { id } }); // cascades to claims
}
