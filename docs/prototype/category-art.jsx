// Per-category visual: SVG illustration (default) + image-slot overlay
// for user-supplied AI-generated images. Drag-and-drop persists per slot id.

const CATEGORY_TONE = {
  skin:'rose',   botox:'lav',   filler:'beige',
  lift:'rose',   acne:'lav',    pigment:'warm',
  hair:'beige',  cosmetic:'rose', scalp:'lav',
};

const CATEGORY_COLORS = {
  rose:  { line: 'rgba(200,67,101,0.78)', fill: 'rgba(232,96,122,0.22)', hi:'#fff',
           bgFrom:'#FCE7EC', bgTo:'#F5C9D5' },
  lav:   { line: 'rgba(94,75,130,0.78)',  fill: 'rgba(184,164,212,0.28)', hi:'#fff',
           bgFrom:'#EFE8F8', bgTo:'#DCD0EE' },
  beige: { line: 'rgba(122,106,74,0.78)', fill: 'rgba(212,184,150,0.32)', hi:'#fff',
           bgFrom:'#F5EFE6', bgTo:'#ECE2D2' },
  warm:  { line: 'rgba(160,112,30,0.78)', fill: 'rgba(245,200,150,0.30)', hi:'#fff',
           bgFrom:'#FBF1E9', bgTo:'#F0DCC7' },
};

// SVG strings — used both for inline React rendering and to bake the
// fallback into the image-slot via a data: URL.
const CATEGORY_MOTIF_STR = {
  skin: (c) => `
    <circle cx="34" cy="36" r="18" fill="${c.fill}" opacity="0.7"/>
    <circle cx="34" cy="36" r="12" fill="${c.fill}"/>
    <path d="M34 14 C 38 22, 44 28, 34 38 C 24 28, 30 22, 34 14 Z" fill="${c.line}" opacity="0.92"/>
    <circle cx="50" cy="18" r="1.6" fill="${c.hi}" opacity="0.9"/>
    <circle cx="46" cy="13" r="0.9" fill="${c.hi}" opacity="0.7"/>
  `,
  botox: (c) => `
    <path d="M10 24 Q32 18, 54 24" stroke="${c.line}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M10 34 Q32 28, 54 34" stroke="${c.line}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.7"/>
    <path d="M10 44 Q32 38, 54 44" stroke="${c.line}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.4"/>
    <g opacity="0.85">
      <rect x="46" y="11" width="2" height="9" rx="1" fill="${c.line}" transform="rotate(28 47 15)"/>
      <circle cx="44" cy="22" r="1.3" fill="${c.line}"/>
    </g>
  `,
  filler: (c) => `
    <path d="M22 18 Q14 30, 18 42 Q22 50, 30 50 Q40 50, 44 42 Q48 32, 44 22 Q38 14, 30 14 Q24 14, 22 18 Z"
      fill="${c.fill}" stroke="${c.line}" stroke-width="1.6"/>
    <circle cx="36" cy="28" r="1.4" fill="${c.line}"/>
    <path d="M34 40 Q38 42, 42 39" stroke="${c.line}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <g opacity="0.7" stroke="${c.hi}" stroke-width="1.4" stroke-linecap="round">
      <line x1="50" y1="30" x2="54" y2="30"/>
      <line x1="52" y1="28" x2="52" y2="32"/>
    </g>
  `,
  lift: (c) => `
    <path d="M16 48 Q20 36, 26 30 Q34 22, 44 22" stroke="${c.line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M38 18 L46 22 L44 30" stroke="${c.line}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 56 Q22 46, 30 40 Q40 30, 50 30" stroke="${c.line}" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.35"/>
  `,
  acne: (c) => `
    <circle cx="18" cy="22" r="3.2" fill="${c.line}"/>
    <circle cx="26" cy="34" r="2.2" fill="${c.line}" opacity="0.75"/>
    <circle cx="18" cy="44" r="2.6" fill="${c.line}" opacity="0.55"/>
    <circle cx="26" cy="48" r="1.4" fill="${c.line}" opacity="0.4"/>
    <line x1="32" y1="12" x2="32" y2="52" stroke="${c.line}" stroke-width="0.9" stroke-dasharray="2 3" opacity="0.55"/>
    <circle cx="44" cy="32" r="14" fill="${c.fill}" opacity="0.85"/>
    <circle cx="44" cy="32" r="8" fill="${c.fill}"/>
    <circle cx="48" cy="26" r="1.2" fill="${c.hi}"/>
  `,
  pigment: (c) => `
    <circle cx="18" cy="32" r="7" fill="${c.line}" opacity="0.95"/>
    <circle cx="32" cy="32" r="7" fill="${c.line}" opacity="0.6"/>
    <circle cx="46" cy="32" r="7" fill="${c.line}" opacity="0.3"/>
    <circle cx="52" cy="22" r="1.4" fill="${c.hi}" opacity="0.95"/>
  `,
  hair: (c) => `
    <path d="M10 22 L 50 30" stroke="${c.line}" stroke-width="2" stroke-linecap="round"/>
    <path d="M10 30 L 50 38" stroke="${c.line}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <path d="M10 38 L 50 46" stroke="${c.line}" stroke-width="2" stroke-linecap="round" opacity="0.45"/>
    <circle cx="52" cy="30" r="3.2" fill="${c.hi}" stroke="${c.line}" stroke-width="1.6"/>
    <g opacity="0.8" stroke="${c.line}" stroke-width="1.4" stroke-linecap="round">
      <line x1="14" y1="48" x2="14" y2="54"/>
      <line x1="20" y1="48" x2="20" y2="52"/>
      <line x1="26" y1="48" x2="26" y2="50"/>
    </g>
  `,
  cosmetic: (c) => `
    <ellipse cx="28" cy="30" rx="13" ry="17" fill="${c.fill}" stroke="${c.line}" stroke-width="1.6"/>
    <circle cx="24" cy="28" r="1.3" fill="${c.line}"/>
    <circle cx="33" cy="28" r="1.3" fill="${c.line}"/>
    <path d="M25 36 Q28 38, 31 36" stroke="${c.line}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <path d="M44 20 Q56 20, 56 28 Q56 34, 50 34 L48 38 L46 34 Q44 33, 44 28 Q44 20, 44 20 Z" fill="${c.hi}" stroke="${c.line}" stroke-width="1.5"/>
    <line x1="47" y1="26" x2="53" y2="26" stroke="${c.line}" stroke-width="1.4" stroke-linecap="round"/>
    <line x1="47" y1="30" x2="51" y2="30" stroke="${c.line}" stroke-width="1.4" stroke-linecap="round"/>
  `,
  scalp: (c) => `
    <path d="M14 44 Q14 22, 32 18 Q50 22, 50 44" fill="${c.fill}" stroke="${c.line}" stroke-width="1.6"/>
    <g stroke="${c.line}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0.9">
      <path d="M18 36 Q20 24, 24 18"/>
      <path d="M26 36 Q28 24, 32 18"/>
      <path d="M34 36 Q36 24, 40 18"/>
      <path d="M42 36 Q44 24, 48 18"/>
    </g>
    <circle cx="32" cy="22" r="1.4" fill="${c.hi}" opacity="0.9"/>
  `,
};

