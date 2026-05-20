// Screens 12-14: Korea Visit dedicated flow — landing, plan form, confirmation

// ════════════════════════════════════════════════════════════════════
// KV-1. KOREA VISIT LANDING
// ════════════════════════════════════════════════════════════════════
function ScreenKoreaVisit() {
  const t = useT();
  const nav = useNav();
  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bg, position:'relative' }}>
      {/* Dark hero */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:`linear-gradient(160deg, #1A1A1A 0%, #2A1F26 50%, #3A1F2A 100%)`,
        color:'#fff', padding:'18px 20px 28px',
      }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%',
          background:`radial-gradient(circle, ${T.rose} 0%, transparent 70%)`, opacity:0.4 }}/>
        <div style={{ position:'absolute', top:60, right:-100, width:200, height:200, borderRadius:'50%',
          background:`radial-gradient(circle, ${T.lavender} 0%, transparent 70%)`, opacity:0.25 }}/>

        <div style={{ position:'relative', display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
          <button onClick={() => nav.back()} className="kb-press"
            style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,0.1)',
              border:`1px solid rgba(255,255,255,0.15)`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Icon d={Icons.chevL} size={18} stroke="#fff"/>
          </button>
          <div style={{ flex:1 }}/>
          <Icon d={Icons.heart} size={20} stroke="#fff"/>
        </div>

        <div style={{ position:'relative' }}>
          <div style={{ fontSize:10.5, color:T.rose, fontWeight:700, letterSpacing:'1.5px', marginBottom:14 }}>{t.kv.kicker}</div>
          <div className="kb-display" style={{ fontSize:30, lineHeight:1.2, marginBottom:14, color:'#fff' }}>
            {t.kv.hero1}<br/>
            <span style={{ color:T.rose }}>{t.kv.hero2}</span>
          </div>
          <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.78)', lineHeight:1.55, maxWidth:300 }}>
            {t.kv.heroSub}
          </div>

          {/* Trust row */}
          <div style={{ display:'flex', gap:18, marginTop:22 }}>
            {[
              ['14', t.cl.tabKorea.replace('🇰🇷 ','')],
              ['1,240+', t.kv.kicker.replace('🇰🇷 ','')],
              ['24h', 'WhatsApp · Telegram'],
            ].map((s,i)=>(
              <div key={i} style={{ flex:1 }}>
                <div className="kb-display" style={{ fontSize:22, color:'#fff' }}>{s[0]}</div>
                <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.55)', marginTop:3, lineHeight:1.4 }}>{s[1]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's included */}
      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={t.kv.whatIn}/>
        <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:9 }}>
          {t.kv.items.map((it,i)=>(
            <div key={i} className="kb-card" style={{ padding:'12px 13px', display:'flex', gap:11, alignItems:'center' }}>
              <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
                background: i===0 ? T.roseTint : i===1 ? T.lavenderSoft : i===2 ? T.beigeSoft : i===3 ? T.roseTint : T.lavenderSoft,
                display:'flex', alignItems:'center', justifyContent:'center',
                color: i===0 ? T.roseDeep : i===1 ? '#6E5A8C' : i===2 ? '#7A6A4A' : i===3 ? T.roseDeep : '#6E5A8C',
              }}>
                <Icon d={[Icons.plane, Icons.hotel, Icons.language, Icons.calendar, Icons.shieldCheck][i]} size={18} sw={1.8}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.2px' }}>{it[0]}</div>
                <div style={{ fontSize:10.5, color:T.textMute, marginTop:2 }}>{it[1]}</div>
              </div>
              <Icon d={Icons.check} size={14} stroke={T.success} sw={2.4}/>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={t.kv.stepT}/>
        <div style={{ marginTop:12, position:'relative' }}>
          {/* vertical line */}
          <div style={{ position:'absolute', left:12, top:14, bottom:14, width:2,
            background:`linear-gradient(180deg, ${T.rose} 0%, ${T.lavender} 100%)`, opacity:0.3 }}/>
          {t.kv.steps.map((s,i)=>(
            <div key={i} style={{ display:'flex', gap:14, position:'relative', paddingBottom:14 }}>
              <div style={{ width:26, height:26, borderRadius:'50%',
                background: i<3 ? T.rose : T.ink, color:'#fff',
                fontWeight:700, fontSize:12,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                boxShadow:`0 0 0 4px ${T.bg}`,
              }}>
                {s[0]}
              </div>
              <div style={{ flex:1, paddingTop:2 }}>
                <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.2px' }}>{s[1]}</div>
                <div style={{ fontSize:11, color:T.textMute, marginTop:2, lineHeight:1.45 }}>{s[2]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended clinics for Korea visit */}
      <div style={{ padding:'22px 0 0' }}>
        <div style={{ padding:'0 18px' }}>
          <SectionTitle title={t.kv.clinicSec} right="14 ›"/>
        </div>
        <div className="kb-scroll" style={{ display:'flex', gap:11, overflowX:'auto', padding:'12px 18px 4px' }}>
          {[
            { name:'Lienne Clinic', loc:'Gangnam · Sinsa', tone:'rose' },
            { name:'Centum Dermatology', loc:'Cheongdam', tone:'lav' },
            { name:'Wua Plastic Surgery', loc:'Apgujeong', tone:'beige' },
          ].map((c,i)=>(
            <button key={i} onClick={() => nav.go('cld')}
              className="kb-card kb-press"
              style={{ flex:'0 0 210px', overflow:'hidden', padding:0,
                border:`1px solid ${T.borderSoft}`, background:'#fff', textAlign:'left', cursor:'pointer', fontFamily:'inherit' }}>
              <div className={`kb-img-ph ${c.tone}`} style={{ height:110, position:'relative' }}>
                <div style={{ position:'absolute', top:8, left:8 }}>
                  <Badge tone="korea">{t.home.koreaTag}</Badge>
                </div>
              </div>
              <div style={{ padding:'10px 12px 12px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{c.name}</div>
                  <Icon d={Icons.checkBadge} size={12} stroke={T.roseDeep} sw={2}/>
                </div>
                <div style={{ fontSize:10.5, color:T.textMute, marginTop:2 }}>{t.locName.seoul} · {c.loc}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:7 }}>
                  <Icon d={Icons.star} size={11} fill={T.rose} stroke={T.rose}/>
                  <div style={{ fontSize:11, fontWeight:600 }}>4.{9-i}</div>
                  <div style={{ fontSize:10, color:T.textMute, marginLeft:'auto' }}>RU·KR</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Disclosure */}
      <div style={{ padding:'18px 18px 140px' }}>
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

      {/* Fixed CTA */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(14px)',
        borderTop:`1px solid ${T.borderSoft}`, padding:'12px 16px 26px',
      }}>
        <CTA onClick={() => nav.go('kvp')} icon={<Icon d={Icons.plane} size={17} stroke="#fff" sw={2}/>}>
          {t.kv.ctaPlan}
        </CTA>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// KV-2. KOREA VISIT PLAN FORM
// ════════════════════════════════════════════════════════════════════
function ScreenKoreaVisitPlan() {
  const t = useT();
  const nav = useNav();
  const [dur, setDur] = React.useState(1);
  const [who, setWho] = React.useState(0);
  const [tx, setTx] = React.useState(new Set(['lift','botox']));
  const [services, setServices] = React.useState(new Set([0,1,2]));

  const toggleS = (s, k, setter) => {
    const next = new Set(s);
    if (next.has(k)) next.delete(k); else next.add(k);
    setter(next);
  };

  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bgWarm, position:'relative' }}>
      <TopBar title={t.kv.planT} back onBack={() => nav.back()}
        right={<button onClick={() => nav.go('home')} className="kb-press" style={{ background:'none', border:'none', padding:4, cursor:'pointer' }}>
          <Icon d={Icons.x} size={20} stroke={T.ink2}/>
        </button>}
      />

      {/* Hero context */}
      <div style={{ padding:'14px 18px 18px',
        background:`linear-gradient(180deg, ${T.roseTint} 0%, transparent 100%)`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
          <Icon d={Icons.plane} size={18} stroke={T.roseDeep} sw={2}/>
          <div style={{ fontSize:10, color:T.roseDeep, fontWeight:700, letterSpacing:'1.5px' }}>{t.kv.kicker}</div>
        </div>
        <div className="kb-display" style={{ fontSize:20, lineHeight:1.35 }}>
          {t.kv.planT}
        </div>
        <div style={{ fontSize:12, color:T.text, marginTop:6, lineHeight:1.55 }}>
          {t.kv.planSub}
        </div>
      </div>

      <div style={{ padding:'4px 16px 130px' }}>
        {/* Date */}
        <FormSection title={t.kv.dateLabel}>
          <div style={{ background:'#fff', border:`1.5px solid ${T.rose}`, borderRadius:11,
            padding:'14px', display:'flex', alignItems:'center', gap:10,
          }}>
            <div style={{ width:36, height:36, borderRadius:10, background:T.roseTint,
              display:'flex', alignItems:'center', justifyContent:'center', color:T.roseDeep }}>
              <Icon d={Icons.calendar} size={18} sw={2}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:600, color:T.ink, letterSpacing:'-0.3px' }}>{t.kv.dateVal}</div>
              <div style={{ fontSize:10.5, color:T.textMute, marginTop:2 }}>{t.kv.planSub}</div>
            </div>
            <Icon d={Icons.chevR} size={16} stroke={T.textMute}/>
          </div>
        </FormSection>

        {/* Duration */}
        <FormSection title={t.kv.durLabel}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {t.kv.durOpts.map((s,i)=>{
              const active = dur === i;
              return (
                <button key={i} onClick={() => setDur(i)}
                  className="kb-press"
                  style={{
                    padding:'12px 14px', borderRadius:11, fontSize:12.5, fontWeight:500,
                    border: active ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
                    background: active ? T.roseTint : '#fff',
                    color: active ? T.roseDeep : T.ink2,
                    cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                    display:'flex', alignItems:'center', gap:9,
                  }}>
                  <div style={{ width:16, height:16, borderRadius:'50%',
                    border: active ? `5px solid ${T.rose}` : `1.5px solid ${T.border}`,
                    background:'#fff', flexShrink:0,
                  }}/>
                  {s}
                </button>
              );
            })}
          </div>
        </FormSection>

        {/* Who */}
        <FormSection title={t.kv.who}>
          <div style={{ display:'flex', gap:8 }}>
            {t.kv.whoOpts.map((s,i)=>{
              const active = who === i;
              return (
                <button key={i} onClick={() => setWho(i)}
                  className="kb-press"
                  style={{
                    flex:1, padding:'14px 8px', borderRadius:11, fontSize:12, fontWeight:600,
                    border: active ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
                    background: active ? T.roseTint : '#fff',
                    color: active ? T.roseDeep : T.ink2,
                    cursor:'pointer', fontFamily:'inherit',
                    display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                  }}>
                  <div style={{ fontSize:18 }}>{['👤','👥','👨‍👩‍👧'][i]}</div>
                  {s}
                </button>
              );
            })}
          </div>
        </FormSection>

        {/* Treatments */}
        <FormSection title={t.kv.txInterest}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {['lift','botox','filler','skin','pigment','cosmetic'].map((k)=>{
              const active = tx.has(k);
              return (
                <button key={k}
                  onClick={() => toggleS(tx, k, setTx)}
                  className="kb-press"
                  style={{
                    padding:'7px 12px', borderRadius:9, fontSize:12, fontWeight:500,
                    border: active ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
                    background: active ? T.roseTint : '#fff',
                    color: active ? T.roseDeep : T.ink2,
                    fontFamily:'inherit', cursor:'pointer',
                  }}>{active && '✓ '}{t.cat.names[k]}</button>
              );
            })}
          </div>
        </FormSection>

        {/* Services needed */}
        <FormSection title={t.kv.service}>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {t.kv.services.map((s,i)=>{
              const active = services.has(i);
              return (
                <button key={i}
                  onClick={() => toggleS(services, i, setServices)}
                  className="kb-press"
                  style={{
                    display:'flex', alignItems:'center', gap:11, padding:'11px 13px',
                    background:'#fff', border:`1px solid ${active ? T.rose : T.border}`, borderRadius:11,
                    cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%',
                  }}>
                  <div style={{ width:22, height:22, borderRadius:6,
                    border: active ? `1.5px solid ${T.rose}` : `1.5px solid ${T.border}`,
                    background: active ? T.rose : '#fff',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}>
                    {active && <Icon d={Icons.check} size={12} stroke="#fff" sw={2.5}/>}
                  </div>
                  <div style={{ flex:1, fontSize:12.5, color:T.ink2 }}>{s}</div>
                  <Icon d={[Icons.plane, Icons.hotel, Icons.language, Icons.pin][i]} size={15} stroke={T.textMute}/>
                </button>
              );
            })}
          </div>
        </FormSection>

        {/* Notes */}
        <FormSection title={t.fm.message}>
          <div style={{
            background:'#fff', border:`1px solid ${T.border}`,
            borderRadius:11, padding:'12px 13px', minHeight:80,
            fontSize:12.5, color:T.textMute, lineHeight:1.55,
          }}>
            {t.fm.messagePh}
          </div>
        </FormSection>

        <div style={{ marginTop:14, padding:'12px 14px', background:T.bgSoft, borderRadius:11,
          display:'flex', gap:9, alignItems:'flex-start' }}>
          <Icon d={Icons.shield} size={15} stroke={T.textMute}/>
          <div style={{ fontSize:11, color:T.text, lineHeight:1.55 }}>
            {t.fm.disclosure}
          </div>
        </div>
      </div>

      <div style={{ position:'absolute', left:0, right:0, bottom:0,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(14px)',
        borderTop:`1px solid ${T.borderSoft}`, padding:'12px 16px 26px',
      }}>
        <CTA onClick={() => nav.go('kvo')} icon={<Icon d={Icons.send} size={17} stroke="#fff" sw={2}/>}>
          {t.fm.cta}
        </CTA>
        <div style={{ fontSize:10, color:T.textMute, textAlign:'center', marginTop:8 }}>
          {t.fm.ctaNote}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// KV-3. KOREA VISIT CONFIRMATION
// ════════════════════════════════════════════════════════════════════
function ScreenKoreaVisitOk() {
  const t = useT();
  const nav = useNav();
  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bgWarm, position:'relative' }}>
      {/* Hero */}
      <div style={{
        background:`linear-gradient(160deg, #1A1A1A 0%, #2A1F26 100%)`,
        color:'#fff', padding:'50px 24px 36px', textAlign:'center', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)',
          width:280, height:280, borderRadius:'50%',
          background:`radial-gradient(circle, ${T.rose} 0%, transparent 65%)`, opacity:0.3,
        }}/>
        <div style={{ position:'relative' }}>
          <div style={{ width:84, height:84, borderRadius:'50%',
            background:`linear-gradient(135deg, ${T.rose} 0%, ${T.roseDeep} 100%)`,
            display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px',
            boxShadow:'0 10px 30px rgba(232,96,122,0.4)',
          }}>
            <Icon d={Icons.plane} size={40} stroke="#fff" sw={2.2}/>
          </div>
          <div style={{ fontSize:10.5, color:T.rose, fontWeight:700, letterSpacing:'1.5px', marginBottom:12 }}>{t.kv.kicker}</div>
          <div className="kb-display" style={{ fontSize:24, lineHeight:1.3, color:'#fff' }}>
            {t.kv.okT1}<br/>{t.kv.okT2}
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:11, lineHeight:1.55, maxWidth:300, margin:'11px auto 0' }}>
            {t.kv.okSub}
          </div>
        </div>
      </div>

      {/* Channel reminder */}
      <div style={{ padding:'18px 18px 0' }}>
        <div style={{ display:'flex', gap:9 }}>
          <div style={{ flex:1, background:'#fff', border:`1px solid ${T.borderSoft}`, borderRadius:13,
            padding:'13px', display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#25D366',
              display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:11 }}>WA</div>
            <div>
              <div style={{ fontSize:11.5, fontWeight:600 }}>WhatsApp</div>
              <div style={{ fontSize:10, color:T.textMute }}>+7 (___) ___ ****</div>
            </div>
          </div>
          <div style={{ flex:1, background:'#fff', border:`1px solid ${T.borderSoft}`, borderRadius:13,
            padding:'13px', display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'#229ED9',
              display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:11 }}>TG</div>
            <div>
              <div style={{ fontSize:11.5, fontWeight:600 }}>Telegram</div>
              <div style={{ fontSize:10, color:T.textMute }}>@aigerim_b</div>
            </div>
          </div>
        </div>
      </div>

      {/* Itinerary */}
      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={t.kv.itinT}/>
        <div style={{ marginTop:12 }}>
          {[t.kv.d1, t.kv.d2, t.kv.d3, t.kv.d4, t.kv.d5].map((d,i,arr)=>{
            const last = i === arr.length - 1;
            return (
              <div key={i} className="kb-card" style={{ marginBottom:8, padding:'12px 13px', display:'flex', gap:11, alignItems:'flex-start' }}>
                <div style={{ width:46, flexShrink:0, textAlign:'center' }}>
                  <div style={{ fontSize:10, color:T.textMute, fontWeight:600 }}>{d[0]}</div>
                  <div style={{ width:24, height:24, borderRadius:'50%',
                    background: last ? T.ink : T.rose, color:'#fff',
                    fontSize:11, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center', margin:'4px auto 0',
                  }}>
                    {last ? '🛫' : i+1}
                  </div>
                </div>
                <div style={{ width:1, background:T.borderSoft, alignSelf:'stretch' }}/>
                <div style={{ flex:1, paddingTop:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.2px' }}>{d[1]}</div>
                </div>
                <Icon d={[Icons.plane, Icons.chat, Icons.hospital, Icons.heart, Icons.plane][i]}
                  size={16} stroke={T.textMute} sw={1.8}/>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop:6, padding:'10px 12px', background:T.bgSoft, borderRadius:10,
          display:'flex', gap:8, alignItems:'flex-start' }}>
          <Icon d={Icons.shield} size={13} stroke={T.textMute}/>
          <div style={{ fontSize:10.5, color:T.text, lineHeight:1.55 }}>
            {t.kv.itinNote}
          </div>
        </div>
      </div>

      {/* Summary card */}
      <div style={{ padding:'22px 18px 0' }}>
        <div className="kb-card" style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink, letterSpacing:'-0.2px', marginBottom:11 }}>
            {t.ok.summaryT}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {[
              [t.kv.dateLabel, t.kv.dateVal],
              [t.kv.durLabel, t.kv.durOpts[1]],
              [t.kv.txInterest, `${t.cat.names.lift} · ${t.cat.names.botox}`],
              [t.kv.service, `${t.kv.services[0]}, ${t.kv.services[1]}, ${t.kv.services[2]}`],
              ['#', '#KB-KV-2025-074'],
            ].map((row,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                <div style={{ fontSize:11, color:T.textMute, flexShrink:0 }}>{row[0]}</div>
                <div style={{ fontSize:11.5, fontWeight:600, color:T.ink, textAlign:'right' }}>{row[1]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'24px 16px 40px', display:'flex', flexDirection:'column', gap:9 }}>
        <CTA onClick={() => nav.go('home')}>{t.ok.home}</CTA>
        <CTA variant="outline" onClick={() => nav.go('cl')}>{t.ok.browse}</CTA>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenKoreaVisit, ScreenKoreaVisitPlan, ScreenKoreaVisitOk });
