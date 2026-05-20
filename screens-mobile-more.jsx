// Mobile screens (additional): Notifications · Manager chat · Search results · Settings.
// Tri-lingual via inline L() helper.

const mL = (lang, dict) => (key) => (dict[key] && dict[key][lang]) || dict[key]?.kz || key;

// ════════════════════════════════════════════════════════════════════
// 21. NOTIFICATIONS INBOX (mobile)
// ════════════════════════════════════════════════════════════════════
function ScreenNotifications() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();
  const [tab, setTab] = React.useState('all');
  const L = mL(lang, {
    title:   { kz:'Хабарландырулар', ru:'Уведомления', kr:'알림함' },
    all:     { kz:'Барлығы', ru:'Все', kr:'전체' },
    consult: { kz:'Кеңес', ru:'Заявки', kr:'상담' },
    review:  { kz:'Пікір', ru:'Отзывы', kr:'후기' },
    promo:   { kz:'Жаңалық', ru:'Новости', kr:'소식' },
    today:   { kz:'Бүгін', ru:'Сегодня', kr:'오늘' },
    earlier: { kz:'Бұрын', ru:'Ранее', kr:'이전 알림' },
    markAll: { kz:'Барлығын оқылды деп белгілеу', ru:'Отметить всё прочитанным', kr:'모두 읽음 표시' },
    settings:{ kz:'Параметрлер', ru:'Настройки', kr:'설정' },
  });

  const notifs = [
    { k:'consult', new:true, when:'5m',
      tt: lang==='kz'?'Park M. сізге сай клиника таңдады':lang==='ru'?'Park M. подобрал клинику':'Park M.님이 클리닉을 추천했어요',
      body: lang==='kz'?'Lienne Clinic — Сеул Каннам. Аударма дайын.':lang==='ru'?'Lienne Clinic — Сеул, Каннам. Перевод готов.':'Lienne Clinic — 서울 강남. 통역 준비 완료.',
      avatar:'P', color:T.lavender, group:'today' },
    { k:'consult', new:true, when:'1h',
      tt: lang==='kz'?'Кеңес расталды':lang==='ru'?'Консультация подтверждена':'상담 일정이 확정되었어요',
      body: lang==='kz'?'15 маусым 14:00 · Бейне қоңырау':lang==='ru'?'15 июня 14:00 · видеозвонок':'6월 15일 14:00 · 영상통화',
      icon:Icons.calendar, color:T.rose, group:'today' },
    { k:'promo', new:true, when:'3h',
      tt: lang==='kz'?'Жаңа: Кореяда кеңес жоспары':lang==='ru'?'Новое: маршрут поездки в Корею':'신규: 한국 방문 일정 안내',
      body: lang==='kz'?'Әуежай қарсы алу + қонақ үй жоспары қосылды':lang==='ru'?'Добавлен пакет встречи в аэропорту + отель':'공항 픽업과 호텔 패키지가 추가되었어요',
      icon:Icons.plane, color:T.beige, group:'today' },
    { k:'review', new:false, when:'어제',
      tt: lang==='kz'?'Пікір қалдырыңыз':lang==='ru'?'Оставьте отзыв':'후기를 남겨주세요',
      body: lang==='kz'?'Almaty Skin Lab процедурасынан 2 апта өтті':lang==='ru'?'Прошло 2 недели после процедуры в Almaty Skin Lab':'Almaty Skin Lab 시술 후 2주 경과',
      icon:Icons.star, color:'#A07012', group:'earlier' },
    { k:'consult', new:false, when:'2d',
      tt: lang==='kz'?'Lee M. жауап берді':lang==='ru'?'Lee M. ответила':'Lee M.님이 답장했어요',
      body: lang==='kz'?'«Қайта тексеру нәтижелерін жібердім, қараңыз»':lang==='ru'?'«Отправила результаты повторного осмотра, посмотрите»':'"재검 결과 보내드렸어요, 확인 부탁드려요"',
      avatar:'L', color:'#9CBEA8', group:'earlier' },
    { k:'promo', new:false, when:'4d',
      tt: lang==='kz'?'Жаңа клиника серіктестікке қосылды':lang==='ru'?'Новая клиника присоединилась':'새 클리닉이 합류했어요',
      body: 'Centum Dermatology · 청담', icon:Icons.hospital, color:T.lavender, group:'earlier' },
    { k:'review', new:false, when:'1w',
      tt: lang==='kz'?'Пікіріңіз модерациядан өтті':lang==='ru'?'Ваш отзыв опубликован':'후기가 게시되었어요',
      body: lang==='kz'?'Lienne Clinic — 4.9 ★':lang==='ru'?'Lienne Clinic — 4.9 ★':'Lienne Clinic — 4.9 ★',
      icon:Icons.checkBadge, color:'#1F7A4D', group:'earlier' },
  ];

  const filtered = tab==='all' ? notifs : notifs.filter(n=>n.k===tab);
  const groups = [
    { id:'today',   l:L('today'),   items: filtered.filter(n=>n.group==='today') },
    { id:'earlier', l:L('earlier'), items: filtered.filter(n=>n.group==='earlier') },
  ];

  return (
    <div className="kb-screen" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:'#fff' }}>
      <TopBar back title={L('title')} sub={notifs.filter(n=>n.new).length>0 ? `${notifs.filter(n=>n.new).length} ${lang==='kz'?'жаңа':lang==='ru'?'новых':'개의 신규 알림'}` : null}
        right={<Icon d={Icons.x} size={22} stroke={T.ink} onClick={()=>nav.back && nav.back()}/>}/>

      {/* segment tabs */}
      <div className="kb-scroll" style={{ display:'flex', gap:6, padding:'6px 16px 8px', overflowX:'auto', borderBottom:`1px solid ${T.borderSoft}` }}>
        {[
          { id:'all',     l:L('all') },
          { id:'consult', l:L('consult') },
          { id:'review',  l:L('review') },
          { id:'promo',   l:L('promo') },
        ].map(s=>{
          const on = s.id===tab;
          return (
            <button key={s.id} onClick={()=>setTab(s.id)} className="kb-press"
              style={{
                padding:'7px 14px', borderRadius:999, border:'none',
                background: on?T.ink:T.bgSoft, color: on?'#fff':T.text,
                fontSize:12, fontWeight: on?700:500, whiteSpace:'nowrap',
              }}>{s.l}</button>
          );
        })}
      </div>

      <div className="kb-scroll" style={{ flex:1, overflow:'auto', padding:'4px 0 80px' }}>
        {groups.map(g => g.items.length>0 && (
          <div key={g.id}>
            <div style={{ padding:'14px 18px 6px', fontSize:11, color:T.textMute, fontWeight:700, letterSpacing:'0.5px' }}>
              {g.l.toUpperCase()}
            </div>
            {g.items.map((n,i)=>(
              <div key={i} style={{
                padding:'12px 16px', display:'flex', gap:11, alignItems:'flex-start',
                background: n.new ? T.roseTint : 'transparent',
                position:'relative',
              }}>
                {n.new && <div style={{ position:'absolute', left:6, top:'50%', width:5, height:5, borderRadius:'50%', background:T.rose, transform:'translateY(-50%)' }}/>}
                <div style={{ width:38, height:38, borderRadius:'50%', background:n.color, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontWeight:700, fontSize:14 }}>
                  {n.avatar ? n.avatar : <Icon d={n.icon} size={18} stroke="#fff" sw={2}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                    <div style={{ fontSize:13.5, fontWeight: n.new?700:600, color:T.ink, letterSpacing:'-0.2px', flex:1 }}>{n.tt}</div>
                    <div style={{ fontSize:10.5, color:T.textMute, flexShrink:0 }}>{n.when}</div>
                  </div>
                  <div style={{ fontSize:12.5, color:T.text, marginTop:3, lineHeight:1.45 }}>{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {filtered.length===0 && (
          <div style={{ padding:'80px 30px', textAlign:'center', color:T.textMute }}>
            <Icon d={Icons.bell} size={32} stroke={T.textMute} sw={1.4}/>
            <div style={{ fontSize:13, marginTop:10 }}>
              {lang==='kz'?'Хабарландыру жоқ':lang==='ru'?'Нет уведомлений':'알림이 없습니다'}
            </div>
          </div>
        )}

        <div style={{ padding:'24px 18px 0' }}>
          <div style={{ padding:'12px 14px', background:T.bgSoft, borderRadius:10,
            display:'flex', alignItems:'center', gap:10 }}>
            <Icon d={Icons.bell} size={14} stroke={T.text}/>
            <div style={{ flex:1, fontSize:12, color:T.text }}>{L('settings')}: Push · Email · In-app</div>
            <Icon d={Icons.chevR} size={14} stroke={T.textMute}/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 22. CHAT WITH MANAGER (in-app)
// ════════════════════════════════════════════════════════════════════
function ScreenChat() {
  const t = useT();
  const lang = useLang();
  const nav = useNav();
  const L = mL(lang, {
    role:    { kz:'Сіздің менеджеріңіз', ru:'Ваш менеджер', kr:'담당 매니저' },
    typing:  { kz:'жазып жатыр…', ru:'печатает…', kr:'입력 중…' },
    today:   { kz:'Бүгін', ru:'Сегодня', kr:'오늘' },
    inputPh: { kz:'Хабарлама жазу…', ru:'Написать сообщение…', kr:'메시지를 입력하세요…' },
    quick:   { kz:'Жылдам сұрау', ru:'Быстрый вопрос', kr:'빠른 질문' },
    hours:   { kz:'10:00–19:00 (Astana, GMT+5) · KZ·RU·KR', ru:'10:00–19:00 (Астана, GMT+5) · KZ·RU·KR', kr:'10:00–19:00 (아스타나, GMT+5) · KZ·RU·KR' },
  });

  const quickQ = lang==='kz' ? ['Күнге қарай қалпына келу?', 'Сапар жоспары?', 'Аударма құны?']
                 : lang==='ru' ? ['Сколько восстановление?', 'План поездки?', 'Стоимость перевода?']
                 : ['회복 기간은요?', '방문 일정 안내', '통역 비용은요?'];

  const msgs = [
    { who:'mgr', text: lang==='kz'?'Сәлеметсіз бе, Айгерім! Park M., K-Beauty Сana менеджеріңізбін 🌸':lang==='ru'?'Здравствуйте, Айгерим! Я Park M., ваш менеджер K-Beauty Сana 🌸':'안녕하세요 아이게림님, K-Beauty Сana 담당 매니저 Park M.입니다 🌸', t:'09:14' },
    { who:'mgr', text: lang==='kz'?'Ulthera лифтинг бойынша сұрауыңыз қабылданды. Lienne Clinic-те сізге сай уақыт іздестіріп жатырмыз.':lang==='ru'?'Ваша заявка на Ulthera-лифтинг принята. Подбираем удобное время в Lienne Clinic.':'울쎄라 리프팅 상담 신청이 접수되었어요. Lienne Clinic 일정 확인 중이에요.', t:'09:14' },
    { who:'me',  text: lang==='kz'?'Рахмет! Маусымға баруды жоспарлаймын, аударма керек.':lang==='ru'?'Спасибо! Планирую в июне, нужен переводчик.':'감사합니다! 6월에 방문 예정이고 통역이 필요해요.', t:'09:17' },
    { who:'mgr', text: lang==='kz'?'Жақсы, орыс тілді аударма дайындаймын. Кері күтім нұсқаулығын да KZ тілінде жіберемін.':lang==='ru'?'Хорошо, подготовлю русскоязычного переводчика. Инструкцию по уходу пришлю на KZ.':'네, 러시아어 통역 준비할게요. 사후 관리 안내는 카자흐어로 보내드릴게요.', t:'09:18' },
    { who:'mgr', kind:'card', t:'09:19' },
    { who:'me',  text: lang==='kz'?'Тамаша, келісемін':lang==='ru'?'Отлично, согласна':'좋아요, 부탁드려요', t:'09:21' },
    { who:'mgr', text: lang==='kz'?'15 маусым 14:00-ге жоспардым. Расталу хабарламасы келеді.':lang==='ru'?'Записала на 15 июня 14:00. Подтверждение придёт сообщением.':'6월 15일 14시로 잡았습니다. 확정 메시지로 보내드릴게요.', t:'09:22' },
  ];

  return (
    <div className="kb-screen" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:T.bgWarm }}>
      <div style={{
        background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${T.borderSoft}`, padding:'10px 14px',
        display:'flex', alignItems:'center', gap:10,
      }}>
        <button className="kb-press" onClick={()=>nav.back && nav.back()}
          style={{ background:'none', border:'none', padding:4 }}>
          <Icon d={Icons.chevL} size={22} stroke={T.ink}/>
        </button>
        <div style={{ position:'relative', width:38, height:38 }}>
          <div style={{ width:38, height:38, borderRadius:'50%', background:T.lavender, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15 }}>P</div>
          <div style={{ position:'absolute', right:-1, bottom:-1, width:11, height:11, borderRadius:'50%',
            background:'#1F7A4D', border:'2px solid #fff' }}/>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:700, letterSpacing:'-0.2px', display:'flex', alignItems:'center', gap:6 }}>
            Park M.
            <Icon d={Icons.checkBadge} size={13} stroke={T.roseDeep} sw={2}/>
          </div>
          <div style={{ fontSize:10.5, color:T.textMute, marginTop:1 }}>{L('role')} · RU · KR</div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:T.rose,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={Icons.phone} size={15} stroke="#fff" sw={2}/>
          </div>
          <div style={{ width:32, height:32, borderRadius:8, background:T.lavender,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={Icons.mail} size={15} stroke="#fff" sw={2}/>
          </div>
        </div>
      </div>

      {/* hours banner */}
      <div style={{ padding:'8px 14px', background:T.roseTint,
        fontSize:10.5, color:T.roseDeep, fontWeight:600, textAlign:'center',
        borderBottom:`1px solid ${T.borderSoft}` }}>
        <Icon d={Icons.clock} size={11} stroke={T.roseDeep} style={{ verticalAlign:'-1px', marginRight:5 }}/>
        {L('hours')}
      </div>

      {/* messages */}
      <div className="kb-scroll" style={{ flex:1, overflow:'auto', padding:'14px 12px 14px', display:'flex', flexDirection:'column', gap:7 }}>
        <div style={{ alignSelf:'center', fontSize:10, color:T.textMute, fontWeight:700,
          padding:'3px 10px', background:'rgba(255,255,255,0.5)', borderRadius:999, marginBottom:4 }}>
          {L('today')}
        </div>
        {msgs.map((m,i)=>{
          const isMe = m.who==='me';
          if (m.kind==='card') {
            return (
              <div key={i} style={{ alignSelf:'flex-start', maxWidth:'82%', display:'flex', gap:7 }}>
                <div style={{ width:24, alignSelf:'flex-end' }}/>
                <div style={{ background:'#fff', border:`1px solid ${T.border}`, borderRadius:'4px 14px 14px 14px',
                  padding:11, width:'100%' }}>
                  <div className="kb-img-ph rose" style={{ height:80, borderRadius:9 }}/>
                  <div style={{ marginTop:9 }}>
                    <div style={{ fontSize:13, fontWeight:700, letterSpacing:'-0.2px' }}>Lienne Clinic</div>
                    <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>Seoul · Gangnam · Ulthera Premium</div>
                    <div style={{ display:'flex', gap:4, marginTop:7 }}>
                      <Badge tone="korea">🇰🇷 Корея</Badge>
                      <Badge tone="lav">RU 통역</Badge>
                    </div>
                    <div style={{ marginTop:10, padding:'9px 11px', background:T.roseTint,
                      color:T.roseDeep, borderRadius:8, fontSize:11.5, fontWeight:600, textAlign:'center' }}>
                      {lang==='kz'?'Толық қарау':lang==='ru'?'Подробнее':'자세히 보기'}
                    </div>
                  </div>
                  <div style={{ fontSize:9.5, color:T.textMute, marginTop:5, textAlign:'right' }}>{m.t}</div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth:'82%', display:'flex', flexDirection: isMe?'row-reverse':'row', gap:7,
              alignItems:'flex-end',
            }}>
              {!isMe && (
                <div style={{ width:24, height:24, borderRadius:'50%', background:T.lavender,
                  display: i>0 && msgs[i-1].who==='mgr' ? 'none' : 'flex',
                  alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:10 }}>P</div>
              )}
              {!isMe && i>0 && msgs[i-1].who==='mgr' && <div style={{ width:24 }}/>}
              <div style={{
                background: isMe ? T.rose : '#fff',
                color: isMe ? '#fff' : T.ink2,
                padding:'9px 13px',
                borderRadius: isMe ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                border: isMe ? 'none' : `1px solid ${T.border}`,
                fontSize:13, lineHeight:1.45, letterSpacing:'-0.2px',
                position:'relative',
              }}>
                {m.text}
                <div style={{ fontSize:9.5, color: isMe?'rgba(255,255,255,0.75)':T.textMute,
                  marginTop:4, textAlign: isMe?'right':'left' }}>
                  {m.t}{isMe && <span style={{ marginLeft:4 }}>✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}

        {/* typing indicator */}
        <div style={{ alignSelf:'flex-start', display:'flex', gap:7, alignItems:'flex-end', marginTop:2 }}>
          <div style={{ width:24, height:24, borderRadius:'50%', background:T.lavender, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10 }}>P</div>
          <div style={{ background:'#fff', border:`1px solid ${T.border}`,
            padding:'9px 13px', borderRadius:'4px 14px 14px 14px', display:'flex', gap:4 }}>
            {[0,1,2].map(i=>(
              <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:T.textMute, opacity:0.4 + i*0.2 }}/>
            ))}
          </div>
        </div>
      </div>

      {/* quick chips */}
      <div style={{ padding:'8px 12px 0', display:'flex', gap:6, overflowX:'auto' }} className="kb-scroll">
        {quickQ.map((q,i)=>(
          <div key={i} style={{ padding:'7px 12px', background:'#fff', border:`1px solid ${T.border}`,
            borderRadius:999, fontSize:11.5, color:T.ink2, fontWeight:600, whiteSpace:'nowrap', flexShrink:0 }}>
            {q}
          </div>
        ))}
      </div>

      {/* input */}
      <div style={{ padding:'10px 12px 22px', display:'flex', gap:8, alignItems:'flex-end' }}>
        <div style={{ width:36, height:36, borderRadius:18, background:T.bgSoft,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon d={Icons.plus} size={18} stroke={T.ink2} sw={2}/>
        </div>
        <div style={{ flex:1, background:'#fff', border:`1px solid ${T.border}`, borderRadius:20,
          padding:'9px 14px', fontSize:13, color:T.textMute,
          display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ flex:1 }}>{L('inputPh')}</div>
          <Icon d={Icons.camera} size={17} stroke={T.text}/>
        </div>
        <div style={{ width:38, height:38, borderRadius:19, background:T.rose,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 3px 10px rgba(232,96,122,0.32)', flexShrink:0 }}>
          <Icon d={Icons.send} size={18} stroke="#fff" sw={2.2}/>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 23. SEARCH RESULTS (mobile)
// ════════════════════════════════════════════════════════════════════
function ScreenSearch() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();
  const [q, setQ] = React.useState('лифтинг');
  const [tab, setTab] = React.useState('all');
  const L = mL(lang, {
    placeholder:{ kz:'Процедура, клиника немесе мәселе', ru:'Процедура, клиника или проблема', kr:'시술 · 클리닉 · 고민 검색' },
    recent:    { kz:'Соңғы іздеулер', ru:'Недавние поиски', kr:'최근 검색어' },
    suggestT:  { kz:'Танымал ұсыныстар', ru:'Популярные запросы', kr:'인기 검색어' },
    clear:     { kz:'Тазарту', ru:'Очистить', kr:'지우기' },
    all:       { kz:'Барлығы', ru:'Все', kr:'전체' },
    tx:        { kz:'Процедура', ru:'Процедура', kr:'시술' },
    cl:        { kz:'Клиника', ru:'Клиника', kr:'클리닉' },
    rv:        { kz:'Пікір', ru:'Отзыв', kr:'후기' },
    results:   { kz:'нәтиже табылды', ru:'найдено', kr:'개의 결과' },
    noRes:     { kz:'Нәтиже жоқ', ru:'Ничего не найдено', kr:'결과가 없습니다' },
  });

  const recent = lang==='kz' ? ['Ulthera лифтинг', 'Lienne Clinic', 'Кореяға сапар', 'Безеу тыртығы']
               : lang==='ru' ? ['Ulthera лифтинг', 'Lienne Clinic', 'Поездка в Корею', 'Шрамы от акне']
               : ['울쎄라 리프팅', 'Lienne Clinic', '한국 방문', '여드름 흉터'];

  const trending = lang==='kz' ? ['Inmode', 'Алматы скин', 'Каннам', 'Филлер', 'Бот ботокс']
                 : lang==='ru' ? ['Inmode', 'Almaty skin', 'Каннам', 'Филлер', 'Ботокс']
                 : ['인모드', '알마티 스킨', '강남', '필러', '보톡스'];

  const results = {
    tx: [
      { name:'Ulthera Premium лифтинг', sub:`${t.cat.names.lift} · 30–60 ${lang==='kr'?'분':'мин'}`, badge:'🇰🇷', tx:true },
      { name:'Inmode lifting',          sub:`${t.cat.names.lift} · 45 ${lang==='kr'?'분':'мин'}`,    badge:'🇰🇿', tx:true },
      { name:'Thermage FLX',            sub:`${t.cat.names.lift} · 50–70 ${lang==='kr'?'분':'мин'}`, badge:'🇰🇷', tx:true },
    ],
    cl: [
      { name:'Lienne Clinic',      sub:'Seoul · Gangnam', tag:lang==='kz'?'Корея':lang==='ru'?'Корея':'한국', cl:true, rat:4.9 },
      { name:'Centum Dermatology', sub:'Seoul · Cheongdam', tag:lang==='kz'?'Корея':lang==='ru'?'Корея':'한국', cl:true, rat:4.8 },
      { name:'Almaty Skin Lab',    sub:t.locName.almaty, tag:lang==='kz'?'Жергілікті':lang==='ru'?'Локально':'카자흐스탄', cl:true, rat:4.7 },
    ],
    rv: [
      { who:'Aigerim B.', sub: lang==='kz'?'«2 апта өтті, ісік жоқ. Бет контуры табиғи»':lang==='ru'?'«Прошло 2 недели, отёка нет. Контур натуральный»':'"2주 지났는데 붓기 없어요. 윤곽이 자연스러워요"', rat:5, rv:true },
      { who:'Zarina B.',  sub: lang==='kz'?'«Аударма жақсы, ыңғайлы кеңес. 4 апта күтім сезіледі»':lang==='ru'?'«Перевод отличный, удобно. Уход 4 недели чувствуется»':'"통역 좋고 편안했어요. 4주 케어가 느껴져요"', rat:5, rv:true },
    ],
  };

  const merged = [
    ...results.tx.map(x => ({ ...x, kind:'tx' })),
    ...results.cl.map(x => ({ ...x, kind:'cl' })),
    ...results.rv.map(x => ({ ...x, kind:'rv' })),
  ];
  const filtered = tab==='all' ? merged : merged.filter(x => x.kind===tab);

  return (
    <div className="kb-screen" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:'#fff' }}>
      {/* search header */}
      <div style={{
        position:'sticky', top:0, zIndex:4,
        background:'rgba(255,255,255,0.95)', backdropFilter:'blur(12px)',
        borderBottom:`1px solid ${T.borderSoft}`,
        padding:'10px 14px', display:'flex', alignItems:'center', gap:9,
      }}>
        <button className="kb-press" onClick={()=>nav.back && nav.back()}
          style={{ background:'none', border:'none', padding:4 }}>
          <Icon d={Icons.chevL} size={22} stroke={T.ink}/>
        </button>
        <div style={{ flex:1, background:T.bgSoft, borderRadius:12, padding:'9px 14px',
          display:'flex', alignItems:'center', gap:9 }}>
          <Icon d={Icons.search} size={16} stroke={T.text}/>
          <div style={{ flex:1, fontSize:14, color: q?T.ink:T.textMute, fontWeight:500 }}>
            {q || L('placeholder')}
          </div>
          {q && <Icon d={Icons.x} size={16} stroke={T.textMute} onClick={()=>setQ('')}/>}
        </div>
      </div>

      {!q ? (
        // EMPTY STATE: recent + trending
        <div className="kb-scroll" style={{ flex:1, overflow:'auto', padding:'14px 16px 80px' }}>
          <SectionLabel l={L('recent')} right={<span style={{ fontSize:11, color:T.roseDeep, fontWeight:600 }}>{L('clear')}</span>}/>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {recent.map((r,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 0',
                borderBottom: i<recent.length-1?`1px solid ${T.borderSoft}`:'none' }}>
                <Icon d={Icons.clock} size={15} stroke={T.textMute} sw={1.6}/>
                <div style={{ flex:1, fontSize:13.5, color:T.ink2 }} onClick={()=>setQ(r)}>{r}</div>
                <Icon d={Icons.arrow} size={15} stroke={T.textMute} sw={1.6} style={{ transform:'rotate(-45deg)' }}/>
              </div>
            ))}
          </div>

          <div style={{ height:22 }}/>
          <SectionLabel l={L('suggestT')}/>
          <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
            {trending.map((tr,i)=>(
              <div key={i} onClick={()=>setQ(tr)} className="kb-press"
                style={{ padding:'8px 13px', borderRadius:999, background:T.bgSoft,
                  fontSize:12.5, color:T.ink2, fontWeight:600 }}>
                <span style={{ color:T.roseDeep, marginRight:5 }}>↑</span>{tr}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* tabs */}
          <div className="kb-scroll" style={{ display:'flex', gap:6, padding:'8px 16px 8px', overflowX:'auto', borderBottom:`1px solid ${T.borderSoft}` }}>
            {[
              { id:'all', l:L('all'), n: merged.length },
              { id:'tx',  l:L('tx'),  n: results.tx.length },
              { id:'cl',  l:L('cl'),  n: results.cl.length },
              { id:'rv',  l:L('rv'),  n: results.rv.length },
            ].map(s=>{
              const on = s.id===tab;
              return (
                <button key={s.id} onClick={()=>setTab(s.id)} className="kb-press"
                  style={{ padding:'7px 14px', borderRadius:999, border:'none',
                    background: on?T.ink:T.bgSoft, color: on?'#fff':T.text,
                    fontSize:12, fontWeight: on?700:500, whiteSpace:'nowrap', display:'flex', gap:5 }}>
                  {s.l}<span style={{ opacity:0.7 }}>{s.n}</span>
                </button>
              );
            })}
          </div>

          <div className="kb-scroll" style={{ flex:1, overflow:'auto', padding:'10px 16px 80px' }}>
            <div style={{ fontSize:11, color:T.textMute, fontWeight:600, marginBottom:9, letterSpacing:'0.3px' }}>
              «{q}» · {filtered.length} {L('results')}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map((r,i)=>{
                if (r.kind==='tx') return (
                  <div key={i} className="kb-card" style={{ padding:11, display:'flex', gap:11, alignItems:'center' }}>
                    <div className="kb-img-ph rose" style={{ width:54, height:54, borderRadius:10, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, letterSpacing:'-0.2px', color:T.ink }}>
                        <HL text={r.name} q={q}/>
                      </div>
                      <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>{r.sub}</div>
                    </div>
                    <Badge tone="korea">{r.badge}</Badge>
                  </div>
                );
                if (r.kind==='cl') return (
                  <div key={i} className="kb-card" style={{ padding:11, display:'flex', gap:11, alignItems:'center' }}>
                    <div className="kb-img-ph lav" style={{ width:54, height:54, borderRadius:10, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ fontSize:13, fontWeight:700, letterSpacing:'-0.2px', color:T.ink }}>
                          <HL text={r.name} q={q}/>
                        </div>
                        <Icon d={Icons.checkBadge} size={12} stroke={T.roseDeep}/>
                      </div>
                      <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>{r.sub}</div>
                      <Badge tone="lav">{r.tag}</Badge>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                      <Icon d={Icons.star} size={11} fill={T.rose} stroke={T.rose}/>
                      <span style={{ fontSize:11.5, fontWeight:700 }}>{r.rat}</span>
                    </div>
                  </div>
                );
                if (r.kind==='rv') return (
                  <div key={i} className="kb-card" style={{ padding:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <div style={{ width:24, height:24, borderRadius:'50%', background:T.lavender, color:'#fff',
                        display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:10 }}>{r.who[0]}</div>
                      <div style={{ flex:1, fontSize:12, fontWeight:700, color:T.ink2 }}>{r.who}</div>
                      <div style={{ display:'flex', gap:1 }}>
                        {Array.from({length:5}).map((_,k)=>(
                          <Icon key={k} d={Icons.star} size={11} fill={k<r.rat?T.rose:'#EEE'} stroke={k<r.rat?T.rose:'#EEE'}/>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize:12.5, color:T.ink2, lineHeight:1.5 }}>
                      <HL text={r.sub} q={q}/>
                    </div>
                  </div>
                );
                return null;
              })}
              {filtered.length===0 && (
                <div style={{ padding:'70px 20px', textAlign:'center' }}>
                  <Icon d={Icons.search} size={32} stroke={T.textMute} sw={1.4}/>
                  <div style={{ fontSize:13.5, color:T.textMute, marginTop:9 }}>{L('noRes')}</div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SectionLabel({ l, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
      <div style={{ fontSize:11, color:T.textMute, fontWeight:700, letterSpacing:'0.5px' }}>{l.toUpperCase()}</div>
      {right}
    </div>
  );
}

function HL({ text, q }) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0,i)}
      <span style={{ background:T.roseTint, color:T.roseDeep, padding:'0 2px', borderRadius:3 }}>{text.slice(i, i+q.length)}</span>
      {text.slice(i+q.length)}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// 24. SETTINGS (mobile)
// ════════════════════════════════════════════════════════════════════
function ScreenSettings() {
  const t = useT();
  const lang = useLang();
  const nav = useNav();
  const [notif, setNotif] = React.useState({ inapp:true, push:true, email:true });

  const L = mL(lang, {
    title:    { kz:'Параметрлер', ru:'Настройки', kr:'설정' },
    lang:     { kz:'Тіл', ru:'Язык', kr:'언어' },
    langSub:  { kz:'Қолданба тілін таңдаңыз', ru:'Выберите язык интерфейса', kr:'앱 인터페이스 언어' },
    profileT: { kz:'Жеке деректер', ru:'Личные данные', kr:'개인정보' },
    nameL:    { kz:'Аты-жөні', ru:'Имя', kr:'이름' },
    phoneL:   { kz:'Телефон', ru:'Телефон', kr:'전화번호' },
    emailL:   { kz:'Email', ru:'Email', kr:'이메일' },
    edit:     { kz:'Өңдеу', ru:'Изменить', kr:'편집' },
    notifT:   { kz:'Хабарландырулар', ru:'Уведомления', kr:'알림 설정' },
    inappCh:  { kz:'Қосымша ішіндегі хабарлама', ru:'Сообщения в приложении', kr:'앱 내 알림' },
    pushCh:   { kz:'Push хабарландыру', ru:'Push-уведомления', kr:'Push 알림' },
    emailCh:  { kz:'Email', ru:'Email', kr:'이메일' },
    privT:    { kz:'Жеке өмір', ru:'Приватность', kr:'개인정보 보호' },
    consent:  { kz:'Деректерді өңдеуге келісім', ru:'Согласие на обработку данных', kr:'개인정보 처리 동의' },
    photoC:   { kz:'Сурет жариялауға келісім', ru:'Согласие на публикацию фото', kr:'사진 게시 동의' },
    download: { kz:'Менің деректерімді жүктеу', ru:'Скачать мои данные', kr:'내 데이터 다운로드' },
    delete:   { kz:'Аккаунтты жою', ru:'Удалить аккаунт', kr:'계정 삭제' },
    supportT: { kz:'Қолдау', ru:'Поддержка', kr:'고객 지원' },
    contact:  { kz:'Бізбен байланыс', ru:'Связаться с нами', kr:'문의하기' },
    faq:      { kz:'Жиі сұрақтар', ru:'Частые вопросы', kr:'자주 묻는 질문' },
    terms:    { kz:'Шарттар', ru:'Условия', kr:'이용약관' },
    privacy:  { kz:'Құпиялылық саясаты', ru:'Политика конфиденциальности', kr:'개인정보 처리방침' },
    logout:   { kz:'Шығу', ru:'Выйти', kr:'로그아웃' },
    version:  { kz:'Нұсқа', ru:'Версия', kr:'버전' },
  });

  const SwitchRow = ({ on, setOn, label, sub, color = T.rose }) => (
    <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12,
      borderBottom:`1px solid ${T.borderSoft}` }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, color:T.ink, fontWeight:500 }}>{label}</div>
        {sub && <div style={{ fontSize:11.5, color:T.textMute, marginTop:2 }}>{sub}</div>}
      </div>
      <div onClick={()=>setOn(!on)} style={{
        width:42, height:24, borderRadius:999, background: on?color:'#DDD',
        padding:2, transition:'.2s', cursor:'pointer', flexShrink:0,
      }}>
        <div style={{ width:20, height:20, background:'#fff', borderRadius:'50%',
          marginLeft: on?18:0, transition:'.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
      </div>
    </div>
  );

  const NavRow = ({ icon, label, value, danger }) => (
    <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:12,
      borderBottom:`1px solid ${T.borderSoft}` }}>
      {icon && <Icon d={icon} size={18} stroke={danger?'#A04432':T.text} sw={1.7}/>}
      <div style={{ flex:1, fontSize:14, color: danger?'#A04432':T.ink, fontWeight:500 }}>{label}</div>
      {value && <div style={{ fontSize:12, color:T.textMute }}>{value}</div>}
      <Icon d={Icons.chevR} size={15} stroke={T.textMute}/>
    </div>
  );

  return (
    <div className="kb-screen" style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:T.bgSoft }}>
      <TopBar back title={L('title')}/>

      <div className="kb-scroll" style={{ flex:1, overflow:'auto', paddingBottom:40 }}>
        {/* Language selector */}
        <Group label={L('lang')} sub={L('langSub')}>
          <div style={{ display:'flex', gap:7, padding:'14px 18px' }}>
            {[
              { v:'kz', label:'Қазақша', sub:'KZ' },
              { v:'ru', label:'Русский', sub:'RU' },
              { v:'kr', label:'한국어',   sub:'KR' },
            ].map(l => {
              const on = l.v === lang;
              return (
                <div key={l.v} style={{
                  flex:1, padding:'13px 8px', borderRadius:11,
                  background: on?'#fff':T.bgSoft,
                  border: on?`1.5px solid ${T.rose}`:`1px solid ${T.border}`,
                  textAlign:'center',
                }}>
                  <div style={{ fontSize:13, fontWeight:700, color:on?T.ink:T.text, letterSpacing:'-0.2px' }}>{l.label}</div>
                  <div style={{ fontSize:10, color:on?T.roseDeep:T.textMute, fontWeight:700, marginTop:2 }}>{l.sub}</div>
                </div>
              );
            })}
          </div>
        </Group>

        {/* Profile */}
        <Group label={L('profileT')}>
          <NavRow icon={Icons.user} label={L('nameL')} value="Aigerim Bekova"/>
          <NavRow icon={Icons.chat} label={L('phoneL')} value="+7 701 234 ****"/>
          <NavRow icon={Icons.send} label={L('emailL')} value="aigerim@example.kz"/>
        </Group>

        {/* Notifications */}
        <Group label={L('notifT')}>
          <SwitchRow on={notif.inapp} setOn={(v)=>setNotif({ ...notif, inapp:v })} label={L('inappCh')} sub="Park M. · 24/7"/>
          <SwitchRow on={notif.push}  setOn={(v)=>setNotif({ ...notif, push:v })}  label={L('pushCh')}/>
          <SwitchRow on={notif.email} setOn={(v)=>setNotif({ ...notif, email:v })} label={L('emailCh')}/>
        </Group>

        {/* Privacy */}
        <Group label={L('privT')}>
          <NavRow icon={Icons.shield}      label={L('consent')} value={lang==='kz'?'Берілген':lang==='ru'?'Дано':'동의함'}/>
          <NavRow icon={Icons.camera}      label={L('photoC')}  value={lang==='kz'?'Сұралған кезде':lang==='ru'?'По запросу':'요청 시'}/>
          <NavRow icon={Icons.doc}         label={L('download')}/>
          <NavRow icon={Icons.x}           label={L('delete')} danger/>
        </Group>

        {/* Support */}
        <Group label={L('supportT')}>
          <NavRow icon={Icons.chat}        label={L('contact')} value="Park M."/>
          <NavRow icon={Icons.doc}         label={L('faq')}/>
          <NavRow icon={Icons.shieldCheck} label={L('terms')}/>
          <NavRow icon={Icons.shield}      label={L('privacy')}/>
        </Group>

        {/* Logout + version */}
        <div style={{ padding:'18px 18px 4px' }}>
          <button className="kb-press" style={{
            width:'100%', padding:'13px', background:'#fff', border:`1px solid ${T.border}`,
            borderRadius:11, fontSize:13.5, fontWeight:600, color:'#A04432',
            fontFamily:T.font, cursor:'pointer',
          }}>{L('logout')}</button>
        </div>

        <div style={{ padding:'18px 18px 30px', textAlign:'center',
          fontSize:11, color:T.textMute, letterSpacing:'0.3px' }}>
          K-Beauty Сana · {L('version')} 0.3.0
        </div>
      </div>
    </div>
  );
}

function Group({ label, sub, children }) {
  return (
    <div style={{ marginTop:18 }}>
      <div style={{ padding:'0 18px 7px' }}>
        <div style={{ fontSize:11, color:T.textMute, fontWeight:700, letterSpacing:'0.5px' }}>{label.toUpperCase()}</div>
        {sub && <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>{sub}</div>}
      </div>
      <div style={{ background:'#fff', borderTop:`1px solid ${T.borderSoft}`, borderBottom:`1px solid ${T.borderSoft}` }}>
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { ScreenNotifications, ScreenChat, ScreenSearch, ScreenSettings, Group, SectionLabel, HL });
