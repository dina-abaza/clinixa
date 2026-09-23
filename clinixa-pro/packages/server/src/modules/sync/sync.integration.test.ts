import query from '../../db/sqlite/query';
import { pullRemoteRecords, pushPendingRecords } from './sync.engine';
import type { SyncMongoAdapter } from './mongo.adapter';

describe('Sync engine with SQLite outbox triggers', () => {
  beforeAll(async () => {
    await query.migrate.latest();
  });

  afterAll(async () => {
    await query.destroy();
  });

  it('creates an outbox pointer and uploads the current record', async () => {
    await query('sync_outbox').del();
    await query('patients').del();
    await query('branches').insert({
      id: 'br_sync_test',
      name_ar: 'فرع اختبار المزامنة',
      address_ar: null,
      phone: '01000000000',
      opens_at: '09:00',
      closes_at: '21:00',
      is_host: 1,
      is_active: 1,
    });
    await query('patients').insert({
      id: 'pat_sync_test',
      display_id: 'P-SYNC-1',
      name_ar: 'مريض اختبار',
      name_ar_normalized: 'مريض اختبار',
      name_en: 'Sync Test',
      phone: '01011111111',
      age: 30,
      gender: 'male',
      address: null,
      notes: null,
      home_branch_id: 'br_sync_test',
      is_active: 1,
    });

    const pointer = await query('sync_outbox').where({ table_name: 'patients', record_id: 'pat_sync_test' }).first();
    expect(pointer).toBeDefined();

    const uploaded: Array<{ tableName: string; record: Record<string, unknown>; branchId: string }> = [];
    const adapter: SyncMongoAdapter = {
      connect: async () => undefined,
      disconnect: async () => undefined,
      ping: async () => true,
      upsert: async (tableName, record, branchId) => {
        uploaded.push({ tableName, record, branchId });
      },
      remove: async () => undefined,
      findChangedSince: async () => [],
    };

    expect(await pushPendingRecords(adapter)).toBeGreaterThan(0);
    const uploadedPatient = uploaded.find((item) => item.tableName === 'patients');
    expect(uploadedPatient).toBeDefined();
    expect(uploadedPatient?.record.id).toBe('pat_sync_test');
    expect(uploadedPatient?.branchId).toBe('br_sync_test');
    expect((await query('sync_outbox').where({ id: pointer.id }).first()).status).toBe('synced');
  });

  it('keeps a failed pointer pending for a later retry', async () => {
    const pointer = await query('sync_outbox').where({ table_name: 'patients', record_id: 'pat_sync_test' }).first();
    await query('sync_outbox').where({ id: pointer.id }).update({ status: 'pending', attempts: 0 });
    const adapter: SyncMongoAdapter = {
      connect: async () => undefined,
      disconnect: async () => undefined,
      ping: async () => false,
      upsert: async () => { throw new Error('network unavailable'); },
      remove: async () => undefined,
      findChangedSince: async () => [],
    };

    expect(await pushPendingRecords(adapter)).toBe(0);
    expect((await query('sync_outbox').where({ id: pointer.id }).first()).status).toBe('pending');
  });

  it('applies a remote record and clears the generated local pointer', async () => {
    const adapter: SyncMongoAdapter = {
      connect: async () => undefined,
      disconnect: async () => undefined,
      ping: async () => true,
      upsert: async () => undefined,
      remove: async () => undefined,
      findChangedSince: async () => [{
        tableName: 'patients',
        document: {
          _id: 'pat_remote_test',
          display_id: 'P-REMOTE-1',
          name_ar: 'مريض قادم من فرع آخر',
          name_ar_normalized: 'مريض قادم من فرع اخر',
          name_en: 'Remote Patient',
          phone: '01022222222',
          age: 40,
          gender: 'female',
          address: null,
          notes: null,
          home_branch_id: 'br_sync_test',
          is_active: 1,
          updated_at: new Date().toISOString(),
          _synced_from_branch: 'br_other',
          _synced_at: new Date(),
        },
      }],
    };

    expect(await pullRemoteRecords(adapter)).toBe(1);
    expect(await query('patients').where({ id: 'pat_remote_test' }).first()).toBeDefined();
    expect(await query('sync_outbox').where({ table_name: 'patients', record_id: 'pat_remote_test' }).first()).toBeUndefined();
  });
});