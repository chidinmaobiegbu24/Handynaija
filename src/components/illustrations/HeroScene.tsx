import type { SVGProps } from "react";

export function HeroScene({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 520 420"
      role="img"
      aria-label="A friendly HandyNaija service professional holding a wrench outside a home, ready to help"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="heroSceneSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EAF4EB" />
          <stop offset="100%" stopColor="#F7F1E4" />
        </linearGradient>
        <linearGradient id="heroSceneShirt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1F835B" />
          <stop offset="100%" stopColor="#136A49" />
        </linearGradient>
      </defs>

      <rect width="520" height="420" fill="url(#heroSceneSky)" />

      <circle cx="428" cy="82" r="62" fill="#FFFFFF" opacity="0.5" />
      <circle cx="98" cy="102" r="40" fill="#FFFFFF" opacity="0.38" />
      <circle cx="132" cy="112" r="28" fill="#FFFFFF" opacity="0.3" />

      <path d="M0 322 Q260 296 520 324 L520 420 L0 420 Z" fill="#E1EDE0" />

      <g>
        <rect x="58" y="170" width="204" height="182" rx="12" fill="#FFFFFF" />
        <rect x="58" y="170" width="204" height="182" rx="12" fill="none" stroke="#DCE7DC" strokeWidth="2" />
        <path d="M42 178 160 96 278 178 Z" fill="#17704E" />
        <path d="M42 178 160 96 278 178 Z" fill="none" stroke="#0F5639" strokeWidth="2" opacity="0.22" />
        <rect x="214" y="112" width="18" height="44" rx="4" fill="#0F5639" />
        <rect x="84" y="260" width="58" height="92" rx="9" fill="#E9F1EA" />
        <rect x="84" y="260" width="58" height="92" rx="9" fill="none" stroke="#D2E2D6" strokeWidth="2" />
        <circle cx="132" cy="310" r="4" fill="#17704E" />
        <rect x="176" y="200" width="66" height="58" rx="9" fill="#CFE6F4" />
        <path d="M209 200v58M176 229h66" stroke="#FFFFFF" strokeWidth="6" />
        <rect x="176" y="200" width="66" height="58" rx="9" fill="none" stroke="#FFFFFF" strokeWidth="3" />
      </g>

      <g>
        <path d="M296 352h46l-7 36h-32z" fill="#D9A06B" />
        <path d="M319 350c-21-6-29-29-23-51 19 4 31 25 23 51Z" fill="#2E9A6A" />
        <path d="M319 350c17-8 21-33 13-51-17 6-25 29-13 51Z" fill="#37AB77" />
      </g>

      <g>
        <ellipse cx="322" cy="360" rx="72" ry="12" fill="#123D2E" opacity="0.1" />

        <rect x="296" y="276" width="24" height="78" rx="11" fill="#2C3E57" />
        <rect x="326" y="276" width="24" height="78" rx="11" fill="#33465F" />
        <rect x="288" y="346" width="38" height="16" rx="8" fill="#183D30" />
        <rect x="322" y="346" width="38" height="16" rx="8" fill="#1E4938" />

        <rect x="272" y="196" width="18" height="66" rx="9" fill="#1B7752" transform="rotate(-12 281 200)" />
        <circle cx="273" cy="258" r="11" fill="#C68642" />

        <rect x="286" y="186" width="72" height="98" rx="26" fill="url(#heroSceneShirt)" />
        <path d="M308 182l14 15 14-15-9-4h-10z" fill="#0F5639" />

        <rect x="286" y="262" width="72" height="16" rx="8" fill="#E2B44A" />
        <rect x="300" y="274" width="22" height="18" rx="6" fill="#C9932F" />
        <rect x="330" y="274" width="22" height="18" rx="6" fill="#C9932F" />

        <rect x="352" y="150" width="18" height="72" rx="9" fill="#1B7752" transform="rotate(26 361 190)" />
        <circle cx="392" cy="170" r="11" fill="#C68642" />
        <g transform="rotate(30 392 168)">
          <rect x="386" y="104" width="12" height="60" rx="6" fill="#C2CDD3" />
          <rect x="386" y="104" width="12" height="16" rx="6" fill="#9FACB4" />
          <path d="M379 108a19 19 0 0 0 26 0v-11a19 19 0 0 1-26 0z" fill="#9FACB4" />
        </g>

        <rect x="312" y="166" width="20" height="22" rx="8" fill="#B4783A" />
        <circle cx="322" cy="148" r="29" fill="#C68642" />
        <circle cx="293" cy="152" r="6" fill="#B4783A" />
        <circle cx="351" cy="152" r="6" fill="#B4783A" />
        <path d="M293 148a29 29 0 0 1 58 0Z" fill="#17704E" />
        <rect x="350" y="140" width="27" height="9" rx="4.5" fill="#0F5639" />
        <circle cx="313" cy="150" r="3" fill="#3A2A20" />
        <circle cx="332" cy="150" r="3" fill="#3A2A20" />
        <path d="M312 162c5 5 15 5 20 0" fill="none" stroke="#8C5A2B" strokeWidth="3" strokeLinecap="round" />
      </g>

      <g>
        <circle cx="452" cy="252" r="30" fill="#FFFFFF" />
        <circle cx="452" cy="252" r="30" fill="none" stroke="#D9E8DC" strokeWidth="2" />
        <path d="M441 252l7 7 15-16" fill="none" stroke="#17704E" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
