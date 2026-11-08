import './knowledge-core.js';

const archive = globalThis.ProcatsKnowledgeCore;
export const collectionSection = 'procats_collection_v1';
export const collectionArchiveKey = archive.key;
const cardSource = 'procats:collection:v1:card';
const folderSource = 'procats:collection:v1:folder';
const defaults = [
  { id: 'words', label: 'Sözcükler' },
  { id: 'concepts', label: 'Kavramlar' },
  { id: 'facts', label: 'Genel bilgi' },
];

const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const nameKey = value => value.trim().toLocaleLowerCase('tr').normalize('NFD').replace(/\p{Diacritic}/gu, '').replaceAll('ı', 'i');
const defaultNames = new Map(defaults.map(item => [nameKey(item.label), item.id]));
const defaultIds = new Set(defaults.map(item => item.id));
const customId = label => 'custom:' + nameKey(label);
const normalizedText = (value, length) => typeof value === 'string' && value.trim().length <= length ? value.trim() : null;

function validName(value) {
  const label = normalizedText(value, 48);
  return label && nameKey(label) && !/[\p{Cc}\p{Cf}]/u.test(label) ? label : null;
}

function folderFromRow(row) {
  const label = validName(row.question);
  if (row.source !== folderSource || !label || defaultNames.has(nameKey(label)) || nameKey(label) === 'tumu' || row.origin !== customId(label)) return null;
  return { id: row.origin, label };
}

function membershipFromRow(row) {
  try {
    const ids = JSON.parse(row.origin);
    if (!Array.isArray(ids) || !ids.length || ids.length > 24 || new Set(ids).size !== ids.length) return null;
    if (ids.some(id => typeof id !== 'string' || (!defaultIds.has(id) && !id.startsWith('custom:')))) return null;
    return ids;
  } catch {
    return null;
  }
}

function cardFromRow(row, validIds) {
  if (row.source !== cardSource || !normalizedText(row.question, 100) || !normalizedText(row.answer, 700)) return null;
  const memberships = membershipFromRow(row);
  if (!memberships) return null;
  const collectionIds = memberships.filter(id => validIds.has(id));
  return { id: row.id, title: row.question, answer: row.answer, example: row.example, collectionIds: collectionIds.length ? collectionIds : ['facts'] };
}

export function collectionView(rows) {
  const categories = new Map();
  for (const row of rows) {
    const category = folderFromRow(row);
    if (category && !categories.has(category.id)) categories.set(category.id, category);
  }
  const ids = new Set([...defaultIds, ...categories.keys()]);
  return { categories: [...categories.values()], cards: rows.map(row => cardFromRow(row, ids)).filter(Boolean) };
}

export const isCollectionRow = row => record(row) && [cardSource, folderSource].includes(row.source);

export function validateCollectionRows(rows) {
  archive.check(rows);
  if (rows.some(row => row.source === folderSource ? !folderFromRow(row)
    : row.source !== cardSource || !normalizedText(row.question, 100) || !normalizedText(row.answer, 700) || !membershipFromRow(row))) {
    throw Error('collection-invalid');
  }
}

export function collectionIdentity(row) {
  if (row.source === folderSource && folderFromRow(row)) return JSON.stringify(['folder', row.origin]);
  if (row.source !== cardSource) return null;
  const memberships = membershipFromRow(row);
  return memberships ? JSON.stringify(['card', row.question, row.answer, row.example, [...memberships].sort()]) : null;
}

function buildFolder(label, id, now) {
  return archive.make({ id, kind: 'fact', question: label, answer: 'Collection', source: folderSource, origin: customId(label) }, now);
}

function buildCard(input, id, validIds, now, previous) {
  const title = normalizedText(input.title, 100), answer = normalizedText(input.answer, 700);
  const example = normalizedText(input.example ?? previous?.example ?? '', 2000);
  const { collectionIds } = input;
  if (!title || !answer || example === null || !Array.isArray(collectionIds) || !collectionIds.length
    || new Set(collectionIds).size !== collectionIds.length || collectionIds.some(key => !validIds.has(key))) {
    throw Error('collection-invalid');
  }
  const origin = JSON.stringify(collectionIds);
  if (collectionIds.length > 24 || origin.length > 2000) throw Error('collection-limit');
  return archive.make({ id, kind: 'fact', question: title, answer, example, source: cardSource, origin }, now, previous);
}

