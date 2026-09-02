# Clinixa — خطة العمل اليومية الكاملة (من التأسيس لحد جاهزية الإطلاق)

> **آخر تحديث:** بناءً على فحص فعلي لملفات الريبو المرفوعة (73 ملف).
> **الحالة العامة:** أساس قوي جدًا اتبنى صح، لكن لسه في بداية طبقة قاعدة البيانات — الموديولات الوظيفية (auth, patients, attendance...) لسه معملش أي سطر كود فيها.
>
> **⚠️ نطاق الملف:** ده الخط الزمني الكامل من دلوقتي لحد ما المشروع يبقى **جاهز فعليًا للإطلاق والبيع**، مش بس الباك إند لفرع واحد. المراحل ١-٥ (باك إند فرع واحد) هي الأساس، لكن المراحل ٦-١٠ لازم تخلص كمان قبل ما تقول "المشروع خلص". **إجمالي تقديري: ~٢٥-٣٠ يوم عمل** بافتراض إنك شغال لوحدك على الباك إند، وفرونت-إند ديفلوبر شغال بالتوازي على الفرونت.

---

## 📍 فين إحنا بالظبط دلوقتي (تقييم صادق)

### ✅ خلصان ومُختبَر (Verified بالكود مش بالوصف)
| البند | الحالة |
|---|---|
| `packages/shared` (permissions, constants, types, index) | ✅ كامل، ١٦ صلاحية، كل الـ enums، متطابق مع السكيمة الموثّقة |
| `packages/server/src/config/env.ts` | ✅ Zod schema كامل، bug الـ boolean اتصلح |
| `packages/server/knexfile.ts` | ✅ PRAGMA foreign_keys مفعّلة على كل البيئات |
| `packages/server/src/db/sqlite/client.ts` | ✅ Singleton + WAL mode + foreign_keys |
| Migrations (٥ من ١١ مجموعة) | ✅ `branches`, `clinic_settings`+`clinic_prices`, `employees`+`employee_permissions`, `patients`+`patient_sequences`, `patient_emergency_contacts`+`patient_follow_ups` |
| `.agents/rules/` + `AGENTS.md` | ✅ موحّدة ومتطابقة بين النسختين |
| `packages/client` | ✅ Vite scaffold بس (لسه مفيهوش أي منطق فعلي — مش شغلك دلوقتي) |
| `packages/electron` | ⚠️ `package.json` بس، مفيش كود Electron لسه |

### ❌ لسه معمول صفر فيه
- **٦ مجموعات migrations** ناقصة: السجل الطبي، الحضور، المالية، المخزون، النظام والنسخ الاحتياطي، sync_outbox
- **Seed data** (`seed.ts`) — مش موجود خالص
- **Utility functions** (`arabicNormalize`, `idGenerator`, `recalcDue`, `nameMap`) — مش موجودين خالص
- **Migration runner script** للتوزيع النهائي — مش موجود
- **أي موديول وظيفي واحد** (auth, patients, attendance, payments...) — صفر كود، الـ `modules/` folder مش موجود أصلاً لسه
- **Express app** نفسه (`app.ts`, `server.ts`) — مش موجود، يعني السيرفر لسه ملوش نقطة تشغيل فعلية

**خلاصة الموقف:** إنت خلّصت **طبقة التأسيس (Foundation)** بجودة عالية جدًا ومراجعة دقيقة، لكن **صفر بالمية من الموديولات الوظيفية**. ده طبيعي جدًا في مشروع بالحجم ده بعد يومين — الأساس القوي ده هيوفّر وقت كبير قدّامك.

---

## 🗺️ الخطة الكاملة (تقدير: ~15-18 يوم عمل حتى نهاية الباك إند لفرع واحد، قبل المزامنة)

