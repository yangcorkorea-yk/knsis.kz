// Shared theme tokens + small UI primitives — Pretendard-only for KZ/RU/KR.

const T = {
  // Base
  bg: '#FFFFFF',
  bgWarm: '#FBF8F5',
  bgSoft: '#F7F4F0',
  // Brand
  rose: '#E8607A',
  roseDeep: '#C84365',
  roseSoft: '#FCE7EC',
  roseTint: '#FDF1F4',
  lavender: '#B8A4D4',
  lavenderSoft: '#EFE8F8',
  beige: '#D4B896',
  beigeSoft: '#F5EFE6',
  // Neutrals
  ink: '#1A1A1A',
  ink2: '#3A3A3A',
  text: '#5A5A5A',
  textMute: '#8A8A8A',
  border: '#ECE8E3',
  borderSoft: '#F2EEEA',
  // States
  success: '#2F9E6A',
  warn: '#D08A2C',
  // Font — single family for KZ/RU/KR. Pretendard covers Latin, Cyrillic, Hangul.
  // System fallback covers Kazakh extended glyphs on rare misses.
  font: '"Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
  // Display = same family, heavier weight + tight tracking (no serif anymore).
  serif: '"Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif',
};

// Inject stylesheet + load Pretendard once. Pretendard supports Cyrillic basic;
// system fallback covers any remaining glyphs (e.g. Kazakh ә/қ/ң on older platforms).
if (typeof document !== 'undefined' && !document.getElementById('kb-theme')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css';
  document.head.appendChild(link);

  const s = document.createElement('style');
  s.id = 'kb-theme';
  s.textContent = `
    .kb-screen { font-family: ${T.font}; color: ${T.ink}; background: ${T.bg}; -webkit-font-smoothing: antialiased; }
    .kb-screen *, .kb-screen *::before, .kb-screen *::after { box-sizing: border-box; }
    .kb-screen button { font-family: inherit; cursor: pointer; }
    .kb-display { font-weight: 700; letter-spacing: -0.04em; }
    .kb-hairline { background: ${T.border}; height: 1px; width: 100%; }
    .kb-chip { display:inline-flex; align-items:center; gap:4px; padding:4px 9px; border-radius:999px; font-size:11px; font-weight:500; line-height:1.2; }
    .kb-card { background:#fff; border:1px solid ${T.borderSoft}; border-radius:14px; }
    .kb-img-ph { background: linear-gradient(135deg, #F2E6EA 0%, #EAE0F0 100%); position:relative; overflow:hidden; }
    .kb-img-ph::before {
      content:""; position:absolute; inset:0;
      background-image:
        radial-gradient(ellipse at 30% 40%, rgba(255,255,255,.55), transparent 50%),
        radial-gradient(ellipse at 70% 70%, rgba(232,96,122,.18), transparent 50%);
    }
    .kb-img-ph.beige { background: linear-gradient(135deg, #F5EFE6 0%, #ECE2D2 100%); }
    .kb-img-ph.lav   { background: linear-gradient(135deg, #EFE8F8 0%, #DCD0EE 100%); }
    .kb-img-ph.rose  { background: linear-gradient(135deg, #FCE7EC 0%, #F5C9D5 100%); }
    .kb-img-ph.warm  { background: linear-gradient(135deg, #FBF1E9 0%, #F0DCC7 100%); }
    .kb-scroll::-webkit-scrollbar{display:none}
    .kb-scroll{ scrollbar-width:none; }
    .kb-press { transition: transform .12s, opacity .12s; }
    .kb-press:active { transform: scale(0.97); opacity: 0.85; }
  `;
  document.head.appendChild(s);
}

// ─── Navigation context ────────────────────────────────────────────
const NavCtx = React.createContext({ go: () => {}, current: 'home', back: () => {} });

function NavProvider({ value, children }) {
  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>;
}
function useNav() {
  return React.useContext(NavCtx);
}

