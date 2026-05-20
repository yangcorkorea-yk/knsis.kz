// Screens 22-24: Phone OTP login flow (3 screens)
// LO-1: Phone number entry
// LO-2: OTP verification
// LO-3: Permissions / consent

// ════════════════════════════════════════════════════════════════════
// LO-1. PHONE NUMBER ENTRY
// ════════════════════════════════════════════════════════════════════
function ScreenLoginPhone() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();

  const L = {
    title:    { kz:'Кіру',                   ru:'Вход',                kr:'로그인' }[lang],
    h1:       { kz:'Жалғастыру үшін',        ru:'Чтобы продолжить',    kr:'계속하려면' }[lang],
    h2:       { kz:'нөміріңізді енгізіңіз',  ru:'введите номер',       kr:'전화번호를 입력하세요' }[lang],
    sub:      { kz:'WhatsApp немесе SMS арқылы кодты жібереміз. Шот тек консультация тарихыңыз бен қызықтыратын клиникаларды сақтау үшін қажет.',
                ru:'Отправим код через WhatsApp или SMS. Аккаунт нужен только чтобы сохранить историю консультаций и избранные клиники.',
                kr:'WhatsApp 또는 SMS로 인증코드를 보내드립니다. 계정은 상담 내역과 관심 클리닉 저장용으로만 사용됩니다.' }[lang],
    phoneLabel:{ kz:'Телефон нөмірі',        ru:'Номер телефона',      kr:'전화번호' }[lang],
    via:      { kz:'Код қалай аламын?',      ru:'Получить код через',  kr:'인증코드 받기' }[lang],
    sendWa:   { kz:'WhatsApp арқылы',        ru:'через WhatsApp',      kr:'WhatsApp 으로' }[lang],
    sendSms:  { kz:'SMS арқылы',             ru:'через SMS',           kr:'SMS 로' }[lang],
    cta:      { kz:'Кодты алу',              ru:'Получить код',        kr:'인증코드 받기' }[lang],
    or:       { kz:'немесе',                 ru:'или',                 kr:'또는' }[lang],
    apple:    { kz:'Apple-мен жалғастыру',   ru:'Продолжить с Apple',  kr:'Apple로 계속하기' }[lang],
    google:   { kz:'Google-мен жалғастыру',  ru:'Продолжить с Google', kr:'Google로 계속하기' }[lang],
    skip:     { kz:'Кейінірек',              ru:'Позже',               kr:'나중에' }[lang],
    legal:    { kz:'Жалғастыру арқылы Қызмет шарттары мен Құпиялылық саясатына келісесіз.',
                ru:'Продолжая, вы соглашаетесь с Условиями сервиса и Политикой конфиденциальности.',
                kr:'계속하면 서비스 약관 및 개인정보 처리방침에 동의하게 됩니다.' }[lang],
  };

  const [channel, setChannel] = React.useState('wa');
  const [phone, setPhone] = React.useState('701 234 5678');

  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bg, position:'relative' }}>
      <TopBar title={L.title} back
        right={<button onClick={() => nav.go('home')} className="kb-press"
          style={{ background:'none', border:'none', padding:4, fontSize:12, color:T.textMute, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
          {L.skip}
        </button>}
      />

      <div style={{
        padding:'24px 22px 18px',
        background:`linear-gradient(180deg, ${T.roseTint} 0%, transparent 100%)`,
      }}>
        <div className="kb-display" style={{ fontSize:24, lineHeight:1.3 }}>
          {L.h1}<br/>{L.h2}
        </div>
        <div style={{ fontSize:12.5, color:T.text, marginTop:9, lineHeight:1.55, letterSpacing:'-0.1px' }}>
          {L.sub}
        </div>
      </div>

      <div style={{ padding:'18px 18px 0' }}>
        <div style={{ fontSize:12, fontWeight:600, color:T.ink2, letterSpacing:'-0.2px', marginBottom:7 }}>{L.phoneLabel}</div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="kb-press"
            style={{
              padding:'13px 12px', borderRadius:11, border:`1px solid ${T.border}`,
              background:'#fff', display:'flex', alignItems:'center', gap:6,
              fontFamily:'inherit', cursor:'pointer',
            }}>
            <span style={{ fontSize:18 }}>🇰🇿</span>
            <span style={{ fontSize:13, fontWeight:600 }}>+7</span>
            <Icon d={Icons.chevD} size={11} stroke={T.textMute} sw={2}/>
          </button>
          <div style={{ flex:1, padding:'13px 14px', borderRadius:11, border:`1.5px solid ${T.rose}`,
            background:'#fff', display:'flex', alignItems:'center', gap:8,
          }}>
            <div style={{ fontSize:15, color:T.ink, letterSpacing:'-0.2px', fontWeight:500, flex:1 }}>{phone}</div>
            <div style={{ width:1.5, height:18, background:T.rose, animation:'kb-blink 1s infinite' }}/>
          </div>
        </div>

        {/* Channel selector */}
        <div style={{ marginTop:18 }}>
          <div style={{ fontSize:12, fontWeight:600, color:T.ink2, letterSpacing:'-0.2px', marginBottom:8 }}>{L.via}</div>
          <div style={{ display:'flex', gap:8 }}>
            {[
              { id:'wa',  l:L.sendWa,  bg:'#25D366', code:'WA' },
              { id:'sms', l:L.sendSms, bg:'#7A6A4A', code:'SMS' },
            ].map(opt=>{
              const on = channel === opt.id;
              return (
                <button key={opt.id} onClick={() => setChannel(opt.id)}
                  className="kb-press"
                  style={{
                    flex:1, padding:'13px 12px', borderRadius:11,
                    border: on ? `1.5px solid ${T.rose}` : `1px solid ${T.border}`,
                    background: on ? T.roseTint : '#fff',
                    color: on ? T.roseDeep : T.ink2,
                    display:'flex', alignItems:'center', gap:9,
                    cursor:'pointer', fontFamily:'inherit', textAlign:'left',
                  }}>
                  <div style={{ width:24, height:24, borderRadius:6, background:opt.bg, color:'#fff',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, letterSpacing:'0.5px' }}>
                    {opt.code}
                  </div>
                  <div style={{ flex:1, fontSize:12.5, fontWeight:600 }}>{opt.l}</div>
                  {on && (
                    <div style={{ width:18, height:18, borderRadius:'50%', background:T.rose,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon d={Icons.check} size={11} stroke="#fff" sw={2.4}/>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop:20 }}>
          <CTA onClick={() => nav.go('lo2')} icon={<Icon d={Icons.send} size={16} stroke="#fff" sw={2}/>}>
            {L.cta}
          </CTA>
        </div>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:11, margin:'24px 0' }}>
          <div style={{ flex:1, height:1, background:T.borderSoft }}/>
          <div style={{ fontSize:11, color:T.textMute, fontWeight:500 }}>{L.or}</div>
          <div style={{ flex:1, height:1, background:T.borderSoft }}/>
        </div>

        {/* Social */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <button className="kb-press"
            style={{
              padding:'13px 14px', borderRadius:11, background:'#000', color:'#fff',
              border:'none', fontSize:14, fontWeight:600, fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              cursor:'pointer',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.05 20.28c-.98.95-2.05.86-3.08.4-1.09-.47-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            {L.apple}
          </button>
          <button className="kb-press"
            style={{
              padding:'13px 14px', borderRadius:11, background:'#fff', color:T.ink,
              border:`1px solid ${T.border}`, fontSize:14, fontWeight:600, fontFamily:'inherit',
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              cursor:'pointer',
            }}>
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {L.google}
          </button>
        </div>

        {/* Legal */}
        <div style={{ fontSize:10.5, color:T.textMute, lineHeight:1.55, textAlign:'center', marginTop:22, padding:'0 8px 20px' }}>
          {L.legal}
        </div>
      </div>

      <style>{`@keyframes kb-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// LO-2. OTP VERIFICATION
// ════════════════════════════════════════════════════════════════════
function ScreenLoginOtp() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();

  const L = {
    title:     { kz:'Кодты енгізіңіз',  ru:'Введите код',           kr:'인증코드 입력' }[lang],
    h1:        { kz:'4 таңбалы кодты',  ru:'Введите 4-значный код', kr:'인증코드 4자리를' }[lang],
    h2:        { kz:'енгізіңіз',         ru:'',                      kr:'입력해 주세요' }[lang],
    sentTo:    { kz:'WhatsApp арқылы жіберілді',
                 ru:'Код отправлен через WhatsApp на',
                 kr:'WhatsApp 으로 인증코드를 보냈습니다' }[lang],
    change:    { kz:'Нөмірді өзгерту',   ru:'Изменить номер',        kr:'번호 변경' }[lang],
    resend:    { kz:'Кодты қайта жіберу', ru:'Отправить код снова',  kr:'코드 재전송' }[lang],
    countdown: { kz:(s)=>`${s} секундтан кейін`, ru:(s)=>`через ${s} сек.`, kr:(s)=>`${s}초 후` }[lang],
    cta:       { kz:'Растау',             ru:'Подтвердить',           kr:'확인' }[lang],
    troubleT:  { kz:'Код келмей жатыр ма?',     ru:'Код не приходит?',     kr:'코드를 받지 못하셨나요?' }[lang],
    troubleS:  { kz:'1–2 минут күтіп көріңіз немесе SMS арқылы қайта сұраңыз.',
                 ru:'Подождите 1–2 минуты или попробуйте отправить через SMS.',
                 kr:'1–2분 기다리거나 SMS로 다시 받아보세요.' }[lang],
  };

  // pseudo-state: 3 of 4 digits entered
  const digits = ['7','3','1',''];
  const focusIdx = 3;
  const [seconds, setSeconds] = React.useState(48);
  React.useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bg, position:'relative' }}>
      <TopBar title={L.title} back onBack={() => nav.back()}/>

      <div style={{
        padding:'28px 24px 18px',
        background:`linear-gradient(180deg, ${T.roseTint} 0%, transparent 100%)`,
      }}>
        <div className="kb-display" style={{ fontSize:23, lineHeight:1.3 }}>
          {L.h1}{L.h2 && <><br/>{L.h2}</>}
        </div>

        {/* Sent to */}
        <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:9, padding:'11px 13px',
          background:'#fff', border:`1px solid ${T.borderSoft}`, borderRadius:11,
        }}>
          <div style={{ width:30, height:30, borderRadius:8, background:'#25D366',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff',
            fontWeight:800, fontSize:10, letterSpacing:'0.5px' }}>WA</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10.5, color:T.textMute }}>{L.sentTo}</div>
            <div style={{ fontSize:13, fontWeight:600, marginTop:2, letterSpacing:'-0.2px' }}>+7 701 234 56**</div>
          </div>
          <button className="kb-press"
            style={{ background:'none', border:'none', fontSize:11, color:T.roseDeep, fontWeight:700,
              padding:'5px 9px', borderRadius:6, cursor:'pointer', fontFamily:'inherit' }}>
            {L.change}
          </button>
        </div>
      </div>

      {/* OTP boxes */}
      <div style={{ padding:'30px 24px 0', display:'flex', justifyContent:'center', gap:12 }}>
        {digits.map((d,i)=>{
          const filled = d !== '';
          const active = i === focusIdx;
          return (
            <div key={i} style={{
              width:60, height:72, borderRadius:14,
              border: active ? `2px solid ${T.rose}` :
                      filled ? `1.5px solid ${T.ink}` :
                               `1.5px solid ${T.borderSoft}`,
              background: active ? T.roseTint : filled ? '#fff' : T.bgSoft,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: active ? `0 0 0 4px ${T.rose}20` : 'none',
            }}>
              {filled ? (
                <div className="kb-display" style={{ fontSize:32, color:T.ink, lineHeight:1 }}>{d}</div>
              ) : active ? (
                <div style={{ width:2, height:30, background:T.rose, animation:'kb-blink 1s infinite' }}/>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Resend */}
      <div style={{ padding:'22px 24px 0', textAlign:'center' }}>
        {seconds > 0 ? (
          <div style={{ fontSize:12, color:T.textMute }}>
            {L.resend} · <span style={{ color:T.ink2, fontWeight:600 }}>{L.countdown(seconds)}</span>
          </div>
        ) : (
          <button className="kb-press"
            style={{ background:'none', border:'none', fontSize:13, color:T.roseDeep, fontWeight:700,
              padding:'8px 14px', cursor:'pointer', fontFamily:'inherit' }}>
            ↻ {L.resend}
          </button>
        )}
      </div>

      {/* Help */}
      <div style={{ padding:'26px 22px 0' }}>
        <div style={{ background:T.bgSoft, borderRadius:11, padding:'12px 14px',
          display:'flex', gap:9, alignItems:'flex-start',
          border:`1px solid ${T.borderSoft}`,
        }}>
          <Icon d={Icons.shield} size={15} stroke={T.textMute} sw={1.8}/>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:T.ink2, letterSpacing:'-0.2px' }}>{L.troubleT}</div>
            <div style={{ fontSize:11, color:T.text, lineHeight:1.55, marginTop:3 }}>{L.troubleS}</div>
          </div>
        </div>
      </div>

      {/* Fixed CTA */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(14px)',
        borderTop:`1px solid ${T.borderSoft}`, padding:'12px 16px 26px',
      }}>
        <CTA onClick={() => nav.go('lo3')}
          icon={<Icon d={Icons.check} size={17} stroke="#fff" sw={2.4}/>}>
          {L.cta}
        </CTA>
      </div>

      <style>{`@keyframes kb-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// LO-3. PERMISSIONS / CONSENT
// ════════════════════════════════════════════════════════════════════
function ScreenLoginConsent() {
  const t = useT();
  const nav = useNav();
  const lang = useLang();

  const L = {
    title: { kz:'Қол жетімділік', ru:'Доступ', kr:'권한 동의' }[lang],
    h1:    { kz:'Соңғы қадам —', ru:'Последний шаг —', kr:'마지막 단계 —' }[lang],
    h2:    { kz:'қажетті рұқсат',    ru:'необходимые согласия', kr:'필요한 권한' }[lang],
    sub:   { kz:'Қызметті бастамас бұрын төмендегі рұқсаттарға келісіміңізді растаңыз. Кез келген уақытта параметрлерден өзгерте аласыз.',
             ru:'Подтвердите согласия ниже. Изменить можно в настройках в любой момент.',
             kr:'아래 항목에 동의해 주세요. 설정에서 언제든 변경 가능합니다.' }[lang],
    selectAll:{ kz:'Барлығын таңдау',   ru:'Выбрать всё',         kr:'전체 선택' }[lang],
    selectAllSub:{ kz:'Барлық міндетті және қосымша рұқсаттар', ru:'Все обязательные и опциональные', kr:'필수 및 선택 항목 전체' }[lang],
    requiredLabel:{ kz:'МІНДЕТТІ',      ru:'ОБЯЗАТЕЛЬНО',         kr:'필수' }[lang],
    optionalLabel:{ kz:'ҚОСЫМША',       ru:'ОПЦИОНАЛЬНО',         kr:'선택' }[lang],
    view:    { kz:'Қарау',             ru:'Подробнее',            kr:'보기' }[lang],
    cta:     { kz:'Бастау',             ru:'Начать пользоваться', kr:'시작하기' }[lang],
    note:    { kz:'Қызмет көрсетудің барлық кезеңінде дербес деректер тек ішкі мақсаттарда пайдаланылады, үшінші тарапқа берілмейді.',
               ru:'Персональные данные используются только в рамках сервиса и не передаются третьим лицам.',
               kr:'개인정보는 서비스 운영 목적으로만 사용되며 제3자에게 제공되지 않습니다.' }[lang],
  };

  const items = [
    {
      key:'tos', req:true,
      title:{ kz:'Қызмет шарттары', ru:'Условия сервиса', kr:'서비스 이용 약관' }[lang],
      sub:{ kz:'Платформаны пайдалану ережелері', ru:'Правила использования платформы', kr:'플랫폼 이용 규칙' }[lang],
      icon:Icons.doc,
    },
    {
      key:'pp', req:true,
      title:{ kz:'Дербес деректерді өңдеу', ru:'Обработка персональных данных', kr:'개인정보 처리방침' }[lang],
      sub:{ kz:'Аты, телефон, WhatsApp/Telegram ID', ru:'Имя, телефон, ID мессенджеров', kr:'이름·전화·메신저 ID' }[lang],
      icon:Icons.shield,
    },
    {
      key:'med', req:true,
      title:{ kz:'Медициналық кеңес ақпараты', ru:'Информация для медицинской консультации', kr:'의료 상담 정보 수집·이용' }[lang],
      sub:{ kz:'Қызықтыратын процедура, фото, нота', ru:'Интересующие процедуры, фото, заметки', kr:'관심 시술·사진·문의 내용' }[lang],
      icon:Icons.hospital,
    },
    {
      key:'notif', req:false,
      title:{ kz:'WhatsApp · Telegram хабарландырулар', ru:'Уведомления WhatsApp · Telegram', kr:'WhatsApp · Telegram 알림 수신' }[lang],
      sub:{ kz:'Жаңа клиникалар, акциялар, кейінгі күтім', ru:'Новые клиники, аftercare, новости', kr:'신규 클리닉·사후관리·소식' }[lang],
      icon:Icons.chat,
    },
    {
      key:'cam', req:false,
      title:{ kz:'Камера және сурет кітапханасы', ru:'Камера и Фото', kr:'카메라 · 사진 접근' }[lang],
      sub:{ kz:'Кеңес кезінде фото жіберу үшін', ru:'Чтобы приложить фото к консультации', kr:'상담 시 사진 첨부용' }[lang],
      icon:Icons.camera,
    },
  ];

  const [state, setState] = React.useState(() => {
    const s = {};
    items.forEach(i => { s[i.key] = i.req; });
    return s;
  });
  const allOn = items.every(i => state[i.key]);
  const setOne = (k, v) => setState(s => ({ ...s, [k]:v }));
  const setAll = (v) => {
    const next = {};
    items.forEach(i => { next[i.key] = v ? true : i.req; });
    setState(next);
  };
  const canProceed = items.filter(i => i.req).every(i => state[i.key]);

  return (
    <div className="kb-screen" style={{ height:'100%', overflow:'auto', background:T.bgWarm, position:'relative' }}>
      <TopBar title={L.title} back onBack={() => nav.back()}/>

      <div style={{
        padding:'18px 22px 18px',
        background:`linear-gradient(180deg, ${T.roseTint} 0%, transparent 100%)`,
      }}>
        <div className="kb-display" style={{ fontSize:22, lineHeight:1.3 }}>
          {L.h1}<br/>{L.h2}
        </div>
        <div style={{ fontSize:12.5, color:T.text, marginTop:8, lineHeight:1.55, letterSpacing:'-0.1px' }}>
          {L.sub}
        </div>
      </div>

      <div style={{ padding:'4px 16px 130px' }}>
        {/* Select all */}
        <button onClick={() => setAll(!allOn)}
          className="kb-press"
          style={{
            width:'100%', padding:'14px 16px', borderRadius:14,
            background: allOn ? T.roseTint : '#fff',
            border:`1.5px solid ${allOn ? T.rose : T.borderSoft}`,
            display:'flex', alignItems:'center', gap:12,
            cursor:'pointer', fontFamily:'inherit', textAlign:'left',
            marginTop:12,
          }}>
          <div style={{ width:24, height:24, borderRadius:7,
            border: allOn ? `1.5px solid ${T.rose}` : `1.5px solid ${T.border}`,
            background: allOn ? T.rose : '#fff',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          }}>
            {allOn && <Icon d={Icons.check} size={14} stroke="#fff" sw={2.6}/>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700, color:T.ink, letterSpacing:'-0.3px' }}>{L.selectAll}</div>
            <div style={{ fontSize:11, color:T.textMute, marginTop:2 }}>{L.selectAllSub}</div>
          </div>
        </button>

        {/* Items */}
        <div className="kb-card" style={{ marginTop:12, padding:0, overflow:'hidden' }}>
          {items.map((it,i,arr)=>{
            const on = state[it.key];
            return (
              <button key={it.key}
                onClick={() => !it.req && setOne(it.key, !on)}
                disabled={it.req}
                className="kb-press"
                style={{
                  width:'100%', padding:'14px', background:'#fff',
                  border:'none', borderBottom: i<arr.length-1 ? `1px solid ${T.borderSoft}` : 'none',
                  display:'flex', alignItems:'flex-start', gap:11,
                  cursor: it.req ? 'default' : 'pointer', fontFamily:'inherit', textAlign:'left',
                }}>
                <div style={{ width:22, height:22, borderRadius:6,
                  border: on ? `1.5px solid ${T.rose}` : `1.5px solid ${T.border}`,
                  background: on ? T.rose : '#fff',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1,
                }}>
                  {on && <Icon d={Icons.check} size={12} stroke="#fff" sw={2.5}/>}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <div style={{
                      padding:'2px 6px', borderRadius:4,
                      background: it.req ? '#FCE7EC' : '#F0EDE8',
                      color: it.req ? T.roseDeep : T.textMute,
                      fontSize:9, fontWeight:800, letterSpacing:'0.5px',
                    }}>{it.req ? L.requiredLabel : L.optionalLabel}</div>
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.ink, letterSpacing:'-0.2px' }}>{it.title}</div>
                  <div style={{ fontSize:11, color:T.textMute, marginTop:3, lineHeight:1.5 }}>{it.sub}</div>
                </div>
                <div style={{ width:30, height:30, borderRadius:8, background:T.bgSoft, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Icon d={it.icon} size={15} stroke={T.ink2} sw={1.8}/>
                </div>
                <span style={{ background:'none', border:'none', fontSize:10.5, color:T.roseDeep,
                  fontWeight:600, padding:'2px 6px', fontFamily:'inherit', flexShrink:0, marginTop:2 }}>
                  {L.view} ›
                </span>
              </button>
            );
          })}
        </div>

        {/* Privacy note */}
        <div style={{ marginTop:14, padding:'12px 14px', background:'#fff',
          border:`1px solid ${T.borderSoft}`, borderRadius:11,
          display:'flex', gap:9, alignItems:'flex-start' }}>
          <div style={{ width:26, height:26, borderRadius:7, background:'#E5F4EC', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon d={Icons.shieldCheck} size={14} stroke="#1F7A4D" sw={2}/>
          </div>
          <div style={{ fontSize:11, color:T.text, lineHeight:1.55 }}>
            {L.note}
          </div>
        </div>
      </div>

      <div style={{ position:'absolute', left:0, right:0, bottom:0,
        background:'rgba(255,255,255,0.96)', backdropFilter:'blur(14px)',
        borderTop:`1px solid ${T.borderSoft}`, padding:'12px 16px 26px',
      }}>
        <CTA onClick={() => nav.go('home')}
          variant={canProceed ? 'primary' : 'outline'}
          icon={canProceed ? <Icon d={Icons.check} size={17} stroke="#fff" sw={2.4}/> : null}>
          {L.cta}
        </CTA>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLoginPhone, ScreenLoginOtp, ScreenLoginConsent });
