// Manager-side workflow expansion: notification templates + activity log
// + automation rules.

// Shared admin layout chrome (sidebar reused across admin screens)
function AdminShell({ active, children }) {
  const t = useT();
  const lang = useLang();
  const A = {
    bg:'#F7F6F4', panel:'#fff',
    border:'#E8E5E0', borderSoft:'#F0EDE8',
    text:'#5A5A5A', mute:'#9A9A95',
  };
  const baLabel = lang==='kz'?'Before & After':lang==='ru'?'До и После':'Before & After';
  const sidebar = [
    { id:'dash',  l:t.ad.sidebar.dash, icon:Icons.home },
    { id:'leads', l:t.ad.sidebar.leads, icon:Icons.chat, badge:14 },
    { id:'cust',  l:t.ad.sidebar.cust, icon:Icons.user },
    { id:'clinic',l:t.ad.sidebar.clinic, icon:Icons.hospital },
    { id:'review',l:t.ad.sidebar.review, icon:Icons.star },
    { id:'manager',l:t.ad.sidebar.manager, icon:Icons.checkBadge },
    { id:'ba',    l:baLabel, icon:Icons.camera },
  ];
  return (
    <div className="kb-screen" style={{
      width:'100%', height:'100%', overflow:'hidden', background:A.bg,
      display:'flex', fontSize:13, color:'#3A3A3A',
    }}>
      <div style={{
        width:230, background:A.panel, borderRight:`1px solid ${A.border}`,
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
          {sidebar.map((it,i)=>{
            const on = it.id === active;
            return (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:9, padding:'8px 10px', marginBottom:2,
                borderRadius:7, background: on ? T.roseTint : 'transparent',
                color: on ? T.roseDeep : A.text, fontWeight: on ? 600 : 500, fontSize:12.5,
              }}>
                <Icon d={it.icon} size={15} stroke={on ? T.roseDeep : A.text} sw={1.8}/>
                <span style={{ flex:1 }}>{it.l}</span>
                {it.badge && <span style={{ padding:'1px 6px', borderRadius:999, background:T.rose, color:'#fff',
                  fontSize:10, fontWeight:700 }}>{it.badge}</span>}
              </div>
            );
          })}
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
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {children}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 12. NOTIFICATION TEMPLATES
// ════════════════════════════════════════════════════════════════════
function ScreenAdminNotifTemplates() {
  const t = useT();
  const lang = useLang();
  const [selectedId, setSelectedId] = React.useState('welcome');
  const [channel, setChannel] = React.useState('whatsapp');
  const [tplLang, setTplLang] = React.useState(lang);

  const L = (k) => ({
    title: { kz:'Хабарлама үлгілері', ru:'Шаблоны сообщений', kr:'알림 메시지 템플릿' },
    sub: { kz:'WhatsApp · Telegram · SMS · Email шаблондары', ru:'Шаблоны для WhatsApp · Telegram · SMS · Email', kr:'WhatsApp · Telegram · SMS · Email 메시지 템플릿' },
    new: { kz:'Жаңа үлгі', ru:'Новый шаблон', kr:'새 템플릿' },
    preview: { kz:'Алдын ала қарау', ru:'Предпросмотр', kr:'미리보기' },
    edit: { kz:'Өңдеу', ru:'Редактировать', kr:'편집' },
    duplicate: { kz:'Көшіру', ru:'Дублировать', kr:'복제' },
    sendTest: { kz:'Тест жіберу', ru:'Тестовая отправка', kr:'테스트 발송' },
    save: { kz:'Сақтау', ru:'Сохранить', kr:'저장' },
    variables: { kz:'Айнымалылар', ru:'Переменные', kr:'사용 가능한 변수' },
    body: { kz:'Хабарлама мәтіні', ru:'Текст сообщения', kr:'본문' },
    chTitle: { kz:'Жіберу арнасы', ru:'Канал отправки', kr:'발송 채널' },
    langs: { kz:'Қол жетімді тілдер', ru:'Доступные языки', kr:'사용 가능한 언어' },
    triggerLabel: { kz:'Қозғаушы оқиға', ru:'Триггер', kr:'트리거' },
    autoSend: { kz:'Автоматты жіберу', ru:'Авто-отправка', kr:'자동 발송' },
    delay: { kz:'Кідіріс', ru:'Задержка', kr:'발송 지연' },
    delayVal: { kz:'Қабылданғаннан кейін 5 минут ішінде', ru:'В течение 5 минут после получения', kr:'접수 후 5분 이내' },
  })[k][lang] || k;

  const templates = [
    {
      id:'welcome',
      title: { kz:'Қарсы алу хабарламасы', ru:'Приветствие', kr:'환영 메시지' },
      trigger: { kz:'Жаңа кеңес сұрауы келді', ru:'Новая заявка', kr:'신규 상담 신청 시' },
      ch:['WA','TG'], auto:true, lastSent:'2분 전', sent:48,
    },
    {
      id:'confirm',
      title: { kz:'Кездесу растамасы', ru:'Подтверждение записи', kr:'예약 확정 안내' },
      trigger: { kz:'Менеджер растады', ru:'Подтверждение менеджером', kr:'매니저 확정 후' },
      ch:['WA','SMS','EM'], auto:false, lastSent:'어제', sent:32,
    },
    {
      id:'reminder',
      title: { kz:'Кеңестен бұрын еске салу', ru:'Напоминание о консультации', kr:'상담 전 리마인더' },
      trigger: { kz:'24 сағат бұрын', ru:'За 24 часа', kr:'24시간 전' },
      ch:['WA','SMS'], auto:true, lastSent:'3시간 전', sent:71,
    },
    {
      id:'aftercare',
      title: { kz:'Кейінгі күтім нұсқаулығы', ru:'Инструкция после-ухода', kr:'사후관리 안내' },
      trigger: { kz:'Процедурадан 1 күн өткенде', ru:'Через 1 день после процедуры', kr:'시술 후 1일' },
      ch:['WA','EM'], auto:true, lastSent:'6시간 전', sent:19,
    },
    {
      id:'visit',
      title: { kz:'Кореяға сапар бағыты', ru:'Маршрут поездки в Корею', kr:'한국 방문 일정 안내' },
      trigger: { kz:'Сапар расталған кезде', ru:'При подтверждении поездки', kr:'방문 확정 시' },
      ch:['WA','EM'], auto:false, lastSent:'2일 전', sent:14,
    },
    {
      id:'review',
      title: { kz:'Пікір сұрауы', ru:'Запрос отзыва', kr:'후기 요청' },
      trigger: { kz:'Процедурадан 14 күн өткенде', ru:'Через 14 дней', kr:'시술 후 14일' },
      ch:['WA','SMS'], auto:true, lastSent:'3일 전', sent:38,
    },
  ];

  // Body content per template / language (samples)
  const bodies = {
    welcome: {
      kz: 'Сәлеметсіз бе, {{name}}!\n\nK-Beauty Сana көмекшіңізбіз. {{procedure}} процедурасы бойынша сұрауыңыз қабылданды. Дәл қазір сізге сай клиникаларды таңдап жатырмыз.\n\n24 сағат ішінде хабарласамыз. Сұрағыңыз болса осы чатта жазып қалдырыңыз 🌸',
      ru: 'Здравствуйте, {{name}}!\n\nЯ ваш консультант K-Beauty Сana. Ваша заявка на {{procedure}} принята. Подбираем подходящие клиники под ваш запрос.\n\nСвяжемся в течение 24 часов. Можете писать сюда — отвечу 🌸',
      kr: '안녕하세요 {{name}}님,\n\nK-Beauty Сana 담당 매니저입니다. {{procedure}} 시술 상담 신청이 접수되었습니다. 지금 맞춤 클리닉을 정리해 드리고 있어요.\n\n24시간 이내 다시 연락드리겠습니다. 궁금하신 점 있으시면 편하게 메시지 남겨 주세요 🌸',
    },
    reminder: {
      kz: 'Қайырлы күн, {{name}}!\n\n{{date}} {{time}} — {{clinic}}-та сізді күтіп отырмыз.\n\n• Аудармашы: {{translator}}\n• Мекенжай: {{address}}\n\nЕске салу: процедурадан 24 сағат бұрын кофе мен қою косметиканы шектеп көріңіз.',
      ru: 'Добрый день, {{name}}!\n\n{{date}} {{time}} — клиника {{clinic}} ждёт вас.\n\n• Переводчик: {{translator}}\n• Адрес: {{address}}\n\nНапоминание: за 24 часа до процедуры ограничьте кофе и плотный макияж.',
      kr: '{{name}}님 안녕하세요,\n\n{{date}} {{time}}, {{clinic}}에서 만나뵙겠습니다.\n\n• 통역: {{translator}}\n• 주소: {{address}}\n\n알림: 시술 24시간 전 카페인과 진한 메이크업은 피해 주세요.',
    },
  };

  const current = templates.find(x=>x.id===selectedId) || templates[0];
  const bodyText = (bodies[selectedId] && bodies[selectedId][tplLang]) || (bodies.welcome && bodies.welcome[tplLang]) || '';

  const A = { bg:'#F7F6F4', panel:'#fff', border:'#E8E5E0', borderSoft:'#F0EDE8', text:'#5A5A5A', mute:'#9A9A95' };

  return (
    <AdminShell active="tpl">
      {/* Header */}
      <div style={{
        padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
        background:'#fff', display:'flex', alignItems:'center', gap:14,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{L('title')}</div>
          <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{L('sub')}</div>
        </div>
        <div style={{ flex:1 }}/>
        <button style={{
          padding:'7px 13px', background:T.ink, color:'#fff', border:'none', borderRadius:8,
          fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontFamily:T.font,
        }}>
          <Icon d={Icons.plus} size={12} stroke="#fff" sw={2.2}/> {L('new')}
        </button>
      </div>

      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Template list */}
        <div style={{ width:328, background:'#fff', borderRight:`1px solid ${A.border}`, overflow:'auto' }}>
          {templates.map((tpl,i)=>{
            const on = tpl.id === selectedId;
            return (
              <button key={tpl.id}
                onClick={() => setSelectedId(tpl.id)}
                style={{
                  display:'block', width:'100%', padding:'13px 16px', textAlign:'left',
                  background: on ? T.roseTint : 'transparent',
                  border:'none', borderBottom:`1px solid ${A.borderSoft}`,
                  cursor:'pointer', fontFamily:T.font,
                  borderLeft: on ? `3px solid ${T.rose}` : '3px solid transparent',
                }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.ink, letterSpacing:'-0.2px' }}>{tpl.title[lang]}</div>
                  {tpl.auto && (
                    <div style={{ padding:'2px 6px', background:'#E5F4EC', color:'#1F7A4D',
                      fontSize:9, fontWeight:700, borderRadius:4, flexShrink:0 }}>AUTO</div>
                  )}
                </div>
                <div style={{ fontSize:10.5, color:A.mute, marginTop:3 }}>{tpl.trigger[lang]}</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:7 }}>
                  {tpl.ch.map((c,k)=>(
                    <span key={k} style={{
                      padding:'2px 6px', borderRadius:4,
                      background: c==='WA' ? '#DCFCE5' : c==='TG' ? '#D8EFFB' : c==='SMS' ? '#F3F0E8' : '#FDE8E4',
                      color: c==='WA' ? '#168F44' : c==='TG' ? '#0F7AB0' : c==='SMS' ? '#7A6A4A' : '#A04432',
                      fontSize:9, fontWeight:800, letterSpacing:'0.5px',
                    }}>{c}</span>
                  ))}
                  <span style={{ flex:1 }}/>
                  <span style={{ fontSize:10, color:A.mute }}>{tpl.sent}회</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div style={{ flex:1, padding:'18px 22px', overflow:'auto', background:A.bg }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14 }}>
            <div>
              <div style={{ fontSize:18, fontWeight:700, letterSpacing:'-0.3px' }}>{current.title[lang]}</div>
              <div style={{ fontSize:11, color:A.mute, marginTop:3 }}>{L('triggerLabel')}: {current.trigger[lang]}</div>
            </div>
            <div style={{ display:'flex', gap:7 }}>
              <button style={btnSecondary}>{L('duplicate')}</button>
              <button style={btnSecondary}>
                <Icon d={Icons.send} size={11} stroke={T.ink2} sw={2} style={{ marginRight:5 }}/>
                {L('sendTest')}
              </button>
              <button style={btnPrimary}>{L('save')}</button>
            </div>
          </div>

          {/* Settings row */}
          <div style={{ marginTop:18, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:11 }}>
            <FieldGroup label={L('chTitle')}>
              <div style={{ display:'flex', gap:6 }}>
                {[
                  ['whatsapp','WhatsApp','#25D366'],
                  ['telegram','Telegram','#229ED9'],
                  ['sms','SMS','#7A6A4A'],
                  ['email','Email','#A04432'],
                ].map(([id,name,col])=>{
                  const on = channel === id;
                  return (
                    <button key={id} onClick={()=>setChannel(id)}
                      style={{
                        flex:1, padding:'10px 4px', borderRadius:7,
                        background: on ? '#fff' : A.panel, border: on ? `1.5px solid ${col}` : `1px solid ${A.border}`,
                        color: on ? T.ink : A.text, fontSize:11, fontWeight: on ? 700 : 500,
                        cursor:'pointer', fontFamily:T.font, display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                      }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:col }}/>
                      {name}
                    </button>
                  );
                })}
              </div>
            </FieldGroup>
            <FieldGroup label={L('langs')}>
              <div style={{ display:'flex', gap:6 }}>
                {['kz','ru','kr'].map(l => {
                  const on = tplLang === l;
                  return (
                    <button key={l} onClick={()=>setTplLang(l)}
                      style={{
                        flex:1, padding:'10px 4px', borderRadius:7,
                        background: on ? T.ink : A.panel, color: on ? '#fff' : A.text,
                        border: on ? 'none' : `1px solid ${A.border}`,
                        fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:T.font,
                      }}>{l.toUpperCase()}</button>
                  );
                })}
              </div>
            </FieldGroup>
            <FieldGroup label={L('autoSend')}>
              <div style={{ padding:'10px 13px', background:'#fff', border:`1px solid ${A.border}`, borderRadius:8,
                display:'flex', alignItems:'center', gap:9 }}>
                <div style={{ width:30, height:18, borderRadius:999, background:current.auto?T.rose:'#DDD',
                  display:'flex', alignItems:'center', padding:2 }}>
                  <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', marginLeft:current.auto?12:0, transition:'.2s' }}/>
                </div>
                <div style={{ flex:1, fontSize:11, color:T.ink2 }}>{L('delayVal')}</div>
              </div>
            </FieldGroup>
          </div>

          {/* Body editor */}
          <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16 }}>
            {/* Editor */}
            <div>
              <div style={{ fontSize:11, color:A.mute, fontWeight:700, letterSpacing:'0.3px', marginBottom:7 }}>{L('body').toUpperCase()}</div>
              <div style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:10, padding:'12px 14px',
                fontSize:12.5, color:T.ink2, lineHeight:1.6, minHeight:240, whiteSpace:'pre-wrap',
                fontFamily:T.font,
              }}>
                {bodyText.split(/(\{\{[^}]+\}\})/g).map((part,k)=>(
                  part.startsWith('{{') ? (
                    <span key={k} style={{ background:T.roseTint, color:T.roseDeep, fontWeight:700,
                      padding:'1px 5px', borderRadius:4, fontSize:11.5 }}>{part}</span>
                  ) : <React.Fragment key={k}>{part}</React.Fragment>
                ))}
              </div>
              <div style={{ marginTop:9, fontSize:10.5, color:A.mute, display:'flex', alignItems:'center', gap:5 }}>
                <Icon d={Icons.shield} size={11} stroke={A.mute}/>
                {{ kz:'Үлгілерде баға, жеңілдік немесе бағамалар жоқ', ru:'В шаблонах нет цен, скидок и смет', kr:'템플릿에 가격, 할인, 견적 정보는 포함되지 않습니다' }[lang]}
              </div>
              {/* Variables */}
              <div style={{ marginTop:14, fontSize:11, color:A.mute, fontWeight:700, letterSpacing:'0.3px', marginBottom:7 }}>{L('variables').toUpperCase()}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {['{{name}}','{{procedure}}','{{clinic}}','{{date}}','{{time}}','{{translator}}','{{address}}','{{managerName}}'].map((v,k)=>(
                  <div key={k} style={{ padding:'5px 9px', background:'#fff', border:`1px solid ${A.border}`,
                    borderRadius:6, fontSize:11, color:T.ink2, fontFamily:T.font, fontWeight:600,
                    display:'flex', alignItems:'center', gap:4 }}>
                    <Icon d={Icons.plus} size={10} stroke={A.mute} sw={2.4}/> {v}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <div style={{ fontSize:11, color:A.mute, fontWeight:700, letterSpacing:'0.3px', marginBottom:7 }}>{L('preview').toUpperCase()}</div>
              <MessagePreview channel={channel} text={bodyText}/>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

const btnSecondary = {
  padding:'7px 12px', background:'#fff', border:'1px solid #E8E5E0', borderRadius:7,
  fontSize:11.5, fontWeight:600, color:'#3A3A3A', cursor:'pointer', fontFamily:T.font,
  display:'inline-flex', alignItems:'center',
};
const btnPrimary = {
  padding:'7px 14px', background:T.rose, color:'#fff', border:'none', borderRadius:7,
  fontSize:11.5, fontWeight:700, cursor:'pointer', fontFamily:T.font,
};

function FieldGroup({ label, children }) {
  return (
    <div>
      <div style={{ fontSize:11, color:'#9A9A95', fontWeight:700, letterSpacing:'0.3px', marginBottom:6 }}>{label.toUpperCase()}</div>
      {children}
    </div>
  );
}

// ─── Phone-like preview of the outbound message ────────────────────
function MessagePreview({ channel, text }) {
  const filled = text
    .replace('{{name}}','Aigerim')
    .replace('{{procedure}}','Ulthera Lifting')
    .replace('{{clinic}}','Lienne Clinic')
    .replace('{{date}}','3 июнь')
    .replace('{{time}}','14:30')
    .replace('{{translator}}','Madina (RU)')
    .replace('{{address}}','Apgujeong-ro 28-gil, Seoul');
  const channelMeta = {
    whatsapp: { bg:'#0B141A', headerBg:'#1F2C33', bubble:'#005C4B', name:'WhatsApp Business', label:'K-Beauty Сana' },
    telegram: { bg:'#1A2331', headerBg:'#2B3A4E', bubble:'#3390EC', name:'Telegram', label:'K-Beauty Сana' },
    sms:      { bg:'#F4F4F2', headerBg:'#FFFFFF', bubble:'#E8607A', name:'SMS', label:'+7 700 *** ****' },
    email:    { bg:'#F4F4F2', headerBg:'#FFFFFF', bubble:'#FFFFFF', name:'Email', label:'manager@kbeauty-cana.kz' },
  }[channel] || { bg:'#0B141A', headerBg:'#1F2C33', bubble:'#005C4B', name:'WhatsApp', label:'' };
  return (
    <div style={{ background:channelMeta.bg, borderRadius:14, overflow:'hidden',
      border:'1px solid #E8E5E0',
    }}>
      <div style={{ padding:'10px 14px', background:channelMeta.headerBg,
        display:'flex', alignItems:'center', gap:9,
        color: channel==='sms'||channel==='email' ? '#1A1A1A' : '#fff',
        borderBottom: channel==='sms'||channel==='email' ? '1px solid #E8E5E0' : 'none',
      }}>
        <div style={{ width:30, height:30, borderRadius:'50%', background:T.rose,
          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:12 }}>K</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:11.5, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{channelMeta.label}</div>
          <div style={{ fontSize:10, opacity:0.6 }}>{channelMeta.name}</div>
        </div>
      </div>
      {channel === 'email' ? (
        <div style={{ background:'#fff', padding:'14px 16px' }}>
          <div style={{ fontSize:11, color:'#9A9A95', marginBottom:9, display:'flex', gap:8 }}>
            <div><div style={{ fontWeight:600, color:'#3A3A3A' }}>To</div>aigerim@example.com</div>
          </div>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:9, letterSpacing:'-0.2px' }}>K-Beauty Сana — консультация принята</div>
          <div style={{ fontSize:12, color:'#3A3A3A', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{filled}</div>
        </div>
      ) : channel === 'sms' ? (
        <div style={{ background:'#F4F4F2', padding:'18px 14px', display:'flex' }}>
          <div style={{ maxWidth:'78%', background:'#fff', borderRadius:14, padding:'10px 13px',
            fontSize:12, color:'#1A1A1A', lineHeight:1.5, whiteSpace:'pre-wrap',
            border:'1px solid #E8E5E0',
          }}>{filled}</div>
        </div>
      ) : (
        <div style={{ padding:'14px 12px', minHeight:200, display:'flex', flexDirection:'column',
          background: channel==='whatsapp' ? 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2240%22 height=%2240%22><circle cx=%225%22 cy=%225%22 r=%221%22 fill=%22%23ffffff14%22/></svg>") repeat, #0B141A' : channelMeta.bg,
        }}>
          <div style={{ alignSelf:'flex-end', maxWidth:'82%', background:channelMeta.bubble,
            color:'#fff', padding:'8px 11px 6px', borderRadius:'10px 10px 2px 10px',
            fontSize:12, lineHeight:1.45, whiteSpace:'pre-wrap',
          }}>
            {filled}
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.6)', textAlign:'right', marginTop:4 }}>
              14:32 ✓✓
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 13. NOTIFICATION ACTIVITY LOG
// ════════════════════════════════════════════════════════════════════
function ScreenAdminNotifLog() {
  const t = useT();
  const lang = useLang();
  const L = (k) => ({
    title: { kz:'Жіберілген хабарламалар', ru:'Журнал отправок', kr:'알림 발송 로그' },
    sub: { kz:'WhatsApp · Telegram · SMS · Email · жіберу күйі', ru:'WhatsApp · Telegram · SMS · Email · статусы', kr:'WhatsApp · Telegram · SMS · Email · 발송 상태' },
    cols: {
      kz: ['Уақыт','Алушы','Арна','Үлгі','Тіл','Күй'],
      ru: ['Время','Получатель','Канал','Шаблон','Язык','Статус'],
      kr: ['시간','수신자','채널','템플릿','언어','상태'],
    },
    filters: {
      kz: ['Барлық арналар','Барлық күйлер','Бүгін','Үлгі бойынша'],
      ru: ['Все каналы','Все статусы','Сегодня','По шаблону'],
      kr: ['전체 채널','전체 상태','오늘','템플릿별'],
    },
    kpis: {
      kz: [['Бүгін жіберілді','312'],['Жеткізілді','94%'],['Оқылды','71%'],['Сәтсіз','6']],
      ru: [['Сегодня отправлено','312'],['Доставлено','94%'],['Прочитано','71%'],['Ошибки','6']],
      kr: [['오늘 발송','312'],['전달됨','94%'],['읽음','71%'],['실패','6']],
    },
    export: { kz:'CSV экспорт', ru:'Экспорт CSV', kr:'CSV 내보내기' },
    retry: { kz:'Қайта жіберу', ru:'Повторить', kr:'재시도' },
    open: { kz:'Ашу', ru:'Открыть', kr:'열기' },
    search: { kz:'Алушы немесе үлгі іздеу', ru:'Поиск получателя или шаблона', kr:'수신자 또는 템플릿 검색' },
    statuses: {
      sent: { kz:'Жіберілді', ru:'Отправлено', kr:'발송됨' },
      delivered: { kz:'Жеткізілді', ru:'Доставлено', kr:'전달됨' },
      read: { kz:'Оқылды', ru:'Прочитано', kr:'읽음' },
      replied: { kz:'Жауап келді', ru:'Ответ получен', kr:'답장됨' },
      failed: { kz:'Сәтсіз', ru:'Ошибка', kr:'실패' },
      queued: { kz:'Кезекте', ru:'В очереди', kr:'대기 중' },
    },
  })[k][lang] || (typeof k === 'string' ? k : '');

  const tplName = (k) => ({
    welcome: { kz:'Қарсы алу', ru:'Приветствие', kr:'환영' },
    confirm: { kz:'Растама', ru:'Подтверждение', kr:'확정' },
    reminder: { kz:'Еске салу', ru:'Напоминание', kr:'리마인더' },
    aftercare: { kz:'Кейінгі күтім', ru:'После-уход', kr:'사후관리' },
    visit: { kz:'Сапар бағыты', ru:'Маршрут', kr:'방문 일정' },
    review: { kz:'Пікір сұрауы', ru:'Запрос отзыва', kr:'후기 요청' },
  })[k][lang];

  const statusMeta = {
    read:      { bg:'#E5F4EC', fg:'#1F7A4D', dot:'#1F7A4D' },
    delivered: { bg:'#E6F0F8', fg:'#2A6A9A', dot:'#2A6A9A' },
    sent:      { bg:'#F0EDE8', fg:'#5A5A5A', dot:'#7A7A7A' },
    replied:   { bg:'#FCE7EC', fg:'#C84365', dot:'#C84365' },
    failed:    { bg:'#FDE8E4', fg:'#A04432', dot:'#A04432' },
    queued:    { bg:'#FFF5E1', fg:'#A07012', dot:'#A07012' },
  };

  const rows = [
    { t:'14:32', name:'Aigerim B.', ch:'WA',  tpl:'welcome',   lng:'KZ', status:'read' },
    { t:'14:18', name:'Dana S.',    ch:'TG',  tpl:'welcome',   lng:'KZ', status:'delivered' },
    { t:'13:51', name:'Aliya N.',   ch:'WA',  tpl:'reminder',  lng:'RU', status:'replied' },
    { t:'12:40', name:'Madina A.',  ch:'WA',  tpl:'aftercare', lng:'RU', status:'read' },
    { t:'11:14', name:'Zarina B.',  ch:'EM',  tpl:'visit',     lng:'RU', status:'sent' },
    { t:'10:22', name:'Saule T.',   ch:'SMS', tpl:'reminder',  lng:'KZ', status:'failed' },
    { t:'09:50', name:'Kamila A.',  ch:'WA',  tpl:'review',    lng:'RU', status:'delivered' },
    { t:'09:12', name:'Aizhan M.',  ch:'TG',  tpl:'welcome',   lng:'KZ', status:'read' },
    { t:'08:40', name:'Diana K.',   ch:'WA',  tpl:'confirm',   lng:'RU', status:'queued' },
    { t:'어제 22:01', name:'Nazym O.', ch:'EM', tpl:'aftercare', lng:'KR', status:'read' },
  ];

  const A = { bg:'#F7F6F4', panel:'#fff', border:'#E8E5E0', borderSoft:'#F0EDE8', text:'#5A5A5A', mute:'#9A9A95' };

  return (
    <AdminShell active="log">
      <div style={{
        padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
        background:'#fff', display:'flex', alignItems:'center', gap:14,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{L('title')}</div>
          <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{L('sub')}</div>
        </div>
        <div style={{ flex:1 }}/>
        <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 11px',
          border:`1px solid ${A.border}`, borderRadius:9, background:A.bg, minWidth:260 }}>
          <Icon d={Icons.search} size={14} stroke={A.mute}/>
          <div style={{ fontSize:12, color:A.mute }}>{L('search')}</div>
        </div>
        <button style={btnSecondary}>
          <Icon d={Icons.doc} size={11} stroke={T.ink2} sw={2} style={{ marginRight:5 }}/>
          {L('export')}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ padding:'16px 22px 0', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        {L('kpis').map(([label, val],i)=>{
          const tones = [T.roseDeep, '#1F7A4D', '#5E4B82', '#A04432'];
          return (
            <div key={i} style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:11, padding:'13px 14px' }}>
              <div style={{ fontSize:11, color:A.mute, fontWeight:500 }}>{label}</div>
              <div className="kb-display" style={{ fontSize:24, color:tones[i], marginTop:5 }}>{val}</div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ padding:'14px 22px 10px', display:'flex', gap:7, flexWrap:'wrap' }}>
        {L('filters').map((f,i)=>(
          <div key={i} style={{
            padding:'6px 10px', border:`1px solid ${A.border}`, borderRadius:7,
            fontSize:11.5, color: i===0 ? T.ink : A.text, fontWeight: i===0 ? 600 : 500,
            background: i===0 ? '#fff' : A.bg, display:'flex', alignItems:'center', gap:5,
          }}>
            {f} <Icon d={Icons.chevD} size={11} stroke={A.mute} sw={2}/>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ padding:'8px 22px 22px', flex:1, overflow:'auto' }}>
        <div style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:12, overflow:'hidden' }}>
          <div style={{
            display:'grid', gridTemplateColumns:'90px 1.4fr 80px 1.2fr 60px 1fr 100px',
            padding:'10px 14px', background:'#FBFAF7',
            borderBottom:`1px solid ${A.border}`,
            fontSize:10.5, color:A.mute, fontWeight:700, letterSpacing:'0.3px', alignItems:'center', gap:8,
          }}>
            {L('cols').map((c,i)=><div key={i}>{c}</div>)}
            <div></div>
          </div>
          {rows.map((r,i)=>{
            const s = statusMeta[r.status];
            return (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'90px 1.4fr 80px 1.2fr 60px 1fr 100px',
                padding:'12px 14px', alignItems:'center', gap:8, fontSize:12,
                borderBottom: i<rows.length-1 ? `1px solid ${A.borderSoft}` : 'none',
                background: i%2===0 ? '#fff' : '#FDFCFA',
              }}>
                <div style={{ fontSize:11, color:A.text, fontFamily:'monospace' }}>{r.t}</div>
                <div style={{ fontSize:12, fontWeight:600, color:T.ink, letterSpacing:'-0.2px' }}>{r.name}</div>
                <div>
                  <span style={{
                    padding:'3px 7px', borderRadius:4, fontSize:9.5, fontWeight:800, letterSpacing:'0.5px',
                    background: r.ch==='WA' ? '#DCFCE5' : r.ch==='TG' ? '#D8EFFB' : r.ch==='SMS' ? '#F3F0E8' : '#FDE8E4',
                    color: r.ch==='WA' ? '#168F44' : r.ch==='TG' ? '#0F7AB0' : r.ch==='SMS' ? '#7A6A4A' : '#A04432',
                  }}>{r.ch}</span>
                </div>
                <div style={{ fontSize:11.5, color:T.ink2 }}>{tplName(r.tpl)}</div>
                <div>
                  <span style={{ padding:'2px 7px', background:A.bg, borderRadius:5,
                    fontSize:10, fontWeight:700, color:A.text }}>{r.lng}</span>
                </div>
                <div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:5,
                    padding:'4px 9px', borderRadius:6, background:s.bg, color:s.fg,
                    fontSize:10.5, fontWeight:700,
                  }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:s.dot }}/>
                    {L('statuses')[r.status]}
                  </div>
                </div>
                <div style={{ display:'flex', gap:5, justifyContent:'flex-end' }}>
                  {r.status === 'failed' && (
                    <button style={{ padding:'3px 8px', borderRadius:5, fontSize:10, fontWeight:700,
                      background:T.roseTint, color:T.roseDeep, border:'none', cursor:'pointer', fontFamily:T.font }}>
                      {L('retry')}
                    </button>
                  )}
                  <button style={{ width:22, height:22, borderRadius:5, background:'transparent',
                    border:`1px solid ${A.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon d={Icons.chevR} size={12} stroke={A.mute}/>
                  </button>
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
// 14. AUTOMATION RULES (workflow builder)
// ════════════════════════════════════════════════════════════════════
function ScreenAdminAutomation() {
  const t = useT();
  const lang = useLang();
  const L = (k) => ({
    title: { kz:'Автоматтандыру ережелері', ru:'Правила автоматизации', kr:'알림 자동화 규칙' },
    sub: { kz:'Жаңа кеңес сұрауы келгенде автоматты түрде хабарлама жіберу', ru:'Авто-отправка при наступлении событий', kr:'특정 이벤트 발생 시 자동 발송' },
    active: { kz:'Белсенді', ru:'Активно', kr:'활성' },
    paused: { kz:'Тоқтатылған', ru:'Пауза', kr:'일시정지' },
    when: { kz:'ҚАШАН', ru:'КОГДА', kr:'언제' },
    then: { kz:'СОНДА', ru:'ТО', kr:'그러면' },
    sentCount: { kz:'жіберілді', ru:'отправлено', kr:'발송' },
    new: { kz:'Жаңа ереже', ru:'Новое правило', kr:'새 규칙' },
    edit: { kz:'Өңдеу', ru:'Изменить', kr:'편집' },
  })[k][lang] || k;

  const rules = [
    {
      title: { kz:'Жаңа кеңес сұрауы → Қарсы алу', ru:'Новая заявка → Приветствие', kr:'신규 상담 신청 → 환영 메시지' },
      when: { kz:'Жаңа сұрау қабылданды', ru:'Получена новая заявка', kr:'신규 상담 신청 접수' },
      then: { kz:'5 минуттан кейін WhatsApp арқылы Қарсы алу үлгісін жіберу', ru:'Через 5 минут отправить шаблон Приветствия через WhatsApp', kr:'5분 후 WhatsApp으로 환영 메시지 발송' },
      active:true, sent:312, channel:'WA', icon:Icons.chat,
    },
    {
      title: { kz:'Кездесуден 24 сағат бұрын', ru:'За 24 часа до встречи', kr:'예약 24시간 전' },
      when: { kz:'Растамаған кеңес 24с қалды', ru:'24ч до подтверждённой консультации', kr:'확정된 상담 24시간 전' },
      then: { kz:'WhatsApp + SMS — Еске салу үлгісі', ru:'WhatsApp + SMS — шаблон Напоминание', kr:'WhatsApp + SMS — 리마인더 발송' },
      active:true, sent:148, channel:'WA+SMS', icon:Icons.bell,
    },
    {
      title: { kz:'Процедурадан 1 күн өткен соң', ru:'1 день после процедуры', kr:'시술 1일 후' },
      when: { kz:'Процедура аяқталды', ru:'Процедура завершена', kr:'시술 완료 처리' },
      then: { kz:'WhatsApp + Email — Кейінгі күтім нұсқаулығы', ru:'WhatsApp + Email — Инструкция после-ухода', kr:'WhatsApp + Email — 사후관리 안내' },
      active:true, sent:74, channel:'WA+EM', icon:Icons.heart,
    },
    {
      title: { kz:'14 күн өткен соң → Пікір сұрауы', ru:'Через 14 дней → Запрос отзыва', kr:'14일 후 → 후기 요청' },
      when: { kz:'Процедурадан 14 күн өткен', ru:'14 дней после процедуры', kr:'시술 후 14일 경과' },
      then: { kz:'WhatsApp — Пікір сұрауы үлгісі', ru:'WhatsApp — шаблон Запрос отзыва', kr:'WhatsApp으로 후기 요청 메시지 발송' },
      active:false, sent:38, channel:'WA', icon:Icons.star,
    },
    {
      title: { kz:'3 күн жауап жоқ → Менеджерге дабыл', ru:'3 дня без ответа → Уведомить менеджера', kr:'3일 응답 없음 → 매니저 알림' },
      when: { kz:'3 күн ішінде жауап жоқ', ru:'Нет ответа 3 дня', kr:'3일 동안 응답 없음' },
      then: { kz:'Менеджердің панеліне тапсырма', ru:'Создать задачу для менеджера', kr:'매니저 대시보드에 작업 추가' },
      active:true, sent:22, channel:'TASK', icon:Icons.user,
    },
  ];

  const A = { bg:'#F7F6F4', panel:'#fff', border:'#E8E5E0', borderSoft:'#F0EDE8', text:'#5A5A5A', mute:'#9A9A95' };

  return (
    <AdminShell active="auto">
      <div style={{
        padding:'12px 22px', borderBottom:`1px solid ${A.border}`,
        background:'#fff', display:'flex', alignItems:'center', gap:14,
      }}>
        <div>
          <div style={{ fontSize:16, fontWeight:700, letterSpacing:'-0.3px' }}>{L('title')}</div>
          <div style={{ fontSize:11, color:A.mute, marginTop:2 }}>{L('sub')}</div>
        </div>
        <div style={{ flex:1 }}/>
        <button style={{
          padding:'7px 13px', background:T.rose, color:'#fff', border:'none', borderRadius:8,
          fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontFamily:T.font,
        }}>
          <Icon d={Icons.plus} size={12} stroke="#fff" sw={2.2}/> {L('new')}
        </button>
      </div>

      <div style={{ padding:'18px 22px', flex:1, overflow:'auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
          {rules.map((r,i)=>(
            <div key={i} style={{ background:'#fff', border:`1px solid ${A.border}`, borderRadius:12,
              padding:'16px 18px', display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:38, height:38, borderRadius:11, flexShrink:0,
                background: r.active ? T.roseTint : '#F0EDE8',
                color: r.active ? T.roseDeep : '#9A9A95',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon d={r.icon} size={18} sw={1.8}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:T.ink, letterSpacing:'-0.2px' }}>{r.title[lang]}</div>
                  <div style={{
                    padding:'2px 8px', borderRadius:5, fontSize:9.5, fontWeight:800, letterSpacing:'0.5px',
                    background: r.active ? '#E5F4EC' : '#F0EDE8',
                    color: r.active ? '#1F7A4D' : '#9A9A95',
                  }}>{(r.active ? L('active') : L('paused')).toUpperCase()}</div>
                </div>
                <div style={{ marginTop:9, display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <div style={{ fontSize:9, fontWeight:800, color:'#9A9A95', letterSpacing:'1px', width:60, flexShrink:0, paddingTop:2 }}>{L('when')}</div>
                    <div style={{ fontSize:11.5, color:T.ink2 }}>{r.when[lang]}</div>
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <div style={{ fontSize:9, fontWeight:800, color:T.roseDeep, letterSpacing:'1px', width:60, flexShrink:0, paddingTop:2 }}>{L('then')}</div>
                    <div style={{ fontSize:11.5, color:T.ink2 }}>{r.then[lang]}</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ width:34, height:20, borderRadius:999, background:r.active?T.rose:'#DDD',
                  display:'inline-flex', alignItems:'center', padding:2, marginBottom:8 }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff',
                    marginLeft:r.active?14:0, transition:'.2s' }}/>
                </div>
                <div style={{ fontSize:10.5, color:A.mute }}>
                  <span className="kb-display" style={{ fontSize:14, color:T.ink, marginRight:4 }}>{r.sent}</span>
                  {L('sentCount')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add row */}
        <div style={{ marginTop:12, padding:'18px', border:`1.5px dashed ${A.border}`, borderRadius:12,
          textAlign:'center', color:A.mute, fontSize:12, fontWeight:500,
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        }}>
          <Icon d={Icons.plus} size={14} stroke={A.mute} sw={2}/>
          {L('new')}
        </div>
      </div>
    </AdminShell>
  );
}

Object.assign(window, { ScreenAdminNotifTemplates, ScreenAdminNotifLog, ScreenAdminAutomation, AdminShell });
