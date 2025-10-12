export function Badge({ variant = "default", className = "", children }) {
    const base = "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium";
    const styles =
        variant === "secondary"
            ? "bg-[#f3f4f6] text-[#111827]"
            : variant === "outline"
                ? "border border-[#d1d5db] text-[#111827] bg-white"
                : "bg-[#111827] text-white";
    return <span className={[base, styles, className].join(" ")}>{children}</span>;
}