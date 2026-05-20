// Screens 5-7: Clinic list, Clinic detail, Reviews — i18n + nav

// ════════════════════════════════════════════════════════════════════
// 5. CLINIC LIST
// ════════════════════════════════════════════════════════════════════
function ScreenClinicList() {
  const t = useT();
  const nav = useNav();
  const clinics = [
    {
      n:'Lienne Clinic', loc:`${t.locName.seoul} · Gangnam`,
      tone:'rose', langs:'RU · KR · EN',
      service:t.tx.title, korea:true, reviews:318,
      tags:[t.home.koreaTag, t.cld.intp, t.home.aftercare],
    },
    {
      n:'Centum Dermatology', loc:`${t.locName.seoul} · Cheongdam`,
      tone:'lav', langs:'RU · KR',
      service:`${t.cat.names.skin} · ${t.cat.names.pigment}`, korea:true, reviews:241,
      tags:[t.home.koreaTag, t.cld.intp],
    },
    {
      n:'Almaty Skin Lab', loc:`${t.locName.almaty} · Medeu`,
      tone:'beige', langs:'KZ · RU · KR',
      service:`${t.cat.names.skin} · ${t.cat.names.acne}`, korea:false, reviews:212,
      tags:[t.home.localTag, 'KZ·RU', t.home.aftercare],
    },
    {
      n:'Nur Beauty Clinic', loc:`${t.locName.astana} · Esil`,
      tone:'rose', langs:'KZ · RU · EN',
      service:`${t.cat.names.botox} · ${t.cat.names.filler} · ${t.cat.names.lift}`, korea:false, reviews:148,
      tags:[t.home.localTag, t.locName.astana],
    },
  ];

  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bg, position:'relative' }}>
      <TopBar title={t.cl.title} sub={t.cl.sub}
        right={<Icon d={Icons.search} size={20} stroke={T.ink2}/>}
      />

      <div style={{ display:'flex', padding:'10px 16px 0', gap:8 }}>
        {[
          { l:t.cl.tabAll, n:34, active:true },
          { l:t.cl.tabKorea, n:14 },
          { l:t.cl.tabLocal, n:20 },
        ].map((tt,i)=>(
          <div key={i} style={{
            padding:'8px 14px', borderRadius:10, fontSize:12.5, fontWeight:600,
            background: tt.active ? T.ink : T.bgSoft,
            color: tt.active ? '#fff' : T.text,
            letterSpacing:'-0.2px',
          }}>
            {tt.l} <span style={{ opacity:0.7, fontWeight:500 }}>{tt.n}</span>
          </div>
        ))}
      </div>

      <div className="kb-scroll" style={{ display:'flex', gap:7, overflowX:'auto', padding:'12px 16px 0' }}>
        {[
          { l:t.cat.filter, icon:Icons.filter },
          { l:t.cat.almaty, active:true },
          { l:t.cat.ruAvail, active:true },
          { l:t.home.aftercare },
          { l:t.cat.area },
        ].map((c,i)=>(
          <div key={i} style={{
            flex:'0 0 auto', display:'flex', alignItems:'center', gap:5,
            padding:'7px 12px', borderRadius:999, fontSize:12, fontWeight:500,
            border: c.active ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
            background: c.active ? T.roseTint : '#fff',
            color: c.active ? T.roseDeep : T.ink2,
            whiteSpace:'nowrap', letterSpacing:'-0.2px',
          }}>
            {c.icon && <Icon d={c.icon} size={12} stroke={T.ink2} sw={2}/>}
            {c.l}
            {!c.icon && <Icon d={Icons.chevD} size={11} stroke={c.active ? T.roseDeep : T.textMute} sw={2}/>}
          </div>
        ))}
      </div>

      <div style={{ padding:'14px 16px 4px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:11.5, color:T.textMute }}>{t.cl.total(34)}</div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:T.ink2, fontWeight:500 }}>
          <Icon d={Icons.sort} size={13} stroke={T.ink2} sw={2}/>
          <span>{t.cl.sortReview}</span>
          <Icon d={Icons.chevD} size={11} stroke={T.textMute} sw={2}/>
        </div>
      </div>

      <div style={{ padding:'10px 16px 110px', display:'flex', flexDirection:'column', gap:12 }}>
        {clinics.map((c,i)=>(
          <div key={i} className="kb-card" style={{ overflow:'hidden' }}>
            <button onClick={() => nav.go('cld')}
              className="kb-press"
              style={{ display:'block', width:'100%', padding:0, border:'none', background:'none',
                textAlign:'left', cursor:'pointer', fontFamily:'inherit' }}>
              <div className={`kb-img-ph ${c.tone}`} style={{ height:124, position:'relative' }}>
                <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:5 }}>
                  {c.korea ? <Badge tone="korea">{t.home.koreaTag}</Badge> : <Badge tone="lav">{t.home.localTag}</Badge>}
                </div>
                <div style={{ position:'absolute', top:10, right:10, width:30, height:30, borderRadius:'50%',
                  background:'rgba(255,255,255,0.9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d={Icons.heart} size={15} stroke={T.ink}/>
                </div>
                <div style={{ position:'absolute', bottom:10, left:10,
                  background:'rgba(255,255,255,0.92)', backdropFilter:'blur(6px)',
                  borderRadius:7, padding:'4px 8px', display:'flex', alignItems:'center', gap:4 }}>
                  <Icon d={Icons.shieldCheck} size={12} stroke={T.success} sw={2}/>
                  <span style={{ fontSize:10, fontWeight:700, color:T.success }}>{t.cl.certified}</span>
                </div>
              </div>
              <div style={{ padding:'12px 14px 13px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>{c.n}</div>
                      <Icon d={Icons.checkBadge} size={13} stroke={T.roseDeep} sw={2}/>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:3, fontSize:11.5, color:T.textMute }}>
                      <Icon d={Icons.pin} size={12} stroke={T.textMute}/> {c.loc}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                    <Icon d={Icons.star} size={13} fill={T.rose} stroke={T.rose}/>
                    <span style={{ fontSize:12, fontWeight:700 }}>4.{9-i}</span>
                    <span style={{ fontSize:10.5, color:T.textMute }}>({c.reviews})</span>
                  </div>
                </div>

                <div style={{ marginTop:9, fontSize:11.5, color:T.ink2 }}>
                  <span style={{ color:T.textMute }}>{t.cl.treatments} · </span>{c.service}
                </div>
                <div style={{ marginTop:4, fontSize:11.5, color:T.ink2 }}>
                  <span style={{ color:T.textMute }}>{t.cl.langs} · </span>{c.langs}
                </div>

                <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10 }}>
                  {c.tags.map((tag,k)=><Badge key={k} tone={tag.startsWith('🇰🇷') ? 'korea' : tag.includes(t.home.localTag) ? 'lav' : 'beige'}>{tag}</Badge>)}
                </div>
              </div>
            </button>
            <div style={{ padding:'0 14px 14px' }}>
              <CTA size="md" onClick={() => nav.go('fm')} icon={<Icon d={Icons.chat} size={14} stroke="#fff" sw={2}/>}>
                {t.cl.ctaCheck}
              </CTA>
            </div>
          </div>
        ))}
      </div>
      <BottomTab active="clinic"/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 6. CLINIC DETAIL
