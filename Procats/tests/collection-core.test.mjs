import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCollectionPack, collectionArchiveKey, collectionSection, collectionView, createCollectionStore } from '../public/collection-core.js';
import { planAddition } from '../public/data-add-core.js';
import { createKnowledgeStore } from '../public/knowledge-store.js';

const archive = globalThis.ProcatsKnowledgeCore;
const legacy = archive.make({ id: 1, question: 'Eski arşiv', answer: 'Korunan kayıt' }, 0);
const card = { title: 'Mahir', answer: 'Becerikli.', example: 'Bu konuda mahir.', collections: ['Sözcükler', 'Sınavda çıkanlar'] };
const payload = { collections: ['Sınavda çıkanlar'], cards: [card] };
const pack = { format: 'procats-data-pack', version: 1, data: { [collectionSection]: payload } };

function memoryStore(initial) {
  let rows = initial, commits = 0;
  return {
    get: () => structuredClone(rows),
    getState: () => ({}),
    get commits() { return commits; },
    refresh() {},
    commit(next) { rows = structuredClone(next); commits++; },
  };
}

test('projected card edits preserve other memberships, the sample and hidden archive rows', () => {
  const archiveStore = memoryStore([legacy, ...buildCollectionPack(payload, 0).map((row, index) => ({ ...row, id: index + 2 }))]);
  const collection = createCollectionStore(archiveStore);
  const { cards, categories } = collection.get();
  assert.equal(cards.length, 1);
  assert.deepEqual(cards[0].collectionIds, ['words', categories[0].id]);
  assert.throws(() => collection.createCollection('  SINAVDA ÇIKANLAR  '), /collection-duplicate/);
  assert.throws(() => collection.createCollection('sözcükler'), /collection-duplicate/);
  const newCategory = collection.createCollection('Bilim');
  const edited = collection.saveCard({ id: cards[0].id, title: 'Mahir', answer: 'Yetenekli.', collectionIds: ['words', categories[0].id, newCategory.id] }, cards[0]);
  assert.equal(edited.id, cards[0].id);
  assert.equal(edited.example, card.example);
  assert.equal(edited.collectionIds.length, 3);
  assert.throws(() => collection.deleteCard(edited.id, cards[0]), /collection-changed/);
  collection.deleteCard(edited.id, edited);
  assert.deepEqual(collection.get(), { categories: [...categories, newCategory], cards: [] });
  assert.deepEqual(archiveStore.get()[0], legacy);
});

test('portable packs add only collection rows and skip the same pack or a scoped backup on reimport', () => {
  const current = { [collectionArchiveKey]: [legacy], yks_v5_notes: [{ id: 1, text: 'Personal' }] };
  const plan = planAddition(current, pack, { now: 1 });
  assert.equal(plan.totalAdded, 2);
  assert.deepEqual(Object.keys(plan.updates), [collectionArchiveKey]);
  const next = plan.updates[collectionArchiveKey];
  assert.equal(new Set(next.map(row => row.id)).size, next.length);
  assert.deepEqual(next[0], legacy);
  assert.equal(collectionView(next).cards.length, 1);
  assert.equal(planAddition({ ...current, ...plan.updates }, pack).totalAdded, 0);
  const backup = { format: 'procats', version: 2, [collectionArchiveKey]: JSON.stringify(next) };
  assert.equal(planAddition({ ...current, ...plan.updates }, backup).totalAdded, 0);
  const imported = planAddition({}, backup);
  assert.equal(imported.totalAdded, 2);
  assert.equal(imported.updates[collectionArchiveKey].some(row => row.question === legacy.question), false);
  assert.throws(() => buildCollectionPack({ ...payload, cards: [{ ...card, collections: ['Missing'] }] }), /collection-reference/);
});

test('renaming a custom collection updates all of its memberships in one commit', () => {
  const rows = buildCollectionPack(payload, 0).map((row, index) => ({ ...row, id: index + 2 }));
  const backing = memoryStore([legacy, ...rows]);
  const store = createCollectionStore(backing);
  const { categories: [original], cards: [originalCard] } = store.get();

  const renamed = store.renameCollection(original.id, '  Sınav notları  ', original.label);
  assert.notEqual(renamed.id, original.id);
  assert.equal(renamed.label, 'Sınav notları');
  assert.equal(backing.commits, 1);
  assert.deepEqual(store.get(), {
    categories: [renamed],
    cards: [{ ...originalCard, collectionIds: ['words', renamed.id] }],
  });
  assert.deepEqual(backing.get()[0], legacy);
  assert.equal(backing.get()[1].id, rows[0].id);
  assert.deepEqual(backing.get()[2].review, rows[1].review);

  const savedCardRow = backing.get()[2];
  const recased = store.renameCollection(renamed.id, 'Sınav Notları', renamed.label);
  assert.deepEqual(recased, { id: renamed.id, label: 'Sınav Notları' });
  assert.deepEqual(backing.get()[2], savedCardRow);
  assert.equal(backing.commits, 2);
  assert.deepEqual(store.renameCollection(recased.id, recased.label, recased.label), recased);
  assert.equal(backing.commits, 2);
});

