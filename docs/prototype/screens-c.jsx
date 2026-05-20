// Screens 8-10: Consultation form, Complete, My page — i18n + nav

// ════════════════════════════════════════════════════════════════════
// 8. CONSULTATION FORM
// ════════════════════════════════════════════════════════════════════
function ScreenConsultForm() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();
  // Interactive selections
  const [tx, setTx] = React.useState(new Set(['lift','botox']));
  const [regions, setRegions] = React.useState(new Set(['almaty','seoul']));
  const [korea, setKorea] = React.useState(true);
  const [local, setLocal] = React.useState(true);

  const toggle = (set, key, setter) => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setter(next);
  };

  const allTx = ['lift','botox','filler','skin','pigment','acne','cosmetic'];
  const allRegions = ['almaty','astana','seoul','other'];
  const regionLabelKey = { almaty:t.locName.almaty, astana:t.locName.astana, seoul:`🇰🇷 ${t.locName.seoul}`, other:t.locName.other };

  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bgWarm, position:'relative' }}>
      <TopBar title={t.fm.title}
        back
        onBack={() => nav.back()}
        right={
          <button onClick={() => nav.back()} className="kb-press"
            style={{ background:'none', border:'none', padding:4, cursor:'pointer' }}>
            <Icon d={Icons.x} size={20} stroke={T.ink2}/>
          </button>
        }
      />

      <div style={{ padding:'14px 18px 18px',
        background:`linear-gradient(180deg, ${T.roseTint} 0%, transparent 100%)`,
      }}>
        <div className="kb-display" style={{ fontSize:20, lineHeight:1.35 }}>
          {t.fm.h1}<br/>{t.fm.h2}
        </div>
        <div style={{ fontSize:12, color:T.text, marginTop:7, lineHeight:1.55 }}>
          {t.fm.intro}<br/>
          <b style={{ color:T.ink }}>{t.fm.introB}</b>
        </div>
      </div>

      <div style={{ padding:'4px 16px 130px' }}>
        <FormSection title={t.fm.basic} sub={t.fm.basicSub}>
          <Field label={t.fm.name} req placeholder={t.fm.namePh}/>
          <Field label={t.fm.phone} req placeholder={t.fm.phonePh} />
          <Field label={t.fm.email} placeholder={t.fm.emailPh} />
          <Field label={t.fm.langWant} select value={t.fm.langVal}/>
        </FormSection>

        <FormSection title={t.fm.content}>
          {/* Interest */}
          <div style={{ marginBottom:14 }}>
            <Label req>{t.fm.interest}</Label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
              {allTx.map((k,i)=>{
                const active = tx.has(k);
                return (
                  <button key={k}
                    onClick={() => toggle(tx, k, setTx)}
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
              <div style={{
                padding:'7px 11px', borderRadius:9, fontSize:12, fontWeight:500,
                border:`1px dashed ${T.border}`, background:'#fff', color:T.textMute,
                display:'flex', alignItems:'center', gap:4,
              }}>
                <Icon d={Icons.plus} size={11} stroke={T.textMute} sw={2}/> {t.fm.addCustom}
              </div>
            </div>
          </div>

          {/* Region */}
          <div style={{ marginBottom:14 }}>
            <Label req>{t.fm.region}</Label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:8 }}>
              {allRegions.map((k,i)=>{
                const active = regions.has(k);
                return (
                  <button key={k}
                    onClick={() => toggle(regions, k, setRegions)}
                    className="kb-press"
                    style={{
                      padding:'12px 14px', borderRadius:11, fontSize:12.5, fontWeight:500,
                      border: active ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
                      background: active ? T.roseTint : '#fff',
                      color: active ? T.roseDeep : T.ink2,
                      display:'flex', alignItems:'center', gap:8,
                      cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                    }}>
                    <div style={{ width:16, height:16, borderRadius:4,
                      border: active ? `1.5px solid ${T.rose}` : `1.5px solid ${T.border}`,
                      background: active ? T.rose : '#fff',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    }}>
                      {active && <Icon d={Icons.check} size={10} stroke="#fff" sw={2.5}/>}
                    </div>
                    {regionLabelKey[k]}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <Label>{t.fm.method}</Label>
            <div style={{ display:'flex', flexDirection:'column', gap:7, marginTop:8 }}>
              <Toggle label={t.fm.methodK} on={korea} onClick={() => setKorea(!korea)}/>
              <Toggle label={t.fm.methodL} on={local} onClick={() => setLocal(!local)}/>
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <Label>{t.fm.photo}</Label>
            <div style={{ fontSize:10.5, color:T.textMute, marginTop:3, lineHeight:1.5 }}>
              {t.fm.photoSub}
            </div>
            <div style={{ display:'flex', gap:7, marginTop:8 }}>
              <div style={{
                width:74, height:74, borderRadius:11, border:`1.5px dashed ${T.border}`,
                background:T.bgSoft, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:3,
                color:T.textMute,
              }}>
                <Icon d={Icons.camera} size={20} stroke={T.textMute}/>
                <div style={{ fontSize:9.5, fontWeight:500 }}>{t.fm.addPhoto}</div>
              </div>
              <div className="kb-img-ph rose" style={{ width:74, height:74, borderRadius:11, position:'relative' }}>
                <div style={{ position:'absolute', top:4, right:4, width:18, height:18, borderRadius:'50%',
                  background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon d={Icons.x} size={11} stroke="#fff" sw={2.4}/>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom:6 }}>
            <Label>{t.fm.message}</Label>
            <div style={{
              marginTop:8, background:'#fff', border:`1px solid ${T.border}`,
              borderRadius:11, padding:'12px 13px', minHeight:88,
              fontSize:12.5, color:T.textMute, lineHeight:1.55,
            }}>
              {t.fm.messagePh}
            </div>
          </div>
        </FormSection>

        <div style={{ background:'#fff', border:`1px solid ${T.borderSoft}`, borderRadius:13,
          padding:'13px 14px', marginTop:14,
        }}>
          <div style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
            <div style={{ width:20, height:20, borderRadius:5, background:T.rose, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center', marginTop:1,
            }}>
              <Icon d={Icons.check} size={12} stroke="#fff" sw={2.5}/>
            </div>
            <div style={{ flex:1, fontSize:11.5, color:T.ink2, lineHeight:1.5 }}>
              {t.fm.consent1}{' '}
              <span style={{ color:T.roseDeep, fontWeight:600, textDecoration:'underline' }}>{t.fm.consentMore}</span>
            </div>
          </div>
          <div style={{ height:1, background:T.borderSoft, margin:'10px 0' }}/>
          <div style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
            <div style={{ width:20, height:20, borderRadius:5, background:'#fff', border:`1.5px solid ${T.border}`, flexShrink:0, marginTop:1 }}/>
            <div style={{ flex:1, fontSize:11.5, color:T.text, lineHeight:1.5 }}>
              {t.fm.consent2}
            </div>
          </div>
        </div>

        <div style={{ marginTop:12, padding:'10px 12px', background:T.bgSoft, borderRadius:10,
          display:'flex', gap:8, alignItems:'flex-start' }}>
          <Icon d={Icons.shield} size={14} stroke={T.textMute}/>
          <div style={{ fontSize:10.5, color:T.text, lineHeight:1.55 }}>
            {t.fm.disclosure}
          </div>
        </div>
      </div>

      <div style={{ position:'absolute', left:0, right:0, bottom:0,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(14px)',
        borderTop:`1px solid ${T.borderSoft}`, padding:'12px 16px 26px',
      }}>
        <CTA onClick={() => nav.go('ok')} icon={<Icon d={Icons.send} size={17} stroke="#fff" sw={2}/>}>
          {t.fm.cta}
        </CTA>
        <div style={{ fontSize:10, color:T.textMute, textAlign:'center', marginTop:8 }}>
          {t.fm.ctaNote}
        </div>
      </div>
    </div>
  );
}

// Form atoms
function Label({ children, req }) {
  return (
    <div style={{ fontSize:12, fontWeight:600, color:T.ink2, letterSpacing:'-0.2px',
      display:'flex', alignItems:'center', gap:4 }}>
      {children} {req && <span style={{ color:T.rose }}>*</span>}
    </div>
  );
}
function Field({ label, placeholder, value, req, select, right }) {
  return (
    <div style={{ marginBottom:13 }}>
      <Label req={req}>{label}</Label>
      <div style={{ marginTop:7, background:'#fff', border:`1px solid ${T.border}`, borderRadius:11,
        padding:'12px 13px', display:'flex', alignItems:'center', gap:8,
      }}>
        <div style={{ flex:1, fontSize:13, color: value ? T.ink : T.textMute, letterSpacing:'-0.2px' }}>
          {value || placeholder}
        </div>
        {right && <div style={{ padding:'3px 7px', background:T.bgSoft, borderRadius:6,
          fontSize:10, fontWeight:700, color:T.text }}>{right}</div>}
        {select && <Icon d={Icons.chevD} size={14} stroke={T.textMute} sw={2}/>}
      </div>
    </div>
  );
}
function Toggle({ label, on, onClick }) {
  return (
    <button onClick={onClick}
      className="kb-press"
      style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 13px',
        background:'#fff', border:`1px solid ${on ? T.rose : T.border}`, borderRadius:11,
        cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%',
    }}>
      <div style={{ width:34, height:20, borderRadius:999, background:on?T.rose:T.border,
        display:'flex', alignItems:'center', padding:2, transition:'.2s',
      }}>
        <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff',
          marginLeft: on ? 14 : 0, transition:'.2s' }}/>
      </div>
      <div style={{ flex:1, fontSize:12.5, color:T.ink2 }}>{label}</div>
    </button>
  );
}
function FormSection({ title, sub, children }) {
  return (
    <div style={{ marginTop:14 }}>
      <div style={{ padding:'4px 4px 10px', display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.ink, letterSpacing:'-0.3px' }}>{title}</div>
        {sub && <div style={{ fontSize:10.5, color:T.textMute }}>{sub}</div>}
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:`1px solid ${T.borderSoft}`, padding:'14px' }}>
        {children}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 9. CONSULTATION COMPLETE
