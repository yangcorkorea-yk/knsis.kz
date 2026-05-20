// App entry: design canvas + interactive prototype + tweaks panel

const { useState, useCallback, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "language": "kz",
  "prototypeStart": "onb"
}/*EDITMODE-END*/;

// ─── Single phone screen, wrapped in IOSDevice + a stub or live nav ────
function PhoneFrame({ children, dark = false, navValue }) {
  const stub = useMemo(() => ({ go:()=>{}, back:()=>{}, current:'' }), []);
  return (
    <NavProvider value={navValue || stub}>
      <IOSDevice width={390} height={812} dark={dark}>
        {children}
      </IOSDevice>
    </NavProvider>
  );
}

// ─── Routing table for screens ────────────────────────────────────
function renderScreen(route) {
  switch (route) {
    case 'onb': return <ScreenOnboarding/>;
    case 'home': return <ScreenHome/>;
    case 'cat': return <ScreenCategories/>;
    case 'tx': return <ScreenTreatmentDetail/>;
    case 'cl': return <ScreenClinicList/>;
    case 'cld': return <ScreenClinicDetail/>;
    case 'rv': return <ScreenReviews/>;
    case 'fm': return <ScreenConsultForm/>;
    case 'ok': return <ScreenComplete/>;
    case 'my': return <ScreenMyPage/>;
    case 'kv': return <ScreenKoreaVisit/>;
    case 'kvp': return <ScreenKoreaVisitPlan/>;
    case 'kvo': return <ScreenKoreaVisitOk/>;
    case 'ba': return <ScreenBeforeAfter/>;
    case 'nt': return <ScreenNotifications/>;
    case 'ch': return <ScreenChat/>;
    case 'sr': return <ScreenSearch/>;
    case 'st': return <ScreenSettings/>;
    default: return <ScreenHome/>;
  }
}

const ROUTE_LABELS = {
  onb:'01 · 온보딩 / Тіл таңдау',
  home:'02 · Home / Басты',
  cat:'03 · Категория / Процедуралар',
  tx:'04 · Процедура детал',
  cl:'05 · Клиника тізімі',
  cld:'06 · Клиника детал',
  rv:'07 · Пікірлер',
  fm:'08 · Кеңес жазылу',
  ok:'09 · Кеңес аяқталды',
  my:'10 · Менің бетім',
  kv:'KV-1 · Кореяға сапар',
  kvp:'KV-2 · Сапар жоспары',
  kvo:'KV-3 · Сапар расталды',
  ba:'BA · Before & After',
  nt:'NT · Хабарландырулар',
  ch:'CH · Менеджер чаты',
  sr:'SR · Іздеу нәтижесі',
  st:'ST · Параметрлер',
};

