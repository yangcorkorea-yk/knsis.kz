// Admin screens (additional): Dashboard · Customers · Clinics · Reviews · Managers.
// Reuses AdminShell from screens-e.jsx. Tri-lingual via inline L() helper.

// ── tiny i18n helper used by all 5 screens ───────────────────────
const adL = (lang, dict) => (key) => (dict[key] && dict[key][lang]) || dict[key]?.kz || key;

// ════════════════════════════════════════════════════════════════════
// 16. DASHBOARD · 대시보드 / Дашборд
// ════════════════════════════════════════════════════════════════════
function ScreenAdminDashboard() {
  const t = useT();
  const lang = useLang();
  const L = adL(lang, {
    title:    { kz:'Дашборд', ru:'Дашборд', kr:'대시보드' },
    sub:      { kz:'Соңғы 7 күн · K-Beauty Сana операциялары', ru:'Последние 7 дней · операции K-Beauty Сana', kr:'최근 7일 · K-Beauty Сana 운영 현황' },
    today:    { kz:'Бүгін', ru:'Сегодня', kr:'오늘' },
    period:   { kz:'7 күн', ru:'7 дней', kr:'7일' },
    funnel:   { kz:'Кеңес сұрауы воронкасы', ru:'Воронка заявок', kr:'상담 신청 퍼널' },
    volume:   { kz:'Күнделікті кеңес сұраулары', ru:'Заявки по дням', kr:'일별 상담 접수' },
    channels: { kz:'Канал бөлінісі', ru:'Распределение каналов', kr:'채널 분포' },
    sources:  { kz:'Қызығушылық бағыты', ru:'Интерес по направлениям', kr:'관심 시술 분포' },
    mgrLoad:  { kz:'Менеджер жүктемесі', ru:'Загрузка менеджеров', kr:'매니저별 처리 현황' },
    recent:   { kz:'Соңғы әрекеттер', ru:'Последние действия', kr:'최근 활동' },
    avgResp:  { kz:'Орт. жауап беру', ru:'Среднее время ответа', kr:'평균 응답 시간' },
    convRate: { kz:'Конверсия', ru:'Конверсия', kr:'전환율' },
    newLeads: { kz:'Жаңа сұраулар', ru:'Новые заявки', kr:'신규 상담' },
    active:   { kz:'Жалғасуда', ru:'В работе', kr:'진행 중' },
    completed:{ kz:'Аяқталған', ru:'Завершено', kr:'완료' },
    review:   { kz:'Пікір кезек', ru:'Отзывы в очереди', kr:'후기 검토 대기' },
    new:      { kz:'Жаңа', ru:'Новая', kr:'신규' },
    contacted:{ kz:'Хабарласты', ru:'Связались', kr:'연락함' },
    inprog:   { kz:'Жалғасуда', ru:'В работе', kr:'진행 중' },
    plan:     { kz:'Жоспарланды', ru:'Назначено', kr:'예약됨' },
    done:     { kz:'Аяқталды', ru:'Завершено', kr:'완료' },
    open:     { kz:'Жабылмаған', ru:'Открытые', kr:'미해결' },
    handled:  { kz:'Өңделген', ru:'Обработано', kr:'처리됨' },
    avgHrs:   { kz:'орт., сағ', ru:'ср., ч', kr:'평균/시간' },
  });

  const A = { bg:'#F7F6F4', border:'#E8E5E0', borderSoft:'#F0EDE8', text:'#5A5A5A', mute:'#9A9A95' };

  const kpis = [
    { l:L('newLeads'), v:'24', d:'+18%', tone:T.roseDeep },
    { l:L('active'),   v:'47', d:'+5',   tone:'#A07012' },
    { l:L('completed'),v:'132',d:'+22',  tone:'#1F7A4D' },
    { l:L('avgResp'),  v:'1.4', dSub:L('avgHrs'), tone:'#5E4B82' },
    { l:L('convRate'), v:'34%', d:'+3.2%', tone:T.ink },
  ];

  const funnel = [
    { l:L('new'),       n:24, w:100, c:T.rose },
    { l:L('contacted'), n:19, w:79,  c:'#1F7A4D' },
    { l:L('inprog'),    n:15, w:62,  c:'#A07012' },
    { l:L('plan'),      n:11, w:46,  c:'#5E4B82' },
    { l:L('done'),      n:8,  w:33,  c:T.ink },
  ];

  // 7-day bars
  const days = ['M','T','W','T','F','S','S'];
  const bars = [12,18,9,15,22,7,11];
  const maxBar = Math.max(...bars);

  const channels = [
    { l:'Web form',  pct:64, c:T.rose },
    { l:'App',       pct:24, c:T.lavender },
    { l:'Phone',     pct:8,  c:T.beige },
    { l:'Referral',  pct:4,  c:'#9CBEA8' },
  ];

  const sources = [
    { l:t.cat.names.lift,    pct:34 },
    { l:t.cat.names.botox,   pct:22 },
    { l:t.cat.names.filler,  pct:16 },
    { l:t.cat.names.skin,    pct:12 },
    { l:t.cat.names.acne,    pct:9 },
    { l:t.cat.names.pigment, pct:7 },
  ];

  const mgrs = [
    { n:'Park M.',  a:'P', col:T.lavender, open:9,  done:42, sla:'98%' },
    { n:'Lee M.',   a:'L', col:'#9CBEA8',  open:7,  done:38, sla:'96%' },
    { n:'Kim M.',   a:'K', col:T.beige,    open:5,  done:31, sla:'94%' },
    { n:'Choi M.',  a:'C', col:'#E8A0B0',  open:4,  done:21, sla:'99%' },
  ];

  const acts = [
    { c:T.rose,      tt:lang==='kz'?'Aigerim Bekova → жаңа сұрау':lang==='ru'?'Aigerim Bekova → новая заявка':'Aigerim Bekova → 신규 상담', s:'5m' },
    { c:'#1F7A4D',   tt:lang==='kz'?'Park M. → Aliya N. хабарлама жіберді':lang==='ru'?'Park M. ответил Aliya N.':'Park M. → Aliya N. 응답', s:'12m' },
    { c:'#5E4B82',   tt:lang==='kz'?'Zarina B. → Centum Dermatology тағайындалды':lang==='ru'?'Zarina B. назначена в Centum Dermatology':'Zarina B. → Centum Dermatology 배정', s:'34m' },
    { c:'#A07012',   tt:lang==='kz'?'Saule T. процедура аяқтады':lang==='ru'?'Saule T. завершила процедуру':'Saule T. 시술 완료', s:'1h' },
    { c:T.ink,       tt:lang==='kz'?'Жаңа пікір модерациядан өтті':lang==='ru'?'Новый отзыв прошёл модерацию':'신규 후기 검수 완료', s:'2h' },
  ];

  return (
    <AdminShell active="dash">
      <div style={{
        padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
        background:'#fff', display:'flex', alignItems:'center', gap:14,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{L('title')}</div>
          <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{L('sub')}</div>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', gap:0, border:`1px solid ${A.border}`, borderRadius:8, overflow:'hidden' }}>
          {[L('today'), L('period'), '30d', '90d'].map((p,i)=>(
            <div key={i} style={{ padding:'7px 12px', fontSize:11.5, fontWeight: i===1?700:500,
              background: i===1?T.ink:'#fff', color: i===1?'#fff':A.text, cursor:'pointer' }}>{p}</div>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflow:'auto', padding:'18px 22px' }}>
        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:11 }}>
          {kpis.map((k,i)=>(
            <div key={i} style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:11, padding:'13px 14px' }}>
              <div style={{ fontSize:11, color:A.mute, fontWeight:500 }}>{k.l}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:6, marginTop:5 }}>
                <div className="kb-display" style={{ fontSize:24, color:k.tone }}>{k.v}</div>
                {k.d && <div style={{ fontSize:10.5, color:k.d.startsWith('+')?'#1F7A4D':T.text, fontWeight:600 }}>{k.d}</div>}
                {k.dSub && <div style={{ fontSize:10.5, color:A.mute }}>{k.dSub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Two-col charts: funnel + daily bars */}
        <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:14 }}>
          <Panel title={L('funnel')}>
            <div style={{ display:'flex', flexDirection:'column', gap:9, padding:'4px 0' }}>
              {funnel.map((f,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:96, fontSize:11.5, color:A.text, fontWeight:600 }}>{f.l}</div>
                  <div style={{ flex:1, height:18, background:A.bg, borderRadius:5, overflow:'hidden', position:'relative' }}>
                    <div style={{ position:'absolute', inset:0, width:`${f.w}%`, background:f.c, opacity:0.92 }}/>
                    <div style={{ position:'absolute', left:9, top:0, bottom:0, display:'flex', alignItems:'center',
                      fontSize:10.5, fontWeight:700, color:'#fff' }}>{f.n}</div>
                  </div>
                  <div style={{ width:42, textAlign:'right', fontSize:10.5, color:A.mute }}>{f.w}%</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={L('volume')}>
            <div style={{ height:148, display:'flex', alignItems:'flex-end', gap:10, padding:'4px 6px 0' }}>
              {bars.map((b,i)=>{
                const h = (b/maxBar)*130;
                return (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ fontSize:10, color:A.mute, fontWeight:600 }}>{b}</div>
                    <div style={{ width:'100%', height:h, background: i===4?T.rose:T.roseSoft,
                      borderRadius:'4px 4px 0 0' }}/>
                    <div style={{ fontSize:9.5, color:A.mute, marginTop:3 }}>{days[i]}</div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Channels + sources + manager */}
        <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr 1.2fr', gap:14 }}>
          <Panel title={L('channels')}>
            <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'4px 0' }}>
              {channels.map((c,i)=>(
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:5 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, color:T.ink2, fontWeight:600 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:c.c }}/> {c.l}
                    </div>
                    <div style={{ color:A.mute }}>{c.pct}%</div>
                  </div>
                  <div style={{ height:6, background:A.bg, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${c.pct}%`, height:'100%', background:c.c }}/>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={L('sources')}>
            <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'4px 0' }}>
              {sources.map((s,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{ flex:1, fontSize:11.5, color:T.ink2 }}>{s.l}</div>
                  <div style={{ width:130, height:6, background:A.bg, borderRadius:3, overflow:'hidden' }}>
                    <div style={{ width:`${s.pct*2.5}%`, height:'100%', background:T.rose, opacity: 1 - i*0.12 }}/>
                  </div>
                  <div style={{ width:32, textAlign:'right', fontSize:10.5, color:A.mute }}>{s.pct}%</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={L('mgrLoad')}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {mgrs.map((m,i)=>(
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                  borderBottom: i<mgrs.length-1?`1px solid ${A.borderSoft}`:'none',
                }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:m.col, color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:12.5 }}>{m.a}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>{m.n}</div>
                    <div style={{ fontSize:10, color:A.mute, marginTop:1 }}>SLA {m.sla}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.ink2 }}>{m.open}<span style={{ fontSize:10, color:A.mute, fontWeight:500 }}> / {m.done}</span></div>
                    <div style={{ fontSize:9.5, color:A.mute }}>{L('open')} / {L('handled')}</div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* Activity feed */}
        <div style={{ marginTop:14 }}>
          <Panel title={L('recent')}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {acts.map((a,i)=>(
                <div key={i} style={{ display:'flex', gap:11, padding:'9px 0',
                  borderBottom: i<acts.length-1?`1px solid ${A.borderSoft}`:'none' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:a.c, marginTop:6, flexShrink:0 }}/>
                  <div style={{ flex:1, fontSize:12, color:T.ink2 }}>{a.tt}</div>
                  <div style={{ fontSize:11, color:A.mute }}>{a.s}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AdminShell>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #E8E5E0', borderRadius:11, padding:'13px 15px' }}>
      <div style={{ fontSize:11, color:'#9A9A95', fontWeight:700, letterSpacing:'0.3px', marginBottom:10 }}>{title.toUpperCase()}</div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 17. CUSTOMERS · 고객 / Клиенты
// ════════════════════════════════════════════════════════════════════
function ScreenAdminCustomers() {
  const t = useT();
  const lang = useLang();
  const L = adL(lang, {
    title:   { kz:'Клиенттер', ru:'Клиенты', kr:'고객 관리' },
    sub:     { kz:'1 248 тіркелген қолданушы · KZ·RU·KR', ru:'1 248 зарегистрированных пользователей · KZ·RU·KR', kr:'등록 회원 1,248명 · KZ·RU·KR' },
    add:     { kz:'Қолмен қосу', ru:'Добавить вручную', kr:'직접 추가' },
    export:  { kz:'Экспорт', ru:'Экспорт', kr:'내보내기' },
    all:     { kz:'Барлығы', ru:'Все', kr:'전체' },
    active:  { kz:'Белсенді', ru:'Активные', kr:'활성' },
    repeat:  { kz:'Қайталанатын', ru:'Повторные', kr:'재방문' },
    dormant: { kz:'Ұйықтаушы', ru:'Спящие', kr:'휴면' },
    vip:     { kz:'VIP', ru:'VIP', kr:'VIP' },
    cols:    { kz:['Клиент','Тіл','Аймақ','Сұраулар','Соңғы белсенділік','Тег','Канал'], ru:['Клиент','Язык','Регион','Заявки','Последняя активность','Тег','Канал'], kr:['고객','언어','지역','상담','최근 활동','태그','채널'] },
    search:  { kz:'Аты, нөмір немесе ID іздеу', ru:'Поиск по имени, номеру или ID', kr:'이름·번호·ID 검색' },
  });
  const A = { bg:'#F7F6F4', border:'#E8E5E0', borderSoft:'#F0EDE8', text:'#5A5A5A', mute:'#9A9A95' };

  const rows = [
    { n:'Aigerim Bekova',    id:'CU-1042', lg:'RU', rg:t.locName.almaty, n2:3, last:'5m', tag:'vip',    ch:'TEL', av:'А', col:T.rose },
    { n:'Dana Sultan',       id:'CU-1041', lg:'KZ', rg:t.locName.astana, n2:1, last:'12m', tag:'new',    ch:'CHAT', av:'Д', col:T.lavender },
    { n:'Aliya Nurpeisova',  id:'CU-1040', lg:'RU', rg:t.locName.seoul,  n2:2, last:'1h', tag:'active', ch:'TEL', av:'А', col:T.beige },
    { n:'Madina Akhmetova',  id:'CU-1039', lg:'RU', rg:t.locName.almaty, n2:5, last:'3h', tag:'repeat', ch:'CHAT', av:'М', col:'#9CBEA8' },
    { n:'Zarina Beksultanova', id:'CU-1038', lg:'RU', rg:t.locName.seoul, n2:2, last:'1d', tag:'vip',  ch:'TEL', av:'З', col:'#E8A0B0' },
    { n:'Saule Toleukhanova',id:'CU-1037', lg:'KZ', rg:t.locName.almaty, n2:1, last:'3d', tag:'active', ch:'CHAT', av:'С', col:T.rose },
    { n:'Kamila Auelbek',    id:'CU-1036', lg:'RU', rg:t.locName.almaty, n2:1, last:'4d', tag:'dormant',ch:'TEL', av:'К', col:T.lavender },
    { n:'Aida Tursynbek',    id:'CU-1035', lg:'KZ', rg:t.locName.astana, n2:4, last:'9d', tag:'repeat', ch:'CHAT', av:'А', col:'#9CBEA8' },
    { n:'Nazerke Iskakova',  id:'CU-1034', lg:'RU', rg:t.locName.seoul,  n2:6, last:'14d', tag:'vip',   ch:'TEL', av:'Н', col:T.beige },
    { n:'Asem Karimova',     id:'CU-1033', lg:'KZ', rg:t.locName.almaty, n2:2, last:'21d', tag:'dormant',ch:'CHAT',av:'А', col:'#E8A0B0' },
  ];

  const tagColor = {
    vip:     { bg:'#FFF1F2', fg:T.roseDeep, l: lang==='kr'?'VIP':lang==='ru'?'VIP':'VIP' },
    new:     { bg:'#E5F4EC', fg:'#1F7A4D',  l: lang==='kz'?'Жаңа':lang==='ru'?'Новый':'신규' },
    active:  { bg:'#EAE4F5', fg:'#5E4B82',  l: lang==='kz'?'Белсенді':lang==='ru'?'Активный':'활성' },
    repeat:  { bg:'#FFF5E1', fg:'#A07012',  l: lang==='kz'?'Қайталанатын':lang==='ru'?'Повторный':'재방문' },
    dormant: { bg:'#F0EDE8', fg:'#5A5A5A',  l: lang==='kz'?'Ұйықтаушы':lang==='ru'?'Спящий':'휴면' },
  };

  return (
    <AdminShell active="cust">
      <div style={{
        padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
        background:'#fff', display:'flex', alignItems:'center', gap:14,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{L('title')}</div>
          <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{L('sub')}</div>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{
          display:'flex', alignItems:'center', gap:7, padding:'7px 11px',
          border:`1px solid ${A.border}`, borderRadius:9, background:A.bg, minWidth:280,
        }}>
          <Icon d={Icons.search} size={14} stroke={A.mute}/>
          <div style={{ fontSize:12, color:A.mute }}>{L('search')}</div>
        </div>
        <button style={btnSecondary}>
          <Icon d={Icons.doc} size={11} stroke={T.ink2} sw={2} style={{ marginRight:5 }}/>
          {L('export')}
        </button>
        <button style={btnPrimary}>
          <Icon d={Icons.plus} size={11} stroke="#fff" sw={2.4} style={{ marginRight:5 }}/>
          {L('add')}
        </button>
      </div>

      {/* segment tabs */}
      <div style={{ padding:'14px 22px 8px', display:'flex', gap:6 }}>
        {[
          { l:L('all'),     n:1248, on:true },
          { l:L('active'),  n:412 },
          { l:L('repeat'),  n:189 },
          { l:L('vip'),     n:47 },
          { l:L('dormant'), n:600 },
        ].map((tt,i)=>(
          <div key={i} style={{
            padding:'7px 12px', borderRadius:7, fontSize:12, fontWeight: tt.on?700:500,
            background: tt.on?T.ink:'transparent',
            color: tt.on?'#fff':A.text,
            border: tt.on?'none':`1px solid ${A.border}`,
            display:'flex', alignItems:'center', gap:6,
          }}>{tt.l}<span style={{ opacity:0.7 }}>{tt.n}</span></div>
        ))}
      </div>

      {/* table */}
      <div style={{ padding:'8px 22px 22px', flex:1, overflow:'auto' }}>
        <div style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{
            display:'grid',
            gridTemplateColumns:'1.7fr 0.6fr 0.9fr 0.7fr 1fr 0.9fr 0.7fr 24px',
            padding:'10px 14px', background:'#FBFAF7', borderBottom:`1px solid ${A.border}`,
            fontSize:10.5, color:A.mute, fontWeight:600, letterSpacing:'0.3px', alignItems:'center', gap:6,
          }}>
            {L('cols').map((c,i)=><div key={i}>{c}</div>)}
            <div></div>
          </div>
          {rows.map((r,i)=>{
            const tg = tagColor[r.tag] || tagColor.active;
            return (
              <div key={i} style={{
                display:'grid',
                gridTemplateColumns:'1.7fr 0.6fr 0.9fr 0.7fr 1fr 0.9fr 0.7fr 24px',
                padding:'12px 14px', alignItems:'center',
                borderBottom: i<rows.length-1 ? `1px solid ${A.borderSoft}` : 'none',
                background: i%2===0 ? '#fff' : '#FDFCFA',
                fontSize:12, gap:6,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:r.col, color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12 }}>{r.av}</div>
                  <div>
                    <div style={{ fontWeight:600, color:T.ink, letterSpacing:'-0.2px' }}>{r.n}</div>
                    <div style={{ fontSize:10, color:A.mute, fontFamily:'monospace', marginTop:2 }}>#{r.id}</div>
                  </div>
                </div>
                <div><span style={{ padding:'3px 7px', background:A.bg, borderRadius:5, fontSize:10, fontWeight:700, color:A.text }}>{r.lg}</span></div>
                <div style={{ fontSize:11.5, color:T.ink2 }}>{r.rg}</div>
                <div style={{ fontSize:12, fontWeight:600, color:T.ink2 }}>{r.n2}</div>
                <div style={{ fontSize:11, color:A.mute }}>{r.last}</div>
                <div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 9px',
                    borderRadius:6, background:tg.bg, color:tg.fg, fontSize:10.5, fontWeight:700 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:tg.fg }}/>{tg.l}
                  </span>
                </div>
                <div>
                  <div style={{ width:22, height:22, borderRadius:'50%',
                    background: r.ch==='TEL'?T.rose:T.lavender, color:'#fff',
                    fontSize:8.5, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', letterSpacing:'-0.1px' }}>{r.ch}</div>
                </div>
                <div><Icon d={Icons.chevR} size={14} stroke={A.mute}/></div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// 18. CLINICS · 클리닉 / Клиники
// ════════════════════════════════════════════════════════════════════
function ScreenAdminClinics() {
  const t = useT();
  const lang = useLang();
  const L = adL(lang, {
    title:    { kz:'Клиника басқару', ru:'Управление клиниками', kr:'클리닉 관리' },
    sub:      { kz:'Серіктес клиникалардың тізілімі мен тексеру күйі', ru:'Реестр клиник-партнёров и статус верификации', kr:'파트너 클리닉 등록 및 검증 상태' },
    addCl:    { kz:'Клиника қосу', ru:'Добавить клинику', kr:'클리닉 추가' },
    invite:   { kz:'Шақыру жіберу', ru:'Отправить приглашение', kr:'초대장 발송' },
    all:      { kz:'Барлығы', ru:'Все', kr:'전체' },
    korea:    { kz:'🇰🇷 Корея', ru:'🇰🇷 Корея', kr:'🇰🇷 한국' },
    local:    { kz:'🇰🇿 Жергілікті', ru:'🇰🇿 Локальные', kr:'🇰🇿 카자흐스탄' },
    pending:  { kz:'Тексеру күтуде', ru:'На проверке', kr:'검증 대기' },
    suspend:  { kz:'Тоқтатылған', ru:'Приостановлено', kr:'중단됨' },
    leads:    { kz:'сұрау', ru:'заявок', kr:'상담' },
    rating:   { kz:'рейтинг', ru:'рейтинг', kr:'평점' },
    interpret:{ kz:'аудармашы', ru:'переводчик', kr:'통역' },
    verified: { kz:'✓ Тексерілген', ru:'✓ Верифицирована', kr:'✓ 검증 완료' },
    pendingT: { kz:'Тексеру күтуде', ru:'На проверке', kr:'검증 대기 중' },
    suspended:{ kz:'Тоқтатылған', ru:'Приостановлена', kr:'운영 중단' },
  });
  const A = { bg:'#F7F6F4', border:'#E8E5E0', borderSoft:'#F0EDE8', text:'#5A5A5A', mute:'#9A9A95' };

  const clinics = [
    { n:'Lienne Clinic',         loc:'Seoul · Gangnam',   kind:'korea', leads:48, rat:4.9, intp:['RU','KR'], st:'verified',  txs:[t.cat.names.lift,t.cat.names.botox] },
    { n:'Centum Dermatology',    loc:'Seoul · Cheongdam', kind:'korea', leads:32, rat:4.8, intp:['RU','KR'], st:'verified',  txs:[t.cat.names.filler,t.cat.names.skin] },
    { n:'Almaty Skin Lab',       loc:t.locName.almaty,    kind:'local', leads:27, rat:4.7, intp:['KZ','RU'], st:'verified',  txs:[t.cat.names.skin,t.cat.names.acne] },
    { n:'Nur Beauty Clinic',     loc:t.locName.almaty,    kind:'local', leads:21, rat:4.6, intp:['KZ','RU'], st:'verified',  txs:[t.cat.names.botox,t.cat.names.pigment] },
    { n:'Astana Mediskin',       loc:t.locName.astana,    kind:'local', leads:14, rat:4.5, intp:['KZ','RU'], st:'verified',  txs:[t.cat.names.skin,t.cat.names.lift] },
    { n:'JK Plastic Surgery',    loc:'Seoul · Apgujeong', kind:'korea', leads:0,  rat:0,   intp:['KR'],      st:'pending',   txs:[t.cat.names.cosmetic] },
    { n:'Banobagi Clinic',       loc:'Seoul · Gangnam',   kind:'korea', leads:0,  rat:0,   intp:['KR','RU'], st:'pending',   txs:[t.cat.names.lift,t.cat.names.filler] },
    { n:'Hanbit Clinic',         loc:'Busan · Haeundae',  kind:'korea', leads:6,  rat:4.2, intp:['KR'],      st:'suspended', txs:[t.cat.names.hair] },
  ];

  const stPill = (st) => {
    if (st==='verified')   return { bg:'#E5F4EC', fg:'#1F7A4D', l:L('verified') };
    if (st==='pending')    return { bg:'#FFF5E1', fg:'#A07012', l:L('pendingT') };
    if (st==='suspended')  return { bg:'#FDE8E4', fg:'#A04432', l:L('suspended') };
    return { bg:'#F0EDE8', fg:'#5A5A5A', l:st };
  };

  return (
    <AdminShell active="clinic">
      <div style={{
        padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
        background:'#fff', display:'flex', alignItems:'center', gap:14,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{L('title')}</div>
          <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{L('sub')}</div>
        </div>
        <div style={{ flex:1 }}/>
        <button style={btnSecondary}>
          <Icon d={Icons.send} size={11} stroke={T.ink2} sw={2} style={{ marginRight:5 }}/>{L('invite')}
        </button>
        <button style={btnPrimary}>
          <Icon d={Icons.plus} size={11} stroke="#fff" sw={2.4} style={{ marginRight:5 }}/>{L('addCl')}
        </button>
      </div>

      {/* tabs */}
      <div style={{ padding:'14px 22px 8px', display:'flex', gap:6 }}>
        {[
          { l:L('all'),     n:34, on:true },
          { l:L('korea'),   n:18 },
          { l:L('local'),   n:12 },
          { l:L('pending'), n:3 },
          { l:L('suspend'), n:1 },
        ].map((tt,i)=>(
          <div key={i} style={{
            padding:'7px 12px', borderRadius:7, fontSize:12, fontWeight: tt.on?700:500,
            background: tt.on?T.ink:'transparent', color: tt.on?'#fff':A.text,
            border: tt.on?'none':`1px solid ${A.border}`, display:'flex', alignItems:'center', gap:6,
          }}>{tt.l}<span style={{ opacity:0.7 }}>{tt.n}</span></div>
        ))}
      </div>

      {/* grid */}
      <div style={{ padding:'8px 22px 22px', flex:1, overflow:'auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
          {clinics.map((c,i)=>{
            const sp = stPill(c.st);
            return (
              <div key={i} style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:12,
                overflow:'hidden', display:'flex', flexDirection:'column' }}>
                <div className="kb-img-ph rose" style={{ height:84, position:'relative' }}>
                  <div style={{ position:'absolute', top:9, left:9, display:'flex', gap:5 }}>
                    <Badge tone={c.kind==='korea'?'korea':'lav'}>{c.kind==='korea'?L('korea'):L('local')}</Badge>
                  </div>
                  <div style={{ position:'absolute', top:9, right:9,
                    padding:'3px 8px', background:sp.bg, color:sp.fg, fontSize:10, fontWeight:700, borderRadius:5,
                    display:'flex', alignItems:'center', gap:4 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:sp.fg }}/>{sp.l}
                  </div>
                </div>
                <div style={{ padding:'12px 13px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ fontSize:14, fontWeight:700, letterSpacing:'-0.3px', color:T.ink }}>{c.n}</div>
                    {c.st==='verified' && <Icon d={Icons.checkBadge} size={13} stroke={T.roseDeep} sw={2}/>}
                  </div>
                  <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{c.loc}</div>

                  <div style={{ display:'flex', gap:4, marginTop:8, flexWrap:'wrap' }}>
                    {c.txs.slice(0,3).map((tx,k)=>(
                      <span key={k} style={{ fontSize:10, padding:'3px 7px', background:A.bg, color:T.text,
                        borderRadius:5, fontWeight:600 }}>{tx}</span>
                    ))}
                  </div>

                  <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${A.borderSoft}`,
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
                    <Metric label={L('leads')} val={c.leads||'—'} />
                    <Metric label={L('rating')} val={c.rat?c.rat.toFixed(1):'—'} icon={c.rat ? <Icon d={Icons.star} size={10} fill={T.rose} stroke={T.rose}/> : null}/>
                    <Metric label={L('interpret')} val={c.intp.join('·')} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}

function Metric({ label, val, icon }) {
  return (
    <div style={{ flex:1 }}>
      <div style={{ fontSize:9.5, color:'#9A9A95', fontWeight:600, letterSpacing:'0.3px', marginBottom:2 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize:12.5, fontWeight:700, color:'#1A1A1A', display:'flex', alignItems:'center', gap:3 }}>
        {icon}{val}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 19. REVIEW MODERATION · 후기 검수 / Модерация отзывов
// ════════════════════════════════════════════════════════════════════
function ScreenAdminReviews() {
  const t = useT();
  const lang = useLang();
  const L = adL(lang, {
    title:   { kz:'Пікір модерациясы', ru:'Модерация отзывов', kr:'후기 검수' },
    sub:     { kz:'Жариялау алдында суреттер мен мәтінді тексеру', ru:'Проверка текста и фото перед публикацией', kr:'게시 전 사진·텍스트 확인' },
    pending: { kz:'Күтуде', ru:'Ожидает', kr:'검수 대기' },
    flagged: { kz:'Шағым түсті', ru:'Жалоба', kr:'신고 접수' },
    pub:     { kz:'Жарияланған', ru:'Опубликовано', kr:'게시됨' },
    rejected:{ kz:'Қабылданбады', ru:'Отклонено', kr:'반려' },
    approve: { kz:'Қабылдау', ru:'Одобрить', kr:'승인' },
    reject:  { kz:'Қабылдамау', ru:'Отклонить', kr:'반려' },
    askEdit: { kz:'Өңдеу сұрау', ru:'Запросить правки', kr:'수정 요청' },
    consent: { kz:'Сурет жариялауға келісім', ru:'Согласие на публикацию фото', kr:'사진 게시 동의' },
    given:   { kz:'Берілген', ru:'Получено', kr:'동의 완료' },
    flag:    { kz:'Шағым себебі', ru:'Причина жалобы', kr:'신고 사유' },
    reviewBy:{ kz:'Тексеруші', ru:'Модератор', kr:'검수자' },
  });
  const A = { bg:'#F7F6F4', border:'#E8E5E0', borderSoft:'#F0EDE8', text:'#5A5A5A', mute:'#9A9A95' };

  const rev = [
    { id:'RV-2025-422', tag:'pending', name:'Aigerim B.', rating:5, tx:t.cat.names.lift, cl:'Lienne Clinic',
      body: lang==='kz' ? '2 апта өтті, ісік жоқ. Аударма жақсы болды, ыңғайлы кеңес. Бет контуры табиғи жинақы көрінеді.'
            : lang==='ru' ? 'Прошло 2 недели, отёка нет. Перевод был отличный, консультация удобная. Контур лица выглядит подтянутым и натуральным.'
            : '2주 지났는데 붓기 없어요. 통역도 좋았고 상담도 편안했어요. 얼굴 윤곽이 자연스럽게 정리된 느낌이에요.',
      photos:2, consent:true, time:'12m' },
    { id:'RV-2025-421', tag:'flagged', name:'Madina A.', rating:4, tx:t.cat.names.botox, cl:'Nur Beauty Clinic',
      body: lang==='kz' ? 'Жалпы жақсы. Бірақ алдын ала кеңесте баға айқын болса жақсы болатын еді.'
            : lang==='ru' ? 'В целом хорошо. Хотелось бы, чтобы цены были понятнее на этапе консультации.'
            : '전반적으로 좋아요. 다만 사전 상담에서 가격이 더 명확했으면 좋겠어요.',
      photos:0, consent:true, time:'1h', flag: lang==='kz'?'Баға туралы талқылау':lang==='ru'?'Обсуждение цены':'가격 언급' },
    { id:'RV-2025-420', tag:'pending', name:'Saule T.', rating:5, tx:t.cat.names.acne, cl:'Almaty Skin Lab',
      body: lang==='kz' ? '3 курстан кейін тері тегіс болды. Дәрігер мұқият тыңдады, нұсқаулықты қазақша жіберді.'
            : lang==='ru' ? 'После 3 сеансов кожа стала ровной. Врач внимательно слушал, инструкции прислали на казахском.'
            : '3회 치료 후 피부가 매끈해졌어요. 의사가 잘 들어주셨고 케어 안내도 카자흐어로 받았어요.',
      photos:3, consent:true, time:'3h' },
    { id:'RV-2025-419', tag:'pending', name:'Kamila A.', rating:3, tx:t.cat.names.pigment, cl:'Almaty Skin Lab',
      body: lang==='kz' ? 'Алғашқы нәтиже жақсы, бірақ үшінші процедураға дейін айырмашылық байқалмады.'
            : lang==='ru' ? 'Первый результат хороший, но до третьей процедуры разницы почти не было.'
            : '첫 결과는 좋았지만 3회차까지 큰 차이는 없었어요.',
      photos:1, consent:false, time:'5h' },
  ];

  const tagInfo = {
    pending: { bg:'#FFF5E1', fg:'#A07012', l:L('pending'), n:8 },
    flagged: { bg:'#FDE8E4', fg:'#A04432', l:L('flagged'), n:2 },
    pub:     { bg:'#E5F4EC', fg:'#1F7A4D', l:L('pub'),     n:184 },
    rejected:{ bg:'#F0EDE8', fg:'#5A5A5A', l:L('rejected'),n:11 },
  };

  return (
    <AdminShell active="review">
      <div style={{
        padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
        background:'#fff', display:'flex', alignItems:'center', gap:14,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{L('title')}</div>
          <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{L('sub')}</div>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px', background:A.bg,
          border:`1px solid ${A.border}`, borderRadius:8, fontSize:11.5, color:T.ink2, fontWeight:600 }}>
          <Icon d={Icons.user} size={12} stroke={T.text}/>{L('reviewBy')}: Park M.
        </div>
      </div>

      {/* tabs */}
      <div style={{ padding:'14px 22px 8px', display:'flex', gap:6 }}>
        {Object.entries(tagInfo).map(([k,v],i)=>(
          <div key={k} style={{
            padding:'7px 12px', borderRadius:7, fontSize:12,
            background: i===0?T.ink:'transparent', color: i===0?'#fff':A.text,
            border: i===0?'none':`1px solid ${A.border}`,
            display:'flex', alignItems:'center', gap:6, fontWeight: i===0?700:500,
          }}>
            {i!==0 && <div style={{ width:6, height:6, borderRadius:'50%', background:v.fg }}/>}
            {v.l}<span style={{ opacity:0.7 }}>{v.n}</span>
          </div>
        ))}
      </div>

      {/* cards */}
      <div style={{ padding:'8px 22px 22px', flex:1, overflow:'auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
          {rev.map((r,i)=>{
            const tg = tagInfo[r.tag];
            return (
              <div key={i} style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:11, padding:'14px 16px',
                display:'grid', gridTemplateColumns:'1fr 230px', gap:16 }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:8 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:T.lavenderSoft,
                      color:'#6E5A8C', fontWeight:700, fontSize:13,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>{r.name[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.ink, letterSpacing:'-0.2px' }}>{r.name}</div>
                      <div style={{ fontSize:10.5, color:A.mute, marginTop:1, fontFamily:'monospace' }}>#{r.id} · {r.time}</div>
                    </div>
                    <div style={{ display:'flex', gap:2 }}>
                      {Array.from({length:5}).map((_,k)=>(
                        <Icon key={k} d={Icons.star} size={13} fill={k<r.rating?T.rose:'#EEE'} stroke={k<r.rating?T.rose:'#EEE'}/>
                      ))}
                    </div>
                    <div style={{ padding:'4px 9px', borderRadius:6, background:tg.bg, color:tg.fg,
                      fontSize:10.5, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                      <div style={{ width:5, height:5, borderRadius:'50%', background:tg.fg }}/>{tg.l}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:5, marginBottom:9 }}>
                    <span style={{ fontSize:10.5, padding:'3px 8px', background:T.roseTint, color:T.roseDeep, borderRadius:5, fontWeight:700 }}>{r.tx}</span>
                    <span style={{ fontSize:10.5, padding:'3px 8px', background:A.bg, color:T.text, borderRadius:5, fontWeight:600 }}>{r.cl}</span>
                  </div>

                  <div style={{ fontSize:12.5, color:T.ink2, lineHeight:1.6 }}>{r.body}</div>

                  {r.flag && (
                    <div style={{ marginTop:9, padding:'7px 11px', background:'#FFF1F2',
                      border:`1px solid ${T.roseSoft}`, borderRadius:7,
                      display:'flex', alignItems:'center', gap:7, fontSize:11, color:T.roseDeep }}>
                      <Icon d={Icons.bell} size={12} stroke={T.roseDeep}/> <b>{L('flag')}:</b> {r.flag}
                    </div>
                  )}

                  {/* actions */}
                  <div style={{ marginTop:12, display:'flex', gap:7 }}>
                    <button style={{ ...btnPrimary, background:'#1F7A4D' }}>
                      <Icon d={Icons.check} size={11} stroke="#fff" sw={2.4} style={{ marginRight:5 }}/>{L('approve')}
                    </button>
                    <button style={btnSecondary}>{L('askEdit')}</button>
                    <button style={{ ...btnSecondary, color:'#A04432', borderColor:'#F2D4CE' }}>{L('reject')}</button>
                  </div>
                </div>

                {/* photos column */}
                <div>
                  <div style={{ fontSize:10.5, color:A.mute, fontWeight:700, letterSpacing:'0.3px', marginBottom:6 }}>PHOTOS · {r.photos}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                    {Array.from({length: Math.max(r.photos,1)}).map((_,k)=>(
                      <div key={k} className={r.photos? 'kb-img-ph rose':''} style={{
                        aspectRatio:'1/1', borderRadius:7, position:'relative',
                        background: r.photos ? undefined : '#F4F2EE',
                        border: r.photos ? 'none' : `1px dashed ${A.border}`,
                        display: r.photos ? 'block':'flex', alignItems:'center', justifyContent:'center',
                        color:A.mute, fontSize:10,
                      }}>{!r.photos && '— no photo —'}</div>
                    ))}
                  </div>
                  <div style={{ marginTop:10, padding:'8px 10px',
                    background: r.consent?'#E5F4EC':'#FDE8E4',
                    color: r.consent?'#1F7A4D':'#A04432',
                    borderRadius:7, fontSize:11, fontWeight:600,
                    display:'flex', alignItems:'center', gap:6 }}>
                    <Icon d={r.consent?Icons.check:Icons.x} size={11} stroke={r.consent?'#1F7A4D':'#A04432'} sw={2.5}/>
                    {L('consent')}: {r.consent ? L('given') : '—'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}

// ════════════════════════════════════════════════════════════════════
// 20. MANAGERS · 매니저 / Менеджеры
// ════════════════════════════════════════════════════════════════════
function ScreenAdminManagers() {
  const t = useT();
  const lang = useLang();
  const L = adL(lang, {
    title:   { kz:'Менеджерлер тобы', ru:'Команда менеджеров', kr:'매니저 팀' },
    sub:     { kz:'Рұқсаттар, тілдер және жұмыс жүктемесі', ru:'Доступы, языки и нагрузка', kr:'권한 · 언어 · 처리량' },
    invite:  { kz:'Менеджер шақыру', ru:'Пригласить менеджера', kr:'매니저 초대' },
    cols:    { kz:['Менеджер','Тілдер','Рөл','Жүктеме','SLA','Соңғы белсенділік','Күй'], ru:['Менеджер','Языки','Роль','Нагрузка','SLA','Последняя активность','Статус'], kr:['매니저','언어','권한','담당량','SLA','최근 활동','상태'] },
    online:  { kz:'Онлайн', ru:'Онлайн', kr:'온라인' },
    away:    { kz:'Кеткен', ru:'Отошёл', kr:'자리비움' },
    off:     { kz:'Офлайн', ru:'Офлайн', kr:'오프라인' },
    roleHead:{ kz:'Бас менеджер', ru:'Старший менеджер', kr:'팀장' },
    roleMgr: { kz:'Менеджер', ru:'Менеджер', kr:'매니저' },
    roleSup: { kz:'Қолдау', ru:'Поддержка', kr:'서포트' },
    inv:     { kz:'Шақырылған', ru:'Приглашение', kr:'초대 발송' },
    perm:    { kz:'Рұқсаттар матрицасы', ru:'Матрица прав', kr:'권한 매트릭스' },
    feat:    { kz:'Бөлім', ru:'Раздел', kr:'기능' },
    rView:   { kz:'Көру', ru:'Просмотр', kr:'조회' },
    rEdit:   { kz:'Өңдеу', ru:'Редакт.', kr:'편집' },
    rAdmin:  { kz:'Әкімші', ru:'Админ', kr:'관리자' },
  });
  const A = { bg:'#F7F6F4', border:'#E8E5E0', borderSoft:'#F0EDE8', text:'#5A5A5A', mute:'#9A9A95' };

  const team = [
    { n:'Park M.',    a:'P', col:T.lavender, langs:['RU','KR'],      role:'head', load:9,  sla:'98%', last:'now',  st:'online' },
    { n:'Lee M.',     a:'L', col:'#9CBEA8',  langs:['KR','EN'],      role:'mgr',  load:7,  sla:'96%', last:'2m',   st:'online' },
    { n:'Kim M.',     a:'K', col:T.beige,    langs:['KZ','RU'],      role:'mgr',  load:5,  sla:'94%', last:'18m',  st:'away'   },
    { n:'Choi M.',    a:'C', col:'#E8A0B0',  langs:['KR','EN','RU'], role:'mgr',  load:4,  sla:'99%', last:'1h',   st:'online' },
    { n:'Aizhan A.',  a:'A', col:T.rose,     langs:['KZ','RU'],      role:'sup',  load:2,  sla:'—',   last:'3d',   st:'off'    },
    { n:'Yerkin S.',  a:'Y', col:'#7AA4C8',  langs:['KZ','RU','EN'], role:'sup',  load:0,  sla:'—',   last:'—',    st:'inv'    },
  ];

  const stPill = {
    online:{ bg:'#E5F4EC', fg:'#1F7A4D', l:L('online') },
    away:  { bg:'#FFF5E1', fg:'#A07012', l:L('away')   },
    off:   { bg:'#F0EDE8', fg:'#5A5A5A', l:L('off')    },
    inv:   { bg:'#EAE4F5', fg:'#5E4B82', l:L('inv')    },
  };
  const rolePill = {
    head:{ bg:'#FFF1F2', fg:T.roseDeep, l:L('roleHead') },
    mgr: { bg:'#EAE4F5', fg:'#5E4B82',  l:L('roleMgr')  },
    sup: { bg:'#F5EFE6', fg:'#7A6A4A',  l:L('roleSup')  },
  };

  const permFeatures = [
    { l: lang==='kz'?'Кеңес сұраулары':lang==='ru'?'Заявки':'상담 신청', head:'admin', mgr:'edit', sup:'view' },
    { l: lang==='kz'?'Клиенттер':lang==='ru'?'Клиенты':'고객 관리',       head:'admin', mgr:'edit', sup:'view' },
    { l: lang==='kz'?'Клиникалар':lang==='ru'?'Клиники':'클리닉 관리',     head:'admin', mgr:'view', sup:'view' },
    { l: lang==='kz'?'Хабарлама үлгілері':lang==='ru'?'Шаблоны':'알림 템플릿', head:'admin', mgr:'edit', sup:'—' },
    { l: lang==='kz'?'Автоматтандыру':lang==='ru'?'Автоматизация':'자동화',  head:'admin', mgr:'view', sup:'—' },
    { l: lang==='kz'?'Пікір модерациясы':lang==='ru'?'Модерация отзывов':'후기 검수', head:'admin', mgr:'edit', sup:'edit' },
  ];

  const permLabel = { admin:L('rAdmin'), edit:L('rEdit'), view:L('rView'), '—':'—' };
  const permColor = { admin:T.roseDeep, edit:'#1F7A4D', view:T.text, '—':'#C4BFB8' };

  return (
    <AdminShell active="dash">
      <div style={{
        padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
        background:'#fff', display:'flex', alignItems:'center', gap:14,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{L('title')}</div>
          <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{L('sub')}</div>
        </div>
        <div style={{ flex:1 }}/>
        <button style={btnPrimary}>
          <Icon d={Icons.plus} size={11} stroke="#fff" sw={2.4} style={{ marginRight:5 }}/>{L('invite')}
        </button>
      </div>

      <div style={{ flex:1, overflow:'auto', padding:'18px 22px', display:'grid',
        gridTemplateColumns:'1.4fr 1fr', gap:16 }}>
        {/* TEAM TABLE */}
        <div style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{
            display:'grid',
            gridTemplateColumns:'1.6fr 0.9fr 0.9fr 0.6fr 0.5fr 0.7fr 0.8fr',
            padding:'10px 14px', background:'#FBFAF7', borderBottom:`1px solid ${A.border}`,
            fontSize:10.5, color:A.mute, fontWeight:600, letterSpacing:'0.3px', gap:6, alignItems:'center',
          }}>
            {L('cols').map((c,i)=><div key={i}>{c}</div>)}
          </div>
          {team.map((m,i)=>{
            const sp = stPill[m.st];
            const rp = rolePill[m.role];
            return (
              <div key={i} style={{
                display:'grid',
                gridTemplateColumns:'1.6fr 0.9fr 0.9fr 0.6fr 0.5fr 0.7fr 0.8fr',
                padding:'12px 14px', alignItems:'center', gap:6,
                borderBottom: i<team.length-1?`1px solid ${A.borderSoft}`:'none',
                background: i%2===0?'#fff':'#FDFCFA', fontSize:12,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <div style={{ position:'relative', width:32, height:32 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:m.col, color:'#fff',
                      display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13 }}>{m.a}</div>
                    {m.st!=='inv' && (
                      <div style={{ position:'absolute', right:-1, bottom:-1, width:10, height:10, borderRadius:'50%',
                        background: m.st==='online'?'#1F7A4D':m.st==='away'?'#D08A2C':'#C4BFB8', border:'2px solid #fff' }}/>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, color:T.ink, letterSpacing:'-0.2px' }}>{m.n}</div>
                    <div style={{ fontSize:10, color:A.mute, marginTop:2 }}>{m.n.replace(/ M\.|\./,'').toLowerCase()}@kbeauty.kz</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {m.langs.map((l,k)=>(
                    <span key={k} style={{ padding:'3px 7px', background:A.bg, borderRadius:5, fontSize:10, fontWeight:700, color:A.text }}>{l}</span>
                  ))}
                </div>
                <div>
                  <span style={{ padding:'3px 8px', borderRadius:5, background:rp.bg, color:rp.fg, fontSize:10.5, fontWeight:700 }}>{rp.l}</span>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:T.ink2 }}>{m.load}</div>
                <div style={{ fontSize:11.5, color:A.text, fontWeight:600 }}>{m.sla}</div>
                <div style={{ fontSize:11, color:A.mute }}>{m.last}</div>
                <div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 8px', borderRadius:5,
                    background:sp.bg, color:sp.fg, fontSize:10.5, fontWeight:700 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:sp.fg }}/>{sp.l}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* PERMISSIONS MATRIX */}
        <div style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:12, padding:'14px 16px',
          display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:11, color:A.mute, fontWeight:700, letterSpacing:'0.3px', marginBottom:12 }}>{L('perm').toUpperCase()}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1.4fr 0.8fr 0.8fr 0.8fr', gap:6, marginBottom:8,
            fontSize:10, color:A.mute, fontWeight:700, letterSpacing:'0.3px',
            paddingBottom:7, borderBottom:`1px solid ${A.border}`,
          }}>
            <div>{L('feat').toUpperCase()}</div>
            <div style={{ textAlign:'center' }}>{rolePill.head.l}</div>
            <div style={{ textAlign:'center' }}>{rolePill.mgr.l}</div>
            <div style={{ textAlign:'center' }}>{rolePill.sup.l}</div>
          </div>
          {permFeatures.map((f,i)=>(
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1.4fr 0.8fr 0.8fr 0.8fr', gap:6,
              padding:'9px 0', borderBottom: i<permFeatures.length-1?`1px solid ${A.borderSoft}`:'none',
              fontSize:12, alignItems:'center' }}>
              <div style={{ color:T.ink2, fontWeight:500 }}>{f.l}</div>
              {[f.head, f.mgr, f.sup].map((p,k)=>(
                <div key={k} style={{ textAlign:'center' }}>
                  <span style={{ fontSize:11, fontWeight:700, color:permColor[p] }}>{permLabel[p]}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ flex:1 }}/>
          <div style={{ marginTop:12, padding:'9px 12px', background:A.bg, borderRadius:8,
            fontSize:11, color:A.text, lineHeight:1.5 }}>
            {{ kz:'Әкімші — толық рұқсат · Менеджер — өңдеу · Қолдау — көру/жауап беру',
               ru:'Админ — полный доступ · Менеджер — редактирование · Поддержка — просмотр/ответ',
               kr:'관리자 — 전체 권한 · 매니저 — 편집 · 서포트 — 조회/응답' }[lang]}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

Object.assign(window, {
  ScreenAdminDashboard, ScreenAdminCustomers, ScreenAdminClinics,
  ScreenAdminReviews, ScreenAdminManagers, Panel, Metric,
});