// ════════════════════════════════════════════════════════════════════
function ScreenComplete() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();
  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bgWarm, position:'relative' }}>
      <div style={{
        background:`radial-gradient(ellipse 120% 80% at 50% 30%, ${T.roseSoft} 0%, ${T.bgWarm} 70%)`,
        padding:'56px 24px 36px', textAlign:'center', position:'relative',
      }}>
        <div style={{ position:'absolute', top:38, left:'50%', transform:'translateX(-50%)',
          width:140, height:140, borderRadius:'50%',
          background:`radial-gradient(circle, ${T.roseTint} 0%, transparent 70%)`,
        }}/>
        <div style={{ width:84, height:84, borderRadius:'50%', background:T.rose,
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px',
          boxShadow:'0 10px 30px rgba(232,96,122,0.32)',
          position:'relative',
        }}>
          <Icon d={Icons.check} size={42} stroke="#fff" sw={2.6}/>
        </div>
        <div className="kb-display" style={{ fontSize:24, lineHeight:1.3 }}>
          {t.ok.h1}<br/>{t.ok.h2}
        </div>
        <div style={{ fontSize:13, color:T.text, marginTop:11, lineHeight:1.55, maxWidth:300, margin:'11px auto 0' }}>
          {t.ok.sub1} <b style={{ color:T.ink }}>{t.ok.strong}</b>{t.ok.sub2}
        </div>
      </div>

      <div style={{ padding:'4px 18px 0' }}>
        <div style={{ display:'flex', gap:9 }}>
          <div style={{ flex:1, background:'#fff', border:`1px solid ${T.borderSoft}`, borderRadius:13,
            padding:'13px', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:T.rose,
              display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
              <Icon d={Icons.phone} size={17} stroke="#fff" sw={2}/>
            </div>
            <div style={{ fontSize:11.5, fontWeight:600 }}>{({kz:'Қоңырау',ru:'Звонок',kr:'전화 통화'})[lang]}</div>
            <div style={{ fontSize:10, color:T.textMute }}>+7 (___) ___ ****</div>
          </div>
          <div style={{ flex:1, background:'#fff', border:`1px solid ${T.borderSoft}`, borderRadius:13,
            padding:'13px', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:T.lavender,
              display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}>
              <Icon d={Icons.chat} size={17} stroke="#fff" sw={2}/>
            </div>
            <div style={{ fontSize:11.5, fontWeight:600 }}>{({kz:'Қосымша чаты',ru:'Чат в приложении',kr:'앱 내 채팅'})[lang]}</div>
            <div style={{ fontSize:10, color:T.textMute }}>{({kz:'Менеджер · Park M.',ru:'Менеджер · Park M.',kr:'담당자 · Park M.'})[lang]}</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'18px 18px 0' }}>
        <div className="kb-card" style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.ink, letterSpacing:'-0.2px', marginBottom:11 }}>
            {t.ok.summaryT}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {[t.ok.r1, t.ok.r2, t.ok.r3, t.ok.r4, t.ok.r5].map((row,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                <div style={{ fontSize:11.5, color:T.textMute }}>{row[0]}</div>
                <div style={{ fontSize:12, fontWeight:600, color:T.ink, textAlign:'right' }}>{row[1]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'22px 18px 0' }}>
        <div style={{ fontSize:13.5, fontWeight:700, letterSpacing:'-0.3px', marginBottom:11 }}>{t.ok.stepsT}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {[
            { n:'1', t:t.ok.s1[0], s:t.ok.s1[1] },
            { n:'2', t:t.ok.s2[0], s:t.ok.s2[1] },
            { n:'3', t:t.ok.s3[0], s:t.ok.s3[1] },
          ].map((s,i)=>(
            <div key={i} className="kb-card" style={{ padding:'12px 13px', display:'flex', gap:11, alignItems:'flex-start' }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:T.roseTint, color:T.roseDeep,
                fontWeight:700, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {s.n}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, letterSpacing:'-0.2px' }}>{s.t}</div>
                <div style={{ fontSize:11.5, color:T.textMute, marginTop:2, lineHeight:1.5 }}>{s.s}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'24px 16px 40px', display:'flex', flexDirection:'column', gap:9 }}>
        <CTA onClick={() => nav.go('home')}>{t.ok.home}</CTA>
        <CTA variant="outline" onClick={() => nav.go('cat')}>{t.ok.browse}</CTA>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 10. MY PAGE
// ════════════════════════════════════════════════════════════════════
function ScreenMyPage() {
  const t = useT();
  const nav = useNav();
  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bgWarm, position:'relative' }}>
      <div style={{
        background:`linear-gradient(180deg, ${T.roseTint} 0%, ${T.bgWarm} 100%)`,
        padding:'14px 18px 22px',
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{t.my.title}</div>
          <Icon d={Icons.bell} size={20} stroke={T.ink2}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:60, height:60, borderRadius:'50%',
            background:`linear-gradient(135deg, ${T.lavenderSoft} 0%, ${T.roseSoft} 100%)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontWeight:700, fontSize:22, color:T.roseDeep,
          }}>A</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>Aigerim Bekova</div>
            <div style={{ fontSize:11.5, color:T.textMute, marginTop:3 }}>{t.locName.almaty} · {t.my.langSet}</div>
            <div style={{ display:'flex', gap:5, marginTop:7 }}>
              <Badge tone="lav">📍 {t.locName.almaty}</Badge>
              <Badge tone="ink">RU · KZ</Badge>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'0 18px', marginTop:-12 }}>
        <div className="kb-card" style={{ padding:'14px 8px', display:'flex', justifyContent:'space-around', boxShadow:'0 6px 16px rgba(0,0,0,0.04)' }}>
          {[
            [t.my.reqCount, '3'],
            [t.my.favTx, '6'],
            [t.my.favCl, '4'],
          ].map((r,i,arr)=>(
            <React.Fragment key={i}>
              <div style={{ flex:1, textAlign:'center' }}>
                <div className="kb-display" style={{ fontSize:20, color:T.ink }}>{r[1]}</div>
                <div style={{ fontSize:10.5, color:T.textMute, marginTop:2 }}>{r[0]}</div>
              </div>
              {i<arr.length-1 && <div style={{ width:1, background:T.borderSoft }}/>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={t.my.myReq} right={`${t.my.all} ›`}/>
        <div style={{ marginTop:11, display:'flex', flexDirection:'column', gap:9 }}>
          {[
            { id:'#KB-2025-1042', proc:`${t.cat.names.lift} · ${t.cat.names.botox}`, area:`${t.locName.almaty} · ${t.locName.seoul}`, status:t.my.statusContacted, tone:T.success, bg:'#E5F4EC', when:t.my.ago.d2 },
            { id:'#KB-2025-0987', proc:t.cat.names.filler, area:t.locName.seoul, status:t.my.statusOngoing, tone:T.roseDeep, bg:T.roseSoft, when:t.my.ago.w1 },
            { id:'#KB-2024-0912', proc:t.cat.names.skin, area:t.locName.almaty, status:t.my.statusDone, tone:T.textMute, bg:T.bgSoft, when:t.my.ago.m2 },
          ].map((r,i)=>(
            <div key={i} className="kb-card" style={{ padding:12 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{ padding:'3px 8px', background:r.bg, color:r.tone,
                    fontSize:10.5, fontWeight:700, borderRadius:5 }}>{r.status}</div>
                  <div style={{ fontSize:10.5, color:T.textMute }}>{r.when}</div>
                </div>
                <div style={{ fontSize:10, color:T.textMute, fontFamily:'monospace' }}>{r.id}</div>
              </div>
              <div style={{ fontSize:13, fontWeight:600, marginTop:8, letterSpacing:'-0.2px' }}>{r.proc}</div>
              <div style={{ fontSize:11.5, color:T.text, marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
                <Icon d={Icons.pin} size={11} stroke={T.text}/> {r.area}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'22px 18px 0' }}>
        <SectionTitle title={t.my.favSec}/>
        <div style={{ marginTop:11, display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
          {[
            { t:t.cat.names.lift, kind:t.nav.cat, tone:'rose' },
            { t:'Lienne Clinic', kind:t.nav.clinic, tone:'lav' },
            { t:t.cat.names.skin, kind:t.nav.cat, tone:'beige' },
            { t:'Almaty Skin Lab', kind:t.nav.clinic, tone:'rose' },
          ].map((c,i)=>(
            <div key={i} className="kb-card" style={{ padding:10, display:'flex', gap:9, alignItems:'center' }}>
              <div className={`kb-img-ph ${c.tone}`} style={{ width:42, height:42, borderRadius:9, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9.5, color:T.textMute, fontWeight:500 }}>{c.kind}</div>
                <div style={{ fontSize:12, fontWeight:600, letterSpacing:'-0.2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.t}</div>
              </div>
              <Icon d={Icons.heart} size={14} stroke={T.rose} fill={T.rose}/>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'22px 18px 110px' }}>
        <SectionTitle title={t.my.settings}/>
        <div className="kb-card" style={{ marginTop:11, overflow:'hidden' }}>
          {[
            { l:t.my.langSetting, r:t.my.langSet, icon:Icons.globe },
            { l:t.my.profile, r:'', icon:Icons.user },
            { l:t.my.notif, r:t.my.notifVal, icon:Icons.bell },
            { l:t.my.terms, r:'', icon:Icons.doc },
            { l:t.my.support, r:'', icon:Icons.chat },
          ].map((row,i,arr)=>(
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:11, padding:'14px 14px',
              borderBottom: i<arr.length-1 ? `1px solid ${T.borderSoft}` : 'none',
            }}>
              <div style={{ width:30, height:30, borderRadius:8, background:T.bgSoft,
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d={row.icon} size={15} stroke={T.ink2}/>
              </div>
              <div style={{ flex:1, fontSize:13, color:T.ink2, fontWeight:500 }}>{row.l}</div>
              {row.r && <div style={{ fontSize:11.5, color:T.textMute }}>{row.r}</div>}
              <Icon d={Icons.chevR} size={15} stroke={T.textMute}/>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:18, fontSize:10.5, color:T.textMute }}>
          {t.my.version}
        </div>
      </div>

      <BottomTab active="me"/>
    </div>
  );
}

Object.assign(window, { ScreenConsultForm, ScreenComplete, ScreenMyPage });
