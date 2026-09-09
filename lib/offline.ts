'use client';

import Dexie, { type EntityTable } from 'dexie';

export type LocalDraft = {
  id: string;
  projectId: string;
  userId: string;
  stateName: string;
  status: string;
  payload: unknown;
  updatedAt: string;
  dirty: number;
};

export type OutboxItem = {
  id: string;
  userId: string;
  kind: 'survey_payload';
  projectId: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
  lastError?: string;
};

class EkatmaOfflineDB extends Dexie {
  drafts!: EntityTable<LocalDraft, 'id'>;
  outbox!: EntityTable<OutboxItem, 'id'>;

  constructor() {
    super('ekatma-yatra-offline-v1');
    this.version(1).stores({
      drafts: 'id,projectId,userId,stateName,status,updatedAt,dirty',
      outbox: 'id,userId,projectId,createdAt,attempts'
    });
  }
}

export const offlineDb = new EkatmaOfflineDB();

export async function saveLocalDraft(draft: LocalDraft) { await offlineDb.drafts.put(draft); }
export async function getLocalDraft(id: string) { return offlineDb.drafts.get(id); }
export async function listLocalDrafts(userId: string) { return offlineDb.drafts.where('userId').equals(userId).reverse().sortBy('updatedAt'); }
export async function queueSurveyPayload(userId: string, projectId: string, payload: unknown) {
  const existing = await offlineDb.outbox.where('projectId').equals(projectId).first();
  const item: OutboxItem = { id: existing?.id || crypto.randomUUID(), userId, kind: 'survey_payload', projectId, payload, createdAt: new Date().toISOString(), attempts: existing?.attempts || 0 };
  await offlineDb.outbox.put(item); return item;
}
export async function pendingOutbox(userId: string) { return offlineDb.outbox.where('userId').equals(userId).toArray(); }
export async function markOutboxFailure(id: string, error: string) { const item = await offlineDb.outbox.get(id); if (!item) return; await offlineDb.outbox.put({ ...item, attempts: item.attempts + 1, lastError: error }); }
export async function removeOutbox(id: string) { await offlineDb.outbox.delete(id); }
