import type { SVGProps } from "react";

export type IllustrationKind =
  | "hero"
  | "electrical"
  | "plumbing"
  | "mechanic"
  | "cleaning"
  | "tutoring"
  | "technician"
  | "ade-electric"
  | "ifeoma-plumbing"
  | "tunde-auto"
  | "amara-clean"
  | "chika-plumbing"
  | "zainab-tutor"
  | "emeka-tech"
  | "grace-clean"
  | "bisi-electric"
  | "sani-tech";

const COLORS: Record<string, { bg: string; accent: string; dark: string; line: string }> = {
  hero: { bg: "#E6EEE2", accent: "#1B7A57", dark: "#183D30", line: "#D9E4D8" },
  electrical: { bg: "#EAF0F3", accent: "#F8C554", dark: "#153F3A", line: "#D4E2E7" },
  plumbing: { bg: "#EAF5F0", accent: "#68B0A2", dark: "#1A4338", line: "#C7E4D8" },
  mechanic: { bg: "#F6ECDD", accent: "#D58A38", dark: "#442B1C", line: "#E7D0A7" },
  cleaning: { bg: "#EFF5DF", accent: "#A7BA59", dark: "#2B3B17", line: "#D9E5B2" },
  tutoring: { bg: "#F3EAF7", accent: "#9A78C5", dark: "#35284B", line: "#DECFEF" },
  technician: { bg: "#E4EEFC", accent: "#4F8EE0", dark: "#233D66", line: "#C8D9F7" },
  default: { bg: "#E6EEE2", accent: "#1B7A57", dark: "#183D30", line: "#D9E4D8" },
};

export function getServiceIllustration(categoryId: string): IllustrationKind {
  switch (categoryId) {
    case "electrical":
      return "electrical";
    case "plumbing":
      return "plumbing";
    case "mechanic":
      return "mechanic";
    case "cleaning":
      return "cleaning";
    case "tutoring":
      return "tutoring";
    case "technician":
      return "technician";
    default:
      return "hero";
  }
}

export function getProviderIllustration(providerId: string): IllustrationKind {
  switch (providerId) {
    case "ade-electric":
      return "ade-electric";
    case "ifeoma-plumbing":
      return "ifeoma-plumbing";
    case "tunde-auto":
      return "tunde-auto";
    case "amara-clean":
      return "amara-clean";
    case "chika-plumbing":
      return "chika-plumbing";
    case "zainab-tutor":
      return "zainab-tutor";
    case "emeka-tech":
      return "emeka-tech";
    case "grace-clean":
      return "grace-clean";
    case "bisi-electric":
      return "bisi-electric";
    case "sani-tech":
      return "sani-tech";
    default:
      return "hero";
  }
}

function getColors(kind: IllustrationKind) {
  return COLORS[kind] ?? COLORS.default;
}

function renderBadge(kind: IllustrationKind) {
  const glyphs: Record<string, string> = {
    hero: "✦",
    electrical: "⚡",
    plumbing: "🔧",
    mechanic: "🚗",
    cleaning: "✨",
    tutoring: "📚",
    technician: "🛠",
    "ade-electric": "⚡",
    "ifeoma-plumbing": "🔧",
    "tunde-auto": "🚗",
    "amara-clean": "✨",
    "chika-plumbing": "🔧",
    "zainab-tutor": "📚",
    "emeka-tech": "🛠",
    "grace-clean": "✨",
    "bisi-electric": "⚡",
    "sani-tech": "🛠",
  };

  return glyphs[kind] ?? "✦";
}

export function HandyNaijaIllustration({
  kind = "hero",
  className,
  label,
  ...props
}: { kind?: IllustrationKind; className?: string; label?: string } & SVGProps<SVGSVGElement>) {
  const colors = getColors(kind);
  const glyph = renderBadge(kind);

  return (
    <svg
      viewBox="0 0 260 200"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={`bg-${kind}`} x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor={colors.bg} />
          <stop offset="100%" stopColor={colors.line} />
        </linearGradient>
      </defs>
      <circle cx="172" cy="46" r="52" fill={`url(#bg-${kind})`} opacity="0.9" />
      <circle cx="58" cy="70" r="32" fill="rgba(255,255,255,0.35)" />
      <rect x="38" y="98" width="150" height="62" rx="20" fill={colors.dark} opacity="0.12" />
      <path d="M130 42 L186 82 H74 Z" fill={colors.accent} opacity="0.17" />
      <rect x="92" y="82" width="72" height="78" rx="18" fill={colors.dark} />
      <circle cx="128" cy="64" r="23" fill="#F2C9A0" />
      <path d="M94 129 C112 107, 145 107, 162 129" fill={colors.accent} opacity="0.8" />
      <rect x="108" y="104" width="16" height="46" rx="8" fill={colors.accent} />
      <rect x="136" y="104" width="16" height="46" rx="8" fill={colors.accent} />
      <rect x="83" y="110" width="26" height="52" rx="12" fill={colors.accent} opacity="0.9" transform="rotate(-18 83 110)" />
      <rect x="151" y="110" width="26" height="52" rx="12" fill={colors.accent} opacity="0.9" transform="rotate(18 151 110)" />
      <circle cx="214" cy="59" r="18" fill={colors.accent} opacity="0.9" />
      <text x="214" y="65" textAnchor="middle" fontSize="16" fill="#ffffff" fontWeight="700">{glyph}</text>
      <path d="M42 162 L72 144 L104 162" fill="none" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M158 162 L182 144 L222 165" fill="none" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
