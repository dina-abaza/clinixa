# Clinixa — API Reference & Mock Responses

> **الغرض:** مرجع واحد لشكل كل الـ Requests/Responses — الفرونت يبني عليه Mock API ويشتغل من غير ما يستنى الباك، والباك يلتزم بنفس الشكل بالظبط وقت التنفيذ الفعلي (Contract-First).
>
> **يكمّل:** `clinixa-backend-architecture.md` (قسم ٥ فيه جدول الـ endpoints والصلاحيات — هنا التفصيل الكامل لكل واحد بمثال حقيقي).

---

## ٠. قواعد عامة على كل الـ Responses

### شكل النجاح الموحّد
```json
{
  "ok": true,
  "data": { /* أو [] حسب الـ endpoint */ },
  "warning": null
}
```

### شكل الخطأ الموحّد (كل الأخطاء 4xx/5xx بنفس الشكل)
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "رقم الهاتف لازم يكون ١١ رقم ويبدأ بـ 010/011/012/015",
    "field": "phone"
  }
}
```

**أكواد الأخطاء الموحّدة المستخدمة في كل المشروع:**
| `code` | HTTP Status | متى |
|---|---|---|
| `VALIDATION_ERROR` | 400 | فشل التحقق من مدخل (مع `field`) |
| `UNAUTHORIZED` | 401 | مفيش جلسة / جلسة منتهية |
| `FORBIDDEN` | 403 | مفيش صلاحية للفعل ده (أو محاولة على حساب المالك) |
| `NOT_FOUND` | 404 | السجل مش موجود |
| `CONFLICT` | 409 | تعارض منطقي (مثلاً: إقفال يوم مقفول أصلاً) |
| `LOCKED` | 423 | فعل ممنوع بسبب حالة (مثلاً تعديل بعد إقفال اليوم) |
| `SERVER_ERROR` | 500 | خطأ غير متوقع |

### شكل التحذير غير المانع (Warning) — العملية بتنجح رغم كده
```json
{
  "ok": true,
  "data": { "id": "pat_01HXYZ...", "display_id": "P-1042", "...": "..." },
  "warning": {
    "code": "DUPLICATE_PHONE",
    "message": "رقم الهاتف ده مسجّل بالفعل لمريض تاني",
    "meta": { "existing_patient_id": "pat_01HABC...", "existing_patient_name": "أحمد محمد علي" }
  }
}
```

### الصفحات (Pagination) — لكل endpoint فيه `GET` بقايم طويلة
```json
{
  "ok": true,
  "data": {
    "items": [ /* ... */ ],
    "page": 1,
    "page_size": 25,
    "total_items": 340,
    "total_pages": 14
  }
}
```

### الهيدرز المطلوبة في كل Request بعد تسجيل الدخول
```
Authorization: Bearer <token>
Content-Type: application/json
```
> ملحوظة: `employee_id` و`branch_id` **بيتم استنتاجهم من الـ token في الباك** — الفرونت **مايبعتهموش** في الـ body أبدًا حتى لو ظاهرين في الواجهة.

---

## ١. Auth & Setup

### `POST /api/setup/first-run`
**Request:**
```json
{
  "license_key": "CLX-9F2K-7Q1M-4TZX",
  "clinic": { "name_ar": "عيادة دكتور أحمد للقلب", "phone": "0223456789", "address": "المعادي، القاهرة", "specialty": "cardio" },
  "doctor_account": { "name_ar": "د. أحمد محمود", "username": "dr.ahmed", "password": "********" },
  "security": { "question": "اسم أول مدرسة التحقت بيها؟", "answer": "الأندلس" }
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": {
    "clinic": { "name_ar": "عيادة دكتور أحمد للقلب", "specialty": "cardio", "sync_mode": "none" },
    "main_branch": { "id": "br_01HZ...", "name_ar": "الفرع الرئيسي", "is_host": true },
    "employee": { "id": "emp_01HZ...", "name_ar": "د. أحمد محمود", "username": "dr.ahmed", "is_owner": true },
    "token": "eyJhbGciOi..."
  },
  "warning": null
}
```
**Error (مفتاح مستخدم من قبل) 409:**
```json
{ "ok": false, "error": { "code": "CONFLICT", "message": "التطبيق ده متظبّط بالفعل على جهاز تاني بنفس المفتاح ده" } }
```

### `POST /api/auth/login`
**Request:** `{ "username": "dr.ahmed", "password": "********" }`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOi...",
    "employee": {
      "id": "emp_01HZ...",
      "name_ar": "د. أحمد محمود",
      "username": "dr.ahmed",
      "role": "doctor",
      "is_owner": true,
      "branch_id": null,
      "permissions": ["pat.view","pat.add","pat.edit","pat.off","att.view","att.add","att.edit","att.done","pay.view","pay.add","pay.edit","inv.view","inv.add","inv.edit","admin.view","admin.edit"]
    },
    "active_branch": { "id": "br_01HZ...", "name_ar": "الفرع الرئيسي" }
  },
  "warning": null
}
```
**Error 401:**
```json
{ "ok": false, "error": { "code": "UNAUTHORIZED", "message": "اسم المستخدم أو كلمة السر غلط" } }
```

