# 🤖 Clinixa — AI Agent Master Guidelines & Directive File
> **هام جداً لجميع نماذج الذكاء الاصطناعي (Gemini, Claude, GPT, DeepSeek, Cursor, Antigravity, Copilot):**
> هذا الملف هو **المصدر الرئيسي للتعليمات** والقواعد الخاصة بمشروع **Clinixa**. يجب الالتزام التام بجميع القواعد والمعايير المذكورة أدناه بدون أي انحراف أو اجتهاد يخالف التصميم المعماري المعتمد.

---

## 🎯 ١. الأهداف الأساسية للمشروع (Core Principles)
1. **كود نظيف وآمن وقابل للتوسع (Clean, Secure & Scalable Code):** اتباع معايير Solid Principles، والبرمجة بالطبقات (Layered Architecture)، والأمان أولاً (Security-First).
2. **الوثائق والتعليقات بالعربية (Arabic JSDoc/TSDoc):** كتابة تعليقات توضيحية **باللغة العربية** فوق كل دالة، واضحة ومفصلة لسهولة الصيانة والمتابعة.
3. **تقسيم المهمات والملفات (Modularity & DRY):** عدم كتابة ملفات متضخمة (God Files). تقسيم الكود إلى موديولات ووظائف منفصلة وقابلة لإعادة الاستخدام مع منع التكرارات التام.
4. **التطبيق الصارم لعقد الـ API (Contract-First API):** التزام كامل بملف `clinixa-api-reference.md` بدون تغيير في الهياكل المتفق عليها.
5. **المعمارية المعتمدة (Backend Architecture):** التزام كامل بملف `clinixa-backend-architecture.md` (Monorepo, SQLite Local + Outbox Sync + Mongo Atlas).

---

## 🏗️ ٢. هيكل المشروع (Monorepo Structure)
المشروع عبارة عن Monorepo ينقسم إلى الحزم التالية:
```
packages/
├── shared/         ← حزمة مشتركة (@clinixa/shared): الصلاحيات (17 صلاحية)، القوائم الثابتة، والأنواع (TypeScript Types)
├── server/         ← Express + SQLite (better-sqlite3) + Knex Migrations + Sync Engine (Outbox)
├── client/         ← React 18 + Vite + TypeScript (SPA)
└── electron/       ← Electron Main Process غلاف التطبيق المكتبي
```

### قواعد الهيكل:
- **المصدر الموحد للحقيقة (Single Source of Truth):** الصلاحيات (`permissions.ts`) والقوائم الثابتة (`constants.ts`) تُستورد **حصريًا** من `@clinixa/shared` ولا تُكرر في السيرفر أو الفرونت.
- **التصميم الموديولي (Layered Architecture):** كل موديول داخل السيرفر يُقسم بالشكل التالي:
  - `*.routes.ts`: مسارات الـ Express والتوجيه وإسناد الميدلويرز.
  - `*.controller.ts`: التعامل مع الـ Requests والـ Responses والتحقق الإضافي.
  - `*.service.ts`: المنطق التجاري الرئيسي (Business Logic).
  - `*.repository.ts`: الاستعلامات المباشرة مع قاعدة البيانات (Database Operations).
  - `*.validation.ts`: سكيمات التحقق باستخدام **Zod**.

---

## 📝 ٣. معايير كتابة الكود والتعليقات العربية (Arabic Comments Standard)

### نموذج التعليق العربي الموحد (JSDoc بالعربي):
**يجب إضافته فوق كل دالة بدون استثناء:**
```typescript
/**
 * @description [وصف مختصر وواضح لوظيفة الدالة بالعربية]
 * @param {Type} paramName - [شرح المتغير بالعربية]
 * @returns {Promise<ReturnType>} [شرح القيمة المرجعة بالعربية]
 * @throws {CustomError} [شرح الحالات التي تطلق فيها الدالة خطأ بالعربية]
 */
export async function calculatePatientDue(patientId: string): Promise<number> {
  // كود الدالة...
}
```

### قواعد نظافة الكود (Clean Code Rules):
- **أسماء ذات معنى (Self-documenting Names):** المتغيرات والدوال تكون بأسماء إنجليزية واضحة ومعبرة (مثل `recalcPatientDue` بدلاً من `calc`).
- **منع التكرار (DRY):** إذا تكرر كود منطقي أكثر من مرتين، يجب استخراجه في دالة أو دالة مساعدة (Util) مستقلة.
- **صغر حجم الدوال (Single Responsibility):** الدالة تؤدي غرضًا واحدًا فقط ولا تتعدى 30-40 سطرًا إلا في الحالات الاستثنائية.
- **تجنب Magic Numbers/Strings:** استخدام القوائم والثوابت المسجلة في `@clinixa/shared`.