> **قاعدة الأولوية:** كل يوم بينتهي بشرط واحد ثابت: `npx tsc --noEmit` بدون أخطاء + اختبار يدوي بسيط لو فيه endpoint شغال. لو يوم مخلصش، كمّله بالليل أو في أول اليوم اللي بعده — الترتيب أهم من الالتزام الحرفي بعدد الأيام.

### المرحلة ١ — إكمال طبقة قاعدة البيانات (٣-٤ أيام)

**اليوم ١: باقي الـ Migrations**
- [ ✅] `006_medical_records.ts` — medical_alerts, medical_history, diagnoses, medications, prescriptions, prescription_items, labs, radiology, documents
- [ ✅] `007_attendance.ts` — جدول attendance + الـ indexes (branch_id+date, status)
- [ ✅] `008_financials.ts` — charges, payments, day_closures + الـ indexes
- [ ✅] تشغيل `npx knex migrate:latest` والتأكد إنها بتعدي بدون أخطاء

**اليوم ٢: تكملة الـ Migrations + Seed**
- [ ✅] `009_inventory.ts` — inventory_items
- [✅ ] `010_system_support.ts` — system_alerts, backup_history
- [ ✅] `011_sync_outbox.ts` — sync_outbox + الـ Unique Index الحرج
- [ ✅] `seed.ts` — إدخال أسعار افتراضية صفرية لكل charge_type في clinic_prices
- [ ✅] فحص كل الجداول بـ DB Browser for SQLite يدويًا (تأكيد بصري إن كل حاجة زي ما هي متوقعة)

**اليوم ٣: Utility Functions**
- [✅ ] `shared/utils/arabicNormalize.ts` — دالة توحيد الحروف (أ/إ/آ→ا، ة→ه، ى→ي) + اختبار Jest بأمثلة حقيقية
- [✅ ] `shared/utils/idGenerator.ts` — توليد `P-1002` من `patient_sequences`
- [ ✅] `shared/utils/recalcDue.ts` — `SUM(charges) - SUM(payments)` لمريض معيّن
- [✅ ] `shared/utils/nameMap.ts` — تحويل الاسم العربي لإنجليزي (يكفي نسخة أولية بسيطة، تحسينها لاحقًا)
- [ ✅] Unit tests لكل دالة من الأربعة (نقطة حرجة — الدوال دي هتُستخدم في كل موديول بعد كده)

**اليوم ٤: نقطة انطلاق السيرفر الفعلي**
- [ ✅] `packages/server/src/app.ts` — إعداد Express (helmet, cors, json parser)
- [ ✅] `packages/server/src/server.ts` — نقطة التشغيل (`app.listen`)
- [ ✅] `middlewares/error-handler.middleware.ts` — يحوّل أي exception لشكل `ApiError` الموحّد
- [ ✅] `middlewares/arabic-normalize.middleware.ts`
- [✅ ] تجربة: `npm run dev` في `packages/server` ويشتغل على `localhost:4321` (حتى لو من غير أي route حقيقي لسه — نقطة تحقق مهمة إن كل حاجة متوصلة صح)

---

### المرحلة ٢ — Auth & Setup (يومين)

**اليوم ٥: Setup Module**
- [✅] `modules/setup/setup.validation.ts` (Zod schema لـ first-run طبقًا لـ `clinixa-api-reference.md` قسم ١)
- [✅] `modules/setup/setup.service.ts` — إنشاء clinic_settings + الفرع الرئيسي + حساب الطبيب في transaction واحدة
- [✅] `modules/setup/setup.controller.ts` + `setup.routes.ts`
- [✅] اختبار فعلي: `POST /api/setup/first-run` بـ Postman/Thunder Client، والتأكد إن الرد مطابق تمامًا للمثال الموثّق

