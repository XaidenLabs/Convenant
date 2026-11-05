/** Interlocking shield / binding mark — navy + gold. */
export function CovenantMark({
  className = "h-10 w-10",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M32 4L54 14V30C54 44 44 54 32 60C20 54 10 44 10 30V14L32 4Z"
        stroke="#C9A227"
        strokeWidth="1.5"
        fill="#0A1628"
      />
      <path
        d="M22 28C22 28 26 24 32 24C38 24 42 28 42 28V36C42 42 37 46 32 48C27 46 22 42 22 36V28Z"
        stroke="#C9A227"
        strokeWidth="1.5"
        fill="transparent"
      />
      <path
        d="M26 34H38M32 30V42"
        stroke="#E0C56A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
