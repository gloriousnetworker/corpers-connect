'use client';

interface ChatBackgroundProps {
  isDark: boolean;
}

export default function ChatBackground({ isDark }: ChatBackgroundProps) {
  const c = isDark ? '#00b368' : '#008751';
  const opacity = isDark ? 0.09 : 0.13;

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 380 720"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ opacity }}
      >
        <defs>
          <style>{`
            @keyframes dUp   { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-7px)} }
            @keyframes dDown { 0%,100%{transform:translateY(0)}  50%{transform:translateY(7px)}  }
            @keyframes dPulse{ 0%,100%{opacity:1}                50%{opacity:0.28}               }
            @keyframes dSpin { from{transform:rotate(0deg)}      to{transform:rotate(360deg)}    }
            @keyframes dSpnR { from{transform:rotate(0deg)}      to{transform:rotate(-360deg)}   }
            .du1{animation:dUp    7s  ease-in-out infinite       }
            .du2{animation:dUp    9s  ease-in-out infinite 2s    }
            .du3{animation:dUp    6s  ease-in-out infinite 4.5s  }
            .dd1{animation:dDown  8s  ease-in-out infinite 1s    }
            .dd2{animation:dDown  10s ease-in-out infinite 3s    }
            .dd3{animation:dDown  7s  ease-in-out infinite 5.5s  }
            .dp1{animation:dPulse 4s  ease-in-out infinite       }
            .dp2{animation:dPulse 5s  ease-in-out infinite 1.5s  }
            .dp3{animation:dPulse 6s  ease-in-out infinite 3s    }
            .ds1{animation:dSpin  18s linear     infinite;transform-box:fill-box;transform-origin:center}
            .ds2{animation:dSpnR  22s linear     infinite;transform-box:fill-box;transform-origin:center}
            .ds3{animation:dSpin  14s linear     infinite;transform-box:fill-box;transform-origin:center}
          `}</style>
        </defs>

        {/* ── Chat bubbles (outline style) ─────────────────────────────── */}
        <g className="du1">
          <rect x="18" y="38" width="72" height="30" rx="9" fill="none" stroke={c} strokeWidth="1.8"/>
          <path d="M24,68 L18,80 L38,68" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
          <circle cx="40" cy="53" r="3" fill={c}/>
          <circle cx="52" cy="53" r="3" fill={c}/>
          <circle cx="64" cy="53" r="3" fill={c}/>
        </g>

        <g className="dd1">
          <rect x="278" y="108" width="84" height="28" rx="9" fill="none" stroke={c} strokeWidth="1.8"/>
          <path d="M350,136 L364,149 L344,136" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
          <rect x="287" y="118" width="30" height="3" rx="1.5" fill={c}/>
          <rect x="287" y="125" width="22" height="3" rx="1.5" fill={c}/>
        </g>

        <g className="du2">
          <rect x="14" y="278" width="60" height="24" rx="8" fill="none" stroke={c} strokeWidth="1.6"/>
          <path d="M20,302 L14,313 L32,302" fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
          <circle cx="34" cy="290" r="2.5" fill={c}/>
          <circle cx="44" cy="290" r="2.5" fill={c}/>
          <circle cx="54" cy="290" r="2.5" fill={c}/>
        </g>

        <g className="dd2">
          <rect x="270" y="362" width="92" height="34" rx="10" fill="none" stroke={c} strokeWidth="1.8"/>
          <path d="M354,396 L367,410 L348,396" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
          <rect x="280" y="372" width="36" height="3" rx="1.5" fill={c}/>
          <rect x="280" y="379" width="26" height="3" rx="1.5" fill={c}/>
          <rect x="280" y="386" width="32" height="3" rx="1.5" fill={c}/>
        </g>

        <g className="du3">
          <rect x="10" y="497" width="68" height="26" rx="9" fill="none" stroke={c} strokeWidth="1.8"/>
          <path d="M16,523 L10,535 L30,523" fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
          <rect x="19" y="507" width="28" height="3" rx="1.5" fill={c}/>
          <rect x="19" y="514" width="20" height="3" rx="1.5" fill={c}/>
        </g>

        <g className="dd3">
          <rect x="293" y="588" width="68" height="24" rx="8" fill="none" stroke={c} strokeWidth="1.6"/>
          <path d="M353,612 L363,624 L344,612" fill="none" stroke={c} strokeWidth="1.6" strokeLinejoin="round"/>
          <circle cx="313" cy="600" r="2.5" fill={c}/>
          <circle cx="323" cy="600" r="2.5" fill={c}/>
          <circle cx="333" cy="600" r="2.5" fill={c}/>
        </g>

        {/* ── Stars / Sparkles ──────────────────────────────────────────── */}
        <g className="ds1">
          <path d="M190,46 L193,38 L196,46 L204,49 L196,52 L193,60 L190,52 L182,49Z" fill={c}/>
        </g>
        <g className="ds2">
          <path d="M48,198 L51,191 L54,198 L61,201 L54,204 L51,211 L48,204 L41,201Z" fill={c}/>
        </g>
        <g className="ds3">
          <path d="M338,298 L341,291 L344,298 L351,301 L344,304 L341,311 L338,304 L331,301Z" fill={c}/>
        </g>
        <g className="ds1">
          <path d="M158,458 L160,453 L162,458 L167,460 L162,462 L160,467 L158,462 L153,460Z" fill={c}/>
        </g>
        <g className="ds2">
          <path d="M283,538 L286,531 L289,538 L296,541 L289,544 L286,551 L283,544 L276,541Z" fill={c}/>
        </g>
        <g className="ds3">
          <path d="M98,648 L101,641 L104,648 L111,651 L104,654 L101,661 L98,654 L91,651Z" fill={c}/>
        </g>

        {/* ── Hearts ────────────────────────────────────────────────────── */}
        <g className="du1">
          <path d={`M338,68 C338,68 328,57 328,52 C328,48.1 331.1,45 335,45 C336.8,45 338.4,45.9 339.5,47.2 C340.6,45.9 342.2,45 344,45 C347.9,45 351,48.1 351,52 C351,57 338,68 338,68Z`} fill={c}/>
        </g>
        <g className="dd1">
          <path d={`M76,160 C76,160 66,150 66,145 C66,141.7 68.7,139 72,139 C73.6,139 75,139.8 76,141 C77,139.8 78.4,139 80,139 C83.3,139 86,141.7 86,145 C86,150 76,160 76,160Z`} fill={c}/>
        </g>
        <g className="du2">
          <path d={`M207,248 C207,248 197,238 197,233 C197,229.7 199.7,227 203,227 C204.6,227 206,227.8 207,229 C208,227.8 209.4,227 211,227 C214.3,227 217,229.7 217,233 C217,238 207,248 207,248Z`} fill={c}/>
        </g>
        <g className="dp1">
          <path d={`M356,418 C356,418 347,408.5 347,404 C347,401 349.5,398.5 352.5,398.5 C354,398.5 355.3,399.2 356,400.2 C356.7,399.2 358,398.5 359.5,398.5 C362.5,398.5 365,401 365,404 C365,408.5 356,418 356,418Z`} fill={c}/>
        </g>
        <g className="dd2">
          <path d={`M42,472 C42,472 32,462 32,457 C32,453.7 34.7,451 38,451 C39.6,451 41,451.8 42,453 C43,451.8 44.4,451 46,451 C49.3,451 52,453.7 52,457 C52,462 42,472 42,472Z`} fill={c}/>
        </g>
        <g className="du3">
          <path d={`M227,652 C227,652 217,642 217,637 C217,633.7 219.7,631 223,631 C224.6,631 226,631.8 227,633 C228,631.8 229.4,631 231,631 C234.3,631 237,633.7 237,637 C237,642 227,652 227,652Z`} fill={c}/>
        </g>

        {/* ── Wavy / zigzag lines ───────────────────────────────────────── */}
        <path className="dp2" d="M114,94 C119,87 127,101 135,94 S151,87 157,94" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        <path className="dp1" d="M198,173 C203,166 211,180 219,173 S235,166 243,173 S259,166 265,173" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        <path className="dp3" d="M100,338 C105,331 113,345 121,338 S137,331 143,338" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        <path className="dp2" d="M158,563 C163,556 171,570 179,563 S195,556 203,563 S219,556 227,563" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        <path className="dp1" d="M258,678 C263,671 271,685 279,678 S295,671 301,678" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        <path className="dp3" d="M113,428 C118,421 126,435 134,428 S150,421 156,428" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>

        {/* ── Typing dots "…" ───────────────────────────────────────────── */}
        <g className="dp2">
          <circle cx="198" cy="330" r="3.2" fill={c}/>
          <circle cx="208" cy="330" r="3.2" fill={c}/>
          <circle cx="218" cy="330" r="3.2" fill={c}/>
        </g>
        <g className="dp1">
          <circle cx="308" cy="200" r="3.2" fill={c}/>
          <circle cx="318" cy="200" r="3.2" fill={c}/>
          <circle cx="328" cy="200" r="3.2" fill={c}/>
        </g>
        <g className="dp3">
          <circle cx="150" cy="700" r="3.2" fill={c}/>
          <circle cx="160" cy="700" r="3.2" fill={c}/>
          <circle cx="170" cy="700" r="3.2" fill={c}/>
        </g>

        {/* ── Smiley face ───────────────────────────────────────────────── */}
        <g className="du2">
          <circle cx="205" cy="468" r="18" fill="none" stroke={c} strokeWidth="1.8"/>
          <circle cx="199" cy="463" r="2.3" fill={c}/>
          <circle cx="211" cy="463" r="2.3" fill={c}/>
          <path d="M197,472 Q205,480 213,472" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
        </g>

        {/* ── Phone / send icon ─────────────────────────────────────────── */}
        <g className="dd3">
          <path d="M155,108 L175,108 L175,95 L155,95 L155,108Z" fill="none" stroke={c} strokeWidth="1.6" rx="3"/>
          <line x1="162" y1="105" x2="168" y2="105" stroke={c} strokeWidth="1.6" strokeLinecap="round"/>
        </g>

        {/* ── Small scattered dots ──────────────────────────────────────── */}
        <circle className="dp1" cx="133" cy="163" r="3.5" fill={c}/>
        <circle className="dp2" cx="253" cy="288" r="3"   fill={c}/>
        <circle className="dp3" cx="88"  cy="393" r="4"   fill={c}/>
        <circle className="dp1" cx="308" cy="478" r="3"   fill={c}/>
        <circle className="dp2" cx="168" cy="618" r="3.5" fill={c}/>
        <circle className="dp3" cx="338" cy="148" r="2.5" fill={c}/>
        <circle className="dp1" cx="58"  cy="558" r="3"   fill={c}/>
        <circle className="dp2" cx="248" cy="143" r="2.5" fill={c}/>
        <circle className="dp3" cx="130" cy="545" r="3"   fill={c}/>
        <circle className="dp1" cx="355" cy="520" r="2.5" fill={c}/>
      </svg>
    </div>
  );
}