### `GET /api/auth/session`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "employee": {
      "id": "emp_01HZ...",
      "name_ar": "د. أحمد محمود",
      "username": "dr.ahmed",
      "role": "doctor",
      "is_owner": true,
      "branch_id": null,
      "permissions": ["pat.view","pat.add","pat.edit","pat.off","att.view","att.add","att.edit","att.done","pay.view","pay.add","pay.edit","inv.view","inv.add","inv.edit","admin.view","admin.edit"]
    },
    "active_branch": { "id": "br_01HZ...", "name_ar": "الفرع الرئيسي" }
  },
  "warning": null
}
```

### `GET /api/auth/security-question?username=dr.ahmed`
**Response 200:**
```json
{
  "ok": true,
  "data": { "question": "اسم أول مدرسة التحقت بيها؟" },
  "warning": null
}
```
**Error 404:**
```json
{ "ok": false, "error": { "code": "NOT_FOUND", "message": "المستخدم غير موجود" } }
```

### `POST /api/auth/forgot-password`
**Request:** `{ "username": "dr.ahmed", "security_answer": "الأندلس", "new_password": "********" }`
**Response 200:** `{ "ok": true, "data": { "message": "تم تغيير كلمة السر بنجاح" }, "warning": null }`
**Error 400:** `{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "إجابة سؤال الأمان غلط", "field": "security_answer" } }`

### `POST /api/auth/logout`
**Response 200:**
```json
{ "ok": true, "data": { "message": "تم تسجيل الخروج بنجاح" }, "warning": null }
```

---

## ٢. المرضى (Patients)

### `GET /api/patients?search=احمد&page=1&page_size=25&include_inactive=false`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "pat_01HABC", "display_id": "P-1002",
        "name_ar": "أحمد محمد علي", "name_en": "Ahmed Mohamed Ali",
        "phone": "01012345678", "age": 45, "gender": "male",
        "home_branch_id": "br_01HZ", "is_active": true,
        "due": 350
      }
    ],
    "page": 1, "page_size": 25, "total_items": 1, "total_pages": 1
  },
  "warning": null
}
```
> ⚠️ `due` هنا **محسوب لحظيًا في الباك** (SUM charges - SUM payments) وقت بناء كل صف — مش عمود مخزّن، لكن بيتبعت جاهز في القايمة عشان الفرونت مايحسبوش بنفسه.

