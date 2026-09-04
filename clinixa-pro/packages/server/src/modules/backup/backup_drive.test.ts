import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../app';
import query from '../../db/sqlite/query';
import { env } from '../../config/env';
import { PERMISSIONS } from '@clinixa/shared';
import { encryptBackupData, decryptBackupData } from './backup.crypto';

describe('Phase 8 — Google Drive Integration & Encryption Tests', () => {
  let authToken = '';

  beforeAll(async () => {
    // تشغيل الـ Migrations
    await query.migrate.latest();

    // فحص إن كان يوجد مستخدم مالك بالفعل أو إنشاء واحد
    const existingOwner = await query('employees').where({ is_owner: 1 }).first();

    if (existingOwner) {
      authToken = jwt.sign(
        {
          employee_id: existingOwner.id,
          branch_id: existingOwner.branch_id,
          is_owner: true,
          permissions: PERMISSIONS,
        },
        env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    } else {
      const setupRes = await request(app)
        .post('/api/setup/first-run')
        .send({
          license_key: 'CLX-PHASE8-DRIVE-KEY',
          clinic: {
            name_ar: 'عيادة اختبارات جوجل درايف',
            phone: '01055443322',
            address: 'القاهرة - مصر',
            specialty: 'cardio',
          },
          doctor_account: {
            name_ar: 'د. طارق شاكر',
            username: 'dr.phase8',
            password: 'password123',
          },
          security: {
            question: 'سؤال الأمان للمرحلة 8؟',
            answer: 'إجابة الأمان',
          },
        });

      if (setupRes.body && setupRes.body.ok) {
        authToken = setupRes.body.data.token;
      } else {
        authToken = jwt.sign(
          {
            employee_id: 'emp_test_drive',
            branch_id: null,
            is_owner: true,
            permissions: PERMISSIONS,
          },
          env.JWT_SECRET,
          { expiresIn: '1h' }
        );
      }
    }



    // تنظيف إعدادات Google Drive قبل بدء الاختبارات
    await query('google_drive_settings').where({ id: 'singleton' }).update({
      script_url: null,
      secret_key: null,
      backup_password: null,
      is_enabled: 0,
    });
  });

  afterAll(async () => {
    await query('google_drive_settings').where({ id: 'singleton' }).update({
      script_url: null,
      secret_key: null,
      backup_password: null,
      is_enabled: 0,
    });
    await query.destroy();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. اختبارات التشفير وفك التشفير (AES-256-GCM + PBKDF2)
  // ─────────────────────────────────────────────────────────────
  describe('1. Backup Crypto Utility', () => {
    const testData = {
      patients: [{ id: 'pat_1', name_ar: 'أحمد علي', due: 150 }],
      settings: { clinic_name: 'عيادة التجربة' },
      secret: 'Super confidential health record data',
    };
    const password = 'StrongPassword2026!#$';

    it('يشفر البيانات بنجاح ويرجع بنية صالحة بـ AES-256-GCM و Salt و IV و AuthTag', () => {
      const encrypted = encryptBackupData(testData, password);

      expect(encrypted.format).toBe('clinixa-encrypted-backup-v1');
      expect(encrypted.cipher).toBe('aes-256-gcm');
      expect(typeof encrypted.salt).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
      expect(typeof encrypted.authTag).toBe('string');
      expect(typeof encrypted.data).toBe('string');
      expect(encrypted.data).not.toContain('أحمد علي');
    });

    it('يفك التشفير بكلمة السر الصحيحة ويسترجع البيانات الأصلية بدقة', () => {
      const encrypted = encryptBackupData(testData, password);
      const decrypted = decryptBackupData(encrypted, password);

      expect(decrypted).toEqual(testData);
    });

    it('يرفض فك التشفير عند إدخال كلمة سر خاطئة بـ 400', () => {
      const encrypted = encryptBackupData(testData, password);

      expect(() => {
        decryptBackupData(encrypted, 'WrongPassword123');
      }).toThrow('كلمة سر فك التشفير غير صحيحة أو البيانات تالفة');
    });

    it('يرفض التشفير بكلمة سر فارغة بـ 400', () => {
      expect(() => {
        encryptBackupData(testData, '');
      }).toThrow('كلمة سر تشفير النسخة الاحتياطية مطلوبة');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. إدارة إعدادات Google Drive (GET, PUT, DELETE)
  // ─────────────────────────────────────────────────────────────
  describe('2. Google Drive Settings Management Endpoints', () => {
    it('يجلب الإعدادات الافتراضية فارغة مع إخفاء المفاتيح (GET /api/backup/google-drive)', async () => {
      const res = await request(app)
        .get('/api/backup/google-drive')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.id).toBe('singleton');
      expect(res.body.data.is_enabled).toBe(false);
    });

    it('يحدث إعدادات Google Drive (PUT /api/backup/google-drive)', async () => {
      const res = await request(app)
        .put('/api/backup/google-drive')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          script_url: 'https://script.google.com/macros/s/AKfycbwoi8x1AcBgYcgPuAWhMrfVYrqBEh7Ml2rDz-TTrg6HWC8kx8iGnulQiWPoSwMmsjyDNg/exec',
          secret_key: 'Clinic_App_BkUp_98f7a2d4c8e1a3f6b5297130e4',
          backup_password: 'SecureBackupPassword2026',
          is_enabled: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.settings.is_enabled).toBe(true);
      expect(res.body.data.settings.has_secret_key).toBe(true);
      expect(res.body.data.settings.has_backup_password).toBe(true);
      expect(res.body.data.settings.script_url).toContain('script.google.com');
    });

    it('يرفض إعدادات غير صالحة بـ VALIDATION_ERROR', async () => {
      const res = await request(app)
        .put('/api/backup/google-drive')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          script_url: 'invalid-url',
          backup_password: '123', // less than 4 chars
        });

      expect(res.status).toBe(400);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('يمسح إعدادات Google Drive ويعطلها (DELETE /api/backup/google-drive)', async () => {
      const res = await request(app)
        .delete('/api/backup/google-drive')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.message).toBeDefined();

      const checkRes = await request(app)
        .get('/api/backup/google-drive')
        .set('Authorization', `Bearer ${authToken}`);

      expect(checkRes.body.data.is_enabled).toBe(false);
      expect(checkRes.body.data.script_url).toBeNull();
      expect(checkRes.body.data.has_secret_key).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. اختبارات النسخ السحابي والحالات الموثقة
  // ─────────────────────────────────────────────────────────────
  describe('3. Cloud Backup Execution & Failure Handling', () => {
    it('يسجل فشل النسخ السحابي عندما تكون الإعدادات غير مهيأة مع تنبيه نظام', async () => {
      const res = await request(app)
        .post('/api/backup/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ destination: 'google_drive', kind: 'manual' });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('fail');
      expect(res.body.data.fail_reason).toBe('token');

      // التحقق من وجود تنبيه نظام
      const alertsRes = await request(app)
        .get('/api/system-alerts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(alertsRes.body.ok).toBe(true);
      const backupAlert = alertsRes.body.data.items.find((a: any) => a.type === 'backup_failed');
      expect(backupAlert).toBeDefined();
    });

    it('يتعامل مع force_fail = offline بدقة ويسجلها في السجل', async () => {
      const res = await request(app)
        .post('/api/backup/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destination: 'google_drive',
          kind: 'auto',
          force_fail: true,
          fail_reason: 'offline',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('fail');
      expect(res.body.data.fail_reason).toBe('offline');
    });

    it('يتعامل مع force_fail = token بدقة', async () => {
      const res = await request(app)
        .post('/api/backup/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          destination: 'google_drive',
          kind: 'auto',
          force_fail: true,
          fail_reason: 'token',
        });

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.status).toBe('fail');
      expect(res.body.data.fail_reason).toBe('token');
    });
  });
});
