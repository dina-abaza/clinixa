# 📋 توثيق الفرونت اند - المرحلة الثامنة (Phase 8)
## النسخ الاحتياطي المحلي (Local Backup)

---

## 📌 نظرة عامة

المرحلة الثامنة توفر خدمات النسخ الاحتياطي للبيانات المحلية. تتضمن:
- نسخ احتياطي على **جهاز محلي** (Local Device)
- نسخ احتياطي على **محرك USB**
- تتبع سجل النسخ الاحتياطية
- استعادة البيانات من نسخة احتياطية سابقة

---

## 🔌 عقد الـ API (API Contract)

### 1. جلب سجل النسخ الاحتياطية
```
GET /api/backup/history
Authorization: Bearer <token>
```

**الاستجابة الناجحة (200):**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "bkp_f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "date": "2026-09-02",
        "time": "14:30:45",
        "status": "ok",
        "destination": "local_device",
        "kind": "manual",
        "size_mb": 128.4,
        "fail_reason": null
      },
      {
        "id": "bkp_a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "date": "2026-09-01",
        "time": "10:15:30",
        "status": "fail",
        "destination": "usb",
        "kind": "auto",
        "size_mb": null,
        "fail_reason": "device_unavailable"
      }
    ]
  },
  "warning": null
}
```

---

### 2. تشغيل نسخة احتياطية جديدة
```
POST /api/backup/run
Authorization: Bearer <token>
Content-Type: application/json
```

**جسم الطلب:**
```json
{
  "destination": "local_device",  // أو "usb" أو "google_drive"
  "kind": "manual",                // أو "auto" للنسخ التلقائية
  "force_fail": false,             // (اختياري) للاختبار فقط
  "fail_reason": null              // (اختياري): "offline" | "token" | "device_unavailable"
}
```

**الاستجابة الناجحة (200):**
```json
{
  "ok": true,
  "data": {
    "id": "bkp_f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "date": "2026-09-02",
    "time": "14:30:45",
    "status": "ok",
    "destination": "local_device",
    "kind": "manual",
    "size_mb": 256.7,
    "fail_reason": null
  },
  "warning": null
}
```

**الخطأ (400) - بدون وجهة:**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "اختار مكان النسخ الاحتياطي الأول",
    "field": "destination"
  }
}
```

**الخطأ (500) - فشل غير متوقع:**
```json
{
  "ok": false,
  "error": {
    "code": "SERVER_ERROR",
    "message": "حدث خطأ أثناء تنفيذ النسخة الاحتياطية",
    "field": null
  }
}
```

---

### 3. تحديث وجهة النسخ الاحتياطية الافتراضية
```
PUT /api/backup/destination
Authorization: Bearer <token>
Content-Type: application/json
```

**جسم الطلب:**
```json
{
  "destination": "local_device"  // أو "usb" أو "google_drive"
}
```

**الاستجابة الناجحة (200):**
```json
{
  "ok": true,
  "data": {
    "destination": "local_device",
    "message": "تم تحديث وجهة النسخ الاحتياطي بنجاح"
  },
  "warning": null
}
```

---

### 4. استعادة البيانات من نسخة احتياطية
```
POST /api/backup/restore
Authorization: Bearer <token>
Content-Type: application/json
```

**جسم الطلب:**
```json
{
  "confirmation_text": "RESTORE",  // أو "CONFIRM" أو "استعادة" أو "تأكيد"
  "backup_id": "bkp_..."           // (اختياري) رقم النسخة المحددة
}
```

**الاستجابة الناجحة (200):**
```json
{
  "ok": true,
  "data": {
    "message": "تمت استعادة النسخة الاحتياطية بنجاح"
  },
  "warning": null
}
```

**الخطأ (400) - كلمة تأكيد خاطئة:**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "كلمة تأكيد الاستعادة غير صحيحة",
    "field": "confirmation_text"
  }
}
```

**الخطأ (404) - نسخة غير موجودة:**
```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "النسخة الاحتياطية المحددة غير موجودة",
    "field": null
  }
}
```

---

## 🎨 حالات الاستخدام (Use Cases)

### 1️⃣ تشغيل نسخة يدوية على جهاز محلي
```javascript
// 1. الضغط على زر "نسخ احتياطي الآن"
const response = await fetch('/api/backup/run', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    destination: 'local_device',
    kind: 'manual'
  })
});

// 2. عرض النتيجة للمستخدم
if (response.ok) {
  showSuccess(`تمت النسخة الاحتياطية بنجاح (${data.size_mb} MB)`);
} else {
  showError(data.error.message);
}
```

### 2️⃣ عرض السجل التاريخي
```javascript
// جلب السجل
const response = await fetch('/api/backup/history', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { items } = response.data;

// عرض الجدول
items.forEach(item => {
  console.log(`${item.date} ${item.time} - ${item.destination} - ${item.status}`);
  if (item.status === 'fail') {
    console.log(`  ❌ السبب: ${getFailReasonText(item.fail_reason)}`);
  } else {
    console.log(`  ✅ الحجم: ${item.size_mb} MB`);
  }
});
```

### 3️⃣ استعادة النسخة الاحتياطية
```javascript
// 1. عرض نافذة تأكيد
const confirmed = await showConfirmDialog(
  "هل تريد استعادة البيانات من هذه النسخة؟",
  "أدخل كلمة التأكيد: RESTORE"
);

// 2. إرسال طلب الاستعادة
const response = await fetch('/api/backup/restore', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    confirmation_text: confirmed,
    backup_id: selectedBackupId
  })
});

