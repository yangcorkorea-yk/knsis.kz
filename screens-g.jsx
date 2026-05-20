// Screens 15-16: Before & After gallery (mobile) + admin management.

// Shared sample data — used everywhere (clinic detail, treatment detail, home, gallery).
const BA_DATA = [
  { id:1,  tx:'lift',    clinic:'Lienne Clinic',       tone:'rose',  pair:'lav',   who:'Aigerim',  loc:'almaty',  age:32, after:'2 weeks',  status:'published', date:'2025-04-12' },
  { id:2,  tx:'filler',  clinic:'Centum Dermatology',  tone:'lav',   pair:'beige', who:'Dana',     loc:'astana',  age:28, after:'1 month',  status:'published', date:'2025-04-08' },
  { id:3,  tx:'acne',    clinic:'Almaty Skin Lab',     tone:'beige', pair:'warm',  who:'Aliya',    loc:'almaty',  age:24, after:'3 months', status:'published', date:'2025-03-22' },
  { id:4,  tx:'pigment', clinic:'Nur Beauty Clinic',   tone:'warm',  pair:'rose',  who:'Madina',   loc:'astana',  age:35, after:'2 months', status:'published', date:'2025-03-18' },
  { id:5,  tx:'lift',    clinic:'Almaty Skin Lab',     tone:'rose',  pair:'beige', who:'Zarina',   loc:'almaty',  age:38, after:'6 weeks',  status:'published', date:'2025-03-10' },
  { id:6,  tx:'skin',    clinic:'Lienne Clinic',       tone:'beige', pair:'rose',  who:'Saule',    loc:'almaty',  age:29, after:'2 months', status:'published', date:'2025-03-04' },
  { id:7,  tx:'botox',   clinic:'Centum Dermatology',  tone:'lav',   pair:'rose',  who:'Kamila',   loc:'astana',  age:34, after:'3 weeks',  status:'pending',   date:'2025-04-22' },
  { id:8,  tx:'filler',  clinic:'Nur Beauty Clinic',   tone:'warm',  pair:'lav',   who:'Aizhan',   loc:'almaty',  age:31, after:'1 month',  status:'published', date:'2025-02-28' },
  { id:9,  tx:'lift',    clinic:'Lienne Clinic',       tone:'rose',  pair:'beige', who:'Diana',    loc:'almaty',  age:42, after:'2 months', status:'draft',     date:'2025-04-25' },
  { id:10, tx:'skin',    clinic:'Almaty Skin Lab',     tone:'lav',   pair:'rose',  who:'Nazym',    loc:'astana',  age:27, after:'1 month',  status:'published', date:'2025-02-14' },
];

// Helper: filter
function filterBA({ treatment, clinic, status } = {}) {
  return BA_DATA.filter(b => {
    if (treatment && treatment !== 'all' && b.tx !== treatment) return false;
    if (clinic    && clinic    !== 'all' && b.clinic !== clinic) return false;
    if (status    && status    !== 'all' && b.status !== status) return false;
    return true;
  });
}

