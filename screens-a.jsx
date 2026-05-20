// Screens 1-4: Onboarding (lang), Home, Categories, Treatment detail — i18n + nav

// ════════════════════════════════════════════════════════════════════
// 1. ONBOARDING / LANGUAGE SELECT
// ════════════════════════════════════════════════════════════════════
function ScreenOnboarding({ onLangPick, onStart }) {
  const t = useT();
  const lang = useLang();
  const [pick, setPick] = React.useState(lang);
  const choose = (c) => {
    setPick(c);
    if (onLangPick) onLangPick(c);
  };
  const langs = [
    { code:'kz' },
    { code:'ru' },
    { code:'kr' },
  ];
  const startLabel = (TRANSLATIONS[pick] && TRANSLATIONS[pick].onb.start) || t.onb.start;
  return (
    <div className="kb-screen" style={{ height:'100%', display:'flex', flexDirection:'column', background:T.bgWarm }}>
      {/* Hero */}
      <div style={{
        position:'relative', flex:'1 1 auto', overflow:'hidden',
        background:`radial-gradient(ellipse 120% 80% at 50% 0%, ${T.roseSoft} 0%, ${T.bgWarm} 70%)`,
        padding:'56px 28px 32px',
      }}>
        <div style={{ position:'absolute', top:60, right:-60, width:220, height:220, borderRadius:'50%',
          background:`linear-gradient(135deg, ${T.lavenderSoft}, ${T.roseSoft})`, opacity:0.7, filter:'blur(4px)'
        }}/>
        <div style={{ position:'absolute', top:140, left:-40, width:120, height:120, borderRadius:'50%',
          background:`linear-gradient(135deg, ${T.beigeSoft}, ${T.roseTint})`, opacity:0.8
        }}/>

        <div style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:36 }}>
            <BrandMark/>
            <div style={{ fontSize:17, fontWeight:700, color:T.ink, letterSpacing:'-0.4px' }}>
              {t.brand}
            </div>
          </div>

          <div className="kb-display" style={{ fontSize:28, lineHeight:1.25,
            color:T.ink, marginTop:30, marginBottom:14,
          }}>
            {t.onb.h1}<br/>
            <span style={{ color:T.roseDeep }}>{t.onb.h2}</span>
          </div>
          <div style={{ fontSize:13.5, color:T.text, lineHeight:1.55, letterSpacing:'-0.2px', maxWidth:310 }}>
            {t.onb.intro}
          </div>
        </div>
      </div>

      {/* Picker sheet */}
      <div style={{
        background:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24,
        padding:'24px 20px 28px', boxShadow:'0 -8px 24px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize:12.5, color:T.textMute, marginBottom:14, fontWeight:500, letterSpacing:'-0.2px' }}>
          {t.langPrompt}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {langs.map(l => {
            const on = l.code === pick;
            return (
              <button key={l.code}
                className="kb-press"
                onClick={() => choose(l.code)}
                style={{
                  display:'flex', alignItems:'center', gap:14, padding:'13px 14px',
                  border:`1.5px solid ${on ? T.rose : T.borderSoft}`,
                  background: on ? T.roseTint : '#fff',
                  borderRadius:13, width:'100%', textAlign:'left',
                  fontFamily:'inherit',
                }}>
                <LangDot kind={l.code}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:15, fontWeight:600, color:T.ink, letterSpacing:'-0.3px' }}>{t.langName[l.code]}</div>
                  <div style={{ fontSize:11, color:T.textMute, marginTop:1 }}>{t.langSub[l.code]}</div>
                </div>
                {on && (
                  <div style={{ width:22, height:22, borderRadius:'50%', background:T.rose,
                    display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
                    <Icon d={Icons.check} size={14} sw={2.2}/>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop:18 }}>
          <CTA onClick={onStart}>{startLabel}  ·  Начать  ·  Бастау</CTA>
        </div>
        <div style={{ fontSize:10.5, color:T.textMute, textAlign:'center', marginTop:14, lineHeight:1.5 }}>
          {t.onb.terms}
        </div>
      </div>
    </div>
  );
}

function BrandMark({ size = 32 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:T.rose,
      display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
      fontWeight:800, fontSize:size*0.56, letterSpacing:'-1px',
      boxShadow:'0 3px 10px rgba(232,96,122,0.32)',
    }}>K</div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2. HOME
// ════════════════════════════════════════════════════════════════════
function ScreenHome() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();
  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bgWarm, position:'relative' }}>
      {/* Header */}
      <div style={{
        background:`linear-gradient(180deg, ${T.roseTint} 0%, ${T.bgWarm} 100%)`,
        padding:'14px 18px 16px',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <BrandMark size={26}/>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>{t.brand}</div>
          </div>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <Icon d={Icons.globe} size={20} stroke={T.ink2}/>
            <Icon d={Icons.bell} size={20} stroke={T.ink2}/>
          </div>
        </div>
        <div className="kb-display" style={{ fontSize:22, lineHeight:1.3, color:T.ink }}>
          {t.home.g1}<br/>
          <span style={{ color:T.roseDeep }}>{t.home.g2}</span>
        </div>
        <div style={{
          marginTop:14, background:'#fff', borderRadius:14,
          padding:'12px 14px', display:'flex', alignItems:'center', gap:10,
          border:`1px solid ${T.borderSoft}`, boxShadow:'0 1px 2px rgba(0,0,0,0.02)',
        }}>
          <Icon d={Icons.search} size={18} stroke={T.textMute}/>
          <div style={{ flex:1, fontSize:13, color:T.textMute, letterSpacing:'-0.2px' }}>
            {t.home.search}
          </div>
        </div>
      </div>

      {/* Korea visit promo banner — new */}
      <div style={{ padding:'14px 18px 0' }}>
        <button onClick={() => nav.go && nav.go('kv')}
          className="kb-press"
          style={{
            width:'100%', border:'none', textAlign:'left', cursor:'pointer',
            background:`linear-gradient(135deg, ${T.ink} 0%, #2A1F26 100%)`,
            borderRadius:16, padding:'16px 18px', color:'#fff',
            position:'relative', overflow:'hidden',
            fontFamily:'inherit',
          }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%',
            background:`radial-gradient(circle, ${T.rose} 0%, transparent 70%)`, opacity:0.45 }}/>
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:'rgba(255,255,255,0.12)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              border:'1px solid rgba(255,255,255,0.2)' }}>
              <Icon d={Icons.plane} size={22} stroke="#fff" sw={1.8}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:T.rose, fontWeight:700, letterSpacing:'1.2px' }}>{t.kv.kicker}</div>
              <div style={{ fontSize:14, fontWeight:700, marginTop:3, letterSpacing:'-0.3px' }}>
                {t.kv.hero1}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', marginTop:3 }}>
                {t.kv.heroSub.split('—')[0].trim()}
              </div>
            </div>
            <Icon d={Icons.chevR} size={18} stroke="#fff"/>
          </div>
        </button>
      </div>

      {/* Categories */}
      <div style={{ padding:'18px 0 4px' }}>
        <div style={{ padding:'0 18px', display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>{t.home.popular}</div>
          <button onClick={() => nav.go('cat')}
            style={{ background:'none', border:'none', fontSize:11.5, color:T.textMute, fontFamily:'inherit', cursor:'pointer' }}>
            {t.home.viewAll} ›
          </button>
        </div>
        <div className="kb-scroll" style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 18px 4px' }}>
          {[
            { key:'skin',    tone:'rose' },
            { key:'botox',   tone:'lav' },
            { key:'filler',  tone:'beige' },
            { key:'lift',    tone:'rose' },
            { key:'acne',    tone:'lav' },
            { key:'pigment', tone:'warm' },
          ].map((c,i)=>(
            <button key={i}
              onClick={() => nav.go(c.key === 'lift' ? 'tx' : 'cat')}
              className="kb-press"
              style={{ flex:'0 0 auto', textAlign:'center', background:'none', border:'none', cursor:'pointer', padding:0 }}>
              <CategoryArt kind={c.key} tone={c.tone} size={64} borderRadius={18} style={{ marginBottom:6 }}/>
              <div style={{ fontSize:11.5, fontWeight:500, color:T.ink2, letterSpacing:'-0.2px', fontFamily:'inherit' }}>{t.cat.names[c.key]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Verified banner */}
      <div style={{ padding:'16px 18px 0' }}>
        <div style={{
          background:`linear-gradient(135deg, ${T.lavenderSoft} 0%, ${T.roseSoft} 100%)`,
          borderRadius:16, padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{ width:38, height:38, borderRadius:12, background:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            boxShadow:'0 2px 6px rgba(0,0,0,0.04)',
          }}>
            <Icon d={Icons.shieldCheck} size={20} stroke={T.roseDeep} sw={1.8}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.ink, letterSpacing:'-0.3px' }}>
              {t.home.verifiedT}
            </div>
            <div style={{ fontSize:10.5, color:T.text, marginTop:2, letterSpacing:'-0.2px' }}>
              {t.home.verifiedS}
            </div>
          </div>
          <Icon d={Icons.chevR} size={16} stroke={T.roseDeep}/>
        </div>
      </div>

      {/* Korea consultation */}
      <div style={{ padding:'22px 0 0' }}>
        <div style={{ padding:'0 18px', display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>{t.home.koreaSec}</div>
            <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>{t.home.koreaSecSub}</div>
          </div>
          <button onClick={() => nav.go('cl')}
            style={{ background:'none', border:'none', fontSize:11.5, color:T.textMute, fontFamily:'inherit', cursor:'pointer' }}>
            {t.home.more} ›
          </button>
        </div>
        <div className="kb-scroll" style={{ display:'flex', gap:12, overflowX:'auto', padding:'0 18px 4px' }}>
          {[
            { name:'Lienne Clinic', loc:'Seoul · Gangnam', tag:t.cld.koreaPart, tone:'rose' },
            { name:'Centum Dermatology', loc:'Seoul · Cheongdam', tag:t.cld.ru247, tone:'lav' },
            { name:'Wua Plastic Surgery', loc:'Seoul · Apgujeong', tag:t.cld.day30, tone:'beige' },
          ].map((c,i)=>(
            <button key={i}
              onClick={() => nav.go('cld')}
              className="kb-card kb-press"
              style={{ flex:'0 0 198px', overflow:'hidden', padding:0, border:`1px solid ${T.borderSoft}`,
                fontFamily:'inherit', textAlign:'left', cursor:'pointer' }}>
              <div className={`kb-img-ph ${c.tone}`} style={{ width:'100%', height:118, position:'relative' }}>
                <div style={{ position:'absolute', top:8, left:8 }}>
                  <Badge tone="korea">{t.home.koreaTag}</Badge>
                </div>
              </div>
              <div style={{ padding:'10px 12px 12px' }}>
                <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.3px' }}>{c.name}</div>
                <div style={{ fontSize:10.5, color:T.textMute, marginTop:2 }}>{c.loc}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8 }}>
                  <Icon d={Icons.check} size={11} stroke={T.success} sw={2.4}/>
                  <div style={{ fontSize:10.5, color:T.ink2 }}>{c.tag}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                  <Icon d={Icons.star} size={11} fill={T.rose} stroke={T.rose}/>
                  <div style={{ fontSize:10.5, color:T.ink2 }}>4.{8-i} · {t.home.reviewsN(320 - i*70)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Local clinics */}
      <div style={{ padding:'22px 0 0' }}>
        <div style={{ padding:'0 18px', display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>{t.home.localSec}</div>
            <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>{t.home.localSecSub}</div>
          </div>
          <button onClick={() => nav.go('cl')}
            style={{ background:'none', border:'none', fontSize:11.5, color:T.textMute, fontFamily:'inherit', cursor:'pointer' }}>
            {t.home.more} ›
          </button>
        </div>
        <div style={{ padding:'0 18px', display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { name:'Almaty Skin Lab', loc:'Almaty · Medeu', langs:'KZ · RU · KR', reviews:212 },
            { name:'Nur Beauty Clinic', loc:'Astana · Esil', langs:'KZ · RU · EN', reviews:148 },
          ].map((c,i)=>(
            <button key={i}
              onClick={() => nav.go('cld')}
              className="kb-card kb-press"
              style={{ padding:10, display:'flex', gap:12, border:`1px solid ${T.borderSoft}`,
                background:'#fff', fontFamily:'inherit', textAlign:'left', cursor:'pointer' }}>
              <div className={`kb-img-ph ${i? 'lav' : 'beige'}`} style={{ width:74, height:74, borderRadius:11, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                  <div style={{ fontSize:13.5, fontWeight:600, letterSpacing:'-0.3px' }}>{c.name}</div>
                  <Icon d={Icons.checkBadge} size={13} stroke={T.roseDeep} sw={2}/>
                </div>
                <div style={{ fontSize:11, color:T.textMute, display:'flex', alignItems:'center', gap:4 }}>
                  <Icon d={Icons.pin} size={11} stroke={T.textMute}/> {c.loc}
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:7 }}>
                  <Badge tone="lav">{t.home.localTag}</Badge>
                  <Badge tone="beige">{t.home.aftercare}</Badge>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8 }}>
                  <div style={{ fontSize:10.5, color:T.text }}>{c.langs}</div>
                  <div style={{ fontSize:10.5, color:T.textMute }}>{t.home.reviewsN(c.reviews)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Before & After teaser */}
      <div style={{ padding:'22px 0 0' }}>
        <div style={{ padding:'0 18px', display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>
              {lang==='kz'?'Before & After':lang==='ru'?'До и После':'비포 & 애프터'}
            </div>
            <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>
              {lang==='kz'?'Нақты пациенттердің нәтижелері':lang==='ru'?'Реальные результаты':'실제 고객의 변화'}
            </div>
          </div>
          <button onClick={() => nav.go('ba')}
            style={{ background:'none', border:'none', fontSize:11.5, color:T.textMute, fontFamily:'inherit', cursor:'pointer' }}>
            {t.home.viewAll} ›
          </button>
        </div>
        <div className="kb-scroll" style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 18px 4px' }}>
          {filterBA({ status:'published' }).slice(0, 4).map((b)=>(
            <button key={b.id} onClick={() => nav.go('ba')}
              className="kb-press"
              style={{ flex:'0 0 180px', border:`1px solid ${T.borderSoft}`, borderRadius:14,
                overflow:'hidden', padding:0, background:'#fff', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
              <div style={{ display:'flex', gap:2, position:'relative' }}>
                <div className={`kb-img-ph ${b.tone}`} style={{ flex:1, height:104, position:'relative' }}>
                  <div style={{ position:'absolute', top:6, left:6, background:'rgba(0,0,0,0.55)', color:'#fff',
                    fontSize:9, padding:'2px 6px', borderRadius:4, fontWeight:800, letterSpacing:'0.5px' }}>BEFORE</div>
                </div>
                <div className={`kb-img-ph ${b.pair}`} style={{ flex:1, height:104, position:'relative' }}>
                  <div style={{ position:'absolute', top:6, left:6, background:'rgba(232,96,122,0.9)', color:'#fff',
                    fontSize:9, padding:'2px 6px', borderRadius:4, fontWeight:800, letterSpacing:'0.5px' }}>AFTER</div>
                </div>
              </div>
              <div style={{ padding:'9px 11px 11px' }}>
                <div style={{ fontSize:11.5, fontWeight:700, letterSpacing:'-0.2px' }}>{t.cat.names[b.tx]}</div>
                <div style={{ fontSize:10, color:T.roseDeep, fontWeight:600, marginTop:3,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.clinic}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Reviews */}
      <div style={{ padding:'22px 0 0' }}>
        <div style={{ padding:'0 18px', display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
          <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>{t.home.reviewSec}</div>
          <button onClick={() => nav.go('rv')}
            style={{ background:'none', border:'none', fontSize:11.5, color:T.textMute, fontFamily:'inherit', cursor:'pointer' }}>
            {t.home.viewAll} ›
          </button>
        </div>
        <div className="kb-scroll" style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 18px 4px' }}>
          {[
            { who:'Aigerim · Almaty', clinic:'Lienne Clinic', tone:'rose' },
            { who:'Dana · Astana', clinic:'Almaty Skin Lab', tone:'lav' },
            { who:'Aliya · Almaty', clinic:'Centum Dermatology', tone:'beige' },
          ].map((r,i)=>(
            <button key={i} onClick={() => nav.go('rv')}
              className="kb-card kb-press"
              style={{ flex:'0 0 188px', padding:10, border:`1px solid ${T.borderSoft}`,
                background:'#fff', fontFamily:'inherit', textAlign:'left', cursor:'pointer' }}>
              <div className={`kb-img-ph ${r.tone}`} style={{ height:88, borderRadius:8, marginBottom:8 }}/>
              <div style={{ display:'flex', gap:1, marginBottom:5 }}>
                {[0,0,0,0,0].map((_,k)=><Icon key={k} d={Icons.star} size={11} fill={T.rose} stroke={T.rose}/>)}
              </div>
              <div style={{ fontSize:10.5, color:T.textMute, marginTop:5 }}>{r.who}</div>
              <div style={{ fontSize:10.5, color:T.roseDeep, marginTop:2 }}>{r.clinic}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ height:160 }}/>
      <div style={{ position:'absolute', left:0, right:0, bottom:80, padding:'8px 16px',
        background:'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(251,248,245,0.95) 40%, #FBF8F5 100%)',
        pointerEvents:'none',
      }}>
        <div style={{ pointerEvents:'auto' }}>
          <CTA onClick={() => nav.go('fm')} icon={<Icon d={Icons.chat} size={18} stroke="#fff" sw={2}/>}>
            {t.home.ctaConsult}
          </CTA>
        </div>
      </div>
      <BottomTab active="home"/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3. CATEGORIES
// ════════════════════════════════════════════════════════════════════
function ScreenCategories() {
  const t = useT();
  const nav = useNav();
  const keys = ['skin','botox','filler','lift','acne','pigment','hair','cosmetic','scalp'];
  const tones = ['rose','lav','beige','rose','lav','warm','beige','rose','lav'];
  const counts = [24,18,16,21,14,12,9,11,7];
  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bg, position:'relative' }}>
      <TopBar title={t.cat.title} sub={t.cat.sub}
        right={<Icon d={Icons.search} size={20} stroke={T.ink2}/>}
      />
      <div className="kb-scroll" style={{ display:'flex', gap:7, overflowX:'auto', padding:'12px 16px 0' }}>
        {[
          { l:t.cat.filter, icon:Icons.filter },
          { l:t.cat.almaty, active:true },
          { l:t.cat.koreaCons, active:true },
          { l:t.cat.ruAvail },
          { l:t.cat.area },
          { l:t.cat.concern },
        ].map((c,i)=>(
          <div key={i} style={{
            flex:'0 0 auto', display:'flex', alignItems:'center', gap:5,
            padding:'7px 12px', borderRadius:999, fontSize:12, fontWeight:500,
            border: c.active ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
            background: c.active ? T.roseTint : '#fff',
            color: c.active ? T.roseDeep : T.ink2,
            letterSpacing:'-0.2px', whiteSpace:'nowrap',
          }}>
            {c.icon && <Icon d={c.icon} size={12} stroke={c.active ? T.roseDeep : T.ink2} sw={2}/>}
            {c.l}
            {!c.icon && <Icon d={Icons.chevD} size={11} stroke={c.active ? T.roseDeep : T.textMute} sw={2}/>}
          </div>
        ))}
      </div>

      <div style={{ padding:'14px 16px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:11.5, color:T.textMute }}>{t.cat.total(132)}</div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:T.ink2, fontWeight:500 }}>
          <Icon d={Icons.sort} size={13} stroke={T.ink2} sw={2}/>
          <span>{t.cat.sortPop}</span>
          <Icon d={Icons.chevD} size={11} stroke={T.textMute} sw={2}/>
        </div>
      </div>
      <div style={{ padding:'0 16px 4px', display:'flex', gap:6, flexWrap:'wrap' }}>
        {[t.cat.sortPop, t.cat.sortReview, t.cat.sortRequest, t.cat.sortRec].map((s,i)=>(
          <div key={i} style={{
            padding:'4px 9px', borderRadius:6, fontSize:11,
            background: i===0 ? T.roseTint : T.bgSoft,
            color: i===0 ? T.roseDeep : T.textMute, fontWeight: i===0 ? 600 : 500,
          }}>{s}</div>
        ))}
      </div>

      <div style={{ padding:'12px 16px 100px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
        {keys.map((k,i)=>(
          <button key={k}
            onClick={() => nav.go('tx')}
            className="kb-card kb-press"
            style={{ overflow:'hidden', padding:0, textAlign:'left', cursor:'pointer',
              background:'#fff', border:`1px solid ${T.borderSoft}`, fontFamily:'inherit' }}>
            <CategoryArt kind={k} tone={tones[i]} size="full" borderRadius={0} style={{ height:96 }}>
              <div style={{ position:'absolute', bottom:7, left:8, fontSize:9.5, color:T.ink2, fontWeight:600,
                background:'rgba(255,255,255,0.86)', padding:'2px 6px', borderRadius:5, zIndex:2 }}>
                {counts[i]} {t.cat.countSuffix}
              </div>
            </CategoryArt>
            <div style={{ padding:'10px 11px 12px' }}>
              <div style={{ fontSize:13.5, fontWeight:600, letterSpacing:'-0.3px' }}>{t.cat.names[k]}</div>
              <div style={{ fontSize:10.5, color:T.textMute, marginTop:2 }}>{t.cat.subs[k]}</div>
            </div>
          </button>
        ))}
      </div>
      <BottomTab active="cat"/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4. TREATMENT DETAIL
// ════════════════════════════════════════════════════════════════════
function ScreenTreatmentDetail() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();
  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bg, position:'relative' }}>
      {/* Hero */}
      <div className="kb-img-ph rose" style={{ height:200, position:'relative' }}>
        <div style={{ position:'absolute', top:14, left:14, right:14, display:'flex', justifyContent:'space-between' }}>
          <button onClick={()=>nav.back()} className="kb-press"
            style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.9)',
              display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', border:'none', cursor:'pointer' }}>
            <Icon d={Icons.chevL} size={18} stroke={T.ink}/>
          </button>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.9)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d={Icons.heart} size={17} stroke={T.ink}/>
            </div>
          </div>
        </div>
        <div style={{ position:'absolute', bottom:12, left:14, display:'flex', gap:5 }}>
          <Badge tone="korea">{t.home.koreaTag}</Badge>
          <Badge tone="lav">{t.home.localTag}</Badge>
        </div>
      </div>

      <div style={{ padding:'18px 18px 4px' }}>
        <div style={{ fontSize:11.5, color:T.roseDeep, fontWeight:700, marginBottom:4, letterSpacing:'0.5px' }}>{t.tx.kicker}</div>
        <div className="kb-display" style={{ fontSize:22, lineHeight:1.3 }}>
          {t.tx.title}
        </div>
        <div style={{ fontSize:13, color:T.text, marginTop:6, lineHeight:1.5, letterSpacing:'-0.2px' }}>
          {t.tx.summary}
        </div>

        <div style={{ display:'flex', gap:14, marginTop:14, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon d={Icons.clock} size={14} stroke={T.text}/>
            <span style={{ fontSize:11.5, color:T.text }}>{t.tx.time}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon d={Icons.star} size={14} stroke={T.rose} fill={T.rose}/>
            <span style={{ fontSize:11.5, color:T.text }}>4.8 · {t.home.reviewsN(318)}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Icon d={Icons.globe} size={14} stroke={T.text}/>
            <span style={{ fontSize:11.5, color:T.text }}>{t.tx.lang}</span>
          </div>
        </div>
      </div>

      <div style={{ padding:'20px 18px 0' }}>
        <SectionTitle title={t.tx.recommendFor}/>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
          {t.tx.concerns.map((s,i)=>(
            <div key={i} style={{ padding:'7px 11px', background:T.roseTint, color:T.roseDeep,
              fontSize:11.5, fontWeight:500, borderRadius:8 }}>{s}</div>
          ))}
        </div>
      </div>

      <div style={{ padding:'24px 18px 0' }}>
        <SectionTitle title={t.tx.expect}/>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
          {t.tx.expects.map((s,i)=>(
            <div key={i} style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:T.roseTint, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center', marginTop:1 }}>
                <Icon d={Icons.check} size={11} stroke={T.roseDeep} sw={2.5}/>
              </div>
              <div style={{ fontSize:12.5, color:T.ink2, lineHeight:1.5 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'24px 18px 0' }}>
        <SectionTitle title={t.tx.info}/>
        <div style={{ marginTop:10, border:`1px solid ${T.borderSoft}`, borderRadius:12, overflow:'hidden' }}>
          {[t.tx.infoTime, t.tx.infoRecover, t.tx.infoCheck, t.tx.infoCaution].map((row,i,arr)=>(
            <div key={i} style={{
              display:'flex', padding:'11px 13px',
              borderBottom: i<arr.length-1 ? `1px solid ${T.borderSoft}` : 'none',
              background: i%2===0 ? T.bgWarm : '#fff',
            }}>
              <div style={{ width:100, fontSize:11.5, color:T.textMute, fontWeight:500, flexShrink:0 }}>{row[0]}</div>
              <div style={{ flex:1, fontSize:12, color:T.ink2, lineHeight:1.45 }}>{row[1]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'18px 18px 0' }}>
        <div style={{ background:T.bgSoft, borderRadius:11, padding:'12px 14px',
          display:'flex', gap:9, alignItems:'flex-start',
          border:`1px solid ${T.borderSoft}`,
        }}>
          <Icon d={Icons.shield} size={16} stroke={T.textMute} sw={1.8}/>
          <div style={{ fontSize:11, color:T.text, lineHeight:1.55 }}>
            {t.tx.disclosure}
          </div>
        </div>
      </div>

      {/* Before & After for this treatment */}
      <div style={{ padding:'24px 0 0' }}>
        <div style={{ padding:'0 18px' }}>
          <SectionTitle title={t.cld.ba} right={`${filterBA({treatment:'lift', status:'published'}).length} ›`}/>
        </div>
        <BAStrip
          items={filterBA({ treatment:'lift', status:'published' })}
          t={t} lang={lang}
          onMore={() => nav.go('ba')}
        />
        <div style={{ padding:'8px 18px 0' }}>
          <div style={{ background:T.bgSoft, borderRadius:10, padding:'10px 12px',
            display:'flex', gap:8, alignItems:'flex-start',
          }}>
            <Icon d={Icons.shield} size={14} stroke={T.textMute}/>
            <div style={{ fontSize:10.5, color:T.text, lineHeight:1.55 }}>
              {t.cld.baDisclaimer}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'24px 0 0' }}>
        <div style={{ padding:'0 18px' }}>
          <SectionTitle title={t.tx.relatedClinics} right={`3 ${t.tx.relatedCount}`}/>
        </div>
        <div style={{ padding:'10px 18px 0', display:'flex', flexDirection:'column', gap:9 }}>
          {[
            { n:'Lienne Clinic', l:'Seoul · Gangnam', tone:'rose', korea:true },
            { n:'Almaty Skin Lab', l:'Almaty · Medeu', tone:'beige', korea:false },
          ].map((c,i)=>(
            <button key={i}
              onClick={() => nav.go('cld')}
              className="kb-card kb-press"
              style={{ display:'flex', gap:11, padding:10, alignItems:'center',
                border:`1px solid ${T.borderSoft}`, background:'#fff', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
              <div className={`kb-img-ph ${c.tone}`} style={{ width:62, height:62, borderRadius:10, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.3px' }}>{c.n}</div>
                <div style={{ fontSize:10.5, color:T.textMute, marginTop:2 }}>{c.l}</div>
                <div style={{ display:'flex', gap:4, marginTop:6 }}>
                  {c.korea ? <Badge tone="korea">{t.home.koreaTag}</Badge> : <Badge tone="lav">{t.home.localTag}</Badge>}
                  <Badge tone="beige">{t.cld.intp}</Badge>
                </div>
              </div>
              <Icon d={Icons.chevR} size={16} stroke={T.textMute}/>
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'24px 18px 130px' }}>
        <SectionTitle title={t.tx.reviewSec} right="318 ›"/>
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:8 }}>
          {[
            { n:'Aigerim', loc:t.locName.almaty, txt:t.rv.disclaimer === '' ? '' : null },
            { n:'Dana', loc:t.locName.astana, txt:'' },
          ].map((r,i)=>(
            <div key={i} className="kb-card" style={{ padding:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', background:T.roseTint,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:T.roseDeep }}>
                    {r.n[0]}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600 }}>{r.n}</div>
                    <div style={{ fontSize:10, color:T.textMute }}>{r.loc}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:1 }}>
                  {[0,0,0,0,0].map((_,k)=><Icon key={k} d={Icons.star} size={10} fill={T.rose} stroke={T.rose}/>)}
                </div>
              </div>
              <div style={{ fontSize:12, color:T.ink2, lineHeight:1.5, marginTop:8, letterSpacing:'-0.1px' }}>
                "{[
                  'Маманның жұмысына өте риза болдым. Тілді білмесем де аудармашымен бірге барлық сұрағыма жауап алдым.',
                  'Очень внимательное отношение. Подробно объяснили процедуру до и после, я чувствовала себя в безопасности.',
                ][i % 2]}"
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position:'absolute', left:0, right:0, bottom:0,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(14px)',
        borderTop:`1px solid ${T.borderSoft}`, padding:'12px 16px 26px',
      }}>
        <CTA onClick={() => nav.go('fm')} icon={<Icon d={Icons.chat} size={18} stroke="#fff" sw={2}/>}>
          {t.tx.ctaTreatment}
        </CTA>
      </div>
    </div>
  );
}

function SectionTitle({ title, right }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
      <div style={{ fontSize:14.5, fontWeight:700, letterSpacing:'-0.3px', color:T.ink }}>{title}</div>
      {right && <div style={{ fontSize:11.5, color:T.textMute, fontWeight:500 }}>{right}</div>}
    </div>
  );
}

Object.assign(window, { ScreenOnboarding, ScreenHome, ScreenCategories, ScreenTreatmentDetail, SectionTitle, BrandMark });
