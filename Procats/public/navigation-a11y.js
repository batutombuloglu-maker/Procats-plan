/* Native buttons preserve the menu appearance with keyboard and assistive input. */
(()=>{'use strict';
 const nav=document.querySelector('.obsidian-nav');if(!nav)return;
 const labels={tr:{home:'Ana sayfa',obsidian:'Serbest plan',tasks:'Görevler',exams:'Denemeler',knowledge:'Bilgi Hazinesi',collection:'Bilgi Koleksiyonu',lists:'Listeler',timers:'Sayaçlar',notes:'Hızlı notlar',bookmarks:'Kaynaklar',vault:'Veri kasası',settings:'Ayarlar'},en:{home:'Home',obsidian:'Free plan',tasks:'Tasks',exams:'Exams',knowledge:'Knowledge treasury',collection:'Knowledge collection',lists:'Lists',timers:'Timers',notes:'Quick notes',bookmarks:'Resources',vault:'Data vault',settings:'Settings'},de:{home:'Start',obsidian:'Freier Plan',tasks:'Aufgaben',exams:'Prüfungen',knowledge:'Wissensschatz',collection:'Wissenssammlung',lists:'Listen',timers:'Timer',notes:'Kurznotizen',bookmarks:'Ressourcen',vault:'Datentresor',settings:'Einstellungen'}};
 function reflect(){const words=globalThis.ProcatsLocale?.messages(labels,document.documentElement.lang) || labels[document.documentElement.lang]||labels.tr;nav.setAttribute('aria-label',({tr:'Ana gezinme',en:'Main navigation',de:'Hauptnavigation'})[document.documentElement.lang]||'Ana gezinme');
  for(const b of nav.querySelectorAll('.nav-item')){const view=/switchView\('([a-z]+)'\)/.exec(b.getAttribute('data-action-click')||'')?.[1]||'settings';b.setAttribute('aria-label',words[view]);b.title=words[view];if(view!=='settings'&&b.classList.contains('active'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}
 }
 new MutationObserver(reflect).observe(nav,{subtree:true,attributes:true,attributeFilter:['class']});
 new MutationObserver(reflect).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});reflect();
})();
