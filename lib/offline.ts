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

export type LocalFieldDay={
  id:string;
  projectId:string;
  userId:string;
  stateName:string;
  dayNo:number;
  date:string;
  status:string;
  payload:unknown;
  updatedAt:string;
  dirty:number;
};
export type FieldOutboxItem={
  id:string;
  dayId:string;
  projectId:string;
  userId:string;
  payload:unknown;
  createdAt:string;
  attempts:number;
  lastError?:string;
};

class EkatmaOfflineDB extends Dexie {
  drafts!: EntityTable<LocalDraft, 'id'>;
  outbox!: EntityTable<OutboxItem, 'id'>;
  fieldDays!: EntityTable<LocalFieldDay,'id'>;
  fieldOutbox!: EntityTable<FieldOutboxItem,'id'>;

  constructor() {
    super('ekatma-yatra-offline-v1');
    this.version(1).stores({
      drafts: 'id,projectId,userId,stateName,status,updatedAt,dirty',
      outbox: 'id,userId,projectId,createdAt,attempts'
    });
    this.version(2).stores({
      drafts: 'id,projectId,userId,stateName,status,updatedAt,dirty',
      outbox: 'id,userId,projectId,createdAt,attempts',
      fieldDays:'id,projectId,userId,stateName,dayNo,date,status,updatedAt,dirty',
      fieldOutbox:'id,dayId,projectId,userId,createdAt,attempts'
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

export async function saveFieldDay(d:LocalFieldDay){await offlineDb.fieldDays.put(d)}
export async function getFieldDay(id:string){return offlineDb.fieldDays.get(id)}
export async function listFieldDays(userId:string,projectId?:string){
  const rows=await offlineDb.fieldDays.where('userId').equals(userId).toArray();
  return rows.filter(x=>!projectId||x.projectId===projectId).sort((a,b)=>(b.dayNo-a.dayNo)||b.updatedAt.localeCompare(a.updatedAt));
}
export async function queueFieldDay(userId:string,projectId:string,dayId:string,payload:unknown){
  const existing=await offlineDb.fieldOutbox.where('dayId').equals(dayId).first();
  const item:FieldOutboxItem={id:existing?.id||crypto.randomUUID(),dayId,projectId,userId,payload,createdAt:new Date().toISOString(),attempts:existing?.attempts||0};
  await offlineDb.fieldOutbox.put(item);return item;
}
export async function pendingFieldDays(userId:string){return offlineDb.fieldOutbox.where('userId').equals(userId).toArray()}
export async function removeFieldOutbox(id:string){await offlineDb.fieldOutbox.delete(id)}
export async function failFieldOutbox(id:string,error:string){const item=await offlineDb.fieldOutbox.get(id);if(!item)return;await offlineDb.fieldOutbox.put({...item,attempts:item.attempts+1,lastError:error})}