test('deleting a custom collection preserves shared cards and moves sole members to General Knowledge', () => {
  const shared = { ...card, collections: ['Sözcükler', 'Sınavda çıkanlar', 'Dil'] };
  const sole = { ...card, title: 'Yalın', collections: ['Sınavda çıkanlar'] };
  const rows = buildCollectionPack({ collections: ['Sınavda çıkanlar', 'Dil'], cards: [shared, sole] }, 0)
    .map((row, index) => ({ ...row, id: index + 2 }));
  const backing = memoryStore([legacy, ...rows]);
  const store = createCollectionStore(backing);
  const { categories: [removed, kept], cards: [sharedCard, soleCard] } = store.get();

  store.deleteCollection(removed.id, removed.label);
  assert.equal(backing.commits, 1);
  assert.deepEqual(store.get(), {
    categories: [kept],
    cards: [
      { ...sharedCard, collectionIds: ['words', kept.id] },
      { ...soleCard, collectionIds: ['facts'] },
    ],
  });
  assert.deepEqual(backing.get()[0], legacy);
  assert.deepEqual(backing.get()[1], rows[1]);
  assert.equal(backing.get().some(row => row.id === rows[0].id), false);
  assert.deepEqual(JSON.parse(backing.get()[3].origin), ['facts']);
});

test('duplicate names, built-in collections and stale collection actions leave records untouched', () => {
  const backing = memoryStore(buildCollectionPack({ ...payload, collections: [...payload.collections, 'Bilim'] }, 0));
  const store = createCollectionStore(backing);
  const original = backing.get();
  const [category] = store.get().categories;
  assert.throws(() => store.renameCollection(category.id, ' BİLİM ', category.label), /collection-duplicate/);
  assert.throws(() => store.renameCollection(category.id, 'Sözcükler', category.label), /collection-duplicate/);
  assert.throws(() => store.renameCollection('words', 'Kelimeler', 'Sözcükler'), /collection-changed/);
  assert.throws(() => store.deleteCollection('facts', 'Genel bilgi'), /collection-changed/);
  assert.throws(() => store.renameCollection(category.id, 'Geçersiz ad', 'Önceki ad'), /collection-changed/);
  assert.throws(() => store.deleteCollection(category.id, 'Önceki ad'), /collection-changed/);
  assert.equal(backing.commits, 0);
  assert.deepEqual(backing.get(), original);
});

test('a locked remote refresh retries without losing the other device’s archive changes', async () => {
  let locked = false;
  const other = archive.make({ id: 2, question: 'Remote', answer: 'Preserved' }, 0);
  const local = archive.make({ id: 3, question: 'Local', answer: 'Preserved' }, 0);
  const state = new Map([
    [archive.key, JSON.stringify([legacy])],
    [archive.metaKey, JSON.stringify({ base: [legacy], revision: 1 })],
  ]);
  let remote = { data: { [archive.key]: [legacy, other] }, revision: 2 };
  const store = createKnowledgeStore({
    storage: { getItem: key => state.get(key) ?? null, setItem(key, value) {
      if (locked) throw Error('Storage locked');
      state.set(key, value);
    } },
    flush: async () => {},
    merge: globalThis.ProcatsMerge.mergeDocuments,
    cloudFactory: () => ({
      async request(method, payload) {
        if (method === 'GET') return structuredClone(remote);
        assert.equal(payload.revision, remote.revision);
        remote = { data: payload.data, revision: remote.revision + 1 };
        return { revision: remote.revision };
      }, stop() {},
    }),
  });
  store.commit([legacy, local]);
  locked = true;
  await store.sync();
  assert.equal(store.getState().revision, 1);
  locked = false;
  await store.sync();
  assert.deepEqual(remote.data[archive.key].map(row => row.id).sort(), [1, 2, 3]);
  await store.stop();
});
