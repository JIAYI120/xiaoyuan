function Illustration({ full = false }) {
  const style = full
    ? { width: '100%', height: '100%' }
    : { width: '100%', height: 'auto', maxWidth: '520px' };

  return (
    <svg viewBox="0 0 520 480" fill="none" xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio={full ? "xMidYMid slice" : "xMidYMid meet"}
      style={style}>
      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="520" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E7F8EE" />
          <stop offset="100%" stopColor="#D4F1E0" />
        </linearGradient>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#07C160" />
          <stop offset="100%" stopColor="#06AD56" />
        </linearGradient>
        <linearGradient id="serverGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C3E50" />
          <stop offset="100%" stopColor="#1A252F" />
        </linearGradient>
        <filter id="shadow1" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#07C160" floodOpacity="0.15" />
        </filter>
        <filter id="shadow2" x="-10%" y="-10%" width="130%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#000" floodOpacity="0.08" />
        </filter>
      </defs>

      <rect width="520" height="480" rx="0" fill="url(#bgGrad)" />

      <ellipse cx="260" cy="440" rx="180" ry="16" fill="#07C160" opacity="0.06" />

      <g filter="url(#shadow2)">
        <rect x="95" y="280" width="110" height="130" rx="10" fill="url(#serverGrad)" transform="skewY(-5)" />
        <rect x="95" y="280" width="110" height="20" rx="4" fill="#34495E" transform="skewY(-5)" />
        <rect x="107" y="305" width="70" height="5" rx="2.5" fill="#07C160" opacity="0.6" />
        <rect x="107" y="316" width="50" height="5" rx="2.5" fill="#07C160" opacity="0.4" />
        <rect x="107" y="327" width="60" height="5" rx="2.5" fill="#07C160" opacity="0.3" />
        <circle cx="185" cy="290" r="3.5" fill="#07C160" />
        <circle cx="175" cy="290" r="3.5" fill="#F39C12" />
        <rect x="107" y="342" width="70" height="5" rx="2.5" fill="#07C160" opacity="0.6" />
        <rect x="107" y="353" width="45" height="5" rx="2.5" fill="#07C160" opacity="0.4" />
        <rect x="107" y="364" width="55" height="5" rx="2.5" fill="#07C160" opacity="0.3" />
        <circle cx="185" cy="352" r="3.5" fill="#07C160" />
        <circle cx="175" cy="352" r="3.5" fill="#07C160" />
      </g>

      <g filter="url(#shadow2)">
        <rect x="315" y="260" width="110" height="150" rx="10" fill="url(#serverGrad)" transform="skewY(5)" />
        <rect x="315" y="260" width="110" height="20" rx="4" fill="#34495E" transform="skewY(5)" />
        <rect x="327" y="285" width="60" height="5" rx="2.5" fill="#3498DB" opacity="0.6" />
        <rect x="327" y="296" width="75" height="5" rx="2.5" fill="#3498DB" opacity="0.4" />
        <rect x="327" y="307" width="50" height="5" rx="2.5" fill="#3498DB" opacity="0.3" />
        <circle cx="405" cy="270" r="3.5" fill="#07C160" />
        <circle cx="395" cy="270" r="3.5" fill="#07C160" />
        <rect x="327" y="322" width="70" height="5" rx="2.5" fill="#3498DB" opacity="0.6" />
        <rect x="327" y="333" width="55" height="5" rx="2.5" fill="#3498DB" opacity="0.4" />
        <rect x="327" y="344" width="65" height="5" rx="2.5" fill="#3498DB" opacity="0.3" />
        <circle cx="405" cy="332" r="3.5" fill="#F39C12" />
        <circle cx="395" cy="332" r="3.5" fill="#07C160" />
        <rect x="327" y="359" width="60" height="5" rx="2.5" fill="#3498DB" opacity="0.5" />
        <rect x="327" y="370" width="45" height="5" rx="2.5" fill="#3498DB" opacity="0.3" />
        <circle cx="405" cy="395" r="3.5" fill="#07C160" />
      </g>

      <g filter="url(#shadow1)">
        <path
          d="M260 100 L310 130 L310 200 C310 230 288 252 260 262 C232 252 210 230 210 200 L210 130 Z"
          fill="url(#shieldGrad)"
        />
        <path
          d="M260 115 L298 138 L298 198 C298 222 280 240 260 248 C240 240 222 222 222 198 L222 138 Z"
          fill="white"
          opacity="0.15"
        />
        <path
          d="M245 185 L257 197 L280 170"
          stroke="white"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      <g opacity="0.7">
        <line x1="210" y1="260" x2="165" y2="280" stroke="#07C160" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="310" y1="250" x2="355" y2="265" stroke="#3498DB" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="210" y1="340" x2="315" y2="330" stroke="#07C160" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.4" />
      </g>

      <g>
        <circle cx="165" cy="280" r="8" fill="#07C160" opacity="0.2" />
        <circle cx="165" cy="280" r="4" fill="#07C160" />
        <circle cx="355" cy="265" r="8" fill="#3498DB" opacity="0.2" />
        <circle cx="355" cy="265" r="4" fill="#3498DB" />
      </g>

      <g>
        <circle cx="260" cy="190" r="6" fill="#F39C12" opacity="0.3" />
        <circle cx="260" cy="190" r="3" fill="#F39C12" />
        <circle cx="230" cy="210" r="5" fill="#E74C3C" opacity="0.3" />
        <circle cx="230" cy="210" r="2.5" fill="#E74C3C" />
        <circle cx="290" cy="205" r="5" fill="#9B59B6" opacity="0.3" />
        <circle cx="290" cy="205" r="2.5" fill="#9B59B6" />
      </g>

      <g filter="url(#shadow2)" opacity="0.9">
        <rect x="60" y="120" width="80" height="50" rx="8" fill="white" transform="rotate(-8 100 145)" />
        <rect x="70" y="132" width="40" height="4" rx="2" fill="#07C160" opacity="0.5" transform="rotate(-8 100 145)" />
        <rect x="70" y="142" width="55" height="4" rx="2" fill="#E8E8E8" transform="rotate(-8 100 145)" />
        <rect x="70" y="152" width="30" height="4" rx="2" fill="#E8E8E8" transform="rotate(-8 100 145)" />
      </g>

      <g filter="url(#shadow2)" opacity="0.9">
        <rect x="380" y="100" width="80" height="50" rx="8" fill="white" transform="rotate(6 420 125)" />
        <rect x="390" y="112" width="45" height="4" rx="2" fill="#3498DB" opacity="0.5" transform="rotate(6 420 125)" />
        <rect x="390" y="122" width="50" height="4" rx="2" fill="#E8E8E8" transform="rotate(6 420 125)" />
        <rect x="390" y="132" width="35" height="4" rx="2" fill="#E8E8E8" transform="rotate(6 420 125)" />
      </g>

      <circle cx="70" cy="380" r="18" fill="#07C160" opacity="0.06" />
      <circle cx="460" cy="350" r="24" fill="#3498DB" opacity="0.06" />
      <circle cx="480" cy="150" r="12" fill="#F39C12" opacity="0.08" />
      <circle cx="40" cy="200" r="10" fill="#9B59B6" opacity="0.06" />
    </svg>
  );
}

export default Illustration;
