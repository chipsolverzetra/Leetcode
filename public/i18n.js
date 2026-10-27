// UI strings. Add a language by adding a key here; the picker lists them automatically.
// MTA alert text itself is translated by the MTA feed where available (the server passes ?lang=).

export const LANGUAGES = {
  en: 'English',
  es: 'Español',
  zh: '中文',
  ru: 'Русский',
  bn: 'বাংলা',
  ko: '한국어',
};

const STRINGS = {
  en: {
    demoData: 'Demo data',
    tagline: 'Live subway status, arrivals and station access',
    tabStatus: 'Service status', tabMap: 'Map', tabAccess: 'Accessibility', tabFavorites: 'Favorites',
    good: 'Good service', delays: 'Delays', changes: 'Service change', suspended: 'Suspended',
    linesAffected: 'lines with issues', allGood: 'All lines running normally',
    updated: 'Updated', sampleData: 'Sample data — MTA feed not reachable',
    searchStation: 'Search stations', arrivals: 'Next trains', uptown: 'Uptown / Queens-bound', downtown: 'Downtown / Brooklyn-bound',
    min: 'min', now: 'Now', noTrains: 'No trains reported',
    outages: 'Elevator & escalator outages', elevator: 'Elevator', escalator: 'Escalator', upcoming: 'Planned',
    returnBy: 'Expected back', adaOnly: 'Accessible routes only', stepFree: 'Step-free station',
    save: 'Save', saved: 'Saved', remove: 'Remove', noFavorites: 'Save a line or station to see it here.',
    notify: 'Notify me about changes', notifyOn: 'Alerts on', signIn: 'Sign in', signOut: 'Sign out',
    email: 'Email', password: 'Password', createAccount: 'Create account', or: 'or', google: 'Continue with Google',
    localMode: 'Saved on this device. Sign in to sync across devices.',
  },
  es: {
    demoData: 'Datos de demostración',
    tagline: 'Estado del metro, llegadas y accesibilidad en vivo',
    tabStatus: 'Estado del servicio', tabMap: 'Mapa', tabAccess: 'Accesibilidad', tabFavorites: 'Favoritos',
    good: 'Buen servicio', delays: 'Retrasos', changes: 'Cambio de servicio', suspended: 'Suspendido',
    linesAffected: 'líneas con problemas', allGood: 'Todas las líneas funcionan con normalidad',
    updated: 'Actualizado', sampleData: 'Datos de ejemplo: no se pudo conectar con la MTA',
    searchStation: 'Buscar estaciones', arrivals: 'Próximos trenes', uptown: 'Hacia el norte / Queens', downtown: 'Hacia el sur / Brooklyn',
    min: 'min', now: 'Ahora', noTrains: 'No hay trenes reportados',
    outages: 'Ascensores y escaleras fuera de servicio', elevator: 'Ascensor', escalator: 'Escalera mecánica', upcoming: 'Programado',
    returnBy: 'Regreso previsto', adaOnly: 'Solo rutas accesibles', stepFree: 'Estación sin escalones',
    save: 'Guardar', saved: 'Guardado', remove: 'Quitar', noFavorites: 'Guarde una línea o estación para verla aquí.',
    notify: 'Avisarme de cambios', notifyOn: 'Alertas activadas', signIn: 'Iniciar sesión', signOut: 'Cerrar sesión',
    email: 'Correo', password: 'Contraseña', createAccount: 'Crear cuenta', or: 'o', google: 'Continuar con Google',
    localMode: 'Guardado en este dispositivo. Inicie sesión para sincronizar.',
  },
  zh: {
    demoData: '演示数据',
    tagline: '实时地铁状态、到站信息与车站无障碍设施',
    tabStatus: '服务状态', tabMap: '地图', tabAccess: '无障碍', tabFavorites: '收藏',
    good: '服务正常', delays: '延误', changes: '服务变更', suspended: '暂停',
    linesAffected: '条线路有问题', allGood: '所有线路运行正常',
    updated: '更新于', sampleData: '示例数据 — 无法连接 MTA',
    searchStation: '搜索车站', arrivals: '下一班列车', uptown: '往北 / 往皇后区', downtown: '往南 / 往布鲁克林',
    min: '分钟', now: '即将到站', noTrains: '暂无列车信息',
    outages: '电梯和扶梯停运', elevator: '电梯', escalator: '扶梯', upcoming: '计划停运',
    returnBy: '预计恢复', adaOnly: '仅无障碍路线', stepFree: '无台阶车站',
    save: '收藏', saved: '已收藏', remove: '移除', noFavorites: '收藏线路或车站后将显示在这里。',
    notify: '有变化时通知我', notifyOn: '提醒已开启', signIn: '登录', signOut: '退出',
    email: '电子邮件', password: '密码', createAccount: '创建账户', or: '或', google: '使用 Google 继续',
    localMode: '已保存在本设备。登录后可跨设备同步。',
  },
  ru: {
    demoData: 'Демо-данные',
    tagline: 'Статус метро, прибытие поездов и доступность станций',
    tabStatus: 'Статус линий', tabMap: 'Карта', tabAccess: 'Доступность', tabFavorites: 'Избранное',
    good: 'Работает нормально', delays: 'Задержки', changes: 'Изменения', suspended: 'Приостановлено',
    linesAffected: 'линий с проблемами', allGood: 'Все линии работают нормально',
    updated: 'Обновлено', sampleData: 'Пример данных — нет связи с MTA',
    searchStation: 'Поиск станций', arrivals: 'Ближайшие поезда', uptown: 'На север / в Квинс', downtown: 'На юг / в Бруклин',
    min: 'мин', now: 'Сейчас', noTrains: 'Нет данных о поездах',
    outages: 'Неработающие лифты и эскалаторы', elevator: 'Лифт', escalator: 'Эскалатор', upcoming: 'Запланировано',
    returnBy: 'Ожидается', adaOnly: 'Только доступные маршруты', stepFree: 'Станция без ступеней',
    save: 'Сохранить', saved: 'Сохранено', remove: 'Удалить', noFavorites: 'Сохраните линию или станцию, чтобы видеть её здесь.',
    notify: 'Уведомлять об изменениях', notifyOn: 'Уведомления вкл.', signIn: 'Войти', signOut: 'Выйти',
    email: 'Эл. почта', password: 'Пароль', createAccount: 'Создать аккаунт', or: 'или', google: 'Войти через Google',
    localMode: 'Сохранено на этом устройстве. Войдите для синхронизации.',
  },
  bn: {
    demoData: 'ডেমো তথ্য',
    tagline: 'সাবওয়ের সরাসরি অবস্থা, ট্রেন আসার সময় ও স্টেশনের সুবিধা',
    tabStatus: 'সেবার অবস্থা', tabMap: 'মানচিত্র', tabAccess: 'প্রবেশযোগ্যতা', tabFavorites: 'প্রিয়',
    good: 'স্বাভাবিক সেবা', delays: 'বিলম্ব', changes: 'সেবায় পরিবর্তন', suspended: 'স্থগিত',
    linesAffected: 'লাইনে সমস্যা', allGood: 'সব লাইন স্বাভাবিকভাবে চলছে',
    updated: 'হালনাগাদ', sampleData: 'নমুনা তথ্য — MTA-র সাথে সংযোগ নেই',
    searchStation: 'স্টেশন খুঁজুন', arrivals: 'পরের ট্রেন', uptown: 'উত্তরমুখী / কুইন্সমুখী', downtown: 'দক্ষিণমুখী / ব্রুকলিনমুখী',
    min: 'মিনিট', now: 'এখন', noTrains: 'কোনো ট্রেনের তথ্য নেই',
    outages: 'লিফট ও এস্কেলেটর বন্ধ', elevator: 'লিফট', escalator: 'এস্কেলেটর', upcoming: 'পরিকল্পিত',
    returnBy: 'চালু হওয়ার সম্ভাব্য সময়', adaOnly: 'শুধু প্রবেশযোগ্য পথ', stepFree: 'সিঁড়িবিহীন স্টেশন',
    save: 'সংরক্ষণ', saved: 'সংরক্ষিত', remove: 'সরান', noFavorites: 'এখানে দেখতে একটি লাইন বা স্টেশন সংরক্ষণ করুন।',
    notify: 'পরিবর্তন হলে জানাও', notifyOn: 'সতর্কবার্তা চালু', signIn: 'সাইন ইন', signOut: 'সাইন আউট',
    email: 'ইমেইল', password: 'পাসওয়ার্ড', createAccount: 'অ্যাকাউন্ট খুলুন', or: 'অথবা', google: 'Google দিয়ে চালিয়ে যান',
    localMode: 'এই ডিভাইসে সংরক্ষিত। সব ডিভাইসে পেতে সাইন ইন করুন।',
  },
  ko: {
    demoData: '데모 데이터',
    tagline: '실시간 지하철 운행 상태, 도착 정보, 역 접근성',
    tabStatus: '운행 상태', tabMap: '지도', tabAccess: '접근성', tabFavorites: '즐겨찾기',
    good: '정상 운행', delays: '지연', changes: '운행 변경', suspended: '운행 중단',
    linesAffected: '개 노선 문제', allGood: '모든 노선 정상 운행 중',
    updated: '업데이트', sampleData: '샘플 데이터 — MTA에 연결할 수 없음',
    searchStation: '역 검색', arrivals: '다음 열차', uptown: '북행 / 퀸스 방면', downtown: '남행 / 브루클린 방면',
    min: '분', now: '곧 도착', noTrains: '열차 정보 없음',
    outages: '엘리베이터·에스컬레이터 운행 중지', elevator: '엘리베이터', escalator: '에스컬레이터', upcoming: '예정',
    returnBy: '복구 예정', adaOnly: '무장애 경로만', stepFree: '계단 없는 역',
    save: '저장', saved: '저장됨', remove: '삭제', noFavorites: '노선이나 역을 저장하면 여기에 표시됩니다.',
    notify: '변경 시 알림 받기', notifyOn: '알림 켜짐', signIn: '로그인', signOut: '로그아웃',
    email: '이메일', password: '비밀번호', createAccount: '계정 만들기', or: '또는', google: 'Google로 계속',
    localMode: '이 기기에 저장됨. 로그인하면 기기 간 동기화됩니다.',
  },
};

let current = 'en';
export function setLang(code) { current = STRINGS[code] ? code : 'en'; document.documentElement.lang = current; }
export function getLang() { return current; }
export function t(key) { return STRINGS[current][key] ?? STRINGS.en[key] ?? key; }
export function applyStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
}
export function detectLang() {
  const nav = (navigator.language || 'en').slice(0, 2);
  return STRINGS[nav] ? nav : 'en';
}