---

## 🔒 ٤. الأمان وفحص الصلاحيات (Security & RBAC Rules)

1. **التعرف على جلسة المستخدم (Auth Session):**
   - يُمنع منعًا باتًا استقبال `employee_id` أو `branch_id` في الـ Request Body.
   - يتم استخراج `employee_id` و `branch_id` دائمًا من الـ Token في `auth.middleware.ts`.

2. **فحص الصلاحيات الـ 17 (Permission Enforcement):**
   - كل مسار حساس يجب أن يمر على `permission.middleware.ts` بفحص الصلاحية المطلوبة (مثل `pat.add`, `att.done`, `pay.add`).
   - قاعدة السلسلة: سحب صلاحية `view` يترتب عليه رفض باقي أفعال الموديول تلقائيًا.

3. **حماية حساب المالك (`is_owner = true`):**
   - يُمنع تعديل صلاحيات المالك أو تعطيل حسابه (`toggle-active`). يُرجع النظام خطأ `403 FORBIDDEN` دائمًا.

4. **توحيد النصوص العربية (Arabic Normalization):**
   - تطبيق `arabic-normalize.middleware.ts` قبل أي حفظ أو بحث في النصوص العربية لتوحيد (أ/إ/آ ← ا)، (ة ← ه)، (ى ← ي).

---

## ⚖️ ٥. عقد الـ API واستجابات النظام (API Contract)

### شكل النجاح الموحد:
```json
{
  "ok": true,
  "data": { /* النتيجة أو المصفوفة */ },
  "warning": null
}
```

### شكل الخطأ الموحد (4xx / 5xx):
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | LOCKED | SERVER_ERROR",
    "message": "رسالة الخطأ بالعربية للمستخدم",
    "field": "اسم الحقل اختياري"
  }
}
```

### شكل التحذير غير المانع (Warning):
تنجح العملية ويتم الحفظ، لكن يرجع تحذير للواجهة (مثل تكرار رقم الهاتف):
```json
{
  "ok": true,
  "data": { "id": "pat_123", "name_ar": "..." },
  "warning": {
    "code": "DUPLICATE_PHONE",
    "message": "رقم الهاتف مسجل بالفعل لمريض آخر",
    "meta": { "existing_patient_id": "pat_001" }
  }
}
```

---

## 💾 ٦. قواعد معمارية البيانات الحرجة (Immutable Business Rules)

1. **المستحق للمريض (`due`):**
   - **يُمنع منعًا باتًا** إنشاء عمود مخزن لـ `due` في جدول المرضى `patients`.
   - يُمثل المستحق ناتج دالة لحظية: `SUM(charges.amount) - SUM(payments.amount)` عن طريق `recalcDue.ts`.

2. **سجل الحضور (`attendance`):**
   - جدول الحضور عبارة عن **Append-Only**. يُمنع حذف السجلات (DELETE). التعديل الوحيد المسموح هو تغيير الحالة `status` (مثل waiting -> in_progress -> done).

3. **محرك المزامنة (Sync Engine via Outbox Pattern):**
   - أي تعديل في الجداول القابلة للمزامنة يُنشئ أو يحدث Pointer في `sync_outbox` بذات الـ Transaction.
   - يتولى `sync.engine.ts` نقل البيانات إلى MongoDB Atlas في الخلفية دون تعطيل العمل المحلي الأوفلاين.

4. **كلمة السر المؤقتة (`temporary_password`):**
   - تظهر **مرة واحدة فقط** في استجابة إنشاء الموظف `POST /api/employees` ولا تُخزن كنص عادي ولا تظهر في أي استعلام مستقبلي.

---

## 🛠️ ٧. خطوات التحقق قبل إنهاء المهمة (Verification Steps)
قبل أن يُعلن الـ AI Agent إنهاء أي مهمة أو تعديل:
1. **فحص الأنواع (TypeScript Verification):** تشغيل `npx tsc --noEmit` للتأكد من عدم وجود أخطاء أنواع.
2. **فحص البناء والصياغة:** التأكد من عدم وجود أخطاء في الـ imports أو متغيرات غير مستخدمة.
3. **التأكد من وجود التعليقات العربية:** التأكد من أن جميع الدوال الجديدة أو المعدلة تحتوي على JSDoc باللغة العربية.
4. **مطابقة الـ Types للسكيمة الموثقة:** التردد والمراجعة الحرفية عموداً بعمود وحقلاً بحقل لكل `interface` في `@clinixa/shared/types.ts` مع جداول `clinixa-backend-architecture.md` وأمثلة `clinixa-api-reference.md`.
