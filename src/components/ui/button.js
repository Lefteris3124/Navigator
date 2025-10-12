export function Button({ className = "", size = "md", onClick, children }) {
    const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2", lg: "px-5 py-2.5 text-lg" };
    const base =
        "inline-flex items-center justify-center rounded-md border border-[#d1d5db] bg-white hover:bg-[#f9fafb] shadow";
    return (
        <button onClick={onClick} className={[base, sizes[size] || sizes.md, className].join(" ")}>
            {children}
        </button>
    );
}