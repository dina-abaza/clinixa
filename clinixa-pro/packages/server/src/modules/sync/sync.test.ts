import request from 'supertest';
import app from '../../app';
import query from '../../db/sqlite/query';

describe('Phase 6 — Sync Engine', () => {
  let authToken = '';
  let primaryBranchId = '';

  beforeAll(async () => {
    await query.migrate.latest();

    const setupRes = await request(app)
      .post('/api/setup/first-run')
      .send({
        license_key: 'CLX-PHASE6-TEST-KEY',
        clinic: {
          name_ar: 'عيادة المرحلة السادسة',
          phone: '01000000000',
          address: 'القاهرة',
          specialty: 'cardio',
        },
        doctor_account: {
          name_ar: 'د. محمد المرحلة السادسة',
          username: 'dr.phase6',
          password: 'password123',
        },
        security: {
          question: 'ما اسم مدرستك الأولى؟',
          answer: 'الأندلس',
        },
      });

    expect(setupRes.status).toBe(201);
    authToken = setupRes.body.data.token;
    primaryBranchId = setupRes.body.data.main_branch.id;
  });

  afterAll(async () => {
    await query('sync_outbox').del();
    await query('system_alerts').del();
    await query('backup_history').del();
    await query('inventory_items').del();
    await query('employee_permissions').del();
    await query('employees').del();
    await query('clinic_prices').del();
    await query('clinic_settings').del();
    await query('branches').del();
    await query.destroy();
  });

  it('يستعرض حالة المزامنة الحالية من خلال الـ endpoint', async () => {
    const res = await request(app)
      .get('/api/sync/status')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('enabled');
    expect(res.body.data).toHaveProperty('pending_count');
    expect(res.body.data).toHaveProperty('last_sync_at');
  });

  it('يعيد محاولة المزامنة المعلقة ويُرجع عدد المعالج', async () => {
    await query('sync_outbox').insert({
      id: 'sync_retry_test_1',
      table_name: 'patients',
      record_id: 'pat_retry_1',
      branch_id: primaryBranchId,
      status: 'pending',
      attempts: 0,
      last_error: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced_at: null,
    });

    const res = await request(app)
      .post('/api/sync/retry')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('processed_count');
  });
});
