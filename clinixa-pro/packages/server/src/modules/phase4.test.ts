import request from 'supertest';
import app from '../app';
import query from '../db/sqlite/query';

describe('Phase 4 — Supporting Modules Integration Tests', () => {
  let authToken = '';
  let ownerId = '';
  let secretaryId = '';
  let inventoryItemId = '';
  let newBranchId = '';
  let alertId = '';

  beforeAll(async () => {
    // تشغيل الـ Migrations
    await query.migrate.latest();

    // إعداد العيادة والمالك (Setup)
    const setupRes = await request(app)
      .post('/api/setup/first-run')
      .send({
        license_key: 'CLX-PHASE4-TEST-KEY',
        clinic: {
          name_ar: 'عيادة المرحلة الرابعة',
          phone: '01055443322',
          address: 'القاهرة المعادي',
          specialty: 'cardio',
        },
        doctor_account: {
          name_ar: 'د. محمود شاكر',
          username: 'dr.phase4',
          password: 'password123',
        },
        security: {
          question: 'سؤال المرحلة 4؟',
          answer: 'إجابة المرحلة 4',
        },
      });

    if (setupRes.body.ok) {
      authToken = setupRes.body.data.token;
      ownerId = setupRes.body.data.employee.id;
    } else {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'dr.phase4', password: 'password123' });
      authToken = loginRes.body.data.token;
      ownerId = loginRes.body.data.employee.id;
    }
  });

  afterAll(async () => {
    // تنظيف البيانات بعد انتهاء الاختبارات
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

  // ─────────────────────────────────────────────────────────────
  // 1. المخزون (Inventory Module)
  // ─────────────────────────────────────────────────────────────
  describe('1. Inventory Module', () => {
    it('يضيف صنف جديد للمخزون (POST /api/inventory)', async () => {
      const res = await request(app)
        .post('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name_ar: 'قفازات لاتكس معقمة',
          type: 'supplies',
          qty: 25,
          min_qty: 10,
          unit: 'box',
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.id).toMatch(/^inv_/);
      expect(res.body.data.low_stock).toBe(false);

      inventoryItemId = res.body.data.id;
    });

    it('يستعلم عن قائمة المخزون مع حساب low_stock (GET /api/inventory)', async () => {
      const res = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
    });

    it('يعدل كمية المخزون ويولد تنبيه نقص مخزون عند الوصول للحد الأدنى (PATCH /api/inventory/:id/adjust-qty)', async () => {
      const res = await request(app)
        .patch(`/api/inventory/${inventoryItemId}/adjust-qty`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ qty: 5 }); // 5 <= min_qty 10

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.qty).toBe(5);
      expect(res.body.data.low_stock).toBe(true);
    });

    it('يعدل بيانات الصنف (PUT /api/inventory/:id)', async () => {
      const res = await request(app)
        .put(`/api/inventory/${inventoryItemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name_ar: 'قفازات لاتكس معقمة فاخرة',
          unit: 'carton',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name_ar).toBe('قفازات لاتكس معقمة فاخرة');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. الموظفون والصلاحيات (Employees Module)
  // ─────────────────────────────────────────────────────────────
  describe('2. Employees & Permissions Module', () => {
    it('ينشئ موظف جديد ويرجع temporary_password مرة واحدة (POST /api/employees)', async () => {
      const res = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name_ar: 'منى السكرتيرة',
          username: 'mona.sec',
          role: 'secretary',
          permissions: ['pat.view', 'pat.add', 'att.view', 'att.add', 'pay.view'],
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.temporary_password).toBeDefined();
      expect(typeof res.body.data.temporary_password).toBe('string');
      expect(res.body.data.id).toMatch(/^emp_/);

      secretaryId = res.body.data.id;
    });

    it('يستعرض قائمة الموظفين (GET /api/employees)', async () => {
      const res = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('يعدل صلاحيات الموظف (PUT /api/employees/:id/permissions)', async () => {
      const res = await request(app)
        .put(`/api/employees/${secretaryId}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          permissions: ['pat.view', 'pat.add'],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.permissions).toEqual(['pat.view', 'pat.add']);
    });

    it('يرفض تعديل صلاحيات المالك بـ 403 (PUT /api/employees/:ownerId/permissions)', async () => {
      const res = await request(app)
        .put(`/api/employees/${ownerId}/permissions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          permissions: ['pat.view'],
        });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('يعيد تعيين كلمة سر الموظف بكلمة مؤقتة جديدة (PATCH /api/employees/:id/reset-password)', async () => {
      const res = await request(app)
        .patch(`/api/employees/${secretaryId}/reset-password`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.temporary_password).toBeDefined();
    });

    it('يرفض تعطيل حساب المالك بـ 403 (PATCH /api/employees/:ownerId/toggle-active)', async () => {
      const res = await request(app)
        .patch(`/api/employees/${ownerId}/toggle-active`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ is_active: false });

      expect(res.status).toBe(403);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. الفروع (Branches Module)
  // ─────────────────────────────────────────────────────────────
  describe('3. Branches Module', () => {
    it('يضيف فرعاً جديداً (POST /api/branches)', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name_ar: 'فرع مدينة نصر',
          address_ar: 'شارع عباس العقاد، القاهرة',
          phone: '0229876543',
          opens_at: '10:00',
          closes_at: '22:00',
        });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.id).toMatch(/^br_/);
      expect(res.body.data.is_host).toBe(false);

      newBranchId = res.body.data.id;
    });

    it('يجلب قائمة الفروع (GET /api/branches)', async () => {
      const res = await request(app)
        .get('/api/branches')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('يعدل بيانات الفرع (PUT /api/branches/:id)', async () => {
      const res = await request(app)
        .put(`/api/branches/${newBranchId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name_ar: 'فرع مدينة نصر التخصصي',
          opens_at: '09:30',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.name_ar).toBe('فرع مدينة نصر التخصصي');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. الإعدادات والأسعار (Settings Module)
  // ─────────────────────────────────────────────────────────────
  describe('4. Settings & Prices Module', () => {
    it('يجلب إعدادات العيادة وقائمة الأسعار (GET /api/settings)', async () => {
      const res = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.clinic.name_ar).toBeDefined();
      expect(Array.isArray(res.body.data.prices)).toBe(true);
    });

    it('يحدث إعدادات العيادة والأسعار (PUT /api/settings)', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          clinic: {
            name_ar: 'عيادة د. محمود المحدثة',
            address: 'القاهرة الجديدة',
          },
          prices: [
            { charge_type: 'consultation', default_amount: 350 },
            { charge_type: 'follow_up_visit', default_amount: 150 },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.message).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. النسخ الاحتياطي (Backup Module)
  // ─────────────────────────────────────────────────────────────
  describe('5. Backup Module', () => {
    it('يرفض تشغيل النسخ عند عدم تحديد الوجهة بـ 400 (POST /api/backup/run)', async () => {
      const res = await request(app)
        .post('/api/backup/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('ينفذ عملية نسخ احتياطي ناجحة (POST /api/backup/run)', async () => {
      const res = await request(app)
        .post('/api/backup/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ destination: 'google_drive', kind: 'manual' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.destination).toBe('google_drive');
    });

    it('يسجل عملية نسخ فاشلة وينشئ تنبيه نظام (POST /api/backup/run with force_fail)', async () => {
      const res = await request(app)
        .post('/api/backup/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ destination: 'google_drive', kind: 'auto', force_fail: true, fail_reason: 'offline' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('fail');
      expect(res.body.data.fail_reason).toBe('offline');
    });

    it('يجلب سجل النسخ الاحتياطي (GET /api/backup/history)', async () => {
      const res = await request(app)
        .get('/api/backup/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(2);
    });

    it('يتحقق من استعادة النسخة الاحتياطية بكلمة تأكيد صحيحة (POST /api/backup/restore)', async () => {
      const res = await request(app)
        .post('/api/backup/restore')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ confirmation_text: 'RESTORE' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. تنبيهات النظام والقوائم الثابتة (System Alerts & Config)
  // ─────────────────────────────────────────────────────────────
  describe('6. System Alerts & Constants', () => {
    it('يجلب تنبيهات النظام مع unread_count (GET /api/system-alerts)', async () => {
      const res = await request(app)
        .get('/api/system-alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.unread_count).toBeGreaterThanOrEqual(1);

      if (res.body.data.items.length > 0) {
        alertId = res.body.data.items[0].id;
      }
    });

    it('يعلم تنبيه النظام كمقروء (PATCH /api/system-alerts/:id/read)', async () => {
      if (alertId) {
        const res = await request(app)
          .patch(`/api/system-alerts/${alertId}/read`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(res.body.data.is_read).toBe(true);
      }
    });

    it('يجلب القوائم المرجعية الثابتة للنظام (GET /api/config/constants)', async () => {
      const res = await request(app).get('/api/config/constants');

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.charge_types).toBeDefined();
      expect(res.body.data.payment_methods).toBeDefined();
      expect(res.body.data.roles).toBeDefined();
      expect(res.body.data.permissions).toBeDefined();
    });
  });
});
