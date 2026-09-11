# Clinixa — معمار الباك إند الكامل (Backend Architecture & Workflow)

> **مبني على:** `docs/05-data-model.md` و `docs/06-actions-spec.md` من مستندات المشروع الأصلية.
> **القرارات المعتمدة:**
> 1. Monorepo بـ workspaces (electron / server / client منفصلين)
> 2. Frontend: React + Vite (SPA)
> 3. Sync: Outbox Pattern بـ pointer فقط (بدون تكرار البيانات) + تتبع حالة كامل
> 4. Backend: Express مدمج جوّه Electron main process (localhost فقط، مفيش استضافة خارجية للتشغيل اليومي)

---

## ١. هيكل المشروع الكامل (Project Structure)

```
clinixa/
├── package.json                       ← جذر الـ workspaces
├── pnpm-workspace.yaml                ← (أو npm workspaces في package.json)
├── .env.example
├── README.md
│
├── packages/
│   │
│   ├── shared/                        ← ⭐ حزمة مشتركة بين server و client (اسمها "@clinixa/shared")
│   │   ├── package.json
│   │   └── src/
│   │       ├── permissions.ts         ← الـ 17 صلاحية (pat.add, att.done...) — مصدر واحد للحقيقة
│   │       ├── constants.ts           ← charge_types, payment_methods, specialties, attendance_status...
│   │       └── types.ts               ← أنواع TypeScript مشتركة (Patient, Attendance, Employee...)
│   │
│   ├── electron/                      ← غلاف التطبيق (Main Process)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── main.ts                ← نقطة الدخول: بيشغّل السيرفر + النافذة
│   │   │   ├── window.ts              ← إعداد BrowserWindow
│   │   │   ├── server-bootstrap.ts    ← بيشغّل Express جوّه نفس الـ process
│   │   │   ├── preload.ts             ← جسر آمن بين Renderer و Main (contextBridge)
│   │   │   ├── ipc/                   ← أي حاجة محتاجة IPC مباشر (فتح ملف، طباعة، إلخ)
│   │   │   │   ├── print.handler.ts
│   │   │   │   ├── file-dialog.handler.ts   ← لاختيار وجهة النسخ الاحتياطي (فلاشة)
│   │   │   │   └── app-lifecycle.handler.ts
│   │   │   └── auto-updater.ts        ← تحديث التطبيق (اختياري لاحقًا)
│   │   └── electron-builder.json      ← إعدادات البناء لـ .exe / .dmg
│   │
│   ├── server/                        ← الباك إند (Express + قواعد البيانات)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── app.ts                 ← إعداد Express (middlewares + routes)
│   │   │   ├── server.ts              ← بيستقبل نداء التشغيل من electron/server-bootstrap
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── env.ts
│   │   │   │   └── constants.ts       ← القوائم الثابتة (charge_types, specialties...)
│   │   │   │
│   │   │   ├── db/
│   │   │   │   ├── sqlite/
│   │   │   │   │   ├── client.ts      ← اتصال better-sqlite3
│   │   │   │   │   ├── migrations/    ← ملفات الهجرة (Knex migrations)
│   │   │   │   │   └── seed.ts        ← بيانات أولية (القوائم المرجعية)
│   │   │   │   └── mongo/
│   │   │   │       ├── client.ts      ← اتصال Mongoose بـ Atlas (اختياري - multi-branch فقط)
│   │   │   │       └── schemas/       ← Mongoose schemas (مرآة لجداول SQLite القابلة للمزامنة)
│   │   │   │
│   │   │   ├── modules/                       ← كل موديول بمنطقه الكامل (Layered)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.validation.ts
│   │   │   │   ├── setup/                     ← First-Run Setup
│   │   │   │   │   ├── setup.routes.ts
│   │   │   │   │   ├── setup.controller.ts
│   │   │   │   │   └── setup.service.ts
│   │   │   │   ├── patients/
│   │   │   │   │   ├── patients.routes.ts
│   │   │   │   │   ├── patients.controller.ts
│   │   │   │   │   ├── patients.service.ts
│   │   │   │   │   ├── patients.repository.ts
│   │   │   │   │   └── patients.validation.ts
│   │   │   │   ├── medical-records/            ← history, diagnoses, meds, prescriptions, labs...
│   │   │   │   ├── attendance/
│   │   │   │   ├── payments/                   ← charges + payments + day-close
│   │   │   │   ├── inventory/
│   │   │   │   ├── employees/                  ← employees + permissions
│   │   │   │   ├── branches/
│   │   │   │   ├── settings/                   ← clinic_settings
│   │   │   │   ├── backup/
│   │   │   │   ├── system-alerts/
│   │   │   │   └── sync/                       ← ⭐ محرك المزامنة (Outbox Engine)
│   │   │   │       ├── sync.routes.ts          ← GET /sync/status (للواجهة)
│   │   │   │       ├── sync.engine.ts          ← الحلقة الرئيسية: pending → syncing → synced/failed
│   │   │   │       ├── sync.repository.ts      ← عمليات outbox (upsert pointer, تحديث status)
│   │   │   │       ├── sync.connectivity.ts    ← فحص وجود إنترنت فعلي (ping Atlas)
│   │   │   │       └── sync.triggers.ts        ← Hook بيتنادى من أي service بيعدّل جدول قابل للمزامنة
│   │   │   │
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.middleware.ts          ← يتحقق من الجلسة (employee_id + branch_id)
│   │   │   │   ├── permission.middleware.ts     ← ⭐ يفحص الصلاحية (زي pat.add) قبل أي فعل
│   │   │   │   ├── arabic-normalize.middleware.ts ← توحيد الحروف العربية قبل أي حفظ/بحث
│   │   │   │   ├── error-handler.middleware.ts
│   │   │   │   └── validate.middleware.ts       ← تطبيق سكيمات Zod/Joi على كل route
│   │   │   │
│   │   │   ├── shared/
│   │   │   │   ├── utils/
│   │   │   │   │   ├── arabicNormalize.ts       ← أ/إ/آ→ا، ة→ه، ى→ي
│   │   │   │   │   ├── nameMap.ts               ← توليد الاسم الإنجليزي من reference-arabic-name-map.js
│   │   │   │   │   ├── recalcDue.ts             ← حساب المستحق من البنود (مايتخزنش)
│   │   │   │   │   └── idGenerator.ts           ← توليد P-1002 وغيره
│   │   │   │   └── types/
│   │   │   │
│   │   │   └── jobs/                            ← مهام دورية (node-cron داخل نفس الـ process)
│   │   │       ├── syncScheduler.ts             ← يشغّل sync.engine كل ما الاتصال يرجع
│   │   │       └── backupScheduler.ts           ← نسخ احتياطي تلقائي (لو مفعّل)
│   │   │
│   │   └── tests/
│   │
│   └── client/                         ← الفرونت (React + Vite)
│       ├── package.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── routes/                 ← React Router: نفس تقسيم prototype/screens
│       │   ├── pages/
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── patients/
│       │   │   ├── attendance/
│       │   │   ├── payments/
│       │   │   ├── inventory/
│       │   │   └── admin/
│       │   ├── components/             ← مكوّنات مشتركة (مبنية على tokens.css الموجود)
│       │   ├── api/                    ← طبقة نداء الـ APIs (axios/fetch wrapper)
│       │   ├── hooks/
│       │   ├── store/                  ← إدارة حالة (Zustand/Redux) — فرع الجلسة، اللغة، الثيم
│       │   ├── i18n/                   ← عربي/إنجليزي (RTL/LTR)
│       │   └── assets/                 ← نفس fonts + tokens.css من الـ prototype
│       └── index.html
│
└── docs/                               ← نفس المستندات الأصلية (تُبقى كمرجع حي)
```