// ════════════════════════════════════════════════════════════════════
// BA-1. BEFORE & AFTER GALLERY (mobile)
// ════════════════════════════════════════════════════════════════════
function ScreenBeforeAfter() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();

  const L = {
    title:    { kz:'Before & After', ru:'До и После', kr:'비포 & 애프터' }[lang],
    sub:      { kz:'Нақты пациенттердің нәтижелері', ru:'Реальные результаты клиентов', kr:'실제 고객의 변화 모음' }[lang],
    byAll:    { kz:'Барлығы', ru:'Все', kr:'전체' }[lang],
    byTx:     { kz:'Процедура бойынша', ru:'По процедуре', kr:'시술별' }[lang],
    byClinic: { kz:'Клиника бойынша', ru:'По клинике', kr:'클리닉별' }[lang],
    consent:  { kz:'Барлық суреттер пайдаланушы келісімімен жарияланды. Жеке нәтиже өзгеруі мүмкін.',
                ru:'Все фото опубликованы с согласия. Индивидуальные результаты могут отличаться.',
                kr:'모든 사진은 사용자 동의 하에 게시되었으며 개인별 결과는 다를 수 있습니다.' }[lang],
    total:    { kz:(n)=>`Барлығы ${n} жұп`, ru:(n)=>`Всего ${n} пар`, kr:(n)=>`총 ${n}건` }[lang],
    after:    { kz:'кейін', ru:'после', kr:'후' }[lang],
    sortNew:  { kz:'Жаңалары', ru:'Новые', kr:'최신순' }[lang],
  };

  const [filter, setFilter] = React.useState({ kind:'all', tx:'all', clinic:'all' });
  const allClinics = ['Lienne Clinic','Centum Dermatology','Almaty Skin Lab','Nur Beauty Clinic'];
  const allTxKeys = ['lift','botox','filler','skin','acne','pigment'];

  const items = filterBA({
    treatment: filter.tx === 'all' ? null : filter.tx,
    clinic:    filter.clinic === 'all' ? null : filter.clinic,
    status:    'published',
  });

  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bg, position:'relative' }}>
      {/* Header */}
      <div style={{
        background:`linear-gradient(180deg, ${T.roseTint} 0%, ${T.bg} 100%)`,
        padding:'12px 0 0',
      }}>
        <TopBar title={L.title} sub={L.sub} transparent
          right={<Icon d={Icons.search} size={20} stroke={T.ink2}/>}
        />

        {/* Toggle: Reviews ↔ Before & After (consistent with reviews tab) */}
        <div style={{ padding:'2px 16px 0', display:'flex', gap:6 }}>
          <button onClick={() => nav.go('rv')}
            className="kb-press"
            style={{
              flex:1, padding:'10px 14px', borderRadius:11, fontSize:13, fontWeight:600,
              background:'transparent', color:T.textMute,
              border:`1px solid ${T.borderSoft}`, cursor:'pointer', fontFamily:'inherit',
            }}>
            {t.rv.title}
          </button>
          <button className="kb-press"
            style={{
              flex:1, padding:'10px 14px', borderRadius:11, fontSize:13, fontWeight:700,
              background:T.ink, color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit',
            }}>
            {L.title}
          </button>
        </div>

        {/* Kind tabs */}
        <div style={{ padding:'12px 16px 0', display:'flex', gap:6 }}>
          {[['all', L.byAll], ['tx', L.byTx], ['clinic', L.byClinic]].map(([id,l])=>(
            <button key={id} onClick={() => setFilter(f => ({ ...f, kind:id, tx:'all', clinic:'all' }))}
              className="kb-press"
              style={{
                padding:'7px 13px', borderRadius:999, fontSize:12, fontWeight:600,
                background: filter.kind === id ? T.rose : T.bgSoft,
                color: filter.kind === id ? '#fff' : T.ink2,
                border:'none', cursor:'pointer', fontFamily:'inherit',
              }}>{l}</button>
          ))}
        </div>

        {/* Sub-filter row */}
        {filter.kind === 'tx' && (
          <div className="kb-scroll" style={{ display:'flex', gap:6, overflowX:'auto', padding:'10px 16px 0' }}>
            {[['all', L.byAll], ...allTxKeys.map(k => [k, t.cat.names[k]])].map(([id,l])=>(
              <button key={id} onClick={() => setFilter(f => ({ ...f, tx:id }))}
                className="kb-press"
                style={{
                  flex:'0 0 auto', padding:'6px 11px', borderRadius:999, fontSize:11.5, fontWeight:500,
                  border: filter.tx === id ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
                  background: filter.tx === id ? T.roseTint : '#fff',
                  color: filter.tx === id ? T.roseDeep : T.ink2,
                  whiteSpace:'nowrap', cursor:'pointer', fontFamily:'inherit',
                }}>{l}</button>
            ))}
          </div>
        )}
        {filter.kind === 'clinic' && (
          <div className="kb-scroll" style={{ display:'flex', gap:6, overflowX:'auto', padding:'10px 16px 0' }}>
            {[['all', L.byAll], ...allClinics.map(c => [c, c])].map(([id,l])=>(
              <button key={id} onClick={() => setFilter(f => ({ ...f, clinic:id }))}
                className="kb-press"
                style={{
                  flex:'0 0 auto', padding:'6px 11px', borderRadius:999, fontSize:11.5, fontWeight:500,
                  border: filter.clinic === id ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
                  background: filter.clinic === id ? T.roseTint : '#fff',
                  color: filter.clinic === id ? T.roseDeep : T.ink2,
                  whiteSpace:'nowrap', cursor:'pointer', fontFamily:'inherit',
                }}>{l}</button>
            ))}
          </div>
        )}

        {/* Total + sort */}
        <div style={{ padding:'14px 16px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:11.5, color:T.textMute }}>{L.total(items.length)}</div>
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:T.ink2, fontWeight:500 }}>
            <Icon d={Icons.sort} size={13} stroke={T.ink2} sw={2}/>
            <span>{L.sortNew}</span>
            <Icon d={Icons.chevD} size={11} stroke={T.textMute} sw={2}/>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ padding:'0 16px 18px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:11 }}>
        {items.map((b)=>(
          <BACard key={b.id} item={b} t={t} lang={lang} after={L.after}/>
        ))}
      </div>

      {/* Disclosure */}
      <div style={{ padding:'4px 16px 110px' }}>
        <div style={{ background:T.bgSoft, borderRadius:11, padding:'12px 14px',
          display:'flex', gap:9, alignItems:'flex-start',
          border:`1px solid ${T.borderSoft}`,
        }}>
          <Icon d={Icons.shield} size={16} stroke={T.textMute} sw={1.8}/>
          <div style={{ fontSize:11, color:T.text, lineHeight:1.55 }}>{L.consent}</div>
        </div>
      </div>

      <BottomTab active="review"/>
    </div>
  );
}