// ─── Interactive prototype: stateful phone with nav stack + step rail ─
function InteractivePrototype({ start, language, setLanguage }) {
  const [route, setRoute] = useState(start);
  const [history, setHistory] = useState([]);

  // Reset when language or "start" tweak changes
  React.useEffect(() => { setRoute(start); setHistory([]); }, [start]);

  const go = useCallback((target) => {
    setHistory(h => [...h, route]);
    setRoute(target);
  }, [route]);
  const back = useCallback(() => {
    setHistory(h => {
      if (!h.length) return h;
      const next = [...h];
      const prev = next.pop();
      setRoute(prev);
      return next;
    });
  }, []);
  const reset = useCallback(() => { setRoute(start); setHistory([]); }, [start]);

  // Onboarding lang pick — sync into global tweak
  const screen = route === 'onb'
    ? <ScreenOnboarding
        onLangPick={(c) => setLanguage(c)}
        onStart={() => go('home')}
      />
    : renderScreen(route);

  // Crumbs of recent routes
  const crumbs = [...history, route].slice(-5);
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', gap:18, padding:18,
      background:'linear-gradient(135deg, #1A1A1A 0%, #2A1F26 50%, #3A1F2A 100%)',
      borderRadius:16, color:'#fff', alignItems:'stretch',
    }}>
      {/* Phone */}
      <div style={{ flexShrink:0, display:'flex', alignItems:'center' }}>
        <PhoneFrame navValue={{ go, back, current: route }}>{screen}</PhoneFrame>
      </div>

      {/* Right column: meta + step rail */}
      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', color:'#fff',
        fontFamily: T.font, padding:'8px 4px',
      }}>
        <div style={{ fontSize:10, color:T.rose, fontWeight:700, letterSpacing:'1.5px', marginBottom:6 }}>
          INTERACTIVE PROTOTYPE
        </div>
        <div className="kb-display" style={{ fontSize:24, lineHeight:1.2, color:'#fff', marginBottom:6 }}>
          Тірі прототип
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.55, marginBottom:18, maxWidth:340 }}>
          Карточкалар мен төменгі панельге тиіп сценарий бойынша қозғалыңыз.<br/>
          Click cards and the bottom tab bar to navigate the full flow live.
        </div>

        {/* current route badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, alignSelf:'flex-start',
          padding:'7px 12px', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)',
          borderRadius:8, marginBottom:14,
        }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:T.rose }}/>
          <div style={{ fontSize:11, fontWeight:600, color:'#fff' }}>{ROUTE_LABELS[route] || route}</div>
        </div>

        {/* breadcrumb stack */}
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginBottom:6, letterSpacing:'1px', fontWeight:700 }}>STACK</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center', marginBottom:18 }}>
          {crumbs.length === 1 ? (
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>(стек бос)</span>
          ) : (
            crumbs.map((r,i)=>(
              <React.Fragment key={i}>
                {i>0 && <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>›</span>}
                <span style={{
                  padding:'3px 8px', borderRadius:5,
                  background: i === crumbs.length-1 ? T.rose : 'rgba(255,255,255,0.08)',
                  color: i === crumbs.length-1 ? '#fff' : 'rgba(255,255,255,0.7)',
                  fontSize:10.5, fontWeight:600,
                }}>{(ROUTE_LABELS[r] || r).split('·')[0].trim()}</span>
              </React.Fragment>
            ))
          )}
        </div>

        {/* Quick jump */}
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginBottom:8, letterSpacing:'1px', fontWeight:700 }}>JUMP</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:18 }}>
          {Object.keys(ROUTE_LABELS).map((r)=>(
            <button key={r}
              onClick={() => { setRoute(r); setHistory([]); }}
              style={{
                padding:'7px 9px', borderRadius:7,
                background: r === route ? T.rose : 'rgba(255,255,255,0.06)',
                color: r === route ? '#fff' : 'rgba(255,255,255,0.75)',
                border: r === route ? 'none' : '1px solid rgba(255,255,255,0.1)',
                fontSize:10.5, fontWeight:600, textAlign:'left', cursor:'pointer',
                fontFamily: T.font, letterSpacing:'-0.1px',
              }}>{ROUTE_LABELS[r]}</button>
          ))}
        </div>

        <div style={{ flex:1 }}/>

        {/* Controls */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={back} disabled={!history.length}
            style={{
              flex:1, padding:'10px 12px', borderRadius:9,
              background: history.length ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)',
              color: history.length ? '#fff' : 'rgba(255,255,255,0.3)',
              border:'1px solid rgba(255,255,255,0.12)',
              fontSize:11.5, fontWeight:600, cursor: history.length ? 'pointer' : 'default',
              fontFamily:T.font, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>
            <Icon d={Icons.chevL} size={14} stroke="currentColor" sw={2}/> Back
          </button>
          <button onClick={reset}
            style={{
              flex:1, padding:'10px 12px', borderRadius:9, background:T.rose, color:'#fff',
              border:'none', fontSize:11.5, fontWeight:700, cursor:'pointer', fontFamily:T.font,
            }}>Restart</button>
        </div>
      </div>
    </div>
  );
}