### `GET /api/patients/:id`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "id": "pat_01HABC", "display_id": "P-1002",
    "name_ar": "أحمد محمد علي", "name_en": "Ahmed Mohamed Ali",
    "phone": "01012345678", "age": 45, "gender": "male",
    "address": "مدينة نصر، القاهرة", "notes": "مريض متابعة قلب منتظم",
    "home_branch_id": "br_01HZ", "is_active": true,
    "due": 350,
    "emergency_contact": { "name": "منى أحمد", "relation": "spouse", "phone": "01098765432" },
    "created_at": "2025-03-10T09:15:00Z"
  },
  "warning": null
}
```
**Error 404:** `{ "ok": false, "error": { "code": "NOT_FOUND", "message": "المريض غير موجود" } }`

### `POST /api/patients`
**Request:**
```json
{
  "name_ar": "منى إبراهيم", "phone": "01123456789", "age": 38, "gender": "female",
  "address": "الدقي، الجيزة", "notes": null
}
```
**Response 201 (نجاح عادي):**
```json
{
  "ok": true,
  "data": { "id": "pat_01HNEW", "display_id": "P-1043", "name_ar": "منى إبراهيم", "name_en": "Mona Ibrahim", "phone": "01123456789", "age": 38, "gender": "female", "due": 0, "is_active": true },
  "warning": null
}
```
**Response 201 (مع تحذير تكرار هاتف — الحفظ بيتم برضه):**
```json
{
  "ok": true,
  "data": { "id": "pat_01HNEW2", "display_id": "P-1044", "name_ar": "سارة محمود", "phone": "01123456789", "...": "..." },
  "warning": {
    "code": "DUPLICATE_PHONE",
    "message": "رقم الهاتف ده مسجّل بالفعل لمريض تاني",
    "meta": { "existing_patient_id": "pat_01HNEW", "existing_patient_name": "منى إبراهيم" }
  }
}
```
**Error 400 (validation):**
```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "الاسم لازم يكون أكتر من كلمتين", "field": "name_ar" } }
```

### `PUT /api/patients/:id` — نفس شكل POST تقريبًا (نفس الحقول قابلة للتعديل)

### `PATCH /api/patients/:id/toggle-active`
**Request:** `{ "is_active": false }`
**Response 200:** `{ "ok": true, "data": { "id": "pat_01HABC", "is_active": false }, "warning": null }`

### `GET /api/patients/:id/medical-record`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "medical_alerts": [
      { "id": "ma_1", "type": "allergy", "text_ar": "حساسية من البنسلين", "text_en": "Penicillin allergy" }
    ],
    "medical_history": [
      { "id": "mh_1", "category": "chronic", "text_ar": "ضغط دم مرتفع منذ 2018" }
    ],
    "diagnoses": [
      { "id": "dx_1", "date": "2026-06-01", "text_ar": "قصور بسيط بالصمام التاجي" }
    ],
    "medications": [
      { "id": "med_1", "name": "Concor 5mg", "dose": "5mg", "frequency": "مرة يوميًا", "status": "active" }
    ],
    "labs": [
      { "id": "lab_1", "name": "تحليل دهون شامل", "date": "2026-07-15", "status": "abnormal", "has_attachment": true }
    ],
    "radiology": [],
    "documents": [
      { "id": "doc_1", "file_name": "echo_report.pdf", "type": "pdf", "date": "2026-07-20" }
    ]
  },
  "warning": null
}
```

### `POST /api/patients/:id/medical-alerts`
**Request:**
```json
{
  "type": "allergy",
  "text_ar": "حساسية من البنسلين",
  "text_en": "Penicillin allergy"
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": { "id": "ma_01H1", "type": "allergy", "text_ar": "حساسية من البنسلين" },
  "warning": null
}
```

### `POST /api/patients/:id/medical-history`
**Request:**
```json
{
  "category": "chronic",
  "text_ar": "ضغط دم مرتفع منذ 2018",
  "text_en": "Hypertension since 2018"
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": { "id": "mh_01H1", "category": "chronic", "text_ar": "ضغط دم مرتفع منذ 2018" },
  "warning": null
}
```

### `POST /api/patients/:id/diagnoses`
**Request:**
```json
{
  "text_ar": "قصور بسيط بالصمام التاجي",
  "text_en": "Mild mitral valve regurgitation"
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": { "id": "dx_01H1", "date": "2026-08-27", "text_ar": "قصور بسيط بالصمام التاجي" },
  "warning": null
}
```

### `POST /api/patients/:id/medications`
**Request:**
```json
{
  "name": "Concor 5mg",
  "dose": "5mg",
  "frequency": "مرة يوميًا",
  "status": "active"
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": { "id": "med_01H1", "name": "Concor 5mg", "status": "active" },
  "warning": null
}
```

### `PATCH /api/medications/:id/stop`
**Response 200:**
```json
{
  "ok": true,
  "data": { "id": "med_01H1", "status": "completed" },
  "warning": null
}
```

