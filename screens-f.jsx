// Design variants — alternative visual directions for the Home screen.
// Used in the "Design directions" canvas section for side-by-side comparison.

// ════════════════════════════════════════════════════════════════════
// VARIANT A — MINIMAL / EDITORIAL
// Very high whitespace, mono accents, no soft gradients, B&W base.
// ════════════════════════════════════════════════════════════════════
function ScreenHomeMinimal() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();
  const stepWord = { kz:'қадам', ru:'шагов', kr:'단계' }[lang] || 'steps';
  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:'#FFFFFF', position:'relative' }}>
      {/* Top brand bar */}
      <div style={{ padding:'18px 20px 14px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom:`1px solid #EAEAEA`,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:24, height:24, borderRadius:'50%', background:'#1A1A1A',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
            fontWeight:800, fontSize:13, letterSpacing:'-0.5px',
          }}>K</div>
          <div style={{ fontSize:13, fontWeight:700, letterSpacing:'-0.3px', color:'#1A1A1A' }}>
            K-BEAUTY ＣANA
          </div>
        </div>
        <div style={{ fontSize:10, color:'#9A9A9A', fontFamily:'ui-monospace, Menlo, monospace', letterSpacing:'0.5px' }}>
          KZ / RU / KR
        </div>
      </div>

      {/* Hero — editorial */}
      <div style={{ padding:'40px 24px 32px' }}>
        <div style={{ fontSize:9, color:'#9A9A9A', fontFamily:'ui-monospace, Menlo, monospace',
          letterSpacing:'2px', marginBottom:16 }}>
          № 001 — {t.home.koreaSecSub}
        </div>
        <div style={{ fontSize:38, fontWeight:700, lineHeight:1.05, letterSpacing:'-0.05em', color:'#1A1A1A',
        }}>
          {t.home.g1}<br/>
          <span style={{ fontStyle:'italic', fontWeight:500 }}>{t.home.g2}</span>
        </div>

        <div style={{ marginTop:22, paddingTop:18, borderTop:`1px solid #EAEAEA`, display:'flex', gap:18 }}>
          {[
            ['14', t.cl.tabKorea.replace('🇰🇷 ','')],
            ['20', t.cl.tabLocal],
            ['1.2k', t.home.reviewsN(1283).replace('1,283 ','').replace('1 283 ','')],
          ].map((s,i)=>(
            <div key={i} style={{ flex:1 }}>
              <div style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.04em', lineHeight:1 }}>{s[0]}</div>
              <div style={{ fontSize:10, color:'#9A9A9A', marginTop:6, fontFamily:'ui-monospace, Menlo, monospace', letterSpacing:'0.5px' }}>{s[1]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories as plain list */}
      <div style={{ padding:'8px 24px' }}>
        <div style={{ fontSize:9.5, color:'#9A9A9A', fontFamily:'ui-monospace, Menlo, monospace',
          letterSpacing:'2px', marginBottom:14, display:'flex', justifyContent:'space-between',
          paddingBottom:10, borderBottom:`1px solid #EAEAEA`,
        }}>
          <span>SECTION 02 — {t.home.popular.toUpperCase()}</span>
          <span>→</span>
        </div>
        {['skin','lift','botox','filler','acne'].map((k,i,arr)=>(
          <button key={k} onClick={()=>nav.go('cat')}
            style={{
              display:'flex', alignItems:'center', gap:14, width:'100%',
              padding:'16px 0', background:'none', border:'none',
              borderBottom: i<arr.length-1 ? `1px solid #F0F0F0` : 'none',
              cursor:'pointer', fontFamily:'inherit', textAlign:'left',
            }}>
            <div style={{ fontSize:9.5, color:'#9A9A9A', fontFamily:'ui-monospace, Menlo, monospace',
              width:26, flexShrink:0 }}>
              {String(i+1).padStart(2,'0')}
            </div>
            <div style={{ flex:1, fontSize:17, fontWeight:600, color:'#1A1A1A', letterSpacing:'-0.3px' }}>
              {t.cat.names[k]}
            </div>
            <div style={{ fontSize:10, color:'#9A9A9A', fontFamily:'ui-monospace, Menlo, monospace' }}>
              {[24,21,18,16,14][i]}
            </div>
            <div style={{ fontSize:14, color:'#1A1A1A' }}>→</div>
          </button>
        ))}
      </div>

      {/* Korea visit — editorial card */}
      <div style={{ padding:'24px 24px 0' }}>
        <button onClick={()=>nav.go('kv')}
          style={{
            width:'100%', padding:'22px', background:'#1A1A1A', color:'#fff',
            border:'none', borderRadius:0, textAlign:'left', cursor:'pointer', fontFamily:'inherit',
            position:'relative', overflow:'hidden',
          }}>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)',
            fontFamily:'ui-monospace, Menlo, monospace', letterSpacing:'2px', marginBottom:14 }}>
            № 003 — {t.kv.kicker.replace('🇰🇷 ','')}
          </div>
          <div style={{ fontSize:24, fontWeight:700, lineHeight:1.15, letterSpacing:'-0.03em' }}>
            {t.kv.hero1}<br/>
            <span style={{ fontStyle:'italic', fontWeight:500, color:'#E8607A' }}>{t.kv.hero2}</span>
          </div>
          <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.15)',
            display:'flex', justifyContent:'space-between', alignItems:'center',
            fontSize:11, color:'rgba(255,255,255,0.7)',
          }}>
            <div>{t.kv.steps.length} {stepWord} · {({kz:'Аудармашы · Қонақ үй',ru:'Переводчик · Отель',kr:'통역 · 호텔'})[lang] || 'Translator · Hotel'}</div>
            <div style={{ fontSize:16 }}>→</div>
          </div>
        </button>
      </div>

      {/* Featured clinic — text only */}
      <div style={{ padding:'24px 24px 0' }}>
        <div style={{ fontSize:9.5, color:'#9A9A9A', fontFamily:'ui-monospace, Menlo, monospace',
          letterSpacing:'2px', marginBottom:14, display:'flex', justifyContent:'space-between',
          paddingBottom:10, borderBottom:`1px solid #EAEAEA`,
        }}>
          <span>SECTION 04 — {t.home.koreaSec.toUpperCase()}</span>
          <span>SEE ALL →</span>
        </div>
        {[
          { n:'Lienne Clinic', loc:'Seoul · Gangnam · Sinsa', tag:t.cld.koreaPart, rate:'4.9' },
          { n:'Centum Dermatology', loc:'Seoul · Cheongdam', tag:t.cld.ru247, rate:'4.8' },
        ].map((c,i,arr)=>(
          <button key={i} onClick={()=>nav.go('cld')}
            style={{
              display:'block', width:'100%', padding:'18px 0',
              borderBottom: i<arr.length-1 ? `1px solid #F0F0F0` : 'none',
              background:'none', border:'none', textAlign:'left', cursor:'pointer', fontFamily:'inherit',
            }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:7 }}>
              <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.3px' }}>{c.n}</div>
              <div style={{ fontSize:11, color:'#1A1A1A', fontFamily:'ui-monospace, Menlo, monospace' }}>★ {c.rate}</div>
            </div>
            <div style={{ fontSize:11.5, color:'#5A5A5A', marginBottom:8 }}>{c.loc}</div>
            <div style={{ fontSize:10, color:'#9A9A9A', fontFamily:'ui-monospace, Menlo, monospace', letterSpacing:'0.5px' }}>
              {c.tag.toUpperCase()}
            </div>
          </button>
        ))}
      </div>

      {/* CTA — solid black bar */}
      <div style={{ height:120 }}/>
      <div style={{ position:'absolute', left:0, right:0, bottom:80, padding:'8px 24px',
        background:'linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 50%)',
      }}>
        <button onClick={()=>nav.go('fm')}
          style={{
            width:'100%', padding:'18px', background:'#1A1A1A', color:'#fff',
            border:'none', fontSize:14, fontWeight:700, letterSpacing:'-0.2px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            cursor:'pointer', fontFamily:'inherit',
          }}>
          <span>{t.home.ctaConsult}</span>
          <span>→</span>
        </button>
      </div>

      {/* Minimal tab bar */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0,
        background:'#fff', borderTop:`1px solid #EAEAEA`,
        padding:'10px 20px 28px',
        display:'flex', justifyContent:'space-between',
      }}>
        {[t.nav.home, t.nav.cat, t.nav.clinic, t.nav.review, t.nav.me].map((l,i)=>(
          <div key={i} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:5,
            color: i===0 ? '#1A1A1A' : '#9A9A9A', flex:1,
          }}>
            <div style={{ width:5, height:5, borderRadius:'50%',
              background: i===0 ? '#1A1A1A' : 'transparent',
              border: i===0 ? 'none' : '1px solid #9A9A9A' }}/>
            <div style={{ fontSize:10, fontWeight: i===0 ? 700 : 500, letterSpacing:'0.5px',
              fontFamily:'ui-monospace, Menlo, monospace' }}>{l.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// VARIANT B — LAVENDER / DREAMY
// Lavender primary, soft gradients, more elegant feel.
// ════════════════════════════════════════════════════════════════════
function ScreenHomeLavender() {
  const t = useT();
  const nav = useNav();
  const lavDeep = '#6E5A8C';   // primary action
  const lavBright = '#9683B5';
  const lavLight = '#EFE8F8';
  const lavMist = '#F6F2FB';
  const lavBg = '#FAF8FD';

  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:lavBg, position:'relative' }}>
      {/* Header */}
      <div style={{
        background:`linear-gradient(180deg, ${lavLight} 0%, ${lavBg} 100%)`,
        padding:'14px 18px 16px', position:'relative', overflow:'hidden',
      }}>
        {/* decorative blob */}
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, borderRadius:'50%',
          background:`radial-gradient(circle, ${lavBright} 0%, transparent 70%)`, opacity:0.25 }}/>

        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:'50%', background:lavDeep,
              display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
              fontWeight:800, fontSize:14, boxShadow:`0 3px 10px ${lavDeep}55`,
            }}>K</div>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>{t.brand}</div>
          </div>
          <div style={{ display:'flex', gap:14, alignItems:'center' }}>
            <Icon d={Icons.globe} size={20} stroke={lavDeep}/>
            <Icon d={Icons.bell} size={20} stroke={lavDeep}/>
          </div>
        </div>
        <div style={{ position:'relative', fontSize:23, fontWeight:700, lineHeight:1.3,
          color:T.ink, letterSpacing:'-0.04em' }}>
          {t.home.g1}<br/>
          <span style={{ color:lavDeep, fontStyle:'italic', fontWeight:500 }}>{t.home.g2}</span>
        </div>
        <div style={{ position:'relative', marginTop:14, background:'#fff', borderRadius:16,
          padding:'13px 14px', display:'flex', alignItems:'center', gap:10,
          boxShadow:`0 2px 8px ${lavDeep}10`,
        }}>
          <Icon d={Icons.search} size={18} stroke={lavBright}/>
          <div style={{ flex:1, fontSize:13, color:'#8A8A8A' }}>{t.home.search}</div>
        </div>
      </div>

      {/* Korea visit promo — lavender */}
      <div style={{ padding:'14px 18px 0' }}>
        <button onClick={() => nav.go('kv')}
          className="kb-press"
          style={{
            width:'100%', border:'none', textAlign:'left', cursor:'pointer',
            background:`linear-gradient(135deg, ${lavDeep} 0%, #4A3A6E 100%)`,
            borderRadius:18, padding:'18px 18px', color:'#fff',
            position:'relative', overflow:'hidden',
            fontFamily:'inherit',
          }}>
          <div style={{ position:'absolute', top:-50, right:-50, width:170, height:170, borderRadius:'50%',
            background:`radial-gradient(circle, ${lavBright} 0%, transparent 70%)`, opacity:0.5 }}/>
          <div style={{ position:'relative', display:'flex', alignItems:'center', gap:13 }}>
            <div style={{ width:46, height:46, borderRadius:14, background:'rgba(255,255,255,0.12)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
              border:'1px solid rgba(255,255,255,0.2)', backdropFilter:'blur(4px)' }}>
              <Icon d={Icons.plane} size={22} stroke="#fff" sw={1.8}/>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, color:lavLight, fontWeight:700, letterSpacing:'1.2px' }}>{t.kv.kicker}</div>
              <div style={{ fontSize:15, fontWeight:700, marginTop:3, letterSpacing:'-0.3px' }}>{t.kv.hero1}</div>
            </div>
            <Icon d={Icons.chevR} size={18} stroke="#fff"/>
          </div>
        </button>
      </div>

      {/* Soft category tiles */}
      <div style={{ padding:'20px 0 4px' }}>
        <div style={{ padding:'0 18px', display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>{t.home.popular}</div>
          <div style={{ fontSize:11.5, color:lavBright, fontWeight:600 }}>{t.home.viewAll} ›</div>
        </div>
        <div className="kb-scroll" style={{ display:'flex', gap:11, overflowX:'auto', padding:'0 18px 4px' }}>
          {['skin','botox','filler','lift','acne','pigment'].map((k,i)=>(
            <button key={i} onClick={()=>nav.go('cat')}
              className="kb-press"
              style={{ flex:'0 0 auto', textAlign:'center', background:'none', border:'none', cursor:'pointer', padding:0 }}>
              <div style={{ width:68, height:68, borderRadius:20, marginBottom:7,
                background: `linear-gradient(135deg, ${lavLight} 0%, ${lavMist} 100%)`,
                border:`1px solid ${lavLight}`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <div style={{ width:22, height:22, borderRadius:'50%',
                  background:`linear-gradient(135deg, ${lavBright} 0%, ${lavDeep} 100%)`,
                  opacity: 0.4 + (i*0.1),
                }}/>
              </div>
              <div style={{ fontSize:11.5, fontWeight:600, color:T.ink2, letterSpacing:'-0.2px', fontFamily:'inherit' }}>{t.cat.names[k]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Featured pair — lavender cards */}
      <div style={{ padding:'24px 0 0' }}>
        <div style={{ padding:'0 18px', display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:11 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.3px' }}>{t.home.koreaSec}</div>
            <div style={{ fontSize:11, color:'#8A8A8A', marginTop:2 }}>{t.home.koreaSecSub}</div>
          </div>
          <div style={{ fontSize:11.5, color:lavBright, fontWeight:600 }}>{t.home.more} ›</div>
        </div>
        <div className="kb-scroll" style={{ display:'flex', gap:12, overflowX:'auto', padding:'0 18px 4px' }}>
          {[
            { name:'Lienne Clinic', loc:'Seoul · Gangnam', tag:t.cld.koreaPart },
            { name:'Centum Dermatology', loc:'Seoul · Cheongdam', tag:t.cld.ru247 },
            { name:'Wua Plastic', loc:'Seoul · Apgujeong', tag:t.cld.day30 },
          ].map((c,i)=>(
            <button key={i} onClick={() => nav.go('cld')}
              className="kb-press"
              style={{ flex:'0 0 200px', padding:0, border:`1px solid ${lavLight}`,
                background:'#fff', borderRadius:18, overflow:'hidden',
                boxShadow:`0 4px 14px ${lavDeep}08`,
                fontFamily:'inherit', textAlign:'left', cursor:'pointer' }}>
              <div style={{ height:118, position:'relative',
                background:`linear-gradient(135deg, ${lavLight} 0%, ${lavMist} 100%)`,
              }}>
                <div style={{ position:'absolute', top:8, left:8,
                  padding:'4px 9px', borderRadius:999, background:'#fff',
                  fontSize:10, fontWeight:700, color:lavDeep,
                  border:`1px solid ${lavLight}`,
                }}>{t.home.koreaTag}</div>
                {/* Decorative oval */}
                <div style={{ position:'absolute', bottom:-20, right:-20, width:80, height:80, borderRadius:'50%',
                  background:`radial-gradient(circle, ${lavBright} 0%, transparent 70%)`, opacity:0.35 }}/>
              </div>
              <div style={{ padding:'12px 14px 14px' }}>
                <div style={{ fontSize:13, fontWeight:700, letterSpacing:'-0.3px' }}>{c.name}</div>
                <div style={{ fontSize:10.5, color:'#8A8A8A', marginTop:2 }}>{c.loc}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8 }}>
                  <Icon d={Icons.check} size={11} stroke={lavDeep} sw={2.4}/>
                  <div style={{ fontSize:10.5, color:T.ink2 }}>{c.tag}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:3 }}>
                  <Icon d={Icons.star} size={11} fill={lavDeep} stroke={lavDeep}/>
                  <div style={{ fontSize:10.5, color:T.ink2 }}>4.{9-i} · {t.home.reviewsN(320 - i*70)}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Verified banner */}
      <div style={{ padding:'20px 18px 0' }}>
        <div style={{
          background:`linear-gradient(135deg, #fff 0%, ${lavMist} 100%)`,
          border:`1px solid ${lavLight}`,
          borderRadius:18, padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
        }}>
          <div style={{ width:42, height:42, borderRadius:14, background:lavDeep,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            boxShadow:`0 4px 12px ${lavDeep}40`,
          }}>
            <Icon d={Icons.shieldCheck} size={22} stroke="#fff" sw={1.8}/>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.ink, letterSpacing:'-0.3px' }}>{t.home.verifiedT}</div>
            <div style={{ fontSize:10.5, color:T.text, marginTop:2 }}>{t.home.verifiedS}</div>
          </div>
        </div>
      </div>

      <div style={{ height:130 }}/>

      {/* CTA */}
      <div style={{ position:'absolute', left:0, right:0, bottom:80, padding:'8px 16px',
        background:`linear-gradient(180deg, rgba(250,248,253,0) 0%, ${lavBg} 50%)`,
      }}>
        <button onClick={()=>nav.go('fm')}
          className="kb-press"
          style={{
            width:'100%', padding:'15px 20px', borderRadius:18,
            background:`linear-gradient(135deg, ${lavDeep} 0%, #4A3A6E 100%)`,
            color:'#fff', fontSize:15, fontWeight:700, letterSpacing:'-0.2px',
            display:'flex', alignItems:'center', justifyContent:'center', gap:7,
            boxShadow:`0 6px 18px ${lavDeep}50`,
            border:'none', cursor:'pointer', fontFamily:'inherit',
          }}>
          <Icon d={Icons.chat} size={18} stroke="#fff" sw={2}/>
          {t.home.ctaConsult}
        </button>
      </div>

      {/* Lavender tab bar */}
      <div style={{
        position:'absolute', left:0, right:0, bottom:0,
        background:'rgba(255,255,255,0.95)', backdropFilter:'blur(16px)',
        borderTop:`1px solid ${lavLight}`,
        padding:'8px 8px 26px',
        display:'flex', justifyContent:'space-around',
      }}>
        {[
          { l:t.nav.home, icon:Icons.home, on:true },
          { l:t.nav.cat, icon:Icons.grid },
          { l:t.nav.clinic, icon:Icons.hospital },
          { l:t.nav.review, icon:Icons.star },
          { l:t.nav.me, icon:Icons.user },
        ].map((it,i)=>(
          <div key={i} style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            color: it.on ? lavDeep : '#8A8A8A', padding:'4px 8px', flex:1,
          }}>
            <Icon d={it.icon} size={22} sw={it.on ? 1.9 : 1.5}/>
            <div style={{ fontSize:10.5, fontWeight: it.on ? 600 : 500, letterSpacing:'-0.2px' }}>{it.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// VARIANT C — for reference: original is the Rose home (ScreenHome)
// We re-export it here for the comparison view.
// ════════════════════════════════════════════════════════════════════

Object.assign(window, { ScreenHomeMinimal, ScreenHomeLavender });
