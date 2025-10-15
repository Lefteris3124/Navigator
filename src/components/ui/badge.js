export function Badge({ children, className = '' }) {
    return (
        <span
            className={`inline-block bg-blue-600 text-white text-sm font-medium px-2 py-1 rounded-md ${className}`}
        >
      {children}
    </span>
    );
}