### `PATCH /api/medications/:id/refill`
**Response 200:**
```json
{
  "ok": true,
  "data": { "id": "med_01H1", "status": "active" },
  "warning": null
}
```

### `POST /api/patients/:id/labs`
**Request:**
```json
{
  "name": "تحليل دهون شامل",
  "date": "2026-08-27",
  "status": "pending"
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": { "id": "lab_01H1", "name": "تحليل دهون شامل", "status": "pending" },
  "warning": null
}
```

### `POST /api/patients/:id/radiology`
**Request:**
```json
{
  "type": "أشعة إيكو على القلب",
  "date": "2026-08-27",
  "report": "سليمة"
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": { "id": "rad_01H1", "type": "أشعة إيكو على القلب", "date": "2026-08-27" },
  "warning": null
}
```

### `POST /api/patients/:id/prescriptions`
**Request:**
```json
{
  "items": [
    { "drug": "Concor 5mg", "dose": "قرص واحد", "frequency": "مرة يوميًا صباحًا", "duration": "شهر", "instructions": "بعد الأكل" }
  ]
}
```
**Response 201 (⭐ بترجع الحساسية دايمًا مع الاستجابة — قرار ١١١):**
```json
{
  "ok": true,
  "data": {
    "prescription": {
      "id": "rx_01H...",
      "date": "2026-08-24",
      "doctor_id": "emp_01HZ",
      "items": [
        {
          "drug": "Concor 5mg",
          "dose": "1 قرص",
          "frequency": "مرة يومياً",
          "duration": "شهر",
          "instructions": "صباحاً قبل الأكل"
        }
      ]
    },
    "medical_alerts": [
      { "type": "allergy", "text_ar": "حساسية من البنسلين" }
    ]
  },
  "warning": null
}
```

---

## ٣. الحضور (Attendance)

### `GET /api/attendance?date=2026-08-24`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "att_01H1", "patient_id": "pat_01HABC", "patient_name": "أحمد محمد علي", "patient_display_id": "P-1002",
        "date": "2026-08-24", "time": "09:15:00", "status": "waiting", "items": []
      },
      {
        "id": "att_01H2", "patient_id": "pat_01HDEF", "patient_name": "سلمى حسن", "patient_display_id": "P-1015",
        "date": "2026-08-24", "time": "09:05:00", "status": "in_progress", "items": []
      }
    ]
  },
  "warning": null
}
```

### `POST /api/attendance/check-in`
**Request:** `{ "patient_id": "pat_01HABC" }`
**Response 201:**
```json
{ "ok": true, "data": { "id": "att_01H3", "patient_id": "pat_01HABC", "status": "waiting", "date": "2026-08-24", "time": "10:02:31" }, "warning": null }
```
**Error (مريض معطّل) 400:**
```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "المريض ده معطّل، لازم تفعّله الأول" } }
```

### `PATCH /api/attendance/:id/call`
**Response 200:** `{ "ok": true, "data": { "id": "att_01H1", "status": "in_progress" }, "warning": null }`

### `PATCH /api/attendance/:id/status`
**Request:** `{ "status": "noshow" }`
**Response 200:** `{ "ok": true, "data": { "id": "att_01H1", "status": "noshow" }, "warning": null }`

### `POST /api/attendance/:id/finish` ⭐ الفعل المركّب
**Request:**
```json
{
  "items": [
    { "charge_type": "consultation", "amount": 300 },
    { "charge_type": "procedure", "amount": 150 }
  ],
  "follow_up": { "days": 14, "fee": 100 }
}
```
**Response 200 (مستحق أكبر من صفر — بيرجّع فعل تحصيل لو المستخدم عنده pay.add):**
```json
{
  "ok": true,
  "data": {
    "attendance": { "id": "att_01H1", "status": "done" },
    "charges_created": [
      { "id": "chg_01H1", "type": "consultation", "amount": 300, "date": "2026-08-24", "time": "10:22:10" },
      { "id": "chg_01H2", "type": "procedure", "amount": 150, "date": "2026-08-24", "time": "10:22:10" }
    ],
    "follow_up_created": { "id": "fu_01H1", "due_date": "2026-09-07", "fee": 100, "status": "scheduled" },
    "final_due": 450,
    "can_collect": true
  },
  "warning": null
}
```
**Response 200 (مستحق صفر — من غير مبلغ ومن غير فعل تحصيل):**
```json
{
  "ok": true,
  "data": {
    "attendance": { "id": "att_01H4", "status": "done" },
    "charges_created": [],
    "follow_up_created": null,
    "final_due": 0,
    "can_collect": false
  },
  "warning": null
}
```
**Error (المستخدم مالوش pay.add فحاول يبعت items) 403:**
```json
{ "ok": false, "error": { "code": "FORBIDDEN", "message": "مفيش صلاحية لإضافة بنود رسوم" } }
```

---

## ٤. المدفوعات (Payments)

### `GET /api/payments/outstanding?branch_id=br_01HZ`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "items": [
      { "patient_id": "pat_01HABC", "patient_name": "أحمد محمد علي", "patient_display_id": "P-1002", "due": 450, "last_visit_date": "2026-08-24" }
    ],
    "total_outstanding": 450
  },
  "warning": null
}
```

### `POST /api/charges`
**Request:** `{ "patient_id": "pat_01HABC", "type": "labs", "amount": 200, "date": "2026-08-24", "time": "11:00:00" }`
**Response 201:**
```json
{
  "ok": true,
  "data": { "id": "chg_01H3", "patient_id": "pat_01HABC", "type": "labs", "amount": 200, "date": "2026-08-24", "time": "11:00:00" },
  "warning": { "code": "PATIENT_HAS_OUTSTANDING", "message": "المريض عليه مستحقات سابقة", "meta": { "current_due": 650 } }
}
```

### `POST /api/payments`
**Request:** `{ "patient_id": "pat_01HABC", "amount": 450, "method": "cash" }`
**Response 201 (سداد كامل):**
```json
{
  "ok": true,
  "data": {
    "payment": { "id": "pmt_01H1", "patient_id": "pat_01HABC", "amount": 450, "method": "cash", "date": "2026-08-24", "time": "11:05:00", "recorded_by": "emp_01HZ", "after_day_close": false },
    "remaining_due": 0,
    "receipt": {
      "clinic_name": "عيادة دكتور أحمد للقلب", "branch_name": "الفرع الرئيسي", "branch_phone": "0223456789",
      "patient_name": "أحمد محمد علي", "amount": 450, "method": "كاش", "date": "2026-08-24", "remaining_line_visible": false
    }
  },
  "warning": null
}
```
**Response 201 (سداد جزئي بعد إقفال اليوم):**
```json
{
  "ok": true,
  "data": {
    "payment": { "id": "pmt_01H2", "amount": 200, "method": "cash", "after_day_close": true },
    "remaining_due": 250,
    "receipt": { "...": "...", "remaining_line_visible": true, "remaining_amount": 250 }
  },
  "warning": null
}
```
**Error (محاولة تعديل بعد إقفال اليوم) 423:**
```json
{ "ok": false, "error": { "code": "LOCKED", "message": "اليوم مقفول، مينفعش تعديل — بس الإضافة متاحة" } }
```

### `POST /api/day-summary/close`
**Response 200:**
```json
{
  "ok": true,
  "data": { "date": "2026-08-24", "closed_by": "emp_01HZ", "closed_at": "2026-08-24T20:00:00Z", "total_collected": 4300, "total_charges": 5100 },
  "warning": null
}
```
**Error (اليوم مقفول أصلاً) 409:**
```json
{ "ok": false, "error": { "code": "CONFLICT", "message": "اليوم ده مقفول بالفعل" } }
```

---

## ٥. المخزون (Inventory)

### `GET /api/inventory?branch_id=br_01HZ`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "items": [
      { "id": "inv_01H1", "name_ar": "قفازات طبية", "type": "supplies", "qty": 3, "min_qty": 10, "unit": "box", "low_stock": true },
      { "id": "inv_01H2", "name_ar": "جهاز ضغط", "type": "equipment", "qty": 2, "min_qty": null, "unit": "piece", "low_stock": false }
    ]
  },
  "warning": null
}
```

### `POST /api/inventory`
**Request:**
```json
{
  "name_ar": "قفازات طبية لاتكس",
  "name_en": "Medical Latex Gloves",
  "type": "supplies",
  "qty": 30,
  "min_qty": 10,
  "unit": "box"
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": {
    "id": "inv_01HNEW",
    "name_ar": "قفازات طبية لاتكس",
    "name_en": "Medical Latex Gloves",
    "type": "supplies",
    "qty": 30,
    "min_qty": 10,
    "unit": "box",
    "low_stock": false,
    "is_active": true
  },
  "warning": null
}
```

### `PUT /api/inventory/:id`
**Request:**
```json
{
  "name_ar": "قفازات طبية معقمة فاخرة",
  "min_qty": 15
}
```
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "id": "inv_01HNEW",
    "name_ar": "قفازات طبية معقمة فاخرة",
    "name_en": "Medical Latex Gloves",
    "type": "supplies",
    "qty": 30,
    "min_qty": 15,
    "unit": "box",
    "low_stock": false,
    "is_active": true
  },
  "warning": null
}
```

### `PATCH /api/inventory/:id/adjust-qty`
**Request:** `{ "qty": 3 }`
**Response 200 (بيولّد تنبيه نظام تلقائيًا):**
```json
{
  "ok": true,
  "data": { "id": "inv_01H1", "qty": 3, "min_qty": 10, "low_stock": true },
  "warning": null
}
```
> ⚠️ الباك بيعمل `INSERT` في `system_alerts` (type=`low_stock`) تلقائيًا هنا لو `qty <= min_qty` — ده مش warning بيترجع في نفس الريسبونس، ده سجل منفصل هيظهر في `GET /api/system-alerts`.

---

## ٦. الموظفون والصلاحيات

### `GET /api/employees?branch_id=br_01HZ`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "emp_01HZ", "name_ar": "د. أحمد محمود", "username": "dr.ahmed", "role": "doctor",
        "branch_id": null, "is_owner": true, "is_active": true,
        "permissions": ["pat.view","pat.add","pat.edit","pat.off","att.view","att.add","att.edit","att.done","pay.view","pay.add","pay.edit","inv.view","inv.add","inv.edit","admin.view","admin.edit"]
      },
      {
        "id": "emp_01HNEW", "name_ar": "منى السكرتيرة", "username": "mona.sec", "role": "secretary",
        "branch_id": "br_01HZ", "is_owner": false, "is_active": true,
        "permissions": ["pat.view","pat.add","pat.edit","att.view","att.add","att.edit","att.done","pay.view","pay.add"]
      }
    ]
  },
  "warning": null
}
```

### `POST /api/employees`
**Request:**
```json
{
  "name_ar": "منى السكرتيرة", "username": "mona.sec", "role": "secretary", "branch_id": "br_01HZ",
  "permissions": ["pat.view","pat.add","pat.edit","att.view","att.add","att.edit","att.done","pay.view","pay.add"]
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": {
    "id": "emp_01HNEW", "name_ar": "منى السكرتيرة", "username": "mona.sec", "role": "secretary",
    "temporary_password": "Xk7-Nq2-Wp9"
  },
  "warning": null
}
```
> ⚠️ `temporary_password` بيترجع **مرة واحدة بس** في استجابة الإنشاء — مش مخزّن نص عادي، ومش بيترجع تاني في أي `GET` بعد كده.

### `PUT /api/employees/:id/permissions`
**Request:**
```json
{
  "permissions": ["pat.view", "pat.add", "att.view", "att.add"]
}
```
**Response 200:**
```json
{
  "ok": true,
  "data": { "id": "emp_01HNEW", "permissions": ["pat.view", "pat.add", "att.view", "att.add"] },
  "warning": null
}
```
**Error (محاولة على حساب المالك) 403:**
```json
{ "ok": false, "error": { "code": "FORBIDDEN", "message": "مينفعش تعدّل صلاحيات حساب المالك" } }
```

### `PATCH /api/employees/:id/toggle-active`
**Request:** `{ "is_active": false }`
**Response 200:**
```json
{ "ok": true, "data": { "id": "emp_01HNEW", "is_active": false }, "warning": null }
```
**Error (محاولة تعطيل حساب المالك) 403:**
```json
{ "ok": false, "error": { "code": "FORBIDDEN", "message": "مينفعش تعطّل حساب المالك" } }
```

---

## ٦.٥ الفروع والإعدادات (Branches & Settings)

### `GET /api/branches`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "items": [
      { "id": "br_01HZ", "name_ar": "الفرع الرئيسي", "address_ar": "المعادي، القاهرة", "phone": "0223456789", "opens_at": "09:00", "closes_at": "21:00", "is_host": true, "is_active": true },
      { "id": "br_02HB", "name_ar": "فرع مدينة نصر", "address_ar": "مدينة نصر، القاهرة", "phone": "0229876543", "opens_at": "10:00", "closes_at": "22:00", "is_host": false, "is_active": true }
    ]
  },
  "warning": null
}
```

### `POST /api/branches`
**Request:**
```json
{
  "name_ar": "فرع المهندسين",
  "address_ar": "شارع جامعة الدول، الجيزة",
  "phone": "0233445566",
  "opens_at": "10:00",
  "closes_at": "20:00"
}
```
**Response 201:**
```json
{
  "ok": true,
  "data": { "id": "br_03HM", "name_ar": "فرع المهندسين", "is_host": false, "is_active": true },
  "warning": null
}
```

### `GET /api/settings`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "clinic": { "name_ar": "عيادة دكتور أحمد للقلب", "specialty": "cardio", "phone": "0223456789", "address": "المعادي، القاهرة", "sync_mode": "none" },
    "prices": [
      { "id": "prc_1", "charge_type": "consultation", "default_amount": 300 },
      { "id": "prc_2", "charge_type": "follow_up_visit", "default_amount": 150 }
    ]
  },
  "warning": null
}
```

### `PUT /api/settings`
**Request:**
```json
{
  "clinic": { "name_ar": "عيادة دكتور أحمد التخصصية للقلب", "phone": "0223456789", "address": "المعادي الجديدة، القاهرة" },
  "prices": [
    { "charge_type": "consultation", "default_amount": 350 },
    { "charge_type": "follow_up_visit", "default_amount": 150 }
  ]
}
```
**Response 200:**
```json
{ "ok": true, "data": { "message": "تم تحديث الإعدادات والأسعار بنجاح" }, "warning": null }
```

---

## ٧. النسخ الاحتياطي (Backup)

### `POST /api/backup/run`
**Response 200 (نجاح):**
```json
{
  "ok": true,
  "data": {
    "id": "bkp_01H1", "date": "2026-08-24", "time": "22:00:00", "status": "ok",
    "size_mb": 128.4, "kind": "manual", "destination": "google_drive"
  },
  "warning": null
}
```
**Response 200 (فشل — لازم يحمل سبب دايمًا):**
```json
{
  "ok": true,
  "data": {
    "id": "bkp_01H2", "date": "2026-08-24", "time": "22:05:00", "status": "fail",
    "fail_reason": "offline", "destination": "google_drive"
  },
  "warning": null
}
```
**Error (مفيش وجهة محددة) 400:**
```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "اختار مكان النسخ الاحتياطي الأول" } }
```

---

## ٨. تنبيهات النظام والمزامنة

### `GET /api/system-alerts`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "items": [
      { "id": "alt_01H1", "type": "low_stock", "title": "قفازات طبية أقل من الحد الأدنى", "detail": "المتبقي 3 من 10", "is_read": false, "created_at": "2026-08-24T11:00:00Z" },
      { "id": "alt_01H2", "type": "backup_failed", "title": "فشل النسخ الاحتياطي التلقائي", "detail": "لا يوجد اتصال بالإنترنت", "is_read": false, "created_at": "2026-08-24T22:05:00Z" }
    ],
    "unread_count": 2
  },
  "warning": null
}
```