// Build a data: URL of the SVG illustration so image-slot can use it as the
// default fallback. User-dropped images override.
const _SVG_URL_CACHE = {};
function categorySvgUrl(kind, tone) {
  const useTone = tone || CATEGORY_TONE[kind] || 'rose';
  const key = `${kind}-${useTone}`;
  if (_SVG_URL_CACHE[key]) return _SVG_URL_CACHE[key];
  const c = CATEGORY_COLORS[useTone] || CATEGORY_COLORS.rose;
  const motif = (CATEGORY_MOTIF_STR[kind] && CATEGORY_MOTIF_STR[kind](c)) || '';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid slice">`+
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">`+
    `<stop offset="0" stop-color="${c.bgFrom}"/>`+
    `<stop offset="1" stop-color="${c.bgTo}"/>`+
    `</linearGradient></defs>`+
    `<rect width="64" height="64" fill="url(#g)"/>`+
    motif+
    `</svg>`;
  const url = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  _SVG_URL_CACHE[key] = url;
  return url;
}

// Real-photo defaults per category. Switched from Unsplash (where I had to
// guess opaque photo IDs and kept landing on the wrong content) to Loremflickr
// — keyword-based stable photo lookup from Flickr's CC-licensed pool. The
// lock param pins each slot to the same photo across reloads. Quality varies
// (Flickr is amateur, not stock); when a photo isn't right, drop a better one
// onto the slot to override permanently.
const _LF = (tags, lock) => `https://loremflickr.com/600/600/${tags}/all?lock=${lock}`;
const CATEGORY_IMAGE = {
  skin:     _LF('korean,skincare,face',   201),   // 피부관리 — 스킨케어/세안
  botox:    _LF('forehead,smooth,woman',  202),   // 보톡스 — 매끄러운 이마
  filler:   _LF('lips,closeup,beauty',    203),   // 필러 — 입술/볼륨
  lift:     _LF('jawline,face,woman',     204),   // 리프팅 — 턱선/얼굴 윤곽
  acne:     _LF('acne,pimples,skin',      205),   // 여드름·흉터 — 트러블 피부
  pigment:  _LF('freckles,face,closeup',  206),   // 색소·기미 — 주근깨/색소
  hair:     _LF('legs,smooth,wax',        207),   // 제모 — 매끄러운 피부
  cosmetic: _LF('doctor,consultation,clinic', 208), // 성형 상담 — 의료 상담
  scalp:    _LF('hair,head,salon',        209),   // 모발·두피 — 헤어/두피
};

// Public component: gradient bg + photo overlay (drop AI/own photo to replace).
function CategoryArt({ kind, tone, size = 64, borderRadius = 18, children, style = {}, slotId, placeholder }) {
  const useTone = tone || CATEGORY_TONE[kind] || 'rose';
  const photoUrl = CATEGORY_IMAGE[kind] || categorySvgUrl(kind, useTone);
  const id = slotId || `cat-${kind}`;
  const ph = placeholder || '이미지 드롭';
  const sizeProps = size === 'full'
    ? { width:'100%', height:'100%' }
    : { width:size, height:size };

  return (
    <div style={{
      ...sizeProps, borderRadius, position:'relative', overflow:'hidden',
      background: `linear-gradient(135deg, ${CATEGORY_COLORS[useTone].bgFrom}, ${CATEGORY_COLORS[useTone].bgTo})`,
      ...style,
    }}>
      <image-slot
        id={id}
        src={photoUrl}
        fit="cover"
        shape="rect"
        radius="0"
        placeholder={ph}
        style={{ position:'absolute', inset:0, display:'block', width:'100%', height:'100%' }}
      />
      {/* Subtle tone overlay to keep brand harmony across mixed photo content */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none',
        background:`linear-gradient(180deg, transparent 50%, ${CATEGORY_COLORS[useTone].bgTo}33 100%)`,
      }}/>
      {children}
    </div>
  );
}

Object.assign(window, { CategoryArt, CATEGORY_TONE, CATEGORY_COLORS, CATEGORY_IMAGE, CATEGORY_MOTIF_STR, categorySvgUrl });