**السبب في كل قرار هيكلي:**
- **`packages/shared/`:** بما إن الباك والفرونت بيتطوروا من نفس الـ Git repo (كل مطور في مجلده، والمزامنة عن طريق push/pull عادي)، الصلاحيات والقوائم المرجعية والأنواع المشتركة بتتكتب **مرة واحدة بس** هنا، ويستوردها `server` و`client` مباشرة (`import { PERMISSIONS } from '@clinixa/shared'`) عن طريق workspaces symlink — من غير نسخ يدوي ومن غير اعتماد على API وقت التشغيل. أي تعديل (زي إضافة صلاحية جديدة) بييجي في نفس الـ commit ويوصل للطرفين بمجرد `git pull`.
- **`modules/` بدل `routes/` + `controllers/` مفرّقين على مستوى المشروع كله:** كل موديول (مرضى، حضور، مدفوعات...) قائم بذاته بكل طبقاته — أسهل في الصيانة ولما تكبر الفروع مستقبلاً تقدر تفصل موديول في خدمة منفصلة بسهولة.
- **`sync/` موديول مستقل:** محرك المزامنة مش جزء من أي موديول تاني — أي موديول (patients, attendance...) بينده عليه بس (`sync.triggers.ts`) لما يعمل تغيير، وهو المسؤول الوحيد عن outbox وMongo.
- **`middlewares/permission.middleware.ts`:** تطبيق حرفي للقاعدة العامة رقم ١ في `06-actions-spec.md`: *"الصلاحية بتتفحص في الباك مش في الواجهة بس"*.

---

## ٢. سكيمة قاعدة البيانات — SQLite (المحلية، لكل فرع)

> **ملاحظة معمارية أساسية:** SQLite في **الفرع المضيف (`is_host = true`)** هي **مصدر الحقيقة المحلي**. باقي الفروع (لو موجودة) عندها نسخة SQLite خاصة بيها كمان، وMongo Atlas هو نقطة الالتقاء بينهم كلهم.

