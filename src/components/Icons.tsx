// Check icon component
export const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

// Tri-state "partially visible" mark — U+237B (NOT CHECK MARK).
// Used by the Appearance menu to indicate a part rendered at 50% opacity.
export const NotCheckIcon = () => (
  <span
    aria-hidden
    style={{
      width: 14,
      height: 14,
      fontSize: 15,
      lineHeight: "14px",
      fontWeight: 600,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {"\u237B"}
  </span>
)

// Arrow icon component
export const ChevronRightIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: "transform 0.2s ease",
      transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
      opacity: 0.6,
    }}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
)

export const DotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-dot-icon lucide-dot"
  >
    <circle cx="12.1" cy="12.1" r="4.5" fill="white" />
  </svg>
)
