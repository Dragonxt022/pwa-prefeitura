export function IlustracaoCidade({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 560 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="cidade-ceu" x1="120" y1="60" x2="440" y2="360" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EAF3FF" />
          <stop offset="1" stopColor="#DDF7EE" />
        </linearGradient>
        <linearGradient id="cidade-predio" x1="118" y1="188" x2="118" y2="364" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A9C9FF" />
          <stop offset="1" stopColor="#7FAEF7" />
        </linearGradient>
        <linearGradient id="cidade-predio-2" x1="432" y1="206" x2="432" y2="364" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9FE7D3" />
          <stop offset="1" stopColor="#62CFB4" />
        </linearGradient>
        <filter id="cidade-sombra" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#1351B4" floodOpacity=".12" />
        </filter>
        <filter id="cidade-sombra-suave" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#1351B4" floodOpacity=".16" />
        </filter>
      </defs>

      <rect x="48" y="54" width="464" height="312" rx="84" fill="url(#cidade-ceu)" />
      <circle cx="430" cy="116" r="44" fill="#FDE68A" opacity=".8" />
      <circle cx="430" cy="116" r="27" fill="#FBBF24" />

      <path
        d="M80 124c8-14 25-19 41-13 7-16 29-23 44-11 12-10 31-7 39 6 16-2 29 7 33 18H80Z"
        fill="#fff"
        opacity=".85"
      />
      <path
        d="M232 102c6-11 21-15 33-9 5-12 22-17 33-8 9-7 23-4 28 5 12-1 21 5 24 13h-118Z"
        fill="#fff"
        opacity=".55"
      />

      <path d="M60 348c60-18 380-18 440 0v18c0 10-8 18-18 18H78c-10 0-18-8-18-18v-18Z" fill="#D7EFE7" />

      <rect x="66" y="188" width="100" height="176" rx="18" fill="url(#cidade-predio)" />
      <g fill="#F4F8FF" opacity=".9">
        <rect x="84" y="210" width="16" height="18" rx="4" />
        <rect x="112" y="210" width="16" height="18" rx="4" />
        <rect x="84" y="242" width="16" height="18" rx="4" />
        <rect x="112" y="242" width="16" height="18" rx="4" />
        <rect x="84" y="274" width="16" height="18" rx="4" />
        <rect x="112" y="274" width="16" height="18" rx="4" />
        <rect x="84" y="306" width="16" height="18" rx="4" />
        <rect x="112" y="306" width="16" height="18" rx="4" />
      </g>

      <rect x="186" y="238" width="88" height="126" rx="16" fill="#C7DEFF" />
      <g fill="#fff" opacity=".8">
        <rect x="202" y="258" width="14" height="16" rx="4" />
        <rect x="226" y="258" width="14" height="16" rx="4" />
        <rect x="202" y="286" width="14" height="16" rx="4" />
        <rect x="226" y="286" width="14" height="16" rx="4" />
        <rect x="202" y="314" width="14" height="16" rx="4" />
        <rect x="226" y="314" width="14" height="16" rx="4" />
      </g>

      <rect x="386" y="206" width="108" height="158" rx="18" fill="url(#cidade-predio-2)" />
      <g fill="#F0FFF9" opacity=".9">
        <rect x="404" y="228" width="16" height="18" rx="4" />
        <rect x="432" y="228" width="16" height="18" rx="4" />
        <rect x="404" y="260" width="16" height="18" rx="4" />
        <rect x="432" y="260" width="16" height="18" rx="4" />
        <rect x="404" y="292" width="16" height="18" rx="4" />
        <rect x="432" y="292" width="16" height="18" rx="4" />
      </g>

      <rect x="118" y="300" width="4" height="56" rx="2" fill="#7C8DA6" />
      <circle cx="120" cy="296" r="8" fill="#FBBF24" />
      <circle cx="120" cy="296" r="16" fill="#FBBF24" opacity=".18" />

      <g>
        <rect x="300" y="326" width="9" height="30" rx="4" fill="#8B5E3C" />
        <circle cx="305" cy="306" r="28" fill="#34D399" />
        <circle cx="286" cy="320" r="19" fill="#6EE7B7" />
        <circle cx="324" cy="320" r="19" fill="#6EE7B7" />
      </g>
      <g>
        <rect x="494" y="330" width="8" height="26" rx="4" fill="#8B5E3C" />
        <circle cx="498" cy="312" r="24" fill="#34D399" />
        <circle cx="482" cy="324" r="16" fill="#6EE7B7" />
        <circle cx="514" cy="324" r="16" fill="#6EE7B7" />
      </g>

      <g transform="rotate(-4 324 266)" filter="url(#cidade-sombra)">
        <rect x="262" y="148" width="124" height="236" rx="30" fill="#fff" stroke="#D8E6F8" strokeWidth="4" />
        <rect x="274" y="176" width="100" height="168" rx="18" fill="#F4F8FF" />
        <rect x="318" y="184" width="12" height="4" rx="2" fill="#C9D8F2" />
        <circle cx="324" cy="232" r="27" fill="#16A34A" />
        <path d="m312 232 9 9 16-18" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="294" y="274" width="60" height="8" rx="4" fill="#D9E6FA" />
        <rect x="294" y="290" width="42" height="8" rx="4" fill="#E6EEFA" />
        <rect x="294" y="314" width="72" height="18" rx="9" fill="#1351B4" opacity=".9" />
      </g>

      <g filter="url(#cidade-sombra-suave)">
        <path d="M454 158c0-12 9-22 21-22s21 10 21 22c0 15-21 34-21 34s-21-19-21-34Z" fill="#1351B4" />
        <circle cx="475" cy="158" r="7" fill="#fff" />
      </g>

      <path d="M206 92v16M198 100h16" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
      <path d="M510 172v12M504 178h12" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
      <path d="M164 150v10M159 155h10" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <circle cx="78" cy="268" r="5" fill="#FBBF24" />
      <circle cx="368" cy="118" r="4" fill="#34D399" />
    </svg>
  )
}

