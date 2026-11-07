(() => {
  const options = [
    ['en', 'English'], ['tr', 'Türkçe'], ['de', 'Deutsch'], ['es', 'Español'],
    ['fr', 'Français'], ['it', 'Italiano'], ['ar', 'العربية'],
    ['az', 'Azərbaycanca'], ['kk', 'Қазақша'], ['ky', 'Кыргызча'],
    ['uz', 'Oʻzbekcha'], ['tk', 'Türkmençe'], ['sv', 'Svenska'],
    ['da', 'Dansk'], ['nb', 'Norsk bokmål'], ['fi', 'Suomi'], ['is', 'Íslenska'],
    ['zh-CN', '简体中文'], ['ja', '日本語'], ['ko', '한국어'],
  ];
  const supported = new Set(options.map(([code]) => code));
  const groups = [
    'Sign in|Create account|Email|Password|Repeat password|Forgot password|Send reset link|Back to sign in|Your tasks, notes and plans across your devices.|Verify your email|Open the link in your email, then return here and continue.|I verified my email|Resend verification email|Use another account|Opening your records…|Try without an account · this device only|Delete my account|Incorrect email or password.|Unable to connect. Check your internet connection and try again.|Choose a password with at least 12 characters.|The passwords do not match.',
    'Home|Tasks|Plan|Exams|Timers|Quick notes|Resources|Lists|Data vault|Settings|More|Language|Appearance|Theme|Workspace|Notifications|Account and records|Cloud sync|Sign out|Help and information|Support',
    'Calendar|Today|Export summary|Progress for the selected day|New task|Task title|Details|In progress|Completed|Missed|Last 30 days focus heatmap|New note|Add resource|New folder|Start|Pause|Reset|Classic|Exam clock|Time is up!|Focus time',
    'Save|Cancel|Confirm|Delete|Edit|Copy|Paste|Rename|Close|Back|Search|Title|Description|Add data|Download backup|Restore backup|Sound|Vibration|Silent|Full screen|Exit full screen',
  ].map(group => group.split('|'));
  const normalize = value => value.trim().replace(/^[+✓]\s*/, '').replace(/(?:…|\.{3})$/, '').toLowerCase();
  const catalogs = new Map();
  const resolvedTables = new WeakMap();
  for (const [code, rows] of Object.entries(globalThis.ProcatsLanguagePacks || {})) {
    const catalog = new Map();
    for (const [index, group] of groups.entries()) {
      const values = rows[index]?.split('|') || [];
      if (values.length !== group.length || values.some(value => !value.trim())) {
        throw new Error(`Invalid language catalog: ${code}, row ${index + 1}`);
      }
      group.forEach((value, index) => catalog.set(normalize(value), values[index]));
    }
    catalogs.set(code, catalog);
  }
  const aliases = new Map(Object.entries({
    'free plan': 'plan', 'practice exams': 'exams', 'practice exam': 'exams',
    'timer': 'timers', 'countdown': 'timers', 'digital arsenal': 'resources',
    'personal data vault': 'data vault', 'progress for this day': 'progress for the selected day',
    'selected day progress': 'progress for the selected day', 'progress for selected day': 'progress for the selected day',
    'add task': 'new task', 'add new task': 'new task', 'add note': 'new note',
    'create folder': 'new folder', 'new page': 'new note', 'export data (.json)': 'download backup',
    'export backup': 'download backup', 'import backup': 'restore backup',
    'delete my account and data': 'delete my account', 'delete account and data': 'delete my account', 'delete account': 'delete my account', 'go back': 'back',
    'fullscreen': 'full screen', 'exit fullscreen': 'exit full screen',
    'themes': 'theme', 'app language': 'language', 'vibrate': 'vibration',
  }));
  function phrase(value, code) {
    if (typeof value !== 'string') return value;
    const key = normalize(value);
    const translated = catalogs.get(code)?.get(aliases.get(key) || key);
    if (!translated) return value;
    const prefix = value.match(/^[+✓]\s*/)?.[0] || '';
    return prefix + translated;
  }
  function message(table, code, key) {
    if (table[code]?.[key] !== undefined) return table[code][key];
    return phrase(table.en?.[key] ?? table.tr?.[key], code);
  }
  function messages(table, code) {
    if (table[code]) return table[code];
    if (!resolvedTables.has(table)) resolvedTables.set(table, new Map());
    const byLanguage = resolvedTables.get(table);
    if (!byLanguage.has(code)) {
      byLanguage.set(code, Object.fromEntries(Object.entries(table.en || table.tr || {}).map(([key, value]) => [key, phrase(value, code)])));
    }
    return byLanguage.get(code);
  }
  function resolve(candidates) {
    for (const candidate of candidates || []) {
      if (typeof candidate !== 'string') continue;
      const base = candidate.toLowerCase().split('-')[0];
      if (supported.has(candidate)) return candidate;
      if (base === 'zh') return 'zh-CN';
      if (base === 'no' || base === 'nn') return 'nb';
      if (supported.has(base)) return base;
    }
    return 'en';
  }
  function apply(code) {
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  }
  function fill(select, code) {
    select.replaceChildren(...options.map(([value, label]) => {
      const option = new Option(label, value);
      option.lang = value;
      return option;
    }));
    select.value = code;
    select.setAttribute('aria-label', phrase('Language', code));
  }
  globalThis.ProcatsLocale = Object.freeze({options, supported: code => supported.has(code), resolve, phrase, message, messages, apply, fill});
})();
