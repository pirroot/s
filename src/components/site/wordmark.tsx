type MarkProps = { className?: string };

/** Minimal pendant-luminaire mark: cord, dome shade, light dot. */
export function Mark({ className = "h-4 w-4" }: MarkProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M12 2.5v6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M6.75 13.25C6.75 10.9 9.1 9 12 9s5.25 1.9 5.25 4.25H6.75Z"
        fill="currentColor"
      />
      <circle cx="12" cy="18.5" r="1.3" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
  textClassName?: string;
};

export function Wordmark({ className = "", textClassName = "text-[13px] font-medium tracking-[0.42em]" }: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className="h-[18px] w-[18px] shrink-0" />
      <span className={`leading-none ${textClassName}`} style={{ marginRight: "-0.42em" }}>
        BATOLITE
      </span>
    </span>
  );
}