### `branches`
```sql
CREATE TABLE branches (
  id            TEXT PRIMARY KEY,           -- UUID
  name_ar       TEXT NOT NULL,
  address_ar    TEXT,
  phone         TEXT NOT NULL,
  opens_at      TEXT NOT NULL,              -- "09:00"
  closes_at     TEXT NOT NULL,
  is_host       INTEGER NOT NULL DEFAULT 0, -- boolean
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### `patients` — مشترك بين الفروع (القاعدة المعمارية #١)
```sql
CREATE TABLE patients (
  id                TEXT PRIMARY KEY,          -- يظهر كـ P-1002 (رقم متسلسل + prefix)
  display_id        TEXT UNIQUE NOT NULL,      -- "P-1002"
  name_ar           TEXT NOT NULL,
  name_ar_normalized TEXT NOT NULL,             -- بعد توحيد الحروف، للبحث السريع + index
  name_en           TEXT,                       -- مشتق من name_ar وقت الحفظ (nameMap.ts)
  phone             TEXT NOT NULL,               -- بدون UNIQUE (راجع القاعدة: التكرار مسموح + تحذير)
  age               INTEGER NOT NULL,
  gender            TEXT CHECK(gender IN ('male','female')),
  address           TEXT,
  notes             TEXT,
  home_branch_id    TEXT REFERENCES branches(id),  -- معلومة فقط، مش حاجز وصول
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_patients_name_normalized ON patients(name_ar_normalized);
CREATE INDEX idx_patients_phone ON patients(phone);
```

### `patient_emergency_contacts` (١:١)
```sql
CREATE TABLE patient_emergency_contacts (
  id          TEXT PRIMARY KEY,
  patient_id  TEXT NOT NULL REFERENCES patients(id),
  name        TEXT,
  relation    TEXT,               -- enum: father/mother/spouse/sibling/other...
  phone       TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_emergency_patient ON patient_emergency_contacts(patient_id);
```

### `patient_follow_ups` (١:كتير) — الرسوم على المتابعة نفسها (قرار ١٨٧)
```sql
CREATE TABLE patient_follow_ups (
  id          TEXT PRIMARY KEY,
  patient_id  TEXT NOT NULL REFERENCES patients(id),
  branch_id   TEXT NOT NULL REFERENCES branches(id),
  due_date    TEXT NOT NULL,
  reason      TEXT,
  fee         DECIMAL,
  status      TEXT NOT NULL DEFAULT 'scheduled', -- scheduled/completed/cancelled
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### السجل الطبي (كله مرتبط بـ `patient_id`، مشترك بين الفروع)
```sql
CREATE TABLE medical_alerts (
  id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
  type TEXT NOT NULL,             -- allergy / chronic / active_medication / important_note
  text_ar TEXT NOT NULL, text_en TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE medical_history (
  id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
  category TEXT NOT NULL,   -- chronic/past/surgery/hospitalization/allergy/family/risk_factor/note
  text_ar TEXT NOT NULL, text_en TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE diagnoses (
  id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
  date TEXT NOT NULL, text_ar TEXT NOT NULL, text_en TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE medications (
  id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
  name TEXT NOT NULL, dose TEXT, frequency TEXT,
  since TEXT, status TEXT NOT NULL DEFAULT 'active', -- active/completed
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE prescriptions (
  id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
  date TEXT NOT NULL, doctor_id TEXT REFERENCES employees(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE prescription_items (
  id TEXT PRIMARY KEY, prescription_id TEXT NOT NULL REFERENCES prescriptions(id),
  drug TEXT NOT NULL, dose TEXT, frequency TEXT, duration TEXT, instructions TEXT
);

CREATE TABLE labs (
  id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
  name TEXT NOT NULL, date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- normal/abnormal/pending
  doctor_id TEXT REFERENCES employees(id),
  has_attachment INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE radiology (
  id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
  type TEXT NOT NULL, date TEXT NOT NULL, report TEXT,
  has_attachment INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
  file_name TEXT NOT NULL, type TEXT NOT NULL,      -- pdf/jpg/png
  date TEXT NOT NULL, source TEXT,
  file_ref TEXT NOT NULL,                            -- مسار محلي أو مرجع تخزين
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
⚠️ `documents.file_ref`: الملفات الفعلية **مش بتتخزن في SQLite نفسها** — بتتخزن في مجلد `app-data/attachments/{patient_id}/` والعمود ده بيحمل المسار النسبي. النسخ الاحتياطي (`backup.run`) لازم ياخد المجلد ده كامل (قرار ٢٤٨).

### `attendance` — append-only (القاعدة المعمارية #٣)
```sql
CREATE TABLE attendance (
  id          TEXT PRIMARY KEY,
  patient_id  TEXT NOT NULL REFERENCES patients(id),
  branch_id   TEXT NOT NULL REFERENCES branches(id),
  date        TEXT NOT NULL,          -- YYYY-MM-DD
  time        TEXT NOT NULL,          -- HH:MM:SS
  status      TEXT NOT NULL DEFAULT 'waiting', -- waiting/in_progress/done/noshow/left
  items       TEXT,                    -- JSON array من فهارس visit_items
  created_by  TEXT NOT NULL REFERENCES employees(id),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  -- ⚠️ لا يوجد DELETE على هذا الجدول في منطق التطبيق إطلاقًا. التعديل الوحيد المسموح: status.
);
CREATE INDEX idx_attendance_branch_date ON attendance(branch_id, date);
CREATE INDEX idx_attendance_status_due ON attendance(status); -- لفلتر "جاهزين للتحصيل"
```

### `charges` و `payments` — الفلوس
```sql
CREATE TABLE charges (
  id          TEXT PRIMARY KEY,
  patient_id  TEXT NOT NULL REFERENCES patients(id),
  branch_id   TEXT NOT NULL REFERENCES branches(id),
  type        TEXT NOT NULL,           -- ENUM نصي: consultation/follow_up_visit/procedure/radiology/labs/other/follow_up
  amount      DECIMAL NOT NULL,
  date        TEXT NOT NULL,
  time        TEXT NOT NULL,           -- ⚠️ مطلوب دائمًا (قرار ٢٢٣)
  attendance_id TEXT REFERENCES attendance(id), -- لو ناتج عن إنهاء كشف
  created_by  TEXT NOT NULL REFERENCES employees(id),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE payments (
  id           TEXT PRIMARY KEY,
  patient_id   TEXT NOT NULL REFERENCES patients(id),
  branch_id    TEXT NOT NULL REFERENCES branches(id),
  amount       DECIMAL NOT NULL,
  method       TEXT NOT NULL,          -- cash/card/wallet/bank_transfer
  date         TEXT NOT NULL,
  time         TEXT NOT NULL,
  recorded_by  TEXT NOT NULL REFERENCES employees(id),
  after_day_close INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_charges_patient ON charges(patient_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
```
⚠️ **مفيش عمود `due` على `patients`** — بيتحسب دايمًا: `SUM(charges.amount) - SUM(payments.amount)` (القاعدة المعمارية #٥). دالة `recalcDue.ts` هي المصدر الوحيد لحساب المستحق.

### `day_closures` — إقفال اليوم
```sql
CREATE TABLE day_closures (
  id          TEXT PRIMARY KEY,
  branch_id   TEXT NOT NULL REFERENCES branches(id),
  date        TEXT NOT NULL,
  closed_by   TEXT NOT NULL REFERENCES employees(id),
  closed_at   TEXT NOT NULL DEFAULT (datetime('now')),
  reopened_by TEXT REFERENCES employees(id),
  reopened_at TEXT
);
CREATE UNIQUE INDEX idx_day_closure_branch_date ON day_closures(branch_id, date);
```

### `inventory_items` — بالفرع
```sql
CREATE TABLE inventory_items (
  id          TEXT PRIMARY KEY,
  branch_id   TEXT NOT NULL REFERENCES branches(id),
  name_ar     TEXT NOT NULL,
  name_en     TEXT,
  type        TEXT NOT NULL,     -- supplies/equipment
  qty         INTEGER NOT NULL DEFAULT 0,
  min_qty     INTEGER,           -- NULL للمعدات (بيتخفي)
  unit        TEXT NOT NULL,     -- box/piece/roll/bag...
  is_active   INTEGER NOT NULL DEFAULT 1,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_inventory_branch ON inventory_items(branch_id);
```

### `employees` و الصلاحيات
```sql
CREATE TABLE employees (
  id          TEXT PRIMARY KEY,
  name_ar     TEXT NOT NULL,
  username    TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL,        -- doctor/nurse/secretary (عرض بس)
  branch_id   TEXT REFERENCES branches(id),  -- NULL للمالك
  is_owner    INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  security_question TEXT,           -- للمالك بس
  security_answer_hash TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE employee_permissions (
  id            TEXT PRIMARY KEY,
  employee_id   TEXT NOT NULL REFERENCES employees(id),
  permission_key TEXT NOT NULL,     -- 'pat.add', 'att.done', 'pay.add' ... (١٧ صلاحية)
  UNIQUE(employee_id, permission_key)
);
```

### `clinic_settings` — صف واحد فقط
```sql
CREATE TABLE clinic_settings (
  id             TEXT PRIMARY KEY DEFAULT 'singleton',
  name_ar        TEXT NOT NULL,
  specialty      TEXT NOT NULL,     -- مفتاح من قائمة الـ ٢٠ تخصص
  phone          TEXT,
  address        TEXT,
  license_key    TEXT NOT NULL,
  security_question TEXT,
  security_answer_hash TEXT,
  sync_mode      TEXT NOT NULL DEFAULT 'none',  -- none/local_server/external_hosting (للقراءة بس بعد التركيب)
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE clinic_prices (
  id            TEXT PRIMARY KEY,
  charge_type   TEXT NOT NULL UNIQUE,   -- ENUM نصي، يطابق charges.type
  default_amount DECIMAL NOT NULL DEFAULT 0
);
```

### `system_alerts`
```sql
CREATE TABLE system_alerts (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,    -- backup_failed/low_stock
  title       TEXT NOT NULL,
  detail      TEXT,
  branch_id   TEXT REFERENCES branches(id),
  is_read     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### `backup_history`
```sql
CREATE TABLE backup_history (
  id           TEXT PRIMARY KEY,
  date         TEXT NOT NULL,
  time         TEXT NOT NULL,
  status       TEXT NOT NULL,      -- ok/fail
  fail_reason  TEXT,               -- token/offline/device
  size_mb      DECIMAL,
  kind         TEXT NOT NULL,      -- auto/manual
  destination  TEXT NOT NULL       -- local_device/usb/google_drive
);
```

### ⭐ `sync_outbox` — قلب نظام المزامنة (تصميمك المعدَّل: pointer فقط)
```sql
CREATE TABLE sync_outbox (
  id          TEXT PRIMARY KEY,
  table_name  TEXT NOT NULL,       -- 'patients', 'attendance', ...
  record_id   TEXT NOT NULL,
  branch_id   TEXT NOT NULL REFERENCES branches(id),  -- مين عمل التغيير
  status      TEXT NOT NULL DEFAULT 'pending', -- pending/syncing/synced/failed
  attempts    INTEGER NOT NULL DEFAULT 0,
  last_error  TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at   TEXT
);
-- ⭐ القيد الأهم: أي تغيير تاني على نفس الصف وهو لسه pending بيعمل UPDATE مش INSERT جديد
CREATE UNIQUE INDEX idx_outbox_unique_record ON sync_outbox(table_name, record_id);
CREATE INDEX idx_outbox_status ON sync_outbox(status);
```

**الجداول القابلة للمزامنة (Syncable):** `patients`, `patient_emergency_contacts`, `patient_follow_ups`, `medical_alerts`, `medical_history`, `diagnoses`, `medications`, `prescriptions`, `prescription_items`, `labs`, `radiology`, `documents`, `attendance`, `charges`, `payments`, `inventory_items`, `branches`.
**غير قابلة للمزامنة (محلية لكل فرع فقط):** `employees`, `employee_permissions`, `clinic_settings`, `system_alerts`, `backup_history`, `day_closures`, `sync_outbox` نفسها.
> السبب: الموظفين وصلاحياتهم وإعدادات كل فرع مش بيانات طبية مشتركة، ومفيش داعي تتزامن — كل فرع بيدير موظفينه بنفسه.

---

## ٣. سكيمة MongoDB Atlas (نقطة الالتقاء بين الفروع)

> **تُستخدم فقط لو `sync_mode = local_server` أو `external_hosting` مع أكتر من فرع.** لو فرع واحد بس (`sync_mode = none`) — مفيش اتصال بـ Mongo نهائيًا، SQLite لوحدها كفاية.

كل collection **مرآة** لجدول SQLite المقابل بنفس الحقول + حقل إضافي:

```js
// مثال: collection "patients"
{
  _id: "same as sqlite patient.id",   // نفس المعرف — عشان الـ upsert يبقى بسيط
  name_ar, name_ar_normalized, name_en,
  phone, age, gender, address, notes,
  home_branch_id, is_active,
  created_at, updated_at,
  _synced_from_branch: "branch-uuid", // آخر فرع بعت آخر نسخة
  _synced_at: ISODate(...)
}
```

**فهارس مطلوبة في Atlas:** `name_ar_normalized` (للبحث)، `phone`، `updated_at` (لحل تعارضات لو حصلت).

**استراتيجية التعارض (Conflict Resolution):** **Last-Write-Wins** بمقارنة `updated_at` — لو فرعين عدّلوا نفس المريض وهما الاتنين أوفلاين، اللي وقت تعديله أحدث (`updated_at`) هو اللي بيكسب وقت المزامنة. ده كافي لحجم البيانات هنا (عيادة واحدة بفروع محدودة، مش تعديلات متزامنة كل ثانية).

---

## ٤. محرك المزامنة (Sync Engine) — تدفق العمل بالتفصيل

```
① أي service بيعمل INSERT/UPDATE على جدول قابل للمزامنة
        │
        ▼
② sync.triggers.ts بينده على sync.repository.upsertOutboxPointer(table, record_id, branch_id)
        │        (نفس transaction بتاعة الحفظ الأصلي — عشان لو فشل الحفظ الأصلي، الـ pointer مايتكتبش)
        ▼
③ صف في sync_outbox: status = 'pending' (أو تحديث updated_at لو موجود أصلاً وهو pending)
        │
        ▼
④ sync.connectivity.ts بيراقب الاتصال:
   - حدث 'online'/'offline' من نظام التشغيل
   - + ping فعلي دوري لـ Atlas كل ٣٠ ثانية (navigator.onLine مش كفاية لوحدها)
        │  (لقى إنترنت فعلي + فيه pending)
        ▼
⑤ sync.engine.ts يبدأ دورة:
   لكل صف pending (بالترتيب created_at):
     - status → 'syncing'   (الواجهة بتقرا الحالة دي من GET /api/sync/status)
     - يجيب البيانات الحالية من SQLite بـ record_id
     - upsert على Mongo Atlas (نفس _id)
     - نجح  → status = 'synced', synced_at = now()
     - فشل  → status = 'failed', attempts++, last_error = رسالة الخطأ
              (لو attempts < 5 → يترجع 'pending' تلقائيًا بعد ٦٠ ثانية لمحاولة تانية)
        │
        ▼
⑥ (اتجاه عكسي) sync.engine.ts كمان بيسحب من Atlas أي صف اتغيّر بعد آخر synced_at
   محلي من فروع تانية، ويعمله upsert في SQLite المحلية
   (هنا SQLite بقى الطرف اللي بيستقبل، فمفيش outbox pointer بيتعمل لتغييرات جايه من بره)
```

**الحالة اللي بتظهر للمستخدم (GET `/api/sync/status`):**
```json
{
  "connection": "online",             // online / offline
  "pending_count": 3,
  "syncing_count": 0,
  "failed_count": 1,
  "last_synced_at": "2026-08-24T10:32:00Z",
  "recent": [
    { "table": "patients", "record_id": "...", "status": "synced", "synced_at": "..." },
    { "table": "payments", "record_id": "...", "status": "failed", "last_error": "network timeout" }
  ]
}
```

---

## ٥. الـ APIs الكاملة (REST — كلها تحت `/api`)

> **قاعدة عامة على كل الـ endpoints:** `employee_id` و `branch_id` بييجوا من الجلسة (session/JWT محلي) مش من الـ body. كل route بيمر على `auth.middleware` ثم `permission.middleware` بالصلاحية المطلوبة.

### Auth & Setup
| Method | Endpoint | الصلاحية | ملاحظات |
|---|---|---|---|
| POST | `/auth/login` | — | username + password، مفيش remember-me |
| POST | `/auth/logout` | جلسة | |
| POST | `/auth/forgot-password` | — | سؤال أمان (طبيب فقط) |
| POST | `/setup/first-run` | — | مفتاح ترخيص + بيانات عيادة + حساب طبيب + سؤال أمان → بينشئ الفرع الرئيسي تلقائيًا |
| GET | `/auth/session` | جلسة | بيانات المستخدم الحالي + صلاحياته |

### المرضى
| Method | Endpoint | الصلاحية |
|---|---|---|
| GET | `/patients?search=&page=` | `pat.view` |
| GET | `/patients/:id` | `pat.view` |
| POST | `/patients` | `pat.add` |
| PUT | `/patients/:id` | `pat.edit` |
| PATCH | `/patients/:id/toggle-active` | `pat.off` |
| GET | `/patients/:id/due` | `pat.view` |  محسوب لحظيًا |
| POST | `/patients/:id/emergency-contact` | `pat.edit` |
| POST | `/patients/:id/follow-ups` | `pat.edit` |

### السجل الطبي
| Method | Endpoint | الصلاحية |
|---|---|---|
| GET | `/patients/:id/medical-record` | `pat.view` | يرجّع كل الأقسام + medical_alerts دايمًا |
| POST | `/patients/:id/medical-history` | `pat.edit` |
| POST | `/patients/:id/diagnoses` | `pat.edit` |
| POST | `/patients/:id/medications` | `pat.edit` |
| PATCH | `/medications/:id/stop` | `pat.edit` |
| PATCH | `/medications/:id/refill` | `pat.edit` |
| POST | `/patients/:id/prescriptions` | `pat.edit` | يرجّع `medical_alerts` مع الاستجابة (قرار ١١١) |
| POST | `/patients/:id/labs` | `pat.edit` |
| POST | `/patients/:id/radiology` | `pat.edit` |
| POST | `/patients/:id/documents` | `pat.edit` | multipart upload |

### الحضور
| Method | Endpoint | الصلاحية | ملاحظات |
|---|---|---|---|
| GET | `/attendance?date=&branch_id=` | `att.view` | فرع الجلسة تلقائيًا |
| POST | `/attendance/check-in` | `att.add` | `{ patient_id }` |
| PATCH | `/attendance/:id/call` | `att.edit` | waiting→in_progress، يقفل أي in_progress تاني |
| PATCH | `/attendance/:id/status` | `att.edit` | noshow/left فقط |
| POST | `/attendance/:id/finish` | **`att.done`** | ⭐ الفعل المركّب — راجع تفصيله تحت |
| GET | `/attendance/ready-for-checkout` | `pay.add` | `status=done AND due>0` |

**تفصيل `POST /attendance/:id/finish`:**
```json
// Request
{ "items": [0, 2, 5], "follow_up": { "days": 14, "fee": 100 } }

// Response
{
  "ok": true,
  "status": "done",
  "charges_created": [...],
  "follow_up_created": {...},
  "final_due": 350,
  "can_collect": true   // بناءً على صلاحية pay.add لنفس المستخدم
}
```
⚠️ منطق واحد بالظبط مستخدم من شاشتين (لوحة التحكم + الحضور) — نفس الـ endpoint بالظبط، مفيش تكرار منطق (قرار ٢٦٨).

### المدفوعات
| Method | Endpoint | الصلاحية |
|---|---|---|
| GET | `/charges?patient_id=` | `pay.view` |
| POST | `/charges` | `pay.add` | يتطلب `date` + `time` |
| GET | `/payments?patient_id=` | `pay.view` |
| POST | `/payments` | `pay.add` | افتراضي = المستحق الكامل |
| GET | `/payments/outstanding?branch_id=` | `pay.view` | شاشة المستحقات |
| GET | `/day-summary?date=` | `pay.view` |
| POST | `/day-summary/close` | `pay.edit` |
| POST | `/day-summary/reopen` | `pay.edit` |

### المخزون
| Method | Endpoint | الصلاحية |
|---|---|---|
| GET | `/inventory?branch_id=` | `inv.view` |
| POST | `/inventory` | `inv.add` |
| PUT | `/inventory/:id` | `inv.edit` |
| PATCH | `/inventory/:id/adjust-qty` | `inv.edit` | يولّد `system_alert` لو `qty <= min_qty` |

### الموظفون والصلاحيات
| Method | Endpoint | الصلاحية |
|---|---|---|
| GET | `/employees?branch_id=` | `admin.view` |
| POST | `/employees` | `admin.edit` | كلمة سر مؤقتة تتعرض مرة واحدة |
| PUT | `/employees/:id/permissions` | `admin.edit` | يرفض تعديل صلاحيات المالك |
| PATCH | `/employees/:id/reset-password` | `admin.edit` |
| PATCH | `/employees/:id/toggle-active` | `admin.edit` | يرفض تعطيل المالك |

### الفروع والإعدادات
| Method | Endpoint | الصلاحية |
|---|---|---|
| GET | `/branches` | `admin.view` |
| POST | `/branches` | `admin.edit` |
| PUT | `/branches/:id` | `admin.edit` | يرفض لو هيسيب صفر فروع |
| GET | `/settings` | جلسة |
| PUT | `/settings` | `admin.edit` | `sync_mode` للقراءة بس |

### النسخ الاحتياطي
| Method | Endpoint | الصلاحية |
|---|---|---|
| GET | `/backup/history` | `admin.view` |
| POST | `/backup/run` | `admin.edit` | يبلّغ التقدم عبر SSE/WebSocket محلي |
| PUT | `/backup/destination` | `admin.edit` |
| POST | `/backup/restore` | `admin.edit` | يتطلب كلمة تأكيد نصية |

### تنبيهات النظام والمزامنة
| Method | Endpoint | الصلاحية |
|---|---|---|
| GET | `/system-alerts` | جلسة |
| PATCH | `/system-alerts/:id/read` | جلسة |
| GET | `/sync/status` | جلسة | ⭐ تفاصيل فوق |
| POST | `/sync/retry` | `admin.edit` | إعادة محاولة يدوية للـ failed |

---

## ٦. Workflow التنفيذ الكامل (End-to-End)

### أ) أول تشغيل (First-Run Setup)
```
تثبيت التطبيق → فتحه أول مرة
   → لا يوجد clinic_settings ⇒ يوجّه تلقائيًا لـ "إعداد أول تشغيل"
   → المستخدم يدخل: مفتاح الترخيص (CLX-XXXX-XXXX-XXXX) + بيانات العيادة
     + حساب الطبيب (username/password) + سؤال الأمان
   → POST /setup/first-run:
       1. إنشاء clinic_settings (صف واحد)
       2. إنشاء الفرع الرئيسي تلقائيًا (is_host=true) من بيانات العيادة
       3. إنشاء حساب الطبيب (is_owner=true, branch_id=null, كل الصلاحيات)
       4. تشغيل seed.ts: القوائم المرجعية (charge_types, specialties...)
   → تسجيل دخول تلقائي → لوحة التحكم
```

### ب) الاستخدام اليومي (سيناريو نموذجي)
```
تسجيل دخول (سكرتيرة) → فرع الجلسة يتحدد من حساب الموظف
   → مريض يوصل → بحث بالاسم/الهاتف (بعد توحيد الحروف)
     → موجود؟ attendance.checkIn (status=waiting)
     → مش موجود؟ patient.create سريع من المودال ثم checkIn
   → الطبيب: attendance.call (waiting→in_progress)
   → الطبيب يكشف، يكتب تشخيص/وصفة (مع تحذير الحساسية الأحمر) → attendance.finish
     → البنود تتحول لـ charges فورًا + متابعة (لو فيه) في patient_follow_ups
     → المريض يظهر في "جاهزين للتحصيل" (status=done AND due>0)
   → السكرتيرة: payment.create (المستحق الكامل أو جزئي) → طباعة إيصال
   → آخر اليوم: day.close (تسجيل مين قفل وإمتى)
```

### ج) دورة المزامنة (في الخلفية طول الوقت، لو أكتر من فرع)
```
كل تغيير فوق → sync_outbox pointer (pending)
   ⇄ الاتصال بالإنترنت متاح؟
       نعم → sync.engine يشتغل كل بضع ثواني: pending→syncing→synced/failed
       لا  → البيانات تفضل شغالة محليًا 100%، الـ outbox بيتراكم بأمان
   → المستخدم شايف مؤشر الحالة في Top Bar طول الوقت
   → فشل متكرر (5 محاولات)؟ → system_alert من نوع جديد (sync_failed) + تفاصيل في شاشة المزامنة
```

### د) النسخ الاحتياطي
```
backup.run (يدوي أو مجدول) →
  جمع ملفات المرضى (SQLite dump) → جمع الحضور والمدفوعات → جمع المرفقات (مجلد attachments/)
  → حفظ على كل وجهة مفعّلة (فلاشة/جهاز محلي/Google Drive) → تأكيد سلامة النسخة
  → صف جديد في backup_history (نجاح أو فشل + السبب الدقيق)
```

---

## ٧. التقنيات المقترحة (Stack التفصيلي)

| الطبقة | التقنية المقترحة | السبب |
|---|---|---|
| قاعدة بيانات محلية | **SQLite** عبر `better-sqlite3` | Sync API (أسرع بكتير من async في Electron)، مناسب تمامًا لتطبيق أوفلاين |
| Query Builder / Migrations | **Knex.js** فوق better-sqlite3 | migrations منظمة، مرونة أكتر من ORM كامل مع بساطة، وسهل التبديل لاحقًا لو احتجت Postgres يوم ما |
| قاعدة بيانات سحابية (اختياري) | **MongoDB Atlas** + `mongoose` | حسب قرارك الأصلي، مناسب لأنه مرن مع بنية الـ documents (خصوصًا `medical_record` المتفرع) |
| Backend framework | **Express** + TypeScript | حسب قرارك |
| Validation | **Zod** | تعريف سكيمات مرة واحدة تتستخدم في التحقق + توليد الأنواع |
| Auth محلي | **jsonwebtoken** أو session cookie محلي (بما إن السيرفر localhost فقط) | مفيش "تذكرني" (قرار صريح — الجهاز مشترك) |
| Password hashing | **bcrypt** | |
| Scheduler | **node-cron** داخل نفس الـ Express process | مزامنة دورية + نسخ احتياطي تلقائي |
| Frontend | **React 18 + Vite + TypeScript** | حسب قرارك |
| State management | **Zustand** | أخف من Redux، كافي لحجم التطبيق (فرع الجلسة، اللغة، الثيم) |
| Data fetching | **TanStack Query (React Query)** | تخزين مؤقت + إعادة محاولة تلقائية، مفيد جدًا مع تطبيق أوفلاين |
| i18n | **i18next** + `react-i18next` | عربي/إنجليزي RTL/LTR |
| Desktop packaging | **electron-builder** | لتوليد `.exe`/`.dmg` |
| اتصال Renderer ↔ Main (غير HTTP) | **contextBridge + ipcRenderer** | فقط للطباعة، اختيار مجلد النسخ الاحتياطي، وحوار الملفات |

---

## ٨. ملاحظات تنفيذ حرجة (لازم تتفرض في الكود مش بس في التوثيق)

1. **توحيد الحروف العربية إلزامي** قبل أي `INSERT`/`UPDATE`/بحث — تنفيذه في `middlewares/arabic-normalize.middleware.ts` على مستوى كل route بيستقبل نص عربي، مش متروك لكل controller يتذكره لوحده.
2. **`permission.middleware`**: شيل `view` ⇒ باقي أفعال نفس الموديول تترفض تلقائيًا (قرار ١٣١) — يتفرض كقاعدة عامة في الميدلوير نفسه مش بشرط مكرر في كل controller.
3. **حساب المالك (`is_owner=true`)**: أي محاولة `toggle-active` أو `set-permissions` عليه ترجع `403` **دايمًا** — فحص مركزي واحد في `employees.service.ts` قبل أي تعديل.
4. **الفهارس المخزّنة (charge.type وغيرها) كـ ENUM نصي مش رقم** — طبقنا التوصية المذكورة في نموذج البيانات مباشرة، ده بيلغي مشكلة "الترتيب مايتلمسش" من أصلها.
5. **`due` محسوب دايمًا في وقت الطلب** (`recalcDue.ts`) — ممنوع أي كاش أو عمود مخزّن ليه، حتى في الـ response cache على الفرونت.
6. **الحضور**: الـ repository الخاص بيه (`attendance.repository.ts`) ميحتويش على دالة `update` أو `delete` عامة أصلاً — بس `updateStatus(id, newStatus)` بمنطق تسلسل محدد، عشان القاعدة تتفرض على مستوى الكود مش بس اتفاق.

---

## ٩. الخطوات التالية المقترحة

1. إنشاء `packages/shared/` أولاً — الـ ١٧ صلاحية (`pat.add`, `att.done`...) والقوائم المرجعية في `permissions.ts` و`constants.ts`، ويتستورد من `server` و`client` عبر workspaces (بدون نسخ يدوي أو API).
2. إعداد باقي الـ Monorepo (workspaces) + أول migration (كل الجداول فوق).
3. بناء `auth` + `setup` كأول موديولين (كل حاجة تانية معتمدة عليهم).
4. بناء `patients` + `attendance` + `payments` (المسار الحرج اليومي) قبل `inventory` و`admin`.
5. `sync` engine آخر حاجة — يُبنى بعد ما الموديولات الأساسية شغالة على فرع واحد (`sync_mode=none`) وتتأكد إنها صح، بعدين تضيف المزامنة فوقها.