export function IlustracaoSucesso({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="120" cy="102" r="76" fill="#E7F8F0" />
      <circle cx="120" cy="100" r="46" fill="#16A34A" />
      <path d="m98 100 15 15 29-32" stroke="#fff" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="42" y="56" width="12" height="12" rx="3" fill="#FBBF24" transform="rotate(-18 42 56)" />
      <rect x="190" y="46" width="10" height="10" rx="3" fill="#60A5FA" transform="rotate(22 190 46)" />
      <rect x="36" y="136" width="9" height="9" rx="2" fill="#34D399" transform="rotate(14 36 136)" />
      <rect x="198" y="132" width="12" height="12" rx="3" fill="#F87171" transform="rotate(-24 198 132)" />
      <circle cx="64" cy="96" r="5" fill="#93C5FD" />
      <circle cx="184" cy="94" r="6" fill="#FBBF24" />
      <circle cx="170" cy="158" r="4" fill="#60A5FA" />
      <path d="M78 160c9-11 22-16 36-16M164 166c-7-9-17-14-29-14" stroke="#BBF7D0" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

export function IlustracaoBusca({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="120" cy="100" r="78" fill="#EEF4FF" />
      <circle cx="104" cy="92" r="45" fill="#fff" stroke="#1351B4" strokeWidth="9" />
      <path d="m138 126 42 42" stroke="#1351B4" strokeWidth="14" strokeLinecap="round" />
      <path
        d="M104 66c-11 0-20 9-20 20 0 14 20 31 20 31s20-17 20-31c0-11-9-20-20-20Z"
        fill="#DBEAFE"
      />
      <circle cx="104" cy="85" r="7" fill="#1351B4" />
      <path d="M58 150c11-6 23-9 36-9M158 54c8 3 15 8 20 14" stroke="#93C5FD" strokeWidth="5" strokeLinecap="round" />
      <path d="M186 130v12M180 136h12" stroke="#34D399" strokeWidth="3" strokeLinecap="round" />
      <path d="M54 64v10M49 69h10" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