// ════════════════════════════════════════════════════════════════════
function ScreenClinicDetail() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();
  const sampleQuoteByLang = {
    kz: 'Корей тілін білмесем де аудармашы соңына дейін бірге болды, сондықтан тыныш кеңес алдым.',
    ru: 'Не зная корейского, я была с переводчиком от начала до конца. Объяснили всё подробно.',
    kr: '한국어를 못하는데도 통역 선생님이 처음부터 끝까지 함께해 주셔서 안심하고 상담받았어요.',
  };
  const sampleQuote = sampleQuoteByLang[lang] || sampleQuoteByLang.kz;
  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bg, position:'relative' }}>
      <div className="kb-img-ph rose" style={{ height:220, position:'relative' }}>
        <div style={{ position:'absolute', top:14, left:14, right:14, display:'flex', justifyContent:'space-between' }}>
          <button onClick={()=>nav.back()} className="kb-press"
            style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.92)',
              display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer' }}>
            <Icon d={Icons.chevL} size={18} stroke={T.ink}/>
          </button>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.92)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon d={Icons.heart} size={17} stroke={T.ink}/>
            </div>
          </div>
        </div>
        <div style={{ position:'absolute', bottom:12, left:14, display:'flex', gap:5 }}>
          <Badge tone="korea">{t.home.koreaTag}</Badge>
          <Badge tone="success">{t.cld.cert}</Badge>
        </div>
        <div style={{ position:'absolute', bottom:12, right:14,
          background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', borderRadius:6,
          padding:'3px 8px', fontSize:10.5, color:'#fff', fontWeight:500 }}>1/8</div>
      </div>

      <div style={{ padding:'18px 18px 6px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
          <div className="kb-display" style={{ fontSize:22 }}>Lienne Clinic</div>
          <Icon d={Icons.checkBadge} size={16} stroke={T.roseDeep} sw={2}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:T.text }}>
          <Icon d={Icons.pin} size={13} stroke={T.text}/>
          {t.locName.seoul} · Gangnam · Sinsa-dong, Apgujeong-ro
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:13, marginTop:9 }}>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Icon d={Icons.star} size={14} fill={T.rose} stroke={T.rose}/>
            <span style={{ fontSize:12.5, fontWeight:700 }}>4.9</span>
            <span style={{ fontSize:11, color:T.textMute }}>· {t.home.reviewsN(318)}</span>
          </div>
          <div style={{ width:1, height:11, background:T.border }}/>
          <div style={{ fontSize:11.5, color:T.text }}>1,240+</div>
        </div>
      </div>

      <div style={{ padding:'12px 18px 0' }}>
        <div className="kb-card" style={{ padding:'12px 14px', display:'grid', gridTemplateColumns:'1fr 1fr', rowGap:11, columnGap:10 }}>
          {[
            [t.cld.lang, 'RU · KR · EN'],
            [t.cld.intp, t.cld.ru247],
            [t.cld.koreaPart, t.cld.direct],
            [t.cld.aftercare, t.cld.day30],
          ].map((row,i)=>(
            <div key={i}>
              <div style={{ fontSize:10.5, color:T.textMute, fontWeight:500 }}>{row[0]}</div>
              <div style={{ fontSize:12.5, color:T.ink, fontWeight:600, marginTop:2, letterSpacing:'-0.2px' }}>{row[1]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={t.cld.intro}/>
        <div style={{ fontSize:12.5, color:T.ink2, lineHeight:1.6, marginTop:8 }}>
          {t.cld.introText}
        </div>
      </div>

      <div style={{ padding:'22px 0 0' }}>
        <div style={{ padding:'0 18px' }}>
          <SectionTitle title={t.cld.doctors}/>
        </div>
        <div className="kb-scroll" style={{ display:'flex', gap:11, overflowX:'auto', padding:'12px 18px 4px' }}>
          {[
            { n:'Dr. Kim M.J.', sp:`${t.cat.names.lift} · ${t.cat.names.skin}` },
            { n:'Dr. Lee S.Y.', sp:`${t.cat.names.filler} · ${t.cat.names.botox}` },
            { n:'Dr. Park J.H.', sp:`${t.cat.names.pigment}` },
          ].map((d,i)=>(
            <div key={i} className="kb-card" style={{ flex:'0 0 138px', padding:11, textAlign:'center' }}>
              <div className="kb-img-ph beige" style={{ width:62, height:62, borderRadius:'50%', margin:'0 auto 8px' }}/>
              <div style={{ fontSize:12.5, fontWeight:600, letterSpacing:'-0.2px' }}>{d.n}</div>
              <div style={{ fontSize:10.5, color:T.textMute, marginTop:2 }}>{d.sp}</div>
              <div style={{ marginTop:6, padding:'3px 6px', background:T.roseTint, color:T.roseDeep,
                borderRadius:5, fontSize:9.5, fontWeight:700, display:'inline-block' }}>
                10+ yrs
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={t.cld.treatAreas}/>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
          {['lift','botox','filler','skin','pigment','acne'].map(k=>(
            <div key={k} style={{ padding:'7px 12px', background:T.bgSoft, color:T.ink2,
              fontSize:11.5, fontWeight:500, borderRadius:8, border:`1px solid ${T.borderSoft}` }}>{t.cat.names[k]}</div>
          ))}
        </div>
      </div>

      {/* Location + map */}
      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={lang==='kz'?'Орналасу':lang==='ru'?'Местоположение':'위치'}
          right={lang==='kz'?'Бағытты ашу':lang==='ru'?'Открыть маршрут':'길찾기'}/>

        {/* Address line */}
        <div style={{ marginTop:10, display:'flex', gap:9, alignItems:'flex-start' }}>
          <div style={{ width:30, height:30, borderRadius:9, background:T.roseTint, flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center', color:T.roseDeep }}>
            <Icon d={Icons.pin} size={16} stroke={T.roseDeep} sw={2}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.2px' }}>
              Apgujeong-ro 28-gil, Gangnam-gu
            </div>
            <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>
              {lang==='kz'?'Метро Синса (3-желі) — 4 мин жаяу':
               lang==='ru'?'Метро Синса (линия 3) — 4 мин пешком':
               '신사역 (3호선) · 도보 4분'}
            </div>
          </div>
        </div>

        {/* Stylized map */}
        <div style={{ marginTop:12, borderRadius:14, overflow:'hidden', border:`1px solid ${T.borderSoft}` }}>
          <StreetMap variant="seoul"/>
        </div>

        {/* Korea ↔ Almaty comparison */}
        <div style={{ marginTop:14 }}>
          <div style={{ fontSize:11, color:T.textMute, fontWeight:600, marginBottom:7, letterSpacing:'0.3px' }}>
            {lang==='kz'?'СЕУЛ ↔ АЛМАТЫ':lang==='ru'?'СЕУЛ ↔ АЛМАТЫ':'서울 ↔ 알마티'}
          </div>
          <div className="kb-card" style={{ overflow:'hidden' }}>
            <div style={{ display:'flex' }}>
              {/* Seoul side */}
              <div style={{ flex:1, padding:'12px 13px', borderRight:`1px solid ${T.borderSoft}` }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
                  <span style={{ fontSize:13 }}>🇰🇷</span>
                  <div style={{ fontSize:11.5, fontWeight:700 }}>{t.locName.seoul} · Gangnam</div>
                </div>
                <div style={{ height:78, borderRadius:8, overflow:'hidden', background:T.bgSoft, marginBottom:8 }}>
                  <StreetMap variant="seoul" compact/>
                </div>
                <div style={{ fontSize:10, color:T.textMute, lineHeight:1.5 }}>
                  {lang==='kz'?'Әуежай: Инчхон ICN':
                   lang==='ru'?'Аэропорт: Инчхон ICN':'공항 · 인천 ICN'}
                </div>
              </div>
              {/* Plane / distance */}
              <div style={{ width:88, padding:'12px 6px', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:6, background:'#FBFAF7',
              }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:T.rose, color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d={Icons.plane} size={18} stroke="#fff" sw={1.8}/>
                </div>
                <div className="kb-display" style={{ fontSize:14, color:T.ink, lineHeight:1 }}>~7h</div>
                <div style={{ fontSize:9, color:T.textMute, textAlign:'center', lineHeight:1.4 }}>
                  {lang==='kz'?'Тікелей рейс':lang==='ru'?'Прямой рейс':'직항'}
                </div>
                <div style={{ fontSize:9, color:T.textMute }}>4,300 km</div>
              </div>
              {/* Almaty side */}
              <div style={{ flex:1, padding:'12px 13px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
                  <span style={{ fontSize:13 }}>🇰🇿</span>
                  <div style={{ fontSize:11.5, fontWeight:700 }}>{t.locName.almaty} · Medeu</div>
                </div>
                <div style={{ height:78, borderRadius:8, overflow:'hidden', background:T.bgSoft, marginBottom:8 }}>
                  <StreetMap variant="almaty" compact/>
                </div>
                <div style={{ fontSize:10, color:T.textMute, lineHeight:1.5 }}>
                  {lang==='kz'?'Әуежай: Алматы ALA':
                   lang==='ru'?'Аэропорт: Алматы ALA':'공항 · 알마티 ALA'}
                </div>
              </div>
            </div>
          </div>

          {/* Visit-mode hint */}
          <button onClick={() => nav.go('kv')}
            className="kb-press"
            style={{
              marginTop:10, width:'100%', display:'flex', alignItems:'center', gap:11,
              padding:'12px 13px', borderRadius:11,
              background:'#fff', border:`1.5px dashed ${T.rose}`, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
            }}>
            <div style={{ width:30, height:30, borderRadius:9, background:T.roseTint,
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              color:T.roseDeep }}>
              <Icon d={Icons.plane} size={16} stroke={T.roseDeep} sw={2}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:T.roseDeep, letterSpacing:'-0.2px' }}>
                {lang==='kz'?'Кореяға сапар арқылы кеңесті бағаламақсыз ба?':
                 lang==='ru'?'Рассмотреть поездку в Корею?':
                 '한국 방문 상담을 알아볼까요?'}
              </div>
              <div style={{ fontSize:10.5, color:T.text, marginTop:2 }}>
                {lang==='kz'?'Әуежай, қонақ үй, аудармашы — біз шешеміз':
                 lang==='ru'?'Аэропорт, отель, переводчик — мы решим':
                 '공항, 호텔, 통역 모두 안내'}
              </div>
            </div>
            <Icon d={Icons.chevR} size={16} stroke={T.roseDeep}/>
          </button>
        </div>
      </div>

      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={t.cld.opInfo}/>
        <div style={{ marginTop:10, border:`1px solid ${T.borderSoft}`, borderRadius:12, overflow:'hidden' }}>
          {[t.cld.opHours, t.cld.opClose, t.cld.opTrans, t.cld.opVisit].map((row,i,arr)=>(
            <div key={i} style={{
              display:'flex', padding:'11px 13px',
              borderBottom: i<arr.length-1 ? `1px solid ${T.borderSoft}` : 'none',
              background: i%2===0 ? T.bgWarm : '#fff',
            }}>
              <div style={{ width:120, fontSize:11.5, color:T.textMute, fontWeight:500, flexShrink:0 }}>{row[0]}</div>
              <div style={{ flex:1, fontSize:12, color:T.ink2, lineHeight:1.5 }}>{row[1]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'22px 0 0' }}>
        <div style={{ padding:'0 18px' }}>
          <SectionTitle title={t.cld.ba}
            right={`${filterBA({clinic:'Lienne Clinic', status:'published'}).length} ›`}/>
        </div>
        <BAStrip
          items={filterBA({ clinic:'Lienne Clinic', status:'published' })}
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

      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={t.cld.certInfo}/>
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:7 }}>
          {[t.cld.cert1, t.cld.cert2, t.cld.cert3].map((s,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:'#E5F4EC',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d={Icons.check} size={11} stroke={T.success} sw={2.5}/>
              </div>
              <div style={{ fontSize:12, color:T.ink2 }}>{s}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'22px 18px 130px' }}>
        <SectionTitle title={t.cld.reviewSec} right="318 ›"/>
        <div className="kb-card" style={{ padding:13, marginTop:10 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:T.lavenderSoft,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:11.5, fontWeight:700, color:'#6E5A8C' }}>
                A
              </div>
              <div>
                <div style={{ fontSize:12.5, fontWeight:600 }}>Aigerim</div>
                <div style={{ fontSize:10.5, color:T.textMute }}>{t.locName.almaty} · {t.cat.names.lift}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:1 }}>
              {[0,0,0,0,0].map((_,k)=><Icon key={k} d={Icons.star} size={11} fill={T.rose} stroke={T.rose}/>)}
            </div>
          </div>
          <div style={{ fontSize:12, color:T.ink2, lineHeight:1.55, marginTop:9 }}>
            "{sampleQuote}"
          </div>
        </div>
      </div>

      <div style={{ position:'absolute', left:0, right:0, bottom:0,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(14px)',
        borderTop:`1px solid ${T.borderSoft}`, padding:'12px 16px 26px',
        display:'flex', gap:10,
      }}>
        <button className="kb-press" style={{
          width:46, height:48, borderRadius:14, background:'#fff', border:`1px solid ${T.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}><Icon d={Icons.heart} size={20} stroke={T.ink}/></button>
        <div style={{ flex:1 }}>
          <CTA onClick={() => nav.go('fm')} icon={<Icon d={Icons.chat} size={18} stroke="#fff" sw={2}/>}>
            {t.cld.ctaClinic}
          </CTA>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 7. REVIEWS
// ════════════════════════════════════════════════════════════════════
function ScreenReviews() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();
  const reviewsByLang = {
    kz: [
      'Маманның жұмысына өте риза болдым. Аудармашымен бірге барлық сұрағыма жауап алдым, сондай-ақ кейінгі күтім туралы кеңес берілді.',
      'Алдын ала кеңес ұқыпты болғандықтан тыныш күйде келдім. Аударма да тегін болды, бұл өте ыңғайлы.',
      'Кореяда кеңес алдым, келу-кету кестесі мен бағыттау өте жинақы болды.',
    ],
    ru: [
      'Очень внимательное отношение, мне всё подробно объяснили на родном языке, рассказали про уход после.',
      'Подготовительная консультация была обстоятельной, я чувствовала себя в безопасности. Перевод бесплатный — это удобно.',
      'Делала визитную консультацию в Корее. Сопровождение и расписание поездки прошли гладко.',
    ],
    kr: [
      '친절하게 모국어로 안내받아서 부담 없이 진행할 수 있었어요. 사후관리 안내도 친절했습니다.',
      '사전 상담이 꼼꼼해서 안심하고 받았습니다. 통역도 무료라 편했어요.',
      '한국 방문 상담을 받았는데 일정 조율부터 안내까지 매끄러웠습니다.',
    ],
  };
  const texts = reviewsByLang[lang] || reviewsByLang.kz;
  const reviews = [
    { n:'Aigerim', loc:t.locName.almaty, proc:t.cat.names.lift, clinic:'Lienne Clinic', rating:5, tone:'rose', txt:texts[0] },
    { n:'Dana', loc:t.locName.astana, proc:t.cat.names.acne, clinic:'Almaty Skin Lab', rating:5, tone:'lav', txt:texts[1] },
    { n:'Aliya', loc:t.locName.almaty, proc:t.cat.names.filler, clinic:'Centum Dermatology', rating:4, tone:'beige', txt:texts[2] },
  ];

  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bg, position:'relative' }}>
      <TopBar title={t.rv.title} sub={t.rv.sub}
        right={<Icon d={Icons.search} size={20} stroke={T.ink2}/>}
      />

      {/* Reviews ↔ Before & After toggle */}
      <div style={{ padding:'10px 16px 0', display:'flex', gap:6 }}>
        <button className="kb-press"
          style={{
            flex:1, padding:'10px 14px', borderRadius:11, fontSize:13, fontWeight:700,
            background:T.ink, color:'#fff', border:'none', cursor:'pointer', fontFamily:'inherit',
          }}>
          {t.rv.title}
        </button>
        <button onClick={() => nav.go('ba')}
          className="kb-press"
          style={{
            flex:1, padding:'10px 14px', borderRadius:11, fontSize:13, fontWeight:600,
            background:'transparent', color:T.textMute,
            border:`1px solid ${T.borderSoft}`, cursor:'pointer', fontFamily:'inherit',
          }}>
          {lang==='kz'?'Before & After':lang==='ru'?'До и После':'비포 & 애프터'}
        </button>
      </div>

      <div className="kb-scroll" style={{ display:'flex', gap:7, overflowX:'auto', padding:'12px 16px 0' }}>
        {[
          { l:t.rv.byTx, icon:Icons.filter },
          { l:t.rv.allTx, active:true },
          { l:t.rv.lift },
          { l:t.rv.filler },
          { l:t.rv.skin },
        ].map((c,i)=>(
          <div key={i} style={{
            flex:'0 0 auto', display:'flex', alignItems:'center', gap:5,
            padding:'7px 12px', borderRadius:999, fontSize:12, fontWeight:500,
            border: c.active ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
            background: c.active ? T.roseTint : '#fff',
            color: c.active ? T.roseDeep : T.ink2,
            whiteSpace:'nowrap',
          }}>
            {c.icon && <Icon d={c.icon} size={12} stroke={T.ink2} sw={2}/>}
            {c.l}
            {!c.icon && !c.active && <Icon d={Icons.chevD} size={11} stroke={T.textMute} sw={2}/>}
          </div>
        ))}
      </div>
      <div className="kb-scroll" style={{ display:'flex', gap:7, overflowX:'auto', padding:'8px 16px 0' }}>
        {[t.rv.byRegion, t.rv.byClinic, t.rv.ratingMin].map((c,i)=>(
          <div key={i} style={{
            flex:'0 0 auto', padding:'6px 11px', borderRadius:999, fontSize:11.5, fontWeight:500,
            border:`1px solid ${T.border}`, background:'#fff', color:T.ink2, whiteSpace:'nowrap',
          }}>{c}</div>
        ))}
      </div>

      <div style={{ padding:'14px 16px 0' }}>
        <div className="kb-card" style={{ padding:'14px', display:'flex', alignItems:'center', gap:14,
          background:`linear-gradient(135deg, ${T.roseTint} 0%, #fff 100%)` }}>
          <div>
            <div className="kb-display" style={{ fontSize:30, color:T.ink, lineHeight:1 }}>4.8</div>
            <div style={{ display:'flex', gap:1, marginTop:5 }}>
              {[0,0,0,0,0].map((_,k)=><Icon key={k} d={Icons.star} size={11} fill={T.rose} stroke={T.rose}/>)}
            </div>
          </div>
          <div style={{ width:1, height:42, background:T.border }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600, letterSpacing:'-0.2px' }}>{t.rv.sumCount}</div>
            <div style={{ fontSize:10.5, color:T.textMute, marginTop:3, lineHeight:1.45 }}>
              {t.rv.sumDesc}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'14px 16px 110px', display:'flex', flexDirection:'column', gap:12 }}>
        {reviews.map((r,i)=>(
          <div key={i} className="kb-card" style={{ padding:13 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:32, height:32, borderRadius:'50%',
                  background: r.tone === 'rose' ? T.roseTint : r.tone === 'lav' ? T.lavenderSoft : T.beigeSoft,
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700,
                  color: r.tone === 'rose' ? T.roseDeep : r.tone === 'lav' ? '#6E5A8C' : '#7A6A4A',
                }}>
                  {r.n[0]}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.2px' }}>{r.n}</div>
                  <div style={{ fontSize:10.5, color:T.textMute, marginTop:1 }}>{r.loc} · {t.rv.after}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:1 }}>
                {[0,0,0,0,0].map((_,k)=>(
                  <Icon key={k} d={Icons.star} size={12}
                    fill={k<r.rating?T.rose:'#EEE'} stroke={k<r.rating?T.rose:'#EEE'}/>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:10 }}>
              <Badge tone="rose">{r.proc}</Badge>
              <Badge tone="ink">{r.clinic}</Badge>
            </div>

            <div style={{ display:'flex', gap:5, borderRadius:10, overflow:'hidden', marginBottom:10 }}>
              <div className={`kb-img-ph ${r.tone}`} style={{ flex:1, height:108, position:'relative' }}>
                <div style={{ position:'absolute', top:6, left:6, background:'rgba(0,0,0,0.5)', color:'#fff',
                  fontSize:9, padding:'2px 6px', borderRadius:4, fontWeight:700 }}>{t.rv.before}</div>
              </div>
              <div className={`kb-img-ph ${r.tone==='rose'?'lav':r.tone==='lav'?'beige':'rose'}`} style={{ flex:1, height:108, position:'relative' }}>
                <div style={{ position:'absolute', top:6, left:6, background:'rgba(232,96,122,0.85)', color:'#fff',
                  fontSize:9, padding:'2px 6px', borderRadius:4, fontWeight:700 }}>{t.rv.afterTag}</div>
              </div>
            </div>

            <div style={{ fontSize:12.5, color:T.ink2, lineHeight:1.55 }}>"{r.txt}"</div>

            <div style={{ marginTop:10, paddingTop:9, borderTop:`1px dashed ${T.borderSoft}`,
              display:'flex', gap:7, alignItems:'flex-start',
            }}>
              <Icon d={Icons.shield} size={12} stroke={T.textMute}/>
              <div style={{ fontSize:10, color:T.textMute, lineHeight:1.5 }}>
                {t.rv.disclaimer}
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomTab active="review"/>
    </div>
  );
}

// ─── Stylized neighborhood map (SVG) ───────────────────────────────
function StreetMap({ variant = 'seoul', compact = false }) {
  // Two stylized neighborhoods. Soft tones, abstract streets + named pin.
  if (variant === 'seoul') {
    return (
      <svg viewBox="0 0 400 200" width="100%" height={compact ? 78 : 200} preserveAspectRatio="xMidYMid slice"
        style={{ display:'block' }}>
        <rect width="400" height="200" fill="#F1ECE4"/>
        {/* Hangang river */}
        <path d="M-10 175 Q120 158 240 168 T420 158" stroke="#CFE0EC" strokeWidth="22" fill="none" strokeLinecap="round"/>
        <text x="350" y="190" fontSize="8" fill="#7398AE" fontWeight="600" letterSpacing="0.5">HAN RIVER</text>
        {/* Streets */}
        <path d="M-10 80 L420 92" stroke="#fff" strokeWidth="14" strokeLinecap="round"/>
        <path d="M-10 120 L420 132" stroke="#fff" strokeWidth="10" strokeLinecap="round"/>
        <path d="M120 -10 L130 220" stroke="#fff" strokeWidth="13" strokeLinecap="round"/>
        <path d="M260 -10 L268 220" stroke="#fff" strokeWidth="11" strokeLinecap="round"/>
        <path d="M60 -10 L66 220" stroke="#fff" strokeWidth="7" strokeLinecap="round"/>
        <path d="M340 -10 L334 220" stroke="#fff" strokeWidth="6" strokeLinecap="round"/>
        {/* Blocks */}
        <rect x="20" y="20" width="32" height="50" rx="4" fill="#E6E0D2"/>
        <rect x="148" y="20" width="100" height="50" rx="4" fill="#E0E6D8"/>
        <rect x="276" y="20" width="50" height="58" rx="4" fill="#E6E0D2"/>
        <rect x="20" y="100" width="36" height="14" rx="3" fill="#E6E0D2"/>
        <rect x="148" y="100" width="100" height="14" rx="3" fill="#E6E0D2"/>
        <rect x="276" y="100" width="50" height="14" rx="3" fill="#E6E0D2"/>
        {/* park */}
        <rect x="280" y="140" width="60" height="30" rx="6" fill="#D5E2C9"/>
        {!compact && <text x="285" y="158" fontSize="8" fill="#7D9061" fontWeight="600">Dosan Park</text>}
        {/* Subway markers */}
        <circle cx="62" cy="92" r="7" fill="#fff" stroke="#F3A437" strokeWidth="2.4"/>
        {!compact && <text x="74" y="96" fontSize="9" fill="#A06A12" fontWeight="700">Sinsa</text>}
        <circle cx="334" cy="92" r="7" fill="#fff" stroke="#3A7AFE" strokeWidth="2.4"/>
        {!compact && <text x="312" y="76" fontSize="9" fill="#3A5AB0" fontWeight="700">Apgujeong</text>}
        {/* Pin */}
        <g transform={`translate(${compact ? 200 : 200}, ${compact ? 105 : 105})`}>
          <circle r="28" fill="#E8607A" fillOpacity="0.12"/>
          <circle r="18" fill="#E8607A" fillOpacity="0.22"/>
          <circle r="11" fill="#E8607A"/>
          <path d="M0 6 L0 18" stroke="#E8607A" strokeWidth="3" strokeLinecap="round"/>
          <circle r="4" fill="#fff"/>
        </g>
        {!compact && (
          <g transform="translate(170, 145)">
            <rect x="0" y="0" width="100" height="22" rx="11" fill="#fff" stroke="#E8607A" strokeWidth="1.2"/>
            <text x="50" y="15" fontSize="10" fontWeight="700" fill="#C84365" textAnchor="middle">Lienne Clinic</text>
          </g>
        )}
      </svg>
    );
  }
  // Almaty — alpine palette, mountain hint
  return (
    <svg viewBox="0 0 400 200" width="100%" height={compact ? 78 : 200} preserveAspectRatio="xMidYMid slice"
      style={{ display:'block' }}>
      <rect width="400" height="200" fill="#EFEAE2"/>
      {/* mountain hint at top */}
      <path d="M-10 60 L60 25 L100 50 L160 15 L220 45 L290 18 L360 48 L420 30 L420 -10 L-10 -10 Z" fill="#D9D1C0"/>
      <path d="M-10 70 L70 30 L110 60 L170 22 L230 52 L300 25 L370 55 L420 38 L420 60 L-10 60 Z" fill="#E2DDD0"/>
      {!compact && <text x="14" y="22" fontSize="8" fill="#7A6F58" fontWeight="700" letterSpacing="0.5">TIEN SHAN</text>}
      {/* streets */}
      <path d="M-10 110 L420 110" stroke="#fff" strokeWidth="13" strokeLinecap="round"/>
      <path d="M-10 150 L420 155" stroke="#fff" strokeWidth="10" strokeLinecap="round"/>
      <path d="M100 60 L108 220" stroke="#fff" strokeWidth="12" strokeLinecap="round"/>
      <path d="M240 60 L244 220" stroke="#fff" strokeWidth="11" strokeLinecap="round"/>
      <path d="M340 60 L334 220" stroke="#fff" strokeWidth="7" strokeLinecap="round"/>
      <path d="M40 60 L44 220" stroke="#fff" strokeWidth="6" strokeLinecap="round"/>
      {/* blocks */}
      <rect x="50" y="75" width="40" height="30" rx="4" fill="#E6E0D2"/>
      <rect x="120" y="75" width="110" height="30" rx="4" fill="#E0DDD2"/>
      <rect x="250" y="75" width="76" height="30" rx="4" fill="#E6E0D2"/>
      <rect x="50" y="120" width="40" height="24" rx="3" fill="#E0DDD2"/>
      <rect x="250" y="120" width="76" height="24" rx="3" fill="#E0DDD2"/>
      <rect x="50" y="160" width="42" height="32" rx="4" fill="#E2D9C6"/>
      {/* big landmark (Medeu) */}
      <rect x="116" y="160" width="116" height="30" rx="6" fill="#D5E2C9"/>
      {!compact && <text x="130" y="180" fontSize="9" fontWeight="700" fill="#7D9061">Medeu Park</text>}
      {/* metro */}
      <circle cx="244" cy="155" r="7" fill="#fff" stroke="#23A574" strokeWidth="2.4"/>
      {!compact && <text x="256" y="160" fontSize="9" fill="#1E7A55" fontWeight="700">Abay</text>}
      {/* pin */}
      <g transform={`translate(${compact ? 178 : 178}, ${compact ? 130 : 130})`}>
        <circle r="28" fill="#E8607A" fillOpacity="0.12"/>
        <circle r="18" fill="#E8607A" fillOpacity="0.22"/>
        <circle r="11" fill="#E8607A"/>
        <path d="M0 6 L0 18" stroke="#E8607A" strokeWidth="3" strokeLinecap="round"/>
        <circle r="4" fill="#fff"/>
      </g>
      {!compact && (
        <g transform="translate(135, 92)">
          <rect x="0" y="0" width="118" height="22" rx="11" fill="#fff" stroke="#E8607A" strokeWidth="1.2"/>
          <text x="59" y="15" fontSize="10" fontWeight="700" fill="#C84365" textAnchor="middle">Almaty Skin Lab</text>
        </g>
      )}
    </svg>
  );
}

Object.assign(window, { ScreenClinicList, ScreenClinicDetail, ScreenReviews, StreetMap });
