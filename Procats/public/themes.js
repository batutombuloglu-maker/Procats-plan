/* Theme names and storage migration. The original default palette stays in index.html. */
(() => {
  const themes = [
    {id:'default', names:['Klasik Koyu','Classic Dark','Klassisch Dunkel'], color:'#121214', accent:'#0a84ff'},
    {id:'cream', names:['Krem','Cream','Creme'], color:'#f4efe5', accent:'#816044', light:true},
    {id:'light', names:['Açık','Light','Hell'], color:'#f4f7fb', accent:'#3262ba', light:true},
    {id:'dark', names:['Koyu','Dark','Dunkel'], color:'#171e2b', accent:'#9caff4'},
    {id:'alpine', names:['Gece Vadisi','Night Valley','Nachttal'], color:'#101d1c', accent:'#bdd6ab', image:'01_gece_daglari'},
    {id:'solar', names:['Antik Güneş','Antique Sun','Antike Sonne'], color:'#ede5d5', accent:'#785b31', light:true, image:'02_gravur_gunes'},
    {id:'velvet', names:['Kadife Pati','Velvet Paw','Samtpfote'], color:'#28181e', accent:'#e4b7a1', image:'03_siyah_kedi'},
    {id:'swan', names:['Kuğu Gölü','Swan Lake','Schwanensee'], color:'#eceee6', accent:'#476254', light:true, image:'04_kugular'},
    {id:'heritage', names:['Zamansız Şehir','Timeless City','Zeitlose Stadt'], color:'#eee8d8', accent:'#76613b', light:true, image:'05_tarihi_meydan'},
    {id:'starlit', names:['Yıldız Tarlası','Starlit Fields','Sternenfelder'], color:'#132438', accent:'#f0d37b', image:'06_altin_tarlar_gece'},
    {id:'hibiscus', names:['Gece Hibiskusu','Midnight Hibiscus','Mitternachtshibiskus'], color:'#170e15', accent:'#f0a7bb', image:'07_hibiskus'},
    {id:'lily', names:['Ay Zambağı','Moon Lily','Mondlilie'], color:'#131d21', accent:'#ebc0b7', image:'08_zambaklar'},
    {id:'starry', names:['Yıldızlı Düş','Starry Dream','Sternentraum'], color:'#14223a', accent:'#f2d371', image:'09_yildizli_koy'},
    {id:'vinyl', names:['Bordo Plak','Burgundy Vinyl','Bordeaux-Vinyl'], color:'#241015', accent:'#f0a6b2', image:'10_bordo_muzik'}
  ];
  const normalize = value => themes.some(theme => theme.id === value) ? value : 'default';
  const label = (theme, lang = document.documentElement.lang) => theme.names[lang === 'en' ? 1 : lang === 'de' ? 2 : 0];
  const originalSet = window.setTheme;
  const originalLoad = window.loadTheme;
  function reflect() {
    if(window.ProcatsCustomThemes?.active){if(document.documentElement.dataset.theme!=='custom')window.ProcatsCustomThemes.apply();return;}
    const root = document.documentElement;
    const id = normalize(root.dataset.theme);
    const theme = themes.find(item => item.id === id);
    if(root.dataset.theme !== id) originalSet(id);
    root.dataset.themeTone = theme.light ? 'light' : 'dark';
    if(theme.image) root.dataset.themeArt = theme.image;
    else delete root.dataset.themeArt;
    root.toggleAttribute('data-theme-landscape', !!theme.landscape);
    root.style.setProperty('--theme-image', theme.image ? `url("/themes/${theme.image}.webp")` : 'none');
    root.style.setProperty('--theme-preview-base', theme.color);
    const positions={alpine:['50% 45%','50% 48%'],solar:['45% 42%','40% 44%'],velvet:['50% 50%','50% 50%'],swan:['50% 58%','50% 57%'],heritage:['50% 55%','50% 54%'],starlit:['50% 48%','50% 50%'],hibiscus:['50% 52%','50% 48%'],lily:['50% 50%','52% 50%'],starry:['50% 42%','50% 45%'],vinyl:['50% 50%','50% 52%']};
    root.style.setProperty('--theme-position-desktop',positions[id]?.[0]||'center');root.style.setProperty('--theme-position-mobile',positions[id]?.[1]||'center');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.color);
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === id)));
  }
  window.setTheme = value => { originalSet(normalize(value)); reflect(); };
  window.loadTheme = () => { originalLoad(); reflect(); };
  function menu() {
    const menu = document.getElementById('themeMenu');
    if(!menu) return;
    menu.querySelectorAll('[data-action-click^="setTheme("]').forEach(item => item.remove());
    menu.querySelector('[data-theme-menu]')?.remove();
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'context-menu-item'; button.dataset.themeMenu = 'true';
    button.textContent = ({tr:'Tema seç',en:'Choose theme',de:'Design wählen'})[document.documentElement.lang] || 'Tema seç';
    button.onclick = () => window.ProcatsUI?.settings('appearance');
    menu.prepend(button);
  }
  window.ProcatsThemes = {all:themes, normalize, label, apply:reflect};
  // Read before reflecting: the workspace has not run procatsInitialize yet.
  // Reflecting an empty root first would replace an existing saved selection.
  originalLoad(); reflect(); menu();
  const canvas = document.querySelector('.view-container');
  if(canvas && 'ResizeObserver' in window) new ResizeObserver(() => {
    canvas.style.setProperty('--theme-canvas-width', canvas.clientWidth+'px');
    canvas.style.setProperty('--theme-canvas-height', canvas.clientHeight+'px');
  }).observe(canvas);
  new MutationObserver(reflect).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  new MutationObserver(menu).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
