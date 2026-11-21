(() => {
  'use strict';
  const root = document.getElementById('view-collection');
  const store = window.ProcatsCollection;
  if (!root || !store) return;

  const copy = {
    tr: {
      title: 'Bilgi Koleksiyonu', subtitle: 'Öğrendiklerini kaydet, düzenle ve tekrar et.',
      all: 'Tümü', allCards: 'Tüm kartlar', words: 'Sözcükler', word: 'Sözcük',
      concepts: 'Kavramlar', concept: 'Kavram', facts: 'Genel bilgi', meaning: 'Anlamı',
      definition: 'Tanım', answer: 'Cevap', openMeaning: 'Anlamı göster', openDefinition: 'Tanımı göster',
      collections: 'Koleksiyonlar', search: 'Koleksiyonda ara…', searchLabel: 'Koleksiyonda ara',
      count: '{count} kart', one: '1 kart', noResults: 'Aradığın kart bulunamadı',
      noResultsHelp: 'Arama terimini veya seçili koleksiyonu değiştir.',
      empty: 'Henüz kart yok', emptyHelp: 'Bilgi ekle düğmesiyle ilk kartı oluştur.',
      review: 'Tekrar et', reviewHint: 'Cevabı hatırlamaya çalış, ardından kendini kontrol et.',
      reveal: 'Cevabı göster', next: 'Sonraki kart', finish: 'Bitir', closeCard: 'Kartı kapat',
      options: '{title} kart seçenekleri', edit: 'Düzenle', remove: 'Sil', closeForm: 'Formu kapat',
      addCard: 'Bilgi ekle', editCard: 'Kartı düzenle', saveCard: 'Kartı ekle', saveEdit: 'Değişiklikleri kaydet',
      addIntro: 'Hatırlamak istediğin bilgiyi yeni bir karta yaz.',
      editIntro: 'Kartın içeriğini ve yer aldığı koleksiyonları güncelle.',
      cardTitle: 'Başlık', titleHint: 'Örn. Mahir', titleRequired: 'Kartın başlığını yaz.',
      answerField: 'Anlamı veya cevabı', answerHint: 'Cevabı kendi cümlelerinle yaz…',
      answerRequired: 'Kartın cevabını yaz.', membershipHelp: 'Kartın görüneceği bir veya daha fazla koleksiyon seç.',
      membershipError: 'En az bir koleksiyon seç.', cancel: 'Vazgeç',
      newCollection: 'Yeni koleksiyon', createCollection: 'Koleksiyonu oluştur',
      collectionIntro: 'Benzer kartları bir arada bulmak için bir koleksiyon oluştur.',
      collectionName: 'Koleksiyon adı', collectionHint: 'Örn. Sınavda çıkanlar',
      collectionRequired: 'Koleksiyonun adını yaz.', duplicate: 'Bu adda bir koleksiyon zaten var.',
      deleteCard: 'Kartı sil', deleteCopy: '«{title}» kartı yer aldığı tüm koleksiyonlardan kaldırılacak.',
      collectionOptions: '{title} koleksiyon seçenekleri', renameCollection: 'Yeniden adlandır',
      renameIntro: 'Yeni bir ad yaz. Kartların bu koleksiyonda kalır.',
      deleteCollection: 'Koleksiyonu sil',
      deleteCollectionCopy: '«{title}» koleksiyonu silinecek. Kartlar diğer koleksiyonlarında kalır. Yalnızca bu koleksiyondaki kartlar Genel bilgi’ye taşınır.',
      saveFailed: 'Değişiklik kaydedilemedi. Lütfen tekrar dene.',
      changed: 'Bu kart başka bir yerde değişti. Kartı yeniden açıp düzenle.',
      collectionChanged: 'Bu koleksiyon başka bir yerde değişti. Seçeneklerini yeniden aç.',
      invalidEdit: 'Kart veya koleksiyon bilgilerini kontrol et.',
      limit: 'Bu metin veya koleksiyon, güvenli kayıt kapasitesini aşıyor. Metni birkaç karta böl. Yazdıkların formda korunuyor.',
      locked: 'Koleksiyon kayıtları şu anda düzenlemeye kapalı.',
      offline: 'Çevrimdışı · Koleksiyon değişiklikleri bu cihazda bekliyor.',
      storage: 'Koleksiyon değişiklikleri cihaza kaydedilemedi.',
      invalid: 'Koleksiyon kayıtları okunamadı. Mevcut kayıtlar korundu.',
      unavailable: 'Koleksiyon eşitlemesi kullanılamıyor. Değişiklikler bu cihazda bekliyor.',
      conflict: 'Koleksiyon iki cihazda değişti. Kullanılacak sürümü seç.',
      local: 'Bu cihazdaki sürümü kullan', remote: 'Diğer cihazdaki sürümü kullan', vault: 'Veri kasası',
    },
    en: {
      title: 'Knowledge collection', subtitle: 'Save, organize and review what you learn.',
      all: 'All', allCards: 'All cards', words: 'Words', word: 'Word',
      concepts: 'Concepts', concept: 'Concept', facts: 'General knowledge', meaning: 'Meaning',
      definition: 'Definition', answer: 'Answer', openMeaning: 'Show meaning', openDefinition: 'Show definition',
      collections: 'Collections', search: 'Search collection…', searchLabel: 'Search collection',
      count: '{count} cards', one: '1 card', noResults: 'No matching cards',
      noResultsHelp: 'Change your search or try another collection.',
      empty: 'No cards yet', emptyHelp: 'Choose Add knowledge to create your first card.',
      review: 'Review', reviewHint: 'Try to remember the answer, then check it.',
      reveal: 'Show answer', next: 'Next card', finish: 'Done', closeCard: 'Close card',
      options: 'Options for {title}', edit: 'Edit', remove: 'Delete', closeForm: 'Close form',
      addCard: 'Add knowledge', editCard: 'Edit card', saveCard: 'Add card', saveEdit: 'Save changes',
      addIntro: 'Write what you want to remember on a new card.',
      editIntro: 'Update the card and the collections it appears in.',
      cardTitle: 'Title', titleHint: 'e.g. Skillful', titleRequired: 'Enter a card title.',
      answerField: 'Meaning or answer', answerHint: 'Write the answer in your own words…',
      answerRequired: 'Enter the answer.', membershipHelp: 'Choose one or more collections for this card.',
      membershipError: 'Choose at least one collection.', cancel: 'Cancel',
      newCollection: 'New collection', createCollection: 'Create collection',
      collectionIntro: 'Create a collection to keep related cards together.',
      collectionName: 'Collection name', collectionHint: 'e.g. Exam practice',
      collectionRequired: 'Enter a collection name.', duplicate: 'A collection with this name already exists.',
      deleteCard: 'Delete card', deleteCopy: '“{title}” will be removed from all its collections.',
      collectionOptions: 'Collection options for {title}', renameCollection: 'Rename',
      renameIntro: 'Enter a new name. Your cards stay in this collection.',
      deleteCollection: 'Delete collection',
      deleteCollectionCopy: '“{title}” will be deleted. Cards stay in their other collections. Cards that belong only here move to General knowledge.',
      saveFailed: 'Could not save the change. Please try again.',
      changed: 'This card changed elsewhere. Reopen it to edit the latest version.',
      collectionChanged: 'This collection changed elsewhere. Reopen its options.',
      invalidEdit: 'Check the card or collection details.',
      limit: 'The collection record limit was reached.',
      locked: 'Collection records are currently locked.',
      offline: 'Offline · Collection changes remain on this device.',
      storage: 'Collection changes could not be saved on this device.',
      invalid: 'Collection records could not be read. Existing records were kept.',
      unavailable: 'Collection sync is unavailable. Changes remain on this device.',
      conflict: 'The collection changed on two devices. Choose which version to use.',
      local: 'Use this device’s version', remote: 'Use the other device’s version', vault: 'Data vault',
    },
    de: {
      title: 'Wissenssammlung', subtitle: 'Speichere, ordne und wiederhole, was du lernst.',
      all: 'Alle', allCards: 'Alle Karten', words: 'Wörter', word: 'Wort',
      concepts: 'Begriffe', concept: 'Begriff', facts: 'Allgemeinwissen', meaning: 'Bedeutung',
      definition: 'Definition', answer: 'Antwort', openMeaning: 'Bedeutung anzeigen', openDefinition: 'Definition anzeigen',
      collections: 'Sammlungen', search: 'Sammlung durchsuchen…', searchLabel: 'Sammlung durchsuchen',
      count: '{count} Karten', one: '1 Karte', noResults: 'Keine passenden Karten',
      noResultsHelp: 'Ändere deine Suche oder wähle eine andere Sammlung.',
      empty: 'Noch keine Karten', emptyHelp: 'Wähle Wissen hinzufügen, um deine erste Karte anzulegen.',
      review: 'Wiederholen', reviewHint: 'Versuche dich zu erinnern und prüfe dann die Antwort.',
      reveal: 'Antwort anzeigen', next: 'Nächste Karte', finish: 'Fertig', closeCard: 'Karte schließen',
      options: 'Optionen für {title}', edit: 'Bearbeiten', remove: 'Löschen', closeForm: 'Formular schließen',
      addCard: 'Wissen hinzufügen', editCard: 'Karte bearbeiten', saveCard: 'Karte hinzufügen', saveEdit: 'Änderungen speichern',
      addIntro: 'Schreibe auf eine neue Karte, was du dir merken möchtest.',
      editIntro: 'Aktualisiere die Karte und die Sammlungen, in denen sie erscheint.',
      cardTitle: 'Titel', titleHint: 'z. B. geschickt', titleRequired: 'Gib einen Kartentitel ein.',
      answerField: 'Bedeutung oder Antwort', answerHint: 'Schreibe die Antwort in deinen eigenen Worten…',
      answerRequired: 'Gib eine Antwort ein.', membershipHelp: 'Wähle eine oder mehrere Sammlungen für diese Karte.',
      membershipError: 'Wähle mindestens eine Sammlung.', cancel: 'Abbrechen',
      newCollection: 'Neue Sammlung', createCollection: 'Sammlung erstellen',
      collectionIntro: 'Fasse ähnliche Karten in einer Sammlung zusammen.',
      collectionName: 'Sammlungsname', collectionHint: 'z. B. Prüfungsvorbereitung',
      collectionRequired: 'Gib einen Sammlungsnamen ein.', duplicate: 'Eine Sammlung mit diesem Namen existiert bereits.',
      deleteCard: 'Karte löschen', deleteCopy: '„{title}“ wird aus allen Sammlungen entfernt.',
      collectionOptions: 'Sammlungsoptionen für {title}', renameCollection: 'Umbenennen',
      renameIntro: 'Gib einen neuen Namen ein. Deine Karten bleiben in dieser Sammlung.',
      deleteCollection: 'Sammlung löschen',
      deleteCollectionCopy: '„{title}“ wird gelöscht. Die Karten bleiben in ihren anderen Sammlungen. Karten, die nur hier enthalten sind, werden zu Allgemeinwissen verschoben.',
      saveFailed: 'Änderung konnte nicht gespeichert werden. Versuche es erneut.',
      changed: 'Diese Karte wurde an anderer Stelle geändert. Öffne sie erneut.',
      collectionChanged: 'Diese Sammlung wurde an anderer Stelle geändert. Öffne ihre Optionen erneut.',
      invalidEdit: 'Prüfe die Angaben zur Karte oder Sammlung.',
      limit: 'Die Sammlungsgrenze wurde erreicht.',
      locked: 'Sammlungseinträge können derzeit nicht bearbeitet werden.',
      offline: 'Offline · Änderungen bleiben auf diesem Gerät.',
      storage: 'Änderungen konnten auf diesem Gerät nicht gespeichert werden.',
      invalid: 'Einträge konnten nicht gelesen werden. Bestehende Einträge wurden beibehalten.',
      unavailable: 'Synchronisierung nicht verfügbar. Änderungen bleiben auf diesem Gerät.',
      conflict: 'Die Sammlung wurde auf zwei Geräten geändert. Wähle eine Version.',
      local: 'Version dieses Geräts verwenden', remote: 'Version des anderen Geräts verwenden', vault: 'Datentresor',
    },
  };
  const byId = id => document.getElementById(id);
  const language = () => document.documentElement.lang || 'tr';
  const L = key => window.ProcatsLocale.message(copy, language(), key);
  const format = (key, token, value) => L(key).replace('{' + token + '}', () => value);
  const searchKey = value => value.toLocaleLowerCase('tr').normalize('NFD').replace(/\p{Diacritic}/gu, '').replaceAll('ı', 'i').trim();
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  const search = byId('collectionSearch');
  const grid = byId('collectionGrid');
  const categoryBar = byId('collectionCategories');
  const addDialog = byId('collectionAddDialog');
  const cardDialog = byId('collectionCardDialog');
  const createDialog = byId('collectionCreateDialog');
  const deleteDialog = byId('collectionDeleteDialog');
  const addForm = byId('collectionAddForm');
  const createForm = byId('collectionCreateForm');
  const deleteForm = byId('collectionDeleteForm');
  const collectionName = createForm.elements.label;
  const membershipChoices = byId('collectionMembershipChoices');
  const membershipError = byId('collectionMembershipError');
  const reviewButton = byId('collectionReview');
  const reveal = byId('collectionReveal');
  const next = byId('collectionNext');
  const cardBody = byId('collectionCardBody');
  const reviewHint = byId('collectionReviewHint');
  const syncPanel = byId('collectionSyncStatus');

  let selected = 'words';
  let categories = [];
  let cards = [];
  let visibleCards = [];
  let reviewCards = [];
  let reviewIndex = 0;
  let editingCard = null;
  let deletingCard = null;
  let editingCategory = null;
  let deletingCategory = null;
  let openMenu = null;
  let categorySignature = '';
  let cardSignature = '';
  let statusSignature = '';
  let resolving = false;
  let resolutionError = false;
  let locked = false;

  const categoryFor = id => categories.find(category => category.id === id);
  const mainCategory = card => categoryFor(card.collectionIds[0]) || categoryFor('facts');

  function element(tag, className, value = '') {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    return node;
  }

  function button(label, action, className = '') {
    const node = element('button', className, label);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }

  function localize() {
    for (const node of root.querySelectorAll('[data-collection-text]')) node.textContent = L(node.dataset.collectionText);
    for (const node of root.querySelectorAll('[data-collection-label]')) node.setAttribute('aria-label', L(node.dataset.collectionLabel));
    for (const node of root.querySelectorAll('[data-collection-placeholder]')) node.placeholder = L(node.dataset.collectionPlaceholder);
  }

  function selectCategory(id) {
    selected = id;
    renderCategories();
    renderCards();
  }

  function renderCategories() {
    const counts = new Map([['all', cards.length]]);
    for (const card of cards) {
      for (const id of card.collectionIds) counts.set(id, (counts.get(id) || 0) + 1);
    }
    for (const tab of categoryBar.querySelectorAll('[data-category]')) {
      const id = tab.dataset.category;
      tab.setAttribute('aria-pressed', String(selected === id));
      tab.querySelector('small').textContent = (counts.get(id) || 0).toLocaleString(language());
    }
  }

  function renderCards() {
    const focused = document.activeElement;
    const focusedId = focused?.closest('[data-card-id]')?.dataset.cardId;
    const selector = focused?.classList.contains('collection-card-more') ? '.collection-card-more' : '.collection-card';
    closeActionMenu();
    const query = searchKey(search.value);
    visibleCards = cards.filter(card => (selected === 'all' || card.collectionIds.includes(selected))
      && searchKey(card.title + ' ' + card.answer).includes(query));
    byId('collectionSelection').textContent = selected === 'all' ? L('allCards') : categoryFor(selected).label;
    byId('collectionCount').textContent = visibleCards.length === 1 ? L('one')
      : format('count', 'count', visibleCards.length.toLocaleString(language()));
    byId('collectionEmpty').hidden = visibleCards.length !== 0;
    byId('collectionEmptyTitle').textContent = L(query ? 'noResults' : 'empty');
    byId('collectionEmptyText').textContent = L(query ? 'noResultsHelp' : 'emptyHelp');
    reviewButton.disabled = visibleCards.length === 0;
    const fragment = document.createDocumentFragment();
    for (const card of visibleCards) {
      const wrap = element('article', 'collection-card-wrap');
      wrap.dataset.cardId = card.id;
      const open = button('', () => showCard(card, false), 'collection-card');
      open.setAttribute('aria-label', card.title);
      const memberships = selected === 'all' ? card.collectionIds : [selected];
      const badges = element('span', 'collection-card-badges');
      for (const id of memberships.slice(0, 2)) {
        const category = categoryFor(id);
        const badge = element('span', 'collection-meta', selected === 'all' ? category.label : category.badge || category.label);
        badge.dataset.category = id;
        badges.append(badge);
      }
      if (memberships.length > 2) badges.append(element('span', 'collection-badge-count', '+' + (memberships.length - 2)));
      const foot = element('span', 'collection-card-foot', mainCategory(card).action || L('reveal'));
      foot.insertAdjacentHTML('beforeend', arrow);
      open.append(badges, element('strong', '', card.title), foot);
      wrap.append(open);
      if (!locked) addCardActions(wrap, card);
      fragment.append(wrap);
    }
    grid.replaceChildren(fragment);
    if (focusedId) focusCard(focusedId, selector, { preventScroll: true });
  }

  function focusCard(id, selector = '.collection-card', options) {
    (grid.querySelector('[data-card-id="' + CSS.escape(String(id)) + '"] ' + selector) || search).focus(options);
  }

  function showCard(card, reviewing) {
    const primary = mainCategory(card);
    const category = (selected !== 'all' && categoryFor(selected)) || primary;
    const meta = byId('collectionCardMeta');
    meta.dataset.category = category.id;
    meta.textContent = reviewing ? category.label + ' · ' + (reviewIndex + 1) + ' / ' + reviewCards.length
      : card.collectionIds.map(id => categoryFor(id)?.label).filter(Boolean).join(' · ');
    byId('collectionCardTitle').textContent = card.title;
    byId('collectionAnswerLabel').textContent = primary.answer || L('answer');
    byId('collectionAnswer').textContent = card.answer;
    const example = byId('collectionExample');
    example.textContent = card.example || '';
    example.hidden = !card.example;
    cardBody.hidden = reviewing;
    reviewHint.hidden = !reviewing;
    byId('collectionReviewActions').hidden = !reviewing;
    reveal.hidden = !reviewing;
    next.hidden = true;
    next.textContent = L(reviewIndex + 1 === reviewCards.length ? 'finish' : 'next');
    if (!cardDialog.open) cardDialog.showModal();
    if (reviewing) reveal.focus();
  }

  function makeCategoryButton(category, index) {
    const tab = button('', () => selectCategory(category.id), 'collection-category');
    tab.dataset.category = category.id;
    tab.append(element('span', '', category.label), element('small'));
    if (!category.id.startsWith('custom:') || locked) return tab;

    const wrap = element('div', 'collection-category-wrap');
    const panel = element('div', 'collection-card-menu collection-category-menu');
    panel.id = 'collectionCategoryMenu-' + index;
    panel.hidden = true;
    const rename = button(L('renameCollection'), () => {
      closeActionMenu(true);
      openCollectionForm(category);
    });
    const remove = button(L('deleteCollection'), () => {
      closeActionMenu(true);
      openDeleteDialog(null, category);
    }, 'collection-menu-delete');
    panel.append(rename, remove);
    const trigger = actionTrigger(panel, format('collectionOptions', 'title', category.label), 'collection-category-more');
    wrap.addEventListener('contextmenu', event => {
      event.preventDefault();
      showActionMenu(trigger, panel);
    });
    wrap.append(tab, trigger, panel);
    return wrap;
  }

  function closeActionMenu(restoreFocus = false) {
    if (!openMenu) return;
    const { trigger, panel } = openMenu;
    openMenu = null;
    panel.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus();
  }

  function showActionMenu(trigger, panel) {
    closeActionMenu();
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    openMenu = { trigger, panel };
    panel.firstElementChild.focus();
  }

  function actionTrigger(panel, label, className) {
    const trigger = button('⋯', () => {
      if (openMenu?.trigger === trigger) closeActionMenu();
      else showActionMenu(trigger, panel);
    }, className);
    trigger.setAttribute('aria-label', label);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', panel.id);
    return trigger;
  }

  function addCardActions(wrap, card) {
    const panel = element('div', 'collection-card-menu');
    panel.id = 'collectionCardMenu-' + card.id;
    panel.hidden = true;
    const trigger = actionTrigger(panel, format('options', 'title', card.title), 'collection-card-more');
    const edit = button(L('edit'), () => {
      closeActionMenu(true);
      openEditor(card);
    });
    const remove = button(L('remove'), () => {
      closeActionMenu(true);
      openDeleteDialog(card);
    }, 'collection-menu-delete');
    panel.append(edit, remove);
    wrap.addEventListener('contextmenu', event => {
      event.preventDefault();
      showActionMenu(trigger, panel);
    });
    wrap.append(trigger, panel);
  }

  function setDialogText(node, key) {
    node.dataset.collectionText = key;
    node.textContent = L(key);
  }

  function openCollectionForm(category = null) {
    editingCategory = category;
    createForm.reset();
    showError(createForm);
    collectionName.setCustomValidity('');
    collectionName.value = category?.label || '';
    setDialogText(byId('collectionCreateTitle'), category ? 'renameCollection' : 'newCollection');
    setDialogText(byId('collectionCreateIntro'), category ? 'renameIntro' : 'collectionIntro');
    setDialogText(byId('collectionCreateSubmit'), category ? 'saveEdit' : 'createCollection');
    createDialog.showModal();
    if (category) collectionName.select();
  }

  function openDeleteDialog(card, category = null) {
    deletingCard = card;
    deletingCategory = category;
    showError(deleteForm);
    const titleKey = category ? 'deleteCollection' : 'deleteCard';
    setDialogText(byId('collectionDeleteTitle'), titleKey);
    setDialogText(byId('collectionDeleteSubmit'), titleKey);
    byId('collectionDeleteCopy').textContent = format(category ? 'deleteCollectionCopy' : 'deleteCopy', 'title', category?.label || card.title);
    deleteDialog.showModal();
  }

  function openEditor(card = null) {
    editingCard = card;
    addForm.reset();
    showError(addForm);
    const { title, answer } = addForm.elements;
    title.setCustomValidity('');
    answer.setCustomValidity('');
    title.value = card?.title || '';
    answer.value = card?.answer || '';
    byId('collectionAddTitle').textContent = L(card ? 'editCard' : 'addCard');
    byId('collectionAddIntro').textContent = L(card ? 'editIntro' : 'addIntro');
    byId('collectionSave').textContent = L(card ? 'saveEdit' : 'saveCard');
    const checked = card?.collectionIds || [selected === 'all' ? 'words' : selected];
    const choices = categories.filter(category => category.id !== 'all').map(category => {
      const label = element('label', 'collection-membership');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = 'collections';
      input.value = category.id;
      input.checked = checked.includes(category.id);
      label.append(input, element('span', '', category.label));
      return label;
    });
    membershipChoices.replaceChildren(...choices);
    membershipError.hidden = true;
    addDialog.showModal();
  }

  function hasText(field, key) {
    if (field.value.trim()) return true;
    field.setCustomValidity(L(key));
    field.reportValidity();
    return false;
  }

  function showError(form, error) {
    const notice = form.querySelector('.collection-form-error:not(#collectionMembershipError)');
    const keys = {
      'collection-changed': 'changed', 'collection-duplicate': 'duplicate', 'collection-invalid': 'invalidEdit',
      'collection-limit': 'limit', 'collection-locked': 'locked',
    };
    const key = error?.message === 'collection-changed' && (form === createForm || form === deleteForm && deletingCategory)
      ? 'collectionChanged' : keys[error?.message] || 'saveFailed';
    notice.textContent = error ? L(key) : '';
    notice.hidden = !error;
  }

  function tryWrite(form, action) {
    showError(form);
    try { return action(); }
    catch (error) { showError(form, error); return null; }
  }

  function resolveConflict(which) {
    if (resolving) return;
    showCustomConfirm(L(which), async () => {
      resolving = true;
      resolutionError = false;
      renderStatus(store.getState());
      try { await store.resolve(which); }
      catch { resolutionError = true; }
      finally {
        resolving = false;
        refresh();
      }
    });
  }

  function renderStatus(state) {
    const status = state.conflict ? 'conflict' : state.invalid ? 'invalid' : state.status;
    const signature = JSON.stringify([language(), status, resolving, resolutionError]);
    if (signature === statusSignature) return;
    statusSignature = signature;
    syncPanel.replaceChildren();
    syncPanel.hidden = !['conflict', 'offline', 'storage', 'invalid', 'unavailable'].includes(status);
    if (syncPanel.hidden) return;
    syncPanel.append(element('p', '', L(status)));
    if (status === 'conflict') {
      const actions = element('div', 'collection-actions');
      for (const which of ['local', 'remote']) {
        const choice = button(L(which), () => resolveConflict(which), 'collection-button');
        choice.disabled = resolving;
        actions.append(choice);
      }
      actions.append(button(L('vault'), () => window.switchView('vault'), 'collection-button'));
      syncPanel.append(actions);
    }
    if (resolutionError) syncPanel.append(element('p', 'collection-form-error', L('saveFailed')));
  }

  function refresh() {
    const snapshot = store.get();
    const state = store.getState();
    locked = Boolean(state.conflict || state.invalid);
    byId('collectionAdd').disabled = locked;
    byId('collectionCreate').disabled = locked;
    renderStatus(state);
    const nextCategories = [
      { id: 'all', label: L('all') },
      { id: 'words', label: L('words'), badge: L('word'), answer: L('meaning'), action: L('openMeaning') },
      { id: 'concepts', label: L('concepts'), badge: L('concept'), answer: L('definition'), action: L('openDefinition') },
      { id: 'facts', label: L('facts') },
      ...snapshot.categories,
    ];
    const newCategorySignature = JSON.stringify([language(), locked, nextCategories]);
    const newCardSignature = JSON.stringify([locked, snapshot.cards]);
    if (categorySignature === newCategorySignature && cardSignature === newCardSignature) return;
    cards = snapshot.cards;
    if (categorySignature !== newCategorySignature) {
      const focused = document.activeElement;
      const focusedId = focused?.dataset.category || focused?.closest('.collection-category-wrap')?.querySelector('[data-category]').dataset.category;
      categories = nextCategories;
      if (!categoryFor(selected)) selected = 'all';
      categoryBar.replaceChildren(...categories.map(makeCategoryButton));
      if (focusedId && categoryFor(focusedId)) {
        focusCategory(focusedId, focused.classList.contains('collection-category-more'));
      }
      categorySignature = newCategorySignature;
      localize();
    }
    cardSignature = newCardSignature;
    renderCategories();
    renderCards();
  }

  function focusCategory(id, options = false) {
    const tab = categoryBar.querySelector('[data-category="' + CSS.escape(String(id)) + '"]');
    const target = options ? tab?.closest('.collection-category-wrap')?.querySelector('.collection-category-more') || tab : tab;
    target?.focus({ preventScroll: true });
  }

  function outsideActionMenu(event) {
    if (openMenu && !openMenu.trigger.contains(event.target) && !openMenu.panel.contains(event.target)) closeActionMenu();
  }
  document.addEventListener('click', outsideActionMenu);
  document.addEventListener('focusin', outsideActionMenu);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && openMenu) closeActionMenu(true);
  });
  search.addEventListener('input', renderCards);
  reviewButton.addEventListener('click', () => {
    reviewCards = [...visibleCards];
    reviewIndex = 0;
    showCard(reviewCards[0], true);
  });
  reveal.addEventListener('click', () => {
    cardBody.hidden = false;
    reviewHint.hidden = true;
    reveal.hidden = true;
    next.hidden = false;
    next.focus();
  });
  next.addEventListener('click', () => {
    reviewIndex++;
    if (reviewIndex === reviewCards.length) cardDialog.close();
    else showCard(reviewCards[reviewIndex], true);
  });
  byId('collectionAdd').addEventListener('click', () => openEditor());
  for (const id of ['collectionCancel', 'collectionDiscard']) byId(id).addEventListener('click', () => addDialog.close());
  addForm.addEventListener('input', event => {
    if (event.target.name === 'collections') membershipError.hidden = true;
    else event.target.setCustomValidity('');
    showError(addForm);
  });
  addForm.addEventListener('submit', event => {
    event.preventDefault();
    const { title, answer } = addForm.elements;
    if (!hasText(title, 'titleRequired') || !hasText(answer, 'answerRequired')) return;
    const checked = new FormData(addForm).getAll('collections');
    if (!checked.length) {
      membershipError.hidden = false;
      membershipChoices.querySelector('input').focus();
      return;
    }
    const existingIds = editingCard?.collectionIds || [];
    const collectionIds = [...existingIds.filter(id => checked.includes(id)), ...checked.filter(id => !existingIds.includes(id))];
    const card = tryWrite(addForm, () => store.saveCard({
      id: editingCard?.id, title: title.value.trim(), answer: answer.value.trim(), collectionIds,
    }, editingCard ? JSON.stringify(editingCard) : undefined));
    if (!card) return;
    if (!editingCard) {
      search.value = '';
      if (selected !== 'all' && !collectionIds.includes(selected)) selected = collectionIds[0];
    }
    addDialog.close();
    refresh();
    selectCategory(selected);
    focusCard(card.id);
  });

  byId('collectionCreate').addEventListener('click', () => openCollectionForm());
  byId('collectionCreateCancel').addEventListener('click', () => createDialog.close());
  collectionName.addEventListener('input', () => {
    collectionName.setCustomValidity('');
    showError(createForm);
  });
  createForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!hasText(collectionName, 'collectionRequired')) return;
    const label = collectionName.value.trim();
    const original = editingCategory;
    if (categories.some(category => category.id !== original?.id && searchKey(category.label) === searchKey(label))) {
      collectionName.setCustomValidity(L('duplicate'));
      collectionName.reportValidity();
      return;
    }
    const previousSelection = selected;
    const category = tryWrite(createForm, () => original
      ? store.renameCollection(original.id, label, original.label)
      : store.createCollection(label));
    if (!category) return;
    if (!original) search.value = '';
    createDialog.close();
    refresh();
    selectCategory(!original || previousSelection === original.id ? category.id : selected);
    focusCategory(category.id);
  });

  byId('collectionDeleteCancel').addEventListener('click', () => deleteDialog.close());
  deleteForm.addEventListener('submit', event => {
    event.preventDefault();
    const category = deletingCategory;
    if (!tryWrite(event.currentTarget, () => {
      if (category) store.deleteCollection(category.id, category.label);
      else store.deleteCard(deletingCard.id, JSON.stringify(deletingCard));
      return true;
    })) return;
    deleteDialog.close();
    refresh();
    if (category) focusCategory(selected);
    else search.focus();
  });

  window.addEventListener('procats-collection-change', refresh);
  new MutationObserver(refresh).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  refresh();
})();
