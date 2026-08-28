/**
 * Settings.tsx's "Khoá bằng mã phụ huynh" — a device-level lock in front of
 * Parent Area, same spirit as a phone's screen-time PIN: it's there to stop
 * a curious kid holding the (already-logged-in) device from wandering into
 * Parent Area, not to protect the account itself (that's the parent's real
 * email/password, already required to log in at all). So this lives in
 * localStorage, per device, rather than as account data on the server — a
 * fresh install/another device simply starts unlocked again, which is fine
 * for what this guards against.
 *
 * The PIN itself is hashed (SHA-256, Web Crypto) before being stored — not
 * for defending against a serious attacker (a 4-digit PIN never would), just
 * so a child poking at devtools/localStorage doesn't see the literal digits.
 */
const HASH_KEY = "petlingo.parentPinHash";

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isParentPinEnabled(): boolean {
  return localStorage.getItem(HASH_KEY) !== null;
}

export async function setParentPin(pin: string): Promise<void> {
  localStorage.setItem(HASH_KEY, await sha256Hex(pin));
}

export function clearParentPin(): void {
  localStorage.removeItem(HASH_KEY);
}

export async function verifyParentPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(HASH_KEY);
  if (!stored) return false;
  return (await sha256Hex(pin)) === stored;
}