// ─── Reusable Before/After card ────────────────────────────────────
function BACard({ item, t, lang, after, compact = false }) {
  const txLabel = t.cat.names[item.tx];
  const loc = t.locName[item.loc];
  const beforeTag = lang === 'ru' ? 'ДО' : 'BEFORE';
  const afterTag  = lang === 'ru' ? 'ПОСЛЕ' : 'AFTER';
  return (
    <div className="kb-card" style={{ overflow:'hidden', padding:0 }}>
      <div style={{ display:'flex', gap:2, position:'relative' }}>
        <div className={`kb-img-ph ${item.tone}`} style={{ flex:1, height: compact ? 96 : 124, position:'relative' }}>
          <div style={{ position:'absolute', top:6, left:6, background:'rgba(0,0,0,0.55)', color:'#fff',
            fontSize:9, padding:'2.5px 6px', borderRadius:4, fontWeight:800, letterSpacing:'0.5px' }}>{beforeTag}</div>
        </div>
        <div className={`kb-img-ph ${item.pair}`} style={{ flex:1, height: compact ? 96 : 124, position:'relative' }}>
          <div style={{ position:'absolute', top:6, left:6, background:'rgba(232,96,122,0.92)', color:'#fff',
            fontSize:9, padding:'2.5px 6px', borderRadius:4, fontWeight:800, letterSpacing:'0.5px' }}>{afterTag}</div>
        </div>
        {/* center marker */}
        <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:1, transform:'translateX(-50%)',
          background:'rgba(255,255,255,0.6)' }}/>
      </div>
      <div style={{ padding:'10px 11px 11px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:6 }}>
          <div style={{ fontSize:11.5, fontWeight:700, color:T.ink, letterSpacing:'-0.2px' }}>{txLabel}</div>
          <div style={{ fontSize:9.5, color:T.textMute, fontFamily:'monospace' }}>{item.after} {after}</div>
        </div>
        <div style={{ fontSize:10.5, color:T.roseDeep, fontWeight:600, marginTop:3, letterSpacing:'-0.2px',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.clinic}</div>
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5 }}>
          <div style={{ width:18, height:18, borderRadius:'50%',
            background: item.tone === 'rose' ? T.roseTint : item.tone === 'lav' ? T.lavenderSoft : T.beigeSoft,
            color: item.tone === 'rose' ? T.roseDeep : item.tone === 'lav' ? '#6E5A8C' : '#7A6A4A',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800,
          }}>{item.who[0]}</div>
          <div style={{ fontSize:10, color:T.textMute }}>{item.who} · {loc}</div>
        </div>
      </div>
    </div>
  );
}

