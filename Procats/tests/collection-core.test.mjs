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
  let rows = initial;
  return { get: () => structuredClone(rows), getState: () => ({}), refresh() {}, commit(next) { rows = structuredClone(next); } };
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
