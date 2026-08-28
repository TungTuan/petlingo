import { Capacitor } from "@capacitor/core";
import type { ReactNode } from "react";

/**
 * The dark tablet-device frame every screen sits inside — originally matched
 * the reference mockups' 1194×834 canvas exactly (dark bezel, 34px outer
 * radius, 22px inner radius, cream background); the canvas itself is now
 * 1680×834 (see `.device-frame` in index.css) to better match real phones'
 * landscape aspect ratio, the bezel styling is unchanged.
 *
 * The frame is a FIXED-size box (so every screen's own px-based
 * paddings/fonts/heights lay out exactly as designed, never reflowing) and
 * is visually shrunk to fit any viewport via `transform: scale()` — see
 * `.device-frame` in index.css. Sizing the box itself with width/height
 * `min()` math instead (the earlier approach) makes children overflow and
 * get clipped once the box goes smaller than the design's native size,
 * which is exactly what happened on phones.
 *
 * Inside a real native shell (Capacitor) the phone's own screen edge IS the
 * device edge — drawing a second fake bezel/shadow around the content on
 * top of that would look like a phone-in-a-phone. `Capacitor.isNativePlatform()`
 * is false for every other target (plain browser, including on a phone's
 * mobile browser) so the tablet-mockup look is untouched everywhere else.
 *
 * A real phone's landscape aspect ratio (~19.5:9, e.g. 932×430 ≈ 2.17:1) is
 * still somewhat wider than the design canvas (1680×834 ≈ 2.01:1 — widened
 * from the original 1194×834 ≈ 1.43:1 specifically to close most of this
 * gap, see index.css), so `scale()`-to-fit still leaves a little empty
 * space on the sides once scaled to match screen height (much smaller now:
 * confirmed empirically dropping from ~158px/side to ~33px/side on an
 * iPhone 14 Pro Max) — cropping instead (scaling to fill width and letting
 * height overflow) was tested and rejected: it hides the bottom nav bar and
 * the top status row entirely, so that's off the table. Filling whatever
 * bars remain with a soft brand-colored gradient instead of a flat block
 * reads as an intentional background rather than dead space — cheap, safe,
 * no risk of ever hiding real UI, unlike cropping.
 */
export default function ScreenFrame({ children }: { children: ReactNode }) {
  const isNative = Capacitor.isNativePlatform();
  return (
    <div
      className={`safe-frame-pad fixed inset-0 flex items-center justify-center overflow-hidden ${isNative ? "bg-gradient-to-br from-[#FDE9C8] via-[#FBF3E4] to-[#E4D9F7]" : "bg-[#1a1714]"}`}
    >
      <div className={`device-frame shrink-0 ${isNative ? "" : "rounded-screen bg-[#2E2A26] p-[14px] shadow-[0_18px_40px_rgba(0,0,0,.5)]"}`}>
        <div className={`relative h-full w-full overflow-hidden bg-cream ${isNative ? "" : "rounded-[22px]"}`}>{children}</div>
      </div>
    </div>
  );
}