if (response.ok) {
  showSuccess("تمت استعادة البيانات بنجاح");
} else {
  showError(response.error.message);
}
```

---

## 📊 حالات الفشل وأسبابها

| الحالة | السبب | الرسالة |
|--------|------|---------|
| `fail` | `offline` | لا يوجد اتصال بالإنترنت |
| `fail` | `token` | انتهت صلاحية جلسة التخزين السحابي |
| `fail` | `device_unavailable` | تعذر الوصول لجهاز التخزين |

عند حدوث أي فشل، يتم إنشاء **تنبيه نظام** تلقائياً يظهر للمسؤول الأول.

---

## 🔐 الصلاحيات المطلوبة

جميع المسارات تحتاج إلى:
- ✅ **توثيق صحيح** (JWT Token)
- ✅ **صلاحية `admin.view`** (لجلب السجل)
- ✅ **صلاحية `admin.edit`** (لتشغيل/استعادة النسخ)

```
GET    /api/backup/history       → admin.view
POST   /api/backup/run            → admin.edit
PUT    /api/backup/destination    → admin.edit
POST   /api/backup/restore        → admin.edit
```

---

## 📱 الواجهة المتوقعة (UI Expectations)

### شاشة إدارة النسخ الاحتياطية

```
┌─────────────────────────────────────┐
│  إدارة النسخ الاحتياطية            │
├─────────────────────────────────────┤
│                                     │
│  وجهة النسخ الافتراضية:             │
│  ☑ جهاز محلي  ☐ USB  ☐ جوجل درايف │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [🔄 نسخ احتياطي الآن]           ││
│  └─────────────────────────────────┘│
│                                     │
│  السجل التاريخي:                    │
│  ┌─────────────────────────────────┐│
│  │ التاريخ    | الحالة | الحجم     ││
│  ├─────────────────────────────────┤│
│  │ 2026-09-02 | ✅ OK   | 256.7 MB││
│  │ 2026-09-01 | ❌ FAIL | --      ││
│  │ 2026-08-31 | ✅ OK   | 128.4 MB││
│  └─────────────────────────────────┘│
│                                     │
│  [استعادة من النسخة المحددة]         │
│                                     │
└─────────────────────────────────────┘
```

---

## 🔄 تدفق الحالات (State Flow)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  المستخدم يضغط "نسخ احتياطي الآن"                       │
│                          ↓                              │
│                    الطلب قيد الانتظار                    │
│                    (عرض Loading)                       │
│                          ↓                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │        هل الوجهة متاحة؟                        │   │
│  ├──────────────────────────────────────────────────┤   │
│  │   ✅ نعم              │         ❌ لا             │   │
│  │   ↓                   │          ↓               │   │
│  │ النسخ جارية          │   عرض الخطأ          │   │
│  │ copy DB +             │   مثل:                  │   │
│  │ attachments           │   - بلا إنترنت        │   │
│  │   ↓                   │   - توكن منتهي        │   │
│  │ تسجيل في السجل      │   - جهاز غير متاح     │   │
│  │   ↓                   │   ↓                     │   │
│  │ ✅ نجاح              │   ❌ فشل               │   │
│  │ عرض الحجم           │   إنشاء تنبيه          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 ملاحظات للفرونت اند

1. **عدم حفظ الملفات مباشرة**: الملفات تُحفظ على الخادم تلقائياً، الفرونت يعرض النتائج فقط.

2. **تحديث السجل**: بعد نسخة جديدة، اجلب السجل مجدداً للحصول على أحدث النتائج.

3. **رسائل الخطأ**: معروضة بالعربية من الخادم مباشرة - لا تحتاج لترجمة إضافية.

4. **الصلاحيات**: إذا ظهر `403 FORBIDDEN`، فالمستخدم لا يملك `admin.edit`.

5. **التنبيهات التلقائية**: عند فشل النسخ، سيظهر تنبيه في `/api/system-alerts` تلقائياً.

6. **Google Drive مؤجل**: لا يزال غير مدعوم، تابع حالة المشروع للتحديثات.

---

## 🧪 أمثلة الاختبار

استخدم ملف [backup.http](../packages/server/requests/backup.http) لاختبار جميع الحالات:
- ✅ النسخ الناجحة
- ❌ حالات الفشل المختلفة
- ✅ الاستعادة بكلمات تأكيد مختلفة

---

## 📞 التطوير والصيانة

- **ملف الخدمة**: [backup.service.ts](../packages/server/src/modules/backup/backup.service.ts)
- **ملف الروتر**: [backup.routes.ts](../packages/server/src/modules/backup/backup.routes.ts)
- **الاختبارات**: [phase4.test.ts](../packages/server/src/modules/phase4.test.ts)
- **الصلاحيات**: `admin.view` و `admin.edit` من `@clinixa/shared`

