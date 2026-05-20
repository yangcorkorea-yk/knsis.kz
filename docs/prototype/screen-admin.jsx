// Screen 11: Admin lead management dashboard (desktop) — i18n

function ScreenAdmin() {
  const t = useT();
  const A = {
    bg:'#F7F6F4', panel:'#fff',
    border:'#E8E5E0', borderSoft:'#F0EDE8',
    ink:'#1A1A1A', ink2:'#3A3A3A', text:'#5A5A5A', mute:'#9A9A95',
    accent:T.rose, accentSoft:T.roseTint,
  };

  const statuses = [
    { id:'new', label:t.ad.statuses.new, bg:'#FCE7EC', fg:'#C84365' },
    { id:'ct',  label:t.ad.statuses.ct,  bg:'#E5F4EC', fg:'#1F7A4D' },
    { id:'ing', label:t.ad.statuses.ing, bg:'#FFF5E1', fg:'#A07012' },
    { id:'sch', label:t.ad.statuses.sch, bg:'#EAE4F5', fg:'#5E4B82' },
    { id:'dn',  label:t.ad.statuses.dn,  bg:'#F0EDE8', fg:'#5A5A5A' },
    { id:'hl',  label:t.ad.statuses.hl,  bg:'#FDE8E4', fg:'#A04432' },
  ];

  const leads = [
    { id:'KB-2025-1042', name:'Aigerim Bekova', ch:'TEL', chId:'+7 701 234 ****', proc:`${t.cat.names.lift} · ${t.cat.names.botox}`,
      area:`${t.locName.almaty} · ${t.locName.seoul}`, lang:'RU', kind:`${t.ad.kindKorea}+${t.ad.kindLocal}`, status:'new', when:'5m',
      owner:t.ad.mgrUnassigned, clinic:t.ad.clinicUnassigned, note:'Korea visit Jun, interpreter needed' },
    { id:'KB-2025-1041', name:'Dana Sultan', ch:'CHAT', chId:'@dana_s', proc:t.cat.names.acne,
      area:t.locName.astana, lang:'KZ', kind:t.ad.kindLocal, status:'new', when:'12m',
      owner:t.ad.mgrUnassigned, clinic:t.ad.clinicUnassigned, note:'Photos attached x2' },
    { id:'KB-2025-1040', name:'Aliya Nurpeisova', ch:'TEL', chId:'+7 702 555 ****', proc:t.cat.names.filler,
      area:t.locName.seoul, lang:'RU', kind:t.ad.kindKorea, status:'ct', when:'1h',
      owner:'Park M.', clinic:'Lienne Clinic', note:'Replied in chat, scheduling' },
    { id:'KB-2025-1039', name:'Madina Akhmetova', ch:'CHAT', chId:'@madina_a', proc:t.cat.names.skin,
      area:t.locName.almaty, lang:'RU', kind:t.ad.kindLocal, status:'ing', when:'3h',
      owner:'Lee M.', clinic:'Almaty Skin Lab', note:'First consult done, aftercare info' },
    { id:'KB-2025-1038', name:'Zarina Beksultanova', ch:'TEL', chId:'+7 705 777 ****', proc:t.cat.names.lift,
      area:t.locName.seoul, lang:'RU', kind:t.ad.kindKorea, status:'sch', when:'1d',
      owner:'Park M.', clinic:'Centum Dermatology', note:'Week 3 of May arrival' },
    { id:'KB-2025-1037', name:'Saule Toleukhanova', ch:'CHAT', chId:'@saule_t', proc:t.cat.names.botox,
      area:t.locName.almaty, lang:'KZ', kind:t.ad.kindLocal, status:'dn', when:'3d',
      owner:'Lee M.', clinic:'Nur Beauty Clinic', note:'Done · review request sent' },
    { id:'KB-2025-1036', name:'Kamila Auelbek', ch:'TEL', chId:'+7 707 121 ****', proc:t.cat.names.pigment,
      area:t.locName.almaty, lang:'RU', kind:t.ad.kindLocal, status:'hl', when:'4d',
      owner:'Kim M.', clinic:'-', note:'Waiting for customer response (3 tries)' },
  ];

  const stat = id => statuses.find(s=>s.id===id);

  const sidebar = [
    { l:t.ad.sidebar.dash, icon:Icons.home },
    { l:t.ad.sidebar.leads, icon:Icons.chat, badge:14, active:true },
    { l:t.ad.sidebar.cust, icon:Icons.user },
    { l:t.ad.sidebar.clinic, icon:Icons.hospital },
    { l:t.ad.sidebar.review, icon:Icons.star },
  ];
  const sidebar2 = [
    { l:t.ad.sidebar.manager, icon:Icons.user },
    { l:t.ad.sidebar.notif, icon:Icons.bell },
    { l:t.ad.sidebar.sys, icon:Icons.shield },
  ];

  return (
    <div className="kb-screen" style={{
      width:'100%', height:'100%', overflow:'hidden', background:A.bg,
      display:'flex', fontSize:13, color:A.ink2,
    }}>
      {/* Sidebar */}
      <div style={{
        width:220, background:A.panel, borderRight:`1px solid ${A.border}`,
        display:'flex', flexDirection:'column', flexShrink:0,
      }}>
        <div style={{ padding:'20px 18px 22px', display:'flex', alignItems:'center', gap:9, borderBottom:`1px solid ${A.borderSoft}` }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:T.rose,
            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
            fontWeight:800, fontSize:15 }}>K</div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, letterSpacing:'-0.3px' }}>{t.brand}</div>
            <div style={{ fontSize:10, color:A.mute, marginTop:1 }}>Admin</div>
          </div>
        </div>
        <div style={{ padding:'14px 12px 8px' }}>
          <div style={{ fontSize:10, color:A.mute, fontWeight:700, padding:'0 8px 6px', letterSpacing:'0.5px' }}>{t.ad.group.ops.toUpperCase()}</div>
          {sidebar.map((it,i)=>(
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:9, padding:'8px 10px', marginBottom:2,
              borderRadius:7, background: it.active ? A.accentSoft : 'transparent',
              color: it.active ? T.roseDeep : A.text, fontWeight: it.active ? 600 : 500, fontSize:12.5,
            }}>
              <Icon d={it.icon} size={15} stroke={it.active ? T.roseDeep : A.text} sw={1.8}/>
              <span style={{ flex:1 }}>{it.l}</span>
              {it.badge && <span style={{ padding:'1px 6px', borderRadius:999, background:T.rose, color:'#fff',
                fontSize:10, fontWeight:700 }}>{it.badge}</span>}
            </div>
          ))}
        </div>
        <div style={{ padding:'10px 12px 8px' }}>
          <div style={{ fontSize:10, color:A.mute, fontWeight:700, padding:'0 8px 6px', letterSpacing:'0.5px' }}>{t.ad.group.set.toUpperCase()}</div>
          {sidebar2.map((it,i)=>(
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:9, padding:'8px 10px', marginBottom:2,
              borderRadius:7, color:A.text, fontWeight:500, fontSize:12.5,
            }}>
              <Icon d={it.icon} size={15} stroke={A.text} sw={1.8}/>
              {it.l}
            </div>
          ))}
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ padding:'12px 14px', borderTop:`1px solid ${A.borderSoft}`, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:T.lavenderSoft,
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#6E5A8C', fontSize:12 }}>P</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600 }}>Park M.</div>
            <div style={{ fontSize:10, color:A.mute }}>RU·KR</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{
          padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
          background:'#fff', display:'flex', alignItems:'center', gap:14,
        }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{t.ad.title}</div>
            <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{t.ad.sub}</div>
          </div>
          <div style={{ flex:1 }}/>
          <div style={{
            display:'flex', alignItems:'center', gap:7, padding:'7px 11px',
            border:`1px solid ${A.border}`, borderRadius:9, background:A.bg, minWidth:260,
          }}>
            <Icon d={Icons.search} size={14} stroke={A.mute}/>
            <div style={{ fontSize:12, color:A.mute }}>{t.ad.search}</div>
          </div>
          <div style={{ width:32, height:32, borderRadius:8, background:A.bg, border:`1px solid ${A.border}`,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={Icons.bell} size={15} stroke={A.text}/>
          </div>
        </div>

        {/* KPI */}
        <div style={{ padding:'16px 22px 0', display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12 }}>
          {t.ad.kpis.map((k,i)=>{
            const tones = [T.roseDeep, '#A07012', '#5E4B82', '#1F7A4D', T.ink];
            return (
              <div key={i} style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:11, padding:'13px 14px' }}>
                <div style={{ fontSize:11, color:A.mute, fontWeight:500 }}>{k[0]}</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:7, marginTop:5 }}>
                  <div className="kb-display" style={{ fontSize:24, color:tones[i] }}>{k[1]}</div>
                  <div style={{ fontSize:10.5, color:A.text }}>{k[2]}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div style={{ padding:'16px 22px 12px', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {t.ad.filters.map((l,i)=>(
            <div key={i} style={{
              padding:'6px 10px', border:`1px solid ${A.border}`, borderRadius:7,
              fontSize:11.5, color: i===0 ? T.ink : A.text, fontWeight: i===0 ? 600 : 500,
              background: i===0 ? '#fff' : A.bg,
              display:'flex', alignItems:'center', gap:5,
            }}>
              {l}
              <Icon d={Icons.chevD} size={11} stroke={A.mute} sw={2}/>
            </div>
          ))}
          <div style={{ flex:1 }}/>
          <div style={{ padding:'6px 10px', border:`1px solid ${A.border}`, borderRadius:7,
            fontSize:11.5, color:A.text, background:'#fff', display:'flex', alignItems:'center', gap:5 }}>
            <Icon d={Icons.doc} size={12} stroke={A.text} sw={1.8}/> {t.ad.export}
          </div>
        </div>

        {/* Status tabs */}
        <div style={{ padding:'0 22px', display:'flex', gap:6 }}>
          {[
            { l:t.ad.total, n:72, active:true },
            ...statuses.map(s => ({ l:s.label, n:Math.floor(5 + Math.random()*12), tone:s }))
          ].map((tt,i)=>(
            <div key={i} style={{
              padding:'7px 11px', borderRadius:7, fontSize:12, fontWeight: tt.active ? 700 : 500,
              background: tt.active ? T.ink : 'transparent',
              color: tt.active ? '#fff' : A.text,
              border: tt.active ? 'none' : `1px solid ${A.border}`,
              display:'flex', alignItems:'center', gap:5,
            }}>
              {tt.tone && <div style={{ width:6, height:6, borderRadius:'50%', background:tt.tone.fg }}/>}
              {tt.l}
              <span style={{ opacity:0.7 }}>{tt.n}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ padding:'12px 22px 22px', flex:1, overflow:'auto' }}>
          <div style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:12, overflow:'hidden' }}>
            <div style={{
              display:'grid',
              gridTemplateColumns:'28px 1.5fr 1fr 1.4fr 1.2fr 0.7fr 1.2fr 1.3fr 0.7fr 24px',
              padding:'10px 14px', background:'#FBFAF7',
              borderBottom:`1px solid ${A.border}`,
              fontSize:10.5, color:A.mute, fontWeight:600, letterSpacing:'0.3px',
              alignItems:'center', gap:6,
            }}>
              <div><div style={{ width:14, height:14, border:`1.5px solid ${A.border}`, borderRadius:3 }}/></div>
              {t.ad.cols.map((c,i)=><div key={i}>{c}</div>)}
              <div></div>
            </div>
            {leads.map((l,i)=>{
              const s = stat(l.status);
              return (
                <div key={l.id} style={{
                  display:'grid',
                  gridTemplateColumns:'28px 1.5fr 1fr 1.4fr 1.2fr 0.7fr 1.2fr 1.3fr 0.7fr 24px',
                  padding:'12px 14px', alignItems:'center',
                  borderBottom: i<leads.length-1 ? `1px solid ${A.borderSoft}` : 'none',
                  background: i%2===0 ? '#fff' : '#FDFCFA',
                  fontSize:12, gap:6,
                }}>
                  <div><div style={{ width:14, height:14, border:`1.5px solid ${A.border}`, borderRadius:3 }}/></div>
                  <div>
                    <div style={{ fontWeight:600, color:T.ink, letterSpacing:'-0.2px' }}>{l.name}</div>
                    <div style={{ fontSize:10, color:A.mute, fontFamily:'monospace', marginTop:2 }}>#{l.id}</div>
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:22, height:22, borderRadius:'50%',
                        background: l.ch==='TEL'?T.rose:T.lavender,
                        color:'#fff', fontSize:8.5, fontWeight:800,
                        display:'flex', alignItems:'center', justifyContent:'center', letterSpacing:'-0.1px',
                      }}>{l.ch}</div>
                      <div style={{ fontSize:11, color:A.text }}>{l.chId}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:11.5, color:T.ink2 }}>{l.proc}</div>
                  <div>
                    <div style={{ fontSize:11.5, color:T.ink2 }}>{l.area}</div>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:3,
                      padding:'2px 7px', borderRadius:5,
                      background: l.kind.includes(t.ad.kindKorea) || l.kind.startsWith('🇰🇷') ? '#FFF1F2' : T.lavenderSoft,
                      color: l.kind.includes(t.ad.kindKorea) || l.kind.startsWith('🇰🇷') ? T.roseDeep : '#6E5A8C',
                      fontSize:9.5, fontWeight:700, marginTop:3,
                    }}>{l.kind}</div>
                  </div>
                  <div>
                    <span style={{ padding:'3px 7px', background:A.bg, borderRadius:5,
                      fontSize:10, fontWeight:700, color:A.text }}>{l.lang}</span>
                  </div>
                  <div>
                    <div style={{ fontSize:11.5, color: l.owner===t.ad.mgrUnassigned?T.roseDeep:T.ink2, fontWeight: l.owner===t.ad.mgrUnassigned?600:500 }}>
                      {l.owner===t.ad.mgrUnassigned ? `+ ${t.ad.assignMgr}` : l.owner}
                    </div>
                    <div style={{ fontSize:10.5, color: l.clinic===t.ad.clinicUnassigned || l.clinic==='-' ?A.mute:T.text, marginTop:2 }}>
                      {l.clinic===t.ad.clinicUnassigned ? t.ad.clinicUnassigned : l.clinic}
                    </div>
                  </div>
                  <div>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:5,
                      padding:'4px 9px', borderRadius:6,
                      background:s.bg, color:s.fg,
                      fontSize:10.5, fontWeight:700,
                    }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:s.fg }}/>
                      {s.label}
                    </div>
                  </div>
                  <div style={{ fontSize:11, color:A.mute }}>{l.when}</div>
                  <div><Icon d={Icons.chevR} size={14} stroke={A.mute}/></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right detail drawer */}
      <div style={{
        width:300, background:'#fff', borderLeft:`1px solid ${A.border}`,
        display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden',
      }}>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${A.borderSoft}`,
          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:12.5, fontWeight:700 }}>{t.ad.detail}</div>
          <Icon d={Icons.x} size={15} stroke={A.text}/>
        </div>
        <div style={{ padding:'16px', overflow:'auto', flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <div style={{ width:46, height:46, borderRadius:'50%',
              background:`linear-gradient(135deg, ${T.lavenderSoft} 0%, ${T.roseSoft} 100%)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, fontSize:18, color:T.roseDeep,
            }}>A</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, letterSpacing:'-0.2px' }}>Aigerim Bekova</div>
              <div style={{ fontSize:10.5, color:A.mute, marginTop:2 }}>#KB-2025-1042 · 5m</div>
            </div>
          </div>

          <div style={{ display:'flex', gap:7, marginTop:14 }}>
            <button style={{ flex:1, background:T.rose, color:'#fff', border:'none', borderRadius:8,
              padding:'9px 0', fontSize:11.5, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'inherit' }}>
              <Icon d={Icons.chat} size={13} stroke="#fff" sw={2}/> {t.ad.openChat}
            </button>
            <button style={{ flex:1, background:'#fff', color:T.ink, border:`1px solid ${A.border}`, borderRadius:8,
              padding:'9px 0', fontSize:11.5, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontFamily:'inherit' }}>
              <Icon d={Icons.phone} size={13} stroke={T.ink} sw={2}/> {t.ad.openCall}
            </button>
          </div>

          <DetailRow label={t.ad.cols[6]}>
            <div style={{ padding:'5px 10px', background:stat('new').bg, color:stat('new').fg,
              fontSize:10.5, fontWeight:700, borderRadius:6, display:'inline-flex', alignItems:'center', gap:5 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:stat('new').fg }}/>
              {t.ad.statuses.new}
              <Icon d={Icons.chevD} size={10} stroke={stat('new').fg} sw={2.5}/>
            </div>
          </DetailRow>
          <DetailRow label={t.ad.assignMgr}>
            <button style={{ padding:'5px 10px', background:'#fff', border:`1px dashed ${T.rose}`,
              color:T.roseDeep, fontSize:11, fontWeight:600, borderRadius:6,
              display:'inline-flex', alignItems:'center', gap:4, fontFamily:'inherit', cursor:'pointer',
            }}>
              <Icon d={Icons.plus} size={11} stroke={T.roseDeep} sw={2.4}/> {t.ad.assignMgr}
            </button>
          </DetailRow>
          <DetailRow label={t.ad.assignCl}>
            <button style={{ padding:'5px 10px', background:'#fff', border:`1px dashed ${T.rose}`,
              color:T.roseDeep, fontSize:11, fontWeight:600, borderRadius:6,
              display:'inline-flex', alignItems:'center', gap:4, fontFamily:'inherit', cursor:'pointer',
            }}>
              <Icon d={Icons.plus} size={11} stroke={T.roseDeep} sw={2.4}/> {t.ad.assignCl}
            </button>
          </DetailRow>
          <DetailRow label={t.ad.cols[2]}>{t.cat.names.lift} · {t.cat.names.botox}</DetailRow>
          <DetailRow label={t.ad.cols[3].split('·')[0]}>{t.locName.almaty} · {t.locName.seoul}</DetailRow>
          <DetailRow label={t.ad.cols[3].split('·')[1] || ''}>
            <span style={{ display:'inline-flex', gap:4 }}>
              <span style={{ padding:'2px 7px', background:'#FFF1F2', color:T.roseDeep,
                fontSize:10, fontWeight:700, borderRadius:4 }}>{t.ad.kindKorea}</span>
              <span style={{ padding:'2px 7px', background:T.lavenderSoft, color:'#6E5A8C',
                fontSize:10, fontWeight:700, borderRadius:4 }}>{t.ad.kindLocal}</span>
            </span>
          </DetailRow>
          <DetailRow label={t.ad.cols[4]}>RU</DetailRow>

          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:11, color:A.mute, fontWeight:600, marginBottom:6 }}>{t.ad.notes}</div>
            <div style={{ background:'#FFFBE9', border:`1px solid #F4E4A0`, borderRadius:8,
              padding:'10px 11px', fontSize:11.5, color:'#5A4A2A', lineHeight:1.5 }}>
              Korea visit Jun, interpreter needed.
            </div>
            <div style={{ marginTop:8, padding:'9px 11px', border:`1px dashed ${A.border}`,
              borderRadius:8, fontSize:11, color:A.mute, display:'flex', alignItems:'center', gap:6,
            }}>
              <Icon d={Icons.plus} size={11} stroke={A.mute}/> {t.ad.addNote}
            </div>
          </div>

          <div style={{ marginTop:18 }}>
            <div style={{ fontSize:11, color:A.mute, fontWeight:600, marginBottom:8 }}>{t.ad.activity}</div>
            {[
              { tt:'Lead received', s:'5m · MVP app' },
              { tt:'Consent confirmed', s:'5m' },
            ].map((a,i)=>(
              <div key={i} style={{ display:'flex', gap:9, paddingBottom:9 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:T.rose, marginTop:5, flexShrink:0 }}/>
                <div>
                  <div style={{ fontSize:11.5, fontWeight:600 }}>{a.tt}</div>
                  <div style={{ fontSize:10.5, color:A.mute, marginTop:1 }}>{a.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, children }) {
  if (!label) return null;
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      gap:10, padding:'9px 0', borderBottom:`1px solid #F0EDE8`, fontSize:11.5,
    }}>
      <div style={{ color:'#9A9A95', fontWeight:500, fontSize:11 }}>{label}</div>
      <div style={{ color:T.ink2, fontWeight:600, textAlign:'right' }}>{children}</div>
    </div>
  );
}

Object.assign(window, { ScreenAdmin });
