export function Avatar({
  initials,
  size = "regular",
  label,
}: {
  initials: string;
  size?: "regular" | "large";
  label?: string;
}) {
  return (
    <span className={`avatar avatar--${size}`} role="img" aria-label={label ?? `Avatar ${initials}`}>
      {initials}
    </span>
  );
}
