import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/** Shared, deliberately plain building blocks for the admin dashboard —
 * a normal responsive tool for staff, styled distinctly from the kid app's
 * playful tablet UI but reusing the same brand color tokens. */

export function Button({
  children,
  variant = "primary",
  ...rest
}: { children: ReactNode; variant?: "primary" | "ghost" | "danger" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-brand-orange text-white hover:brightness-105",
    ghost: "border border-line bg-white text-ink hover:bg-cream",
    danger: "border border-[#F0B8AE] bg-[#FDF0EC] text-[#B3402F] hover:bg-[#FBE3DB]",
  }[variant];
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium text-ink/80">{label}</span>}
      <input
        {...rest}
        className={`rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-orange ${className ?? ""}`}
      />
    </label>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  const { label, className, children, ...rest } = props;
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium text-ink/80">{label}</span>}
      <select {...rest} className={`rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-orange ${className ?? ""}`}>
        {children}
      </select>
    </label>
  );
}

export function Badge({ tone, children }: { tone: "green" | "gray" | "orange" | "purple"; children: ReactNode }) {
  const styles = {
    green: "bg-[#EEF9E3] text-[#4F7C2A]",
    gray: "bg-[#EFEAE0] text-[#6E6047]",
    orange: "bg-[#FFF1DE] text-[#C7551A]",
    purple: "bg-[#F1EAFB] text-[#6E56A8]",
  }[tone];
  return <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${styles}`}>{children}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`flex max-h-[85vh] w-full ${wide ? "max-w-2xl" : "max-w-md"} flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-cream hover:text-ink" aria-label="Đóng">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line py-12 text-sm text-ink/50">{children}</div>;
}