// Inline B&A strip — used inside Clinic detail and Treatment detail
function BAStrip({ items, t, lang, onMore }) {
  if (!items.length) return null;
  const moreLabel = { kz:'Толығырақ', ru:'Все', kr:'전체 보기' }[lang];
  const beforeTag = lang === 'ru' ? 'ДО' : 'BEFORE';
  const afterTag  = lang === 'ru' ? 'ПОСЛЕ' : 'AFTER';
  return (
    <div className="kb-scroll" style={{ display:'flex', gap:10, overflowX:'auto', padding:'10px 18px 4px' }}>
      {items.map((b,i)=>(
        <div key={b.id} style={{ flex:'0 0 168px' }}>
          <div style={{ display:'flex', gap:4, borderRadius:10, overflow:'hidden' }}>
            <div className={`kb-img-ph ${b.tone}`} style={{ flex:1, height:108, position:'relative' }}>
              <div style={{ position:'absolute', top:6, left:6, background:'rgba(0,0,0,0.5)', color:'#fff',
                fontSize:9, padding:'2px 6px', borderRadius:4, fontWeight:700 }}>{beforeTag}</div>
            </div>
            <div className={`kb-img-ph ${b.pair}`} style={{ flex:1, height:108, position:'relative' }}>
              <div style={{ position:'absolute', top:6, left:6, background:'rgba(232,96,122,0.85)', color:'#fff',
                fontSize:9, padding:'2px 6px', borderRadius:4, fontWeight:700 }}>{afterTag}</div>
            </div>
          </div>
          <div style={{ marginTop:6, fontSize:10.5, fontWeight:600, color:T.ink, letterSpacing:'-0.1px' }}>
            {t.cat.names[b.tx]} · {b.after}
          </div>
        </div>
      ))}
      {onMore && (
        <button onClick={onMore} className="kb-press"
          style={{
            flex:'0 0 84px', height:108, marginTop:0,
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:5,
            background:T.bgSoft, border:`1.5px dashed ${T.border}`, borderRadius:10,
            cursor:'pointer', fontFamily:'inherit', color:T.textMute, padding:0,
          }}>
          <Icon d={Icons.chevR} size={18} stroke={T.textMute}/>
          <div style={{ fontSize:10, fontWeight:600 }}>{moreLabel}</div>
        </button>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// BA-2. ADMIN — BEFORE & AFTER MANAGEMENT (desktop)
// ════════════════════════════════════════════════════════════════════
function ScreenAdminBeforeAfter() {
  const t = useT();
  const lang = useLang();
  const [filter, setFilter] = React.useState({ tx:'all', clinic:'all', status:'all' });
  const [selected, setSelected] = React.useState(BA_DATA[0]);

  const L = {
    title:   { kz:'Before & After басқару', ru:'Управление До и После', kr:'Before & After 관리' }[lang],
    sub:     { kz:'Жариялау · келісім · сұрыптау', ru:'Публикация · согласие · модерация', kr:'게시·동의·검수 관리' }[lang],
    new:     { kz:'Жаңа жұп қосу', ru:'Добавить новую пару', kr:'새 항목 추가' }[lang],
    cols:    { kz:['Сурет','Процедура','Клиника','Пациент','Күй','Күні','Әрекет'],
               ru:['Фото','Процедура','Клиника','Пациент','Статус','Дата','Действие'],
               kr:['이미지','시술','클리닉','고객','상태','등록일','액션'] }[lang],
    all:     { kz:'Барлығы', ru:'Все', kr:'전체' }[lang],
    filters: { kz:['Барлық процедуралар','Барлық клиникалар','Барлық күйлер'],
               ru:['Все процедуры','Все клиники','Все статусы'],
               kr:['전체 시술','전체 클리닉','전체 상태'] }[lang],
    statuses: {
      published: { kz:'Жарияланған', ru:'Опубликовано', kr:'게시됨' },
      pending:   { kz:'Тексеруде',   ru:'На проверке',  kr:'검수 대기' },
      draft:     { kz:'Жоба',        ru:'Черновик',     kr:'초안' },
    },
    consent:    { kz:'Пациент келісімі', ru:'Согласие пациента', kr:'환자 동의' }[lang],
    consentVal: { kz:'Алынған · ' , ru:'Получено · ', kr:'서명 완료 · ' }[lang],
    publish:    { kz:'Жариялау', ru:'Опубликовать', kr:'게시' }[lang],
    unpublish:  { kz:'Жариядан алу', ru:'Снять с публикации', kr:'게시 취소' }[lang],
    edit:       { kz:'Өңдеу', ru:'Редактировать', kr:'편집' }[lang],
    delete:     { kz:'Жою',   ru:'Удалить',     kr:'삭제' }[lang],
    preview:    { kz:'Алдын ала қарау', ru:'Превью', kr:'미리보기' }[lang],
    txField:    { kz:'Процедура', ru:'Процедура', kr:'시술' }[lang],
    clField:    { kz:'Клиника',   ru:'Клиника',   kr:'클리닉' }[lang],
    locField:   { kz:'Аймақ', ru:'Регион', kr:'지역' }[lang],
    ageField:   { kz:'Жасы', ru:'Возраст', kr:'연령' }[lang],
    afterField: { kz:'Уақыт', ru:'Срок после', kr:'경과 시간' }[lang],
    search:     { kz:'Іздеу', ru:'Поиск', kr:'검색' }[lang],
  };

  const statusMeta = {
    published: { bg:'#E5F4EC', fg:'#1F7A4D', dot:'#1F7A4D' },
    pending:   { bg:'#FFF5E1', fg:'#A07012', dot:'#A07012' },
    draft:     { bg:'#F0EDE8', fg:'#5A5A5A', dot:'#7A7A7A' },
  };

  const items = filterBA({
    treatment: filter.tx,
    clinic: filter.clinic,
    status: filter.status,
  });

  const A = { bg:'#F7F6F4', panel:'#fff', border:'#E8E5E0', borderSoft:'#F0EDE8', text:'#5A5A5A', mute:'#9A9A95' };

  return (
    <AdminShell active="ba">
      <div style={{
        padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
        background:'#fff', display:'flex', alignItems:'center', gap:14,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{L.title}</div>
          <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{L.sub}</div>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{
          display:'flex', alignItems:'center', gap:7, padding:'7px 11px',
          border:`1px solid ${A.border}`, borderRadius:9, background:A.bg, minWidth:220,
        }}>
          <Icon d={Icons.search} size={14} stroke={A.mute}/>
          <div style={{ fontSize:12, color:A.mute }}>{L.search}</div>
        </div>
        <button style={{
          padding:'7px 13px', background:T.rose, color:'#fff', border:'none', borderRadius:8,
          fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontFamily:T.font,
        }}>
          <Icon d={Icons.plus} size={12} stroke="#fff" sw={2.2}/> {L.new}
        </button>
      </div>

      {/* Filters */}
      <div style={{ padding:'14px 22px 10px', display:'flex', gap:7, flexWrap:'wrap' }}>
        {L.filters.map((label,i)=>(
          <div key={i} style={{
            padding:'6px 10px', border:`1px solid ${A.border}`, borderRadius:7,
            fontSize:11.5, color:A.text, fontWeight:500, background:A.bg,
            display:'flex', alignItems:'center', gap:5,
          }}>
            {label}
            <Icon d={Icons.chevD} size={11} stroke={A.mute} sw={2}/>
          </div>
        ))}
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', gap:5, background:A.bg, border:`1px solid ${A.border}`,
          borderRadius:7, padding:2,
        }}>
          {[
            { id:'all', label:L.all, n:BA_DATA.length },
            { id:'published', label:L.statuses.published[lang], n:BA_DATA.filter(b=>b.status==='published').length },
            { id:'pending',   label:L.statuses.pending[lang],   n:BA_DATA.filter(b=>b.status==='pending').length },
            { id:'draft',     label:L.statuses.draft[lang],     n:BA_DATA.filter(b=>b.status==='draft').length },
          ].map(s=>{
            const on = filter.status === s.id;
            return (
              <button key={s.id} onClick={() => setFilter(f => ({ ...f, status:s.id }))}
                style={{
                  padding:'5px 10px', borderRadius:5, fontSize:11.5, fontWeight: on ? 700 : 500,
                  background: on ? '#fff' : 'transparent', color: on ? T.ink : A.text,
                  border:'none', cursor:'pointer', fontFamily:T.font,
                  boxShadow: on ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                }}>{s.label} <span style={{ opacity:0.6 }}>{s.n}</span></button>
            );
          })}
        </div>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Grid */}
        <div style={{ flex:1, overflow:'auto', padding:'8px 22px 22px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
            {items.map((b)=>{
              const s = statusMeta[b.status];
              const on = selected && selected.id === b.id;
              return (
                <button key={b.id} onClick={() => setSelected(b)}
                  style={{
                    background:'#fff', border: on ? `2px solid ${T.rose}` : `1px solid ${A.border}`,
                    borderRadius:12, padding:0, overflow:'hidden', textAlign:'left',
                    cursor:'pointer', fontFamily:T.font,
                    transition:'border-color .12s',
                  }}>
                  <div style={{ display:'flex', gap:2, position:'relative' }}>
                    <div className={`kb-img-ph ${b.tone}`} style={{ flex:1, height:130, position:'relative' }}>
                      <div style={{ position:'absolute', top:7, left:7, background:'rgba(0,0,0,0.55)', color:'#fff',
                        fontSize:9, padding:'2.5px 6px', borderRadius:4, fontWeight:800, letterSpacing:'0.5px' }}>BEFORE</div>
                    </div>
                    <div className={`kb-img-ph ${b.pair}`} style={{ flex:1, height:130, position:'relative' }}>
                      <div style={{ position:'absolute', top:7, left:7, background:'rgba(232,96,122,0.92)', color:'#fff',
                        fontSize:9, padding:'2.5px 6px', borderRadius:4, fontWeight:800, letterSpacing:'0.5px' }}>AFTER</div>
                    </div>
                    {/* status pill on top right */}
                    <div style={{
                      position:'absolute', top:7, right:7, padding:'3px 8px', borderRadius:5,
                      background:s.bg, color:s.fg, fontSize:9.5, fontWeight:800, letterSpacing:'0.5px',
                      display:'inline-flex', alignItems:'center', gap:4,
                    }}>
                      <div style={{ width:4, height:4, borderRadius:'50%', background:s.dot }}/>
                      {L.statuses[b.status][lang].toUpperCase()}
                    </div>
                  </div>
                  <div style={{ padding:'10px 12px 12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:6 }}>
                      <div style={{ fontSize:12.5, fontWeight:700, color:T.ink, letterSpacing:'-0.2px' }}>{t.cat.names[b.tx]}</div>
                      <div style={{ fontSize:10, color:A.mute, fontFamily:'monospace' }}>{b.after}</div>
                    </div>
                    <div style={{ fontSize:11, color:T.roseDeep, fontWeight:600, marginTop:3,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.clinic}</div>
                    <div style={{ marginTop:7, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ fontSize:10, color:A.mute }}>{b.who} · {t.locName[b.loc]}</div>
                      <div style={{ fontSize:9.5, color:A.mute, fontFamily:'monospace' }}>#{String(b.id).padStart(4,'0')}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail drawer */}
        <div style={{
          width:340, background:'#fff', borderLeft:`1px solid ${A.border}`,
          display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden',
        }}>
          {selected && (
            <>
              <div style={{ padding:'12px 16px', borderBottom:`1px solid ${A.borderSoft}`,
                display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ fontSize:12.5, fontWeight:700 }}>#{String(selected.id).padStart(4,'0')}</div>
                <Icon d={Icons.x} size={15} stroke={A.text}/>
              </div>
              <div style={{ padding:'14px 16px', overflow:'auto', flex:1 }}>
                {/* Large preview */}
                <div style={{ display:'flex', gap:3, borderRadius:11, overflow:'hidden', marginBottom:11 }}>
                  <div className={`kb-img-ph ${selected.tone}`} style={{ flex:1, height:180, position:'relative' }}>
                    <div style={{ position:'absolute', top:8, left:8, background:'rgba(0,0,0,0.6)', color:'#fff',
                      fontSize:10, padding:'3px 7px', borderRadius:5, fontWeight:800, letterSpacing:'0.5px' }}>BEFORE</div>
                  </div>
                  <div className={`kb-img-ph ${selected.pair}`} style={{ flex:1, height:180, position:'relative' }}>
                    <div style={{ position:'absolute', top:8, left:8, background:'rgba(232,96,122,0.92)', color:'#fff',
                      fontSize:10, padding:'3px 7px', borderRadius:5, fontWeight:800, letterSpacing:'0.5px' }}>AFTER</div>
                  </div>
                </div>

                <DetailRow label={L.txField}>
                  <span style={{ padding:'3px 8px', background:T.roseTint, color:T.roseDeep,
                    borderRadius:5, fontSize:11, fontWeight:700 }}>{t.cat.names[selected.tx]}</span>
                </DetailRow>
                <DetailRow label={L.clField}>{selected.clinic}</DetailRow>
                <DetailRow label={L.locField}>{t.locName[selected.loc]}</DetailRow>
                <DetailRow label={L.ageField}>{selected.age}</DetailRow>
                <DetailRow label={L.afterField}>{selected.after}</DetailRow>

                {/* Consent */}
                <div style={{ marginTop:14, padding:'12px 13px', background:'#E5F4EC',
                  border:`1px solid #BFE5CF`, borderRadius:10, display:'flex', gap:9, alignItems:'flex-start' }}>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon d={Icons.shieldCheck} size={14} stroke="#1F7A4D" sw={2.2}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11.5, fontWeight:700, color:'#1F7A4D' }}>{L.consent}</div>
                    <div style={{ fontSize:10.5, color:'#1F7A4D', opacity:0.8, marginTop:2 }}>{L.consentVal}{selected.date}</div>
                  </div>
                </div>

                {/* Visibility */}
                <div style={{ marginTop:11, padding:'12px 13px', background:A.bg,
                  border:`1px solid ${A.border}`, borderRadius:10 }}>
                  <div style={{ fontSize:10.5, color:A.mute, fontWeight:700, letterSpacing:'0.3px', marginBottom:7 }}>
                    {lang==='kz'?'КӨРІНУ':lang==='ru'?'ВИДИМОСТЬ':'노출 위치'}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {[
                      { l:lang==='kz'?'Before & After галереясы':lang==='ru'?'Галерея До/После':'Before & After 갤러리', on:true },
                      { l:lang==='kz'?`Клиника беті: ${selected.clinic}`:lang==='ru'?`Страница клиники: ${selected.clinic}`:`클리닉 페이지: ${selected.clinic}`, on:true },
                      { l:lang==='kz'?`Процедура беті: ${t.cat.names[selected.tx]}`:lang==='ru'?`Страница процедуры: ${t.cat.names[selected.tx]}`:`시술 페이지: ${t.cat.names[selected.tx]}`, on:true },
                      { l:lang==='kz'?'Басты бет': lang==='ru'?'Главная':'홈 화면', on:false },
                    ].map((v,i)=>(
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:9, padding:'4px 0' }}>
                        <div style={{ width:26, height:14, borderRadius:999, background:v.on?T.rose:'#DDD',
                          display:'flex', alignItems:'center', padding:1.5 }}>
                          <div style={{ width:11, height:11, borderRadius:'50%', background:'#fff',
                            marginLeft:v.on?12:0, transition:'.2s' }}/>
                        </div>
                        <div style={{ fontSize:11.5, color:T.ink2 }}>{v.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop:14, display:'flex', gap:7 }}>
                  <button style={{ flex:1, padding:'9px 12px', background:T.rose, color:'#fff', border:'none',
                    borderRadius:8, fontSize:11.5, fontWeight:700, cursor:'pointer', fontFamily:T.font,
                  }}>{selected.status === 'published' ? L.unpublish : L.publish}</button>
                  <button style={{ padding:'9px 12px', background:'#fff', color:T.ink2, border:`1px solid ${A.border}`,
                    borderRadius:8, fontSize:11.5, fontWeight:600, cursor:'pointer', fontFamily:T.font,
                  }}>{L.edit}</button>
                  <button style={{ padding:'9px 12px', background:'#fff', color:'#A04432', border:`1px solid ${A.border}`,
                    borderRadius:8, fontSize:11.5, fontWeight:600, cursor:'pointer', fontFamily:T.font,
                  }}>{L.delete}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

Object.assign(window, { BA_DATA, filterBA, ScreenBeforeAfter, ScreenAdminBeforeAfter, BACard, BAStrip });
