export function Card({ className = "", children }) {
    return <div className={"rounded-lg border border-[#e5e7eb] bg-white shadow " + className}>{children}</div>;
}
export function CardContent({ className = "", children }) {
    return <div className={"p-4 " + className}>{children}</div>;
}