**اليوم ٦: Auth Module**
- [✅] `middlewares/auth.middleware.ts` — فك تشفير JWT، حقن `employee_id`+`branch_id` في `req`
- [✅] `middlewares/permission.middleware.ts` — factory function بتاخد `Permission` وترفض لو مش موجودة
- [✅] `modules/auth/*` — login, logout, session, forgot-password
- [✅] اختبار: تسجيل دخول كامل، وتجربة endpoint محمي بدون token (لازم يرجع `401`)، وبصلاحية ناقصة (لازم يرجع `403`)

---

### المرحلة ٣ — المسار الحرج اليومي (٥-٦ أيام)

**اليوم ٧-٨: Patients Module**
- [✅] كل endpoints المرضى + السجل الطبي من `clinixa-api-reference.md` قسم ٢
- [✅] تركيز خاص: `arabicNormalize` بيتطبق فعليًا وقت الحفظ والبحث، و`DUPLICATE_PHONE` warning شغال

**اليوم ٩: Attendance Module**
- [✅] كل endpoints الحضور — تركيز خاص على `attendance.repository.ts` **من غير** دالة `update`/`delete` عامة (قاعدة معمارية صارمة)
- [✅] `POST /attendance/:id/finish` — الفعل المركّب، أهم endpoint في النظام كله

**اليوم ١٠: Payments Module**
- [✅] charges, payments, outstanding, day-summary close/reopen
- [✅] تأكيد: `due` بيتحسب لحظيًا في كل مكان، مفيش أي تخزين له

**اليوم ١١: اختبار تكاملي شامل للمسار الحرج**
- [✅] سيناريو كامل يدوي: check-in → call → finish (مع بنود) → دفع → إقفال يوم
- [✅] Jest integration test واحد على الأقل بيغطي السيناريو ده كامل

---

### المرحلة ٤ — الموديولات الداعمة (٣ أيام)

**اليوم ١٢: Inventory + Employees**
- [✅] `inventory` كامل (مع توليد `system_alert` عند `low_stock`)
- [✅] `employees` كامل (مع حماية `is_owner` المركزية)

**اليوم ١٣: Branches + Settings**
- [✅] `branches` (مع رفض حذف آخر فرع)
- [✅] `settings` (`clinic_settings` + `clinic_prices`)

**اليوم ١٤: Backup + System Alerts**
- [✅] `backup` (تشغيل، سجل، استعادة)
- [✅] `system-alerts` (قراءة، تعليم كمقروء)

---

### المرحلة ٥ — تجهيز نهائي لفرع واحد (يوم واحد)

**اليوم ١٥: مراجعة شاملة قبل التسليم لفرع واحد**
- [✅ ] `npx tsc --noEmit` نظيف في كل الـ packages
- [✅ ] مراجعة كل endpoint مقابل `clinixa-api-reference.md` (شكل الـ response مطابق حرفيًا)
- [✅ ] تجربة كاملة من `setup.firstRun` لحد `day.close` بدون أي كراش
- [✅ ] **نقطة قرار:** المنتج جاهز فعليًا للبيع/الاستخدام لعيادة بفرع واحد (`sync_mode=none`) عند هذه النقطة

---

### المرحلة ٦ — محرك المزامنة (بعد المرحلة ٥ فقط، ٣-٤ أيام)
> لا تبدأ هنا إلا بعد ما المراحل فوق شغالة ومختبرة بالكامل — ده قرارنا المعماري من الأول.

- [✅ ] `sync.repository.ts` — upsert pointer في outbox
- [✅ ] `sync.triggers.ts` — hook في كل service بيغيّر جدول Syncable
- [✅ ] `sync.connectivity.ts` — فحص اتصال فعلي
- [✅ ] `sync.engine.ts` — الحلقة الكاملة (pending→syncing→synced/failed) + upsert على Mongo Atlas
- [✅ ] `GET /sync/status` + `POST /sync/retry`
- [✅ ] اختبار قطع نت فعلي (يدوي) والتأكد إن البيانات بترجع تتزامن لوحدها

---