// ─── Small SVG icons (stroke-based, 24x24) ─────────────────────────
const Icon = ({ d, size = 20, stroke = 'currentColor', fill = 'none', sw = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {typeof d === 'string' ? <path d={d}/> : d}
  </svg>
);

const Icons = {
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.3-4.3',
  home: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-8.5Z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  hospital: 'M4 21V8l8-4 8 4v13M9 21v-6h6v6M12 11v4M10 13h4',
  star: 'M12 3.5l2.7 5.5 6 .9-4.3 4.2 1 6L12 17.3 6.6 20l1-6L3.3 9.9l6-.9z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9ZM10 21a2 2 0 0 0 4 0',
  chat: 'M21 12a8 8 0 1 1-3.2-6.4L21 4l-1 4.2A8 8 0 0 1 21 12Z',
  check: 'M4 12.5 9.5 18 20 6.5',
  checkBadge: 'M9 12.5l2 2 4-4M5 7.5 12 3l7 4.5v4.5c0 4.5-3 8-7 9-4-1-7-4.5-7-9z',
  shield: 'M5 5.5 12 3l7 2.5V12c0 4.5-3 8-7 9-4-1-7-4.5-7-9z',
  globe: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0Z',
  pin: 'M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12ZM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  chevR: 'm9 5 7 7-7 7',
  chevL: 'm15 5-7 7 7 7',
  chevD: 'm5 9 7 7 7-7',
  x: 'M6 6l12 12M6 18 18 6',
  plus: 'M12 5v14M5 12h14',
  filter: 'M4 6h16M7 12h10M10 18h4',
  sort: 'M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5',
  language: 'M5 8h6M8 5v3m-3 6 4-6 4 6m-7-2h6M14 21l4-9 4 9m-7-2h6',
  arrow: 'm5 12h14m-5-5 5 5-5 5',
  shieldCheck: 'M5 5.5 12 3l7 2.5V12c0 4.5-3 8-7 9-4-1-7-4.5-7-9zM9 12l2 2 4-4',
  plane: 'M3 12l8-3 6-6 2 2-6 6-3 8-2-1 2-5-4 1-3-2z',
  calendar: 'M4 6h16v15H4zM4 10h16M9 3v4M15 3v4',
  hotel: 'M3 21V8l9-5 9 5v13H3zM9 21v-6h6v6M11 11h2',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  mail: 'M3 6h18v12H3zM3 6l9 7 9-7',
};

// ─── Bottom tab bar (fixed) — wired to nav ─────────────────────────
function BottomTab({ active = 'home' }) {
  const t = useT();
  const nav = useNav();
  const items = [
    { id: 'home',   label: t.nav.home,   icon: Icons.home,     target: 'home' },
    { id: 'cat',    label: t.nav.cat,    icon: Icons.grid,     target: 'cat' },
    { id: 'clinic', label: t.nav.clinic, icon: Icons.hospital, target: 'cl' },
    { id: 'review', label: t.nav.review, icon: Icons.star,     target: 'rv' },
    { id: 'me',     label: t.nav.me,     icon: Icons.user,     target: 'my' },
  ];
  return (
    <div style={{
      position:'absolute', left:0, right:0, bottom:0,
      background:'rgba(255,255,255,0.95)', backdropFilter:'blur(16px)',
      borderTop:`1px solid ${T.border}`,
      padding:'8px 8px 26px',
      display:'flex', justifyContent:'space-around',
      zIndex: 5,
    }}>
      {items.map(it => {
        const on = it.id === active;
        return (
          <button key={it.id}
            className="kb-press"
            onClick={() => nav.go && nav.go(it.target)}
            style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              color: on ? T.rose : T.textMute, padding:'4px 8px',
              flex:1, background:'none', border:'none',
            }}>
            <Icon d={it.icon} size={22} sw={on ? 1.9 : 1.5}/>
            <div style={{ fontSize:10.5, fontWeight: on ? 600 : 500, letterSpacing:'-0.2px' }}>{it.label}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Compact top app bar ───────────────────────────────────────────
function TopBar({ title, back = false, right = null, sub = null, transparent = false, onBack }) {
  const nav = useNav();
  return (
    <div style={{
      position:'sticky', top:0, zIndex:4,
      background: transparent ? 'transparent' : 'rgba(255,255,255,0.92)',
      backdropFilter:'blur(12px)',
      borderBottom: transparent ? 'none' : `1px solid ${T.borderSoft}`,
      padding:'10px 16px',
      display:'flex', alignItems:'center', gap:10, minHeight:48,
    }}>
      {back && (
        <button className="kb-press"
          onClick={() => (onBack ? onBack() : nav.back && nav.back())}
          style={{ background:'none', border:'none', padding:4, marginLeft:-4 }}>
          <Icon d={Icons.chevL} size={22} stroke={T.ink}/>
        </button>
      )}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:16, fontWeight:600, color:T.ink, letterSpacing:'-0.3px' }}>{title}</div>
        {sub && <div style={{ fontSize:11, color:T.textMute, marginTop:1 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// ─── Primary CTA button ────────────────────────────────────────────
function CTA({ children, variant = 'primary', size = 'lg', style = {}, icon = null, onClick }) {
  const v = variant === 'primary' ? {
    background: T.rose, color:'#fff',
    boxShadow:'0 4px 14px rgba(232,96,122,0.32)',
  } : variant === 'soft' ? {
    background: T.roseTint, color: T.roseDeep,
  } : variant === 'outline' ? {
    background:'#fff', color: T.ink, border:`1px solid ${T.border}`,
  } : variant === 'ink' ? {
    background:T.ink, color:'#fff',
  } : {
    background:T.ink, color:'#fff',
  };
  const sz = size === 'lg' ? { padding:'15px 20px', fontSize:15, borderRadius:14 }
           : size === 'md' ? { padding:'11px 16px', fontSize:13.5, borderRadius:11 }
           : { padding:'8px 12px', fontSize:12.5, borderRadius:9 };
  return (
    <button onClick={onClick}
      className="kb-press"
      style={{
        width:'100%', border:'none', fontWeight:600, letterSpacing:'-0.2px',
        display:'flex', alignItems:'center', justifyContent:'center', gap:7,
        cursor:'pointer',
        ...v, ...sz, ...style,
    }}>
      {icon}
      {children}
    </button>
  );
}

// ─── Verified badge ────────────────────────────────────────────────
function Badge({ children, tone = 'rose', size = 'sm' }) {
  const tones = {
    rose:    { bg:T.roseSoft, fg:T.roseDeep },
    lav:     { bg:T.lavenderSoft, fg:'#6E5A8C' },
    beige:   { bg:T.beigeSoft, fg:'#7A6A4A' },
    ink:     { bg:'#F2EFEC', fg:T.ink2 },
    success: { bg:'#E5F4EC', fg:'#1F7A4D' },
    korea:   { bg:'#FFF1F2', fg:T.roseDeep },
  };
  const tt = tones[tone] || tones.ink;
  const sz = size === 'md' ? { fontSize:12, padding:'5px 10px' } : { fontSize:10.5, padding:'3px 8px' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      background:tt.bg, color:tt.fg, borderRadius:999, fontWeight:600,
      ...sz,
    }}>{children}</span>
  );
}

// ─── Small SVG flag-ish dots (for language pick) ───────────────────
const LangDot = ({ kind }) => {
  if (kind === 'ru') return (
    <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#fff" stroke={T.border}/><rect x="2" y="9" width="24" height="5" fill="#0033A0"/><rect x="2" y="14" width="24" height="5" fill="#D52B1E"/></svg>
  );
  if (kind === 'kz') return (
    <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#00AFCA"/><circle cx="14" cy="13" r="4" fill="#FEC50C"/><g stroke="#FEC50C" strokeWidth="0.7"><line x1="14" y1="9" x2="14" y2="7"/><line x1="18" y1="13" x2="20" y2="13"/><line x1="14" y1="17" x2="14" y2="19"/><line x1="10" y1="13" x2="8" y2="13"/></g></svg>
  );
  if (kind === 'kr') return (
    <svg width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#fff" stroke={T.border}/><path d="M5 14a9 9 0 0 1 18 0 4.5 4.5 0 0 0-9 0 4.5 4.5 0 0 1-9 0Z" fill="#CD2E3A"/><path d="M5 14a9 9 0 0 0 18 0 4.5 4.5 0 0 1-9 0 4.5 4.5 0 0 0-9 0Z" fill="#0047A0"/></svg>
  );
  return null;
};

// Export
Object.assign(window, {
  T, Icon, Icons, BottomTab, TopBar, CTA, Badge, LangDot,
  NavCtx, NavProvider, useNav,
});