// ─── Top-level App ───────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const lang = tweaks.language || 'kz';
  const setLanguage = (code) => setTweak('language', code);

  return (
    <LangProvider lang={lang}>
      <DesignCanvas>

        {/* ── Cover ── */}
        <DCSection
          id="cover"
          title="K-Beauty Сana — MVP v0.3 (launch-ready)"
          subtitle="Қазақстан K-Beauty кеңес платформасы · OTP/WhatsApp/Telegram/SMS жоқ — таза ішкі MVP · KZ default · Pretendard"
        >
          <DCArtboard id="cover" label="Cover" width={540} height={812}>
            <CoverArtboard/>
          </DCArtboard>
        </DCSection>

        {/* ── Interactive Prototype ── */}
        <DCSection
          id="prototype"
          title="① Тірі прототип · Interactive Prototype"
          subtitle="Тілді ауыстырып, ішкі панельмен немесе төменгі табтармен сценарий бойынша қозғалыңыз"
        >
          <DCArtboard id="proto-live" label="Live · Tap to navigate" width={760} height={840}>
            <InteractivePrototype
              start={tweaks.prototypeStart || 'onb'}
              language={lang}
              setLanguage={setLanguage}
            />
          </DCArtboard>
        </DCSection>

        {/* ── Main flow gallery ── */}
        <DCSection
          id="flow"
          title="② Негізгі сценарий · Main user flow"
          subtitle="Онбординг → Home → Category → Treatment → Clinic → Review → Form → Done"
        >
          <DCArtboard id="s1" label="01 · Тіл таңдау" width={390} height={812}>
            <PhoneFrame><ScreenOnboarding/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s2" label="02 · Басты бет" width={390} height={812}>
            <PhoneFrame><ScreenHome/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s3" label="03 · Категория" width={390} height={812}>
            <PhoneFrame><ScreenCategories/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s4" label="04 · Процедура детал" width={390} height={812}>
            <PhoneFrame><ScreenTreatmentDetail/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s5" label="05 · Клиника тізімі" width={390} height={812}>
            <PhoneFrame><ScreenClinicList/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s6" label="06 · Клиника детал" width={390} height={812}>
            <PhoneFrame><ScreenClinicDetail/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s7" label="07 · Пікірлер" width={390} height={812}>
            <PhoneFrame><ScreenReviews/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s8" label="08 · Кеңес жазылу" width={390} height={812}>
            <PhoneFrame><ScreenConsultForm/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s9" label="09 · Кеңес аяқталды" width={390} height={812}>
            <PhoneFrame><ScreenComplete/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s10" label="10 · Менің бетім" width={390} height={812}>
            <PhoneFrame><ScreenMyPage/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="s11-ba" label="11 · Before & After" width={390} height={812}>
            <PhoneFrame><ScreenBeforeAfter/></PhoneFrame>
          </DCArtboard>
        </DCSection>

        {/* ── Korea Visit Flow ── */}
        <DCSection
          id="korea"
          title="③ Кореяға сапар сценарийі · Korea visit flow"
          subtitle="Landing → Plan form → Confirmation · Әуежай, қонақ үй, аудармашы, кейінгі күтім"
        >
          <DCArtboard id="kv1" label="KV-1 · Landing" width={390} height={812}>
            <PhoneFrame><ScreenKoreaVisit/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="kv2" label="KV-2 · Plan form" width={390} height={812}>
            <PhoneFrame><ScreenKoreaVisitPlan/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="kv3" label="KV-3 · Confirmation" width={390} height={812}>
            <PhoneFrame><ScreenKoreaVisitOk/></PhoneFrame>
          </DCArtboard>
        </DCSection>

        {/* Login flow (Phone OTP) removed from MVP — see post-MVP roadmap.
            Guests can submit a consult request without logging in. */}

        {/* ── Admin · Core ── */}
        <DCSection
          id="admin"
          title="④ Әкімші · Operations · Admin core"
          subtitle="Dashboard · Leads · Customers · Clinics — ешқандай баға өрісі жоқ"
        >
          <DCArtboard id="admin-dash" label="11A · Dashboard / KPI" width={1280} height={812}>
            <NavProvider value={{ go:()=>{}, back:()=>{}, current:'' }}>
              <ScreenAdminDashboard/>
            </NavProvider>
          </DCArtboard>
          <DCArtboard id="admin-1" label="11B · Lead management" width={1280} height={812}>
            <NavProvider value={{ go:()=>{}, back:()=>{}, current:'' }}>
              <ScreenAdmin/>
            </NavProvider>
          </DCArtboard>
          <DCArtboard id="admin-cust" label="11C · Customers" width={1280} height={812}>
            <NavProvider value={{ go:()=>{}, back:()=>{}, current:'' }}>
              <ScreenAdminCustomers/>
            </NavProvider>
          </DCArtboard>
          <DCArtboard id="admin-cl" label="11D · Clinics" width={1280} height={812}>
            <NavProvider value={{ go:()=>{}, back:()=>{}, current:'' }}>
              <ScreenAdminClinics/>
            </NavProvider>
          </DCArtboard>
          <DCArtboard id="admin-rv" label="11E · Review moderation" width={1280} height={812}>
            <NavProvider value={{ go:()=>{}, back:()=>{}, current:'' }}>
              <ScreenAdminReviews/>
            </NavProvider>
          </DCArtboard>
          <DCArtboard id="admin-mgr" label="11F · Managers / team" width={1280} height={812}>
            <NavProvider value={{ go:()=>{}, back:()=>{}, current:'' }}>
              <ScreenAdminManagers/>
            </NavProvider>
          </DCArtboard>
        </DCSection>

        {/* ── Admin · Before & After moderation ── */}
        <DCSection
          id="admin-ba-sec"
          title="⑤ Before & After модерация · Content ops"
          subtitle="Сурет жұптарын жариялау · келісім · клиника/процедура беттерінде көріну басқару"
        >
          <DCArtboard id="admin-ba" label="12 · Before & After басқару" width={1280} height={812}>
            <NavProvider value={{ go:()=>{}, back:()=>{}, current:'' }}>
              <ScreenAdminBeforeAfter/>
            </NavProvider>
          </DCArtboard>
        </DCSection>

        {/* WhatsApp / Telegram / SMS template editor, automation rules and send log
            removed from MVP. Manager replies to leads through the in-app chat (CH)
            or by phone — external channel adapters land in a later milestone. */}

        {/* ── Mobile · Extras (notifications, chat, search, settings) ── */}
        <DCSection
          id="mobile-extras"
          title="⑤·⁵ Қосымша мобайл экрандар · Mobile extras"
          subtitle="Хабарландырулар · Менеджермен чат · Іздеу нәтижесі · Параметрлер"
        >
          <DCArtboard id="nt-board" label="NT · Notifications" width={390} height={812}>
            <PhoneFrame><ScreenNotifications/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="ch-board" label="CH · Manager chat" width={390} height={812}>
            <PhoneFrame><ScreenChat/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="sr-board" label="SR · Search results" width={390} height={812}>
            <PhoneFrame><ScreenSearch/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="st-board" label="ST · Settings" width={390} height={812}>
            <PhoneFrame><ScreenSettings/></PhoneFrame>
          </DCArtboard>
        </DCSection>

        {/* ── Design directions — side-by-side variants ── */}
        <DCSection
          id="variants"
          title="⑥ Визуалдық бағыттар · Design directions"
          subtitle="Бір экран — үш визуалдық тіл: Rose (default) · Minimal · Lavender"
        >
          <DCArtboard id="var-rose" label="A · Rose (current)" width={390} height={812}>
            <PhoneFrame><ScreenHome/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="var-minimal" label="B · Minimal / Editorial" width={390} height={812}>
            <PhoneFrame><ScreenHomeMinimal/></PhoneFrame>
          </DCArtboard>
          <DCArtboard id="var-lavender" label="C · Lavender" width={390} height={812}>
            <PhoneFrame><ScreenHomeLavender/></PhoneFrame>
          </DCArtboard>
        </DCSection>

        {/* ── Design System ── */}
        <DCSection
          id="system"
          title="⑦ Дизайн жүйесі · Design system"
          subtitle="Pretendard · Rose / Lavender / Beige · Card-first"
        >
          <DCArtboard id="ds-palette" label="Colors" width={620} height={460}>
            <PaletteCard/>
          </DCArtboard>
          <DCArtboard id="ds-type" label="Typography" width={620} height={460}>
            <TypeCard/>
          </DCArtboard>
          <DCArtboard id="ds-components" label="Components" width={620} height={640}>
            <ComponentsCard/>
          </DCArtboard>
        </DCSection>

      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Language · Тіл">
          <TweakRadio
            label="UI language"
            value={lang}
            options={[
              { value:'kz', label:'KZ' },
              { value:'ru', label:'RU' },
              { value:'kr', label:'KR' },
            ]}
            onChange={(v) => setLanguage(v)}
          />
          <div style={{ fontSize:11, color:'#888', padding:'4px 0 0', lineHeight:1.5 }}>
            Барлық экран бойынша қолданылады. KZ-ден RU/KR-ге ауыстырып көріңіз.
          </div>
        </TweakSection>

        <TweakSection label="Prototype">
          <TweakSelect
            label="Start screen"
            value={tweaks.prototypeStart || 'onb'}
            options={Object.entries(ROUTE_LABELS).map(([v, label]) => ({ value:v, label }))}
            onChange={(v) => setTweak('prototypeStart', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </LangProvider>
  );
}

// ─── Cover artboard ───────────────────────────────────────────────
function CoverArtboard() {
  const t = useT();
  return (
    <div className="kb-screen" style={{
      width:'100%', height:'100%', position:'relative', overflow:'hidden',
      background:`linear-gradient(135deg, ${T.roseTint} 0%, ${T.lavenderSoft} 50%, ${T.beigeSoft} 100%)`,
      padding:'48px 44px', display:'flex', flexDirection:'column', justifyContent:'space-between',
    }}>
      <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%',
        background:`radial-gradient(circle, ${T.roseSoft} 0%, transparent 70%)` }}/>
      <div style={{ position:'absolute', bottom:-100, left:-60, width:280, height:280, borderRadius:'50%',
        background:`radial-gradient(circle, ${T.lavenderSoft} 0%, transparent 70%)` }}/>

      <div style={{ position:'relative', display:'flex', alignItems:'center', gap:12 }}>
        <BrandMark size={46}/>
        <div>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.5px' }}>{t.brand}</div>
          <div style={{ fontSize:11, color:T.text, marginTop:1 }}>K-Beauty Consultation · MVP v0.3 (launch-ready)</div>
        </div>
      </div>

      <div style={{ position:'relative' }}>
        <div style={{ fontSize:10, color:T.roseDeep, fontWeight:700, letterSpacing:'1.5px', marginBottom:12 }}>
          ҚАЗАҚСТАН · K-БЬЮТИ · INTERACTIVE MVP
        </div>
        <div className="kb-display" style={{ fontSize:54, lineHeight:1.1, marginBottom:18 }}>
          {t.onb.h1}<br/>
          <span style={{ color:T.roseDeep }}>{t.onb.h2}</span>
        </div>
        <div style={{ fontSize:14, color:T.ink2, lineHeight:1.55, maxWidth:440 }}>
          {t.onb.intro}
        </div>
      </div>

      <div style={{ position:'relative', display:'flex', gap:24, alignItems:'baseline', flexWrap:'wrap' }}>
        {[
          ['22', 'Экран · Screens'],
          ['3', 'Тілдер · KZ·RU·KR'],
          ['7', 'Әкімші · Admin'],
          ['3', 'Бағыт · Variants'],
          ['0', 'Сыртқы тәуелділік'],
        ].map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <div className="kb-display" style={{ fontSize:30,
              color: i===4 ? T.roseDeep : T.ink }}>{s[0]}</div>
            <div style={{ fontSize:10.5, color:T.text }}>{s[1]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Design system cards ──────────────────────────────────────────
function PaletteCard() {
  const groups = [
    { title:'Base', items:[
      ['#FFFFFF','White'], ['#FBF8F5','Warm BG'], ['#F7F4F0','Soft BG'],
    ]},
    { title:'Brand · Rose', items:[
      [T.rose,'Rose / Primary'], [T.roseDeep,'Rose Deep'], [T.roseSoft,'Rose Soft'], [T.roseTint,'Rose Tint'],
    ]},
    { title:'Accent', items:[
      [T.lavender,'Lavender'], [T.lavenderSoft,'Lavender Soft'],
      [T.beige,'Beige'], [T.beigeSoft,'Beige Soft'],
    ]},
    { title:'Ink & State', items:[
      [T.ink,'Ink'], [T.text,'Text'], [T.textMute,'Muted'],
      [T.success,'Success'], [T.warn,'Warn'],
    ]},
  ];
  return (
    <div className="kb-screen" style={{ width:'100%', height:'100%', padding:24, background:'#fff', overflow:'auto' }}>
      <div className="kb-display" style={{ fontSize:22, marginBottom:4 }}>Colors</div>
      <div style={{ fontSize:11.5, color:T.textMute, marginBottom:18 }}>프리미엄 · 의료 · 신뢰감 · K-뷰티</div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {groups.map((g,i)=>(
          <div key={i}>
            <div style={{ fontSize:10.5, fontWeight:700, color:T.textMute, letterSpacing:'1px', marginBottom:7 }}>{g.title.toUpperCase()}</div>
            <div style={{ display:'flex', gap:8 }}>
              {g.items.map(([c,n],k)=>(
                <div key={k} style={{ flex:1 }}>
                  <div style={{ height:48, borderRadius:8, background:c,
                    border: c==='#FFFFFF' || c==='#FBF8F5' || c==='#F7F4F0' ? `1px solid ${T.border}` : 'none' }}/>
                  <div style={{ fontSize:10, fontWeight:600, marginTop:5 }}>{n}</div>
                  <div style={{ fontSize:9, color:T.textMute, fontFamily:'monospace' }}>{c}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeCard() {
  return (
    <div className="kb-screen" style={{ width:'100%', height:'100%', padding:24, background:'#fff', overflow:'auto' }}>
      <div className="kb-display" style={{ fontSize:22, marginBottom:4 }}>Typography</div>
      <div style={{ fontSize:11.5, color:T.textMute, marginBottom:18 }}>Pretendard — Latin · Cyrillic · Hangul · Kazakh extended</div>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {[
          { label:'Display · 30 · 700', val:['Қазақстанда', 'Из Казахстана', '카자흐스탄에서'], size:28 },
          { label:'Title · 22 · 700',   val:['Ulthera лифтинг', 'Ulthera лифтинг', '울쎄라 리프팅'], size:20 },
          { label:'Section · 15 · 700', val:['Танымал санаттар', 'Популярные', '인기 카테고리'], size:15 },
          { label:'Body · 13 · 400',    val:['Жеке нәтиже өзгеруі мүмкін.', 'Результаты могут отличаться.', '결과는 다를 수 있습니다.'], size:13 },
          { label:'Caption · 11 · 500', val:['Аударма · RU · KR', 'Перевод · RU · KR', '통역 · RU · KR'], size:11 },
        ].map((tt,i,arr)=>(
          <div key={i} style={{ display:'flex', gap:14, alignItems:'baseline',
            paddingBottom:12, borderBottom: i<arr.length-1 ? `1px solid ${T.borderSoft}` : 'none' }}>
            <div style={{ width:120, flexShrink:0, fontSize:10, color:T.textMute, fontWeight:700, lineHeight:1.5 }}>
              {tt.label}
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:3 }}>
              {tt.val.map((v,k)=>(
                <div key={k} className={i<=1 ? 'kb-display' : ''}
                  style={{ fontSize:tt.size, fontWeight: i<=2 ? (i<=1?700:700) : (i===3 ? 400 : 500),
                  letterSpacing: i<=1 ? '-0.04em' : '-0.2px',
                  color:T.ink, lineHeight:1.3 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:T.textMute, marginRight:8, letterSpacing:'0.5px' }}>
                    {['KZ','RU','KR'][k]}
                  </span>
                  {v}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentsCard() {
  return (
    <div className="kb-screen" style={{ width:'100%', height:'100%', padding:24, background:'#fff', overflow:'auto' }}>
      <div className="kb-display" style={{ fontSize:22, marginBottom:4 }}>Components</div>
      <div style={{ fontSize:11.5, color:T.textMute, marginBottom:20 }}>Card · Badge · CTA · Input · Status</div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <div>
          <CompLabel>Primary CTA</CompLabel>
          <CTA icon={<Icon d={Icons.chat} size={16} stroke="#fff" sw={2}/>}>Кеңеске жазылу</CTA>
          <div style={{ height:9 }}/>
          <CTA variant="outline">Басты бетке</CTA>
          <div style={{ height:9 }}/>
          <CTA size="md" variant="soft">Қол жетімділікті сұрау</CTA>
        </div>

        <div>
          <CompLabel>Badges</CompLabel>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            <Badge tone="korea">🇰🇷 Корея</Badge>
            <Badge tone="lav">Жергілікті</Badge>
            <Badge tone="success">✓ Тексерілген</Badge>
            <Badge tone="beige">Кейінгі күтім</Badge>
            <Badge tone="rose">Лифтинг</Badge>
            <Badge tone="ink">RU · KR</Badge>
          </div>
        </div>

        <div style={{ gridColumn:'span 2' }}>
          <CompLabel>Clinic card</CompLabel>
          <div className="kb-card" style={{ padding:12, display:'flex', gap:11 }}>
            <div className="kb-img-ph rose" style={{ width:64, height:64, borderRadius:11, flexShrink:0 }}/>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ fontSize:13, fontWeight:700, letterSpacing:'-0.3px' }}>Lienne Clinic</div>
                <Icon d={Icons.checkBadge} size={13} stroke={T.roseDeep} sw={2}/>
              </div>
              <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>Сеул · Каннам</div>
              <div style={{ display:'flex', gap:4, marginTop:6 }}>
                <Badge tone="korea">🇰🇷 Корея</Badge>
                <Badge tone="lav">RU аудармашы</Badge>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:3 }}>
              <Icon d={Icons.star} size={12} fill={T.rose} stroke={T.rose}/>
              <span style={{ fontSize:11.5, fontWeight:700 }}>4.9</span>
            </div>
          </div>
        </div>

        <div style={{ gridColumn:'span 2' }}>
          <CompLabel>Inputs</CompLabel>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ background:'#fff', border:`1px solid ${T.border}`, borderRadius:11,
              padding:'12px 13px', fontSize:13, color:T.ink }}>
              Aigerim Bekova
            </div>
            <div style={{ background:'#fff', border:`1px solid ${T.border}`, borderRadius:11,
              padding:'12px 13px', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ flex:1, fontSize:13, color:T.textMute }}>+7 (___) ___ ____</div>
              <div style={{ padding:'3px 7px', background:T.bgSoft, borderRadius:6,
                fontSize:10, fontWeight:700, color:T.text }}>WA</div>
            </div>
          </div>
        </div>

        <div style={{ gridColumn:'span 2' }}>
          <CompLabel>Lead status pills</CompLabel>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {[
              ['Жаңа','#FCE7EC','#C84365'],
              ['Хабарласты','#E5F4EC','#1F7A4D'],
              ['Жалғасуда','#FFF5E1','#A07012'],
              ['Жоспарлау','#EAE4F5','#5E4B82'],
              ['Аяқталды','#F0EDE8','#5A5A5A'],
              ['Кідіртілген','#FDE8E4','#A04432'],
            ].map(([l,bg,fg],i)=>(
              <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:5,
                padding:'5px 10px', borderRadius:6, background:bg, color:fg,
                fontSize:11, fontWeight:700 }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:fg }}/>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompLabel({ children }) {
  return <div style={{ fontSize:10.5, fontWeight:700, color:T.textMute, letterSpacing:'1px', marginBottom:9 }}>{children}</div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