### المرحلة ٧ — تكامل Electron الفعلي (يومين-٣ أيام)
> دي مش "فرونت إند" — دي مسؤولية الباك إند/الفول ستاك ديفلوبر (إنت) لأنها بتتعلق بتشغيل الـ Express جوّه الـ Electron main process، مش بكود الواجهة نفسها.

**اليوم ١٦: تشغيل السيرفر جوّه Electron**
- [✅ ] `packages/electron/src/main.ts` — نقطة الدخول، بيفتح الـ window ويشغّل الـ server
- [✅ ] `packages/electron/src/server-bootstrap.ts` — استدعاء `app.listen()` بتاع Express من جوّه الـ main process نفسه (مش عملية منفصلة)
- [✅ ] `packages/electron/src/window.ts` — إعداد `BrowserWindow` (تحميل الفرونت المبني، أو `localhost:5173` وقت التطوير)
- [✅ ] تأكيد أمان: `contextIsolation: true`, `nodeIntegration: false` — نقطة حرجة أمنيًا
- [✅ ] تجربة: تشغيل التطبيق كـ Electron app حقيقي (`electron .`) والتأكد إن الفرونت بيكلم الباك على `localhost` بنجاح

**اليوم ١٧: IPC Handlers + الجدولة**
- [✅ ] `packages/electron/src/preload.ts` — الجسر الآمن (`contextBridge`)
- [✅ ] `ipc/print.handler.ts` — طباعة الإيصالات
- [✅ ] `ipc/file-dialog.handler.ts` — اختيار وجهة النسخ الاحتياطي (فلاشة/مجلد محلي)
- [✅ ] `jobs/backupScheduler.ts` (`node-cron`) — نسخ احتياطي تلقائي مجدول
- [✅ ] تجربة: طباعة إيصال فعلي من التطبيق، واختيار مسار نسخ احتياطي من نافذة حوار حقيقية

**اليوم ١٨: مسار المستخدم الكامل E2E**
- [✅ ] تشغيل التطبيق من الصفر (زي عميل حقيقي فتحه أول مرة) → Setup → تسجيل دخول → مريض → حضور → كشف → دفع → نسخة احتياطية
- [✅ ] تسجيل أي مشكلة تكامل ظهرت بين الطبقات التلاتة (Electron/Server/Client) وحلها

---

### المرحلة ٨ — تكامل النسخ الاحتياطي الحقيقي (يومين)

**اليوم ١٩: الوجهات المحلية**
- [✅ ] تنفيذ فعلي لـ `local_device` و`usb` — نسخ ملف `clinixa.db` + مجلد `attachments/` كامل لمسار مختار
- [✅ ] التحقق من سلامة النسخة (حجم الملف، فتح تجريبي للتأكد إنها مش تالفة)

**اليوم ٢٠: Google Drive Integration**    لسه محتاج احدد هنستخدم api ولا اخلي المستخدم يخزن الملف بنفسه 

- [ ] تكامل فعلي مع Google Drive API (OAuth، رفع ملف، معالجة فشل الاتصال)
- [ ] معالجة أسباب الفشل الموثّقة (`token`, `offline`, `device`) وتسجيلها في `backup_history.fail_reason` بدقة

---

### المرحلة ٩ — اختبارات شاملة (يومين-٣ أيام)

**اليوم ٢١-٢٢: تغطية اختبارات كاملة**
- [ ] Jest integration tests لكل موديول (مش بس المسار الحرج) — خصوصًا حالات الرفض (`403`, `423`, `409`)
- [ ] اختبار كل الـ Warning cases (تكرار هاتف، مستحقات سابقة)
- [ ] اختبار حماية حساب المالك (`is_owner`) في كل السيناريوهات

**اليوم ٢٣: اختبار حمل وأداء بسيط**
- [ ] محاكاة يوم عيادة كامل (٥٠-١٠٠ مريض، مئات العمليات) والتأكد من الأداء واستقرار SQLite

---

### المرحلة ١٠ — قرارات معلّقة + التجهيز للإطلاق (٢-٣ أيام)