### `GET /api/sync/status`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "connection": "online",
    "pending_count": 2,
    "syncing_count": 0,
    "failed_count": 1,
    "last_synced_at": "2026-08-24T22:10:00Z",
    "recent": [
      { "table": "patients", "record_id": "pat_01HNEW", "status": "synced", "synced_at": "2026-08-24T22:10:00Z" },
      { "table": "payments", "record_id": "pmt_01H2", "status": "failed", "attempts": 3, "last_error": "network timeout" }
    ]
  },
  "warning": null
}
```
**Response 200 (فرع واحد بس — sync_mode=none):**
```json
{
  "ok": true,
  "data": { "connection": "disabled", "pending_count": 0, "syncing_count": 0, "failed_count": 0, "last_synced_at": null, "recent": [] },
  "warning": null
}
```

---

## ٩. القوائم المرجعية الثابتة (للفرونت يبنيها Dropdowns منها)

### `GET /api/config/constants`
**Response 200:**
```json
{
  "ok": true,
  "data": {
    "charge_types": [
      { "key": "consultation", "label_ar": "كشف" },
      { "key": "follow_up_visit", "label_ar": "إعادة كشف" },
      { "key": "procedure", "label_ar": "إجراء/علاج" },
      { "key": "radiology", "label_ar": "أشعة" },
      { "key": "labs", "label_ar": "تحاليل" },
      { "key": "other", "label_ar": "أخرى" },
      { "key": "follow_up", "label_ar": "متابعة" }
    ],
    "payment_methods": [
      { "key": "cash", "label_ar": "كاش" },
      { "key": "card", "label_ar": "فيزا (ماكينة)" },
      { "key": "wallet", "label_ar": "محفظة إلكترونية" },
      { "key": "bank_transfer", "label_ar": "تحويل بنكي" }
    ],
    "attendance_status": ["waiting", "in_progress", "done", "noshow", "left"],
    "roles": ["doctor", "nurse", "secretary"],
    "permissions": ["pat.view","pat.add","pat.edit","pat.off","att.view","att.add","att.edit","att.done","pay.view","pay.add","pay.edit","inv.view","inv.add","inv.edit","admin.view","admin.edit"],
    "specialties": [
      { "key": "cardio", "label_ar": "قلب وأوعية دموية", "group": "أمراض مزمنة" }
    ]
  },
  "warning": null
}
```
> **ملحوظة معمارية:** القوائم دي **نفسها موجودة** في `packages/shared/src/constants.ts` (راجع ملف المعمار). الـ endpoint ده مش مصدر حقيقة تاني — هو بس بيعرض نفس القيم عن طريق الشبكة للحالات اللي محتاجة (مثلاً واجهة ويب منفصلة مستقبلًا). **الفرونت الأساسي (Electron) المفروض يستورد من `@clinixa/shared` مباشرة** بدل ما يستنى الـ API، أسرع وشغال حتى قبل ما السيرفر يشتغل.

---

## ١٠. دليل Mock Server للفرونت (قبل ما الباك يخلص)

**التوصية:** استخدم **MSW (Mock Service Worker)** في `packages/client` — بيعترض نداءات `fetch`/`axios` فعليًا ويرجّع نفس الأمثلة اللي فوق، فالفرونت بيتطور وكأنه بيكلم سيرفر حقيقي بالظبط، ولما الباك يخلص endpoint حقيقي، بتشيل الـ mock بتاعه بس من غير ما تغيّر سطر كود واحد في باقي الفرونت.

```
packages/client/
└── src/
    └── mocks/
        ├── handlers/
        │   ├── patients.handlers.ts     ← كل الأمثلة اللي فوق كـ MSW handlers
        │   ├── attendance.handlers.ts
        │   ├── payments.handlers.ts
        │   └── ...
        └── browser.ts                    ← تفعيل MSW في وضع التطوير بس
```

**مثال handler واحد (`patients.handlers.ts`):**
```ts
import { http, HttpResponse } from 'msw';

export const patientsHandlers = [
  http.get('/api/patients', () => {
    return HttpResponse.json({
      ok: true,
      data: {
        items: [ /* نفس مثال Section 2 فوق */ ],
        page: 1, page_size: 25, total_items: 1, total_pages: 1
      },
      warning: null
    });
  }),

  http.post('/api/patients', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      ok: true,
      data: { id: 'pat_mock_new', display_id: 'P-1099', ...body, due: 0 },
      warning: null
    }, { status: 201 });
  }),
];
```

**قاعدة عمل بين الفريقين:** أي تعديل على شكل أي Response لازم يتحدّث في **الملف ده الأول** قبل ما يتنفذ في كود الباك أو الفرونت — الملف ده هو الـ Source of Truth للـ Contract بين الطرفين، مش الكود نفسه.