function validateName(value, names) {
  const label = validName(value);
  if (!label) throw Error('collection-invalid');
  const key = nameKey(label);
  if (key === 'tumu' || names.has(key)) throw Error('collection-duplicate');
  return label;
}

export function buildCollectionPack(data, now = Date.now()) {
  if (!record(data) || Object.keys(data).some(key => key !== 'collections' && key !== 'cards')
    || !Array.isArray(data.collections) || !Array.isArray(data.cards)) throw Error('collection-invalid');
  if (data.collections.length + data.cards.length > archive.maxCards) throw Error('collection-limit');
  const names = new Map(defaultNames), rows = [];
  for (const value of data.collections) {
    const label = validateName(value, names);
    names.set(nameKey(label), customId(label));
    rows.push(buildFolder(label, rows.length + 1, now));
  }
  const validIds = new Set(names.values());
  for (const value of data.cards) {
    if (!record(value) || Object.keys(value).some(key => !['title', 'answer', 'example', 'collections'].includes(key))
      || !Array.isArray(value.collections)) throw Error('collection-invalid');
    const collectionIds = value.collections.map(name => {
      const label = validName(name);
      if (!label) throw Error('collection-invalid');
      const id = names.get(nameKey(label));
      if (!id) throw Error('collection-reference');
      return id;
    });
    rows.push(buildCard({ title: value.title, answer: value.answer, example: value.example, collectionIds }, rows.length + 1, validIds, now));
  }
  archive.pack(rows);
  return rows;
}

export function checkCollectionAddition(current, incoming) {
  validateCollectionRows(incoming);
  const validIds = new Set(defaultIds);
  for (const row of [...current, ...incoming]) {
    const folder = folderFromRow(row);
    if (folder) validIds.add(folder.id);
  }
  if (incoming.some(row => row.source === cardSource && membershipFromRow(row).some(id => !validIds.has(id)))) throw Error('collection-reference');
}

function allocateId(rows) {
  const existing = new Set(rows.map(row => row.id));
  const values = new Uint32Array(2);
  for (;;) {
    crypto.getRandomValues(values);
    const id = (values[0] & 0x1fffff) * 0x100000000 + values[1];
    if (id > 0 && !existing.has(id)) return id;
  }
}

export function createCollectionStore(store) {
  const read = () => {
    store.refresh();
    return store.get();
  };
  const mutable = () => {
    const rows = read(), state = store.getState();
    if (state.invalid || state.conflict) throw Error('collection-locked');
    return rows;
  };
  const commit = rows => {
    if (rows.length > archive.maxCards) throw Error('collection-limit');
    try {
      archive.pack(rows);
    } catch (error) {
      if (error.message === 'knowledge-limit') throw Error('collection-limit');
      throw error;
    }
    store.commit(rows);
  };
  const currentCard = (view, id, expected) => {
    const card = view.cards.find(item => item.id === id);
    if (!card || expected !== undefined && JSON.stringify(card) !== (typeof expected === 'string' ? expected : JSON.stringify(expected))) throw Error('collection-changed');
    return card;
  };
  return {
    get: () => collectionView(read()),
    getState: () => store.getState(),
    getConflict: () => store.getConflict(),
    resolve: which => store.resolve(which),
    createCollection(value) {
      const rows = mutable(), view = collectionView(rows);
      const names = new Map([...defaultNames, ...view.categories.map(category => [nameKey(category.label), category.id])]);
      const label = validateName(value, names);
      commit([...rows, buildFolder(label, allocateId(rows), Date.now())]);
      return { id: customId(label), label };
    },
    saveCard(input, expected) {
      if (!record(input)) throw Error('collection-invalid');
      const rows = mutable(), view = collectionView(rows);
      const validIds = new Set([...defaultIds, ...view.categories.map(category => category.id)]);
      if (input.id != null) currentCard(view, input.id, expected);
      const index = rows.findIndex(row => row.id === input.id);
      const saved = buildCard(input, index < 0 ? allocateId(rows) : input.id, validIds, Date.now(), rows[index]);
      if (index < 0) rows.unshift(saved);
      else rows[index] = saved;
      commit(rows);
      return cardFromRow(saved, validIds);
    },
    deleteCard(id, expected) {
      const rows = mutable();
      currentCard(collectionView(rows), id, expected);
      // Memberships live in the card, so one deletion removes it from every collection.
      commit(rows.filter(row => row.id !== id));
    },
  };
}