**اليوم ٢٤: حسم القرارات المفتوحة**
- [ ] **قرار الترخيص:** التحقق من مفتاح الترخيص أونلاين مرة واحدة وقت التركيب، ولا أوفلاين بالكامل؟ (قرار مفتوح موثّق من الأصل، لازم يتحسم مع صاحب المنتج قبل ما `setup` module يتقفل نهائيًا)
- [ ] **قرار الاستضافة (لو هيتفعل multi-tenant مستقبلًا):** مين مالك حساب Atlas؟ العيادة نفسها ولا الشركة؟ ده قرار بيزنس/قانوني مش تقني، لكن بيأثر على معمار `sync` — لازم يتحسم قبل ما تبدأ المرحلة ٦ فعليًا لو هتتفعل
- [ ] مراجعة الالتزام بقانون ١٥١/٢٠٢٠ (حماية البيانات) قبل أي إطلاق فعلي لعميل حقيقي

**اليوم ٢٥-٢٦: Packaging & Release**
- [ ] `electron-builder.json` نهائي — بناء `.exe` (Windows) فعلي
- [ ] توقيع الملف (Code Signing) — مهم لتفادي تحذيرات Windows Defender للعملاء
- [ ] `auto-updater.ts` (اختياري للنسخة الأولى، أساسي للتحديثات بعد كده)
- [ ] اختبار التثبيت الكامل على جهاز نظيف (مش جهاز التطوير بتاعك) — أهم اختبار قبل التسليم لأي عميل

---

## ✅ متى نقدر نقول "المشروع خلص بالكامل"؟

| بعد | الحالة |
|---|---|
| **المرحلة ٥ (يوم ١٥)** | باك إند API شغال بالكامل، لكن **مش تطبيق ديسكتوب فعلي** — مفيش تكامل Electron، مفيش build نهائي |
| **المرحلة ٧ (يوم ١٨)** | تطبيق ديسكتوب شغال فعليًا على جهازك، لكن النسخ الاحتياطي شكلي بس ومفيش اختبارات كافية |
| **المرحلة ٩ (يوم ٢٣)** | كل حاجة شغالة ومُختبرة، لكن لسه مفيش ملف `.exe` نهائي يتسلّم لعميل |
| **المرحلة ١٠ (يوم ٢٦)** | ✅ **المشروع جاهز فعليًا للإطلاق لعيادة بفرع واحد** — ده أول نقطة حقيقية لكلمة "خلص" |
| **المرحلة ٦ (بعدها إضافيًا)** | فقط لو العميل عنده أكتر من فرع — مش شرط للإطلاق الأول |

**ملاحظة أخيرة مهمة:** الجدول الزمني ده كله بافتراض إنك شغال بمفردك على الباك إند كل يوم، من غير عوائق. أي يوم فيه مراجعة زي اللي بنعملها دي (فحص كود فعلي، تصحيحات) هو استثمار وقت بيوفّر أضعافه لاحقًا — سيبه في حسابك ومتستغربش لو بعض الأيام "امتدت" فعليًا ليوم ونص.

---

## 📌 خلاصة سريعة — إيه المطلوب منك بكرة الصبح بالظبط
ابدأ فورًا بـ **اليوم ١ من المرحلة ١**: `006_medical_records.ts`. عندك كل الأعمدة والأنواع جاهزة في `clinixa-backend-architecture.md` قسم ٢ — استخدم نفس نمط الـ ٥ migrations اللي عملتهم بالظبط (نفس أسلوب التعليقات، نفس ترتيب `up`/`down`).

**تذكير مهم:** ابعتلي كل مجموعة migrations بمجرد ما تخلص (مش لازم تستنى آخر اليوم) — المراجعة بتاعتي بتكشف حاجات حقيقية بالكود، وكل ما نراجع بدري كل ما وفرنا وقت أكتر.
