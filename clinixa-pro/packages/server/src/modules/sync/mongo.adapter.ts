import mongoose, { type Connection } from 'mongoose';
import type { SyncableTable } from '@clinixa/shared';

/** @description شكل السجل الذي يتم تخزينه في Mongo مع بيانات التتبع */
export interface MongoSyncDocument {
  _id: string;
  [key: string]: unknown;
}

/** @description عقد مخزن Mongo الذي يستخدمه محرك المزامنة ويمكن استبداله في الاختبارات */
export interface SyncMongoAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  ping(): Promise<boolean>;
  diagnose?(): Promise<MongoConnectionDiagnostic>;
  upsert(tableName: SyncableTable, record: Record<string, unknown>, branchId: string): Promise<void>;
  remove(tableName: SyncableTable, recordId: string): Promise<void>;
  findChangedSince(since: string | null): Promise<Array<{ tableName: SyncableTable; document: MongoSyncDocument }>>;
}

export interface MongoConnectionDiagnostic {
  status: 'connected' | 'failed';
  reason: string | null;
  code: 'ok' | 'uri_missing' | 'auth_failed' | 'ip_not_allowed' | 'network_error' | 'database_error';
}

function classifyMongoError(error: unknown): MongoConnectionDiagnostic {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  if (normalized.includes('authentication failed') || normalized.includes('bad auth')) {
    return { status: 'failed', code: 'auth_failed', reason: 'بيانات الدخول إلى MongoDB Atlas غير صحيحة' };
  }
  if (normalized.includes('whitelist') || normalized.includes('ip address') || normalized.includes('not authorized')) {
    return { status: 'failed', code: 'ip_not_allowed', reason: 'عنوان IP الحالي غير مسموح به في MongoDB Atlas Access List' };
  }
  if (normalized.includes('server selection') || normalized.includes('timed out') || normalized.includes('econnrefused') || normalized.includes('enotfound')) {
    return { status: 'failed', code: 'network_error', reason: 'تعذر الوصول إلى MongoDB Atlas. تحقق من الإنترنت وNetwork Access وDNS' };
  }
  return { status: 'failed', code: 'database_error', reason: 'فشل اتصال MongoDB Atlas بسبب إعداد غير صالح أو خطأ في قاعدة البيانات' };
}

/** @description اتصال Mongo الحقيقي مع حماية من طباعة رابط الاتصال في السجلات */
export class MongoSyncAdapter implements SyncMongoAdapter {
  private connection: Connection | null = null;

  /** @description فتح اتصال Mongo باستخدام URI القادم من بيئة السيرفر فقط */
  async connect(): Promise<void> {
    if (this.connection?.readyState === 1) return;

    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) throw new Error('MONGODB_URI غير مضبوط في بيئة السيرفر');

    this.connection = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 5,
      appName: 'ClinixaSync',
    }).asPromise();
  }

  /** @description إغلاق اتصال Mongo عند إيقاف السيرفر */
  async disconnect(): Promise<void> {
    if (!this.connection) return;
    await this.connection.close();
    this.connection = null;
  }

  /** @description فحص اتصال Mongo دون كشف أي بيانات حساسة */
  async ping(): Promise<boolean> {
    try {
      await this.connect();
      await this.connection?.db?.admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  async diagnose(): Promise<MongoConnectionDiagnostic> {
    const uri = process.env.MONGODB_URI?.trim();
    if (!uri) return { status: 'failed', code: 'uri_missing', reason: 'رابط MongoDB Atlas غير مضبوط في إعدادات التشغيل' };
    try {
      await this.connect();
      await this.connection?.db?.admin().ping();
      return { status: 'connected', code: 'ok', reason: null };
    } catch (error) {
      await this.disconnect();
      return classifyMongoError(error);
    }
  }

  /** @description رفع سجل محلي إلى collection مطابقة مع تطبيق Last-Write-Wins */
  async upsert(tableName: SyncableTable, record: Record<string, unknown>, branchId: string): Promise<void> {
    await this.connect();
    if (!this.connection?.db) throw new Error('اتصال Mongo غير جاهز');

    const recordId = String(record.id ?? '');
    if (!recordId) throw new Error(`السجل ${tableName} لا يحتوي على id`);

    const collection = this.connection.db.collection<MongoSyncDocument>(tableName);
    const current = await collection.findOne({ _id: recordId });
    const localUpdatedAt = String(record.updated_at ?? record.created_at ?? '');
    const remoteUpdatedAt = String(current?.updated_at ?? '');

    if (remoteUpdatedAt && localUpdatedAt && remoteUpdatedAt > localUpdatedAt) return;

    const document: MongoSyncDocument = {
      ...record,
      _id: recordId,
      _synced_from_branch: branchId,
      _synced_at: new Date(),
    };
    delete document.id;
    await collection.replaceOne({ _id: recordId }, document, { upsert: true });
  }

  /** @description حذف السجل المقابل في Mongo عند حذف سجل SQLite */
  async remove(tableName: SyncableTable, recordId: string): Promise<void> {
    await this.connect();
    if (!this.connection?.db) throw new Error('اتصال Mongo غير جاهز');
    await this.connection.db.collection<MongoSyncDocument>(tableName).deleteOne({ _id: recordId });
  }

  /** @description جلب السجلات التي أرسلتها الفروع منذ آخر دورة سحب */
  async findChangedSince(since: string | null): Promise<Array<{ tableName: SyncableTable; document: MongoSyncDocument }>> {
    await this.connect();
    if (!this.connection?.db) throw new Error('اتصال Mongo غير جاهز');

    const tableNames: SyncableTable[] = [
      'patients', 'patient_emergency_contacts', 'patient_follow_ups', 'medical_alerts',
      'medical_history', 'diagnoses', 'medications', 'prescriptions', 'prescription_items',
      'labs', 'radiology', 'documents', 'attendance', 'charges', 'payments',
      'inventory_items', 'branches',
    ];
    const changed: Array<{ tableName: SyncableTable; document: MongoSyncDocument }> = [];
    for (const tableName of tableNames) {
      const filter = since ? { _synced_at: { $gt: new Date(since) } } : {};
      const documents = await this.connection.db.collection<MongoSyncDocument>(tableName).find(filter).limit(100).toArray();
      changed.push(...documents.map((document) => ({ tableName, document })));
    }
    return changed;
  }
}