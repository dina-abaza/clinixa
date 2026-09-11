# 📚 Clinixa — مرجع الـ API الشامل للمرحلة الرابعة (Phase 4: Supporting Modules)

> **موجه لمطوري الفرونت-إند (Frontend Guide & API Contract):**
> هذا المستند يحتوي على التوثيق الحرفي الكامل لكل طلبات واستجابات **المرحلة الرابعة (الموديولات الداعمة)** مع توضيح حالة كل حقل (**إجباري / اختياري**) ونوعه والقيود المطبقة عليه.

---

## 📌 ٠. القواعد العامة والهيدرز المشتركة

### الهيدرز المطلوبة في كل طلب بعد تسجيل الدخول:
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```
> **ملاحظة أمنية ومعمارية هامة:** `employee_id` و `branch_id` يتم استخراجهما أوتوماتيكياً من الـ Token في السيرفر — **لا تقم بإرسالهما في الـ Request Body أبدًا**.

---

### الشكل الموحد للاستجابة الناجحة (Success Response):
```json
{
  "ok": true,
  "data": { /* كائن البيانات أو مصفوفة العناصر */ },
  "warning": null
}
```

---

### الشكل الموحد لاستجابة الخطأ (Error Response — 4xx / 5xx):
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | LOCKED | SERVER_ERROR",
    "message": "رسالة الخطأ التوضيحية بالعربية",
    "field": "اسم الحقل المتسبب بالخطأ إن وجد"
  }
}
```

---

## 📦 ١. موديول المخزون (Inventory Module)

### ١.١ جلب قائمة أصناف المخزون
- **المسار:** `GET /api/inventory`
- **الصلاحية المطلوبة:** `inv.view`

#### معامل الاستعلام (Query Parameters):
| المعامل (Param) | النوع (Type) | الحالة | الوصف |
|---|---|---|---|
| `branch_id` | `string` | **اختياري (Optional)** | معرّف الفرع المطلوب عرض مخزونه. في حال عدم إرساله، يعرض السيرفر فرع الجلسة الحالية تلقائياً. |

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "inv_01H1",
        "branch_id": "br_01HZ",
        "name_ar": "قفازات طبية لاتكس",
        "name_en": "Medical Latex Gloves",
        "type": "supplies",
        "qty": 3,
        "min_qty": 10,
        "unit": "box",
        "low_stock": true,
        "is_active": true,
        "updated_at": "2026-08-24T11:00:00Z"
      },
      {
        "id": "inv_01H2",
        "branch_id": "br_01HZ",
        "name_ar": "جهاز ضغط رقمي",
        "name_en": "Digital BP Monitor",
        "type": "equipment",
        "qty": 2,
        "min_qty": null,
        "unit": "piece",
        "low_stock": false,
        "is_active": true,
        "updated_at": "2026-08-24T11:00:00Z"
      }
    ]
  },
  "warning": null
}
```
> 💡 **ملاحظة للفرونت:** الحقل `low_stock` هو قيمة منطقية (`true` / `false`) محسوبة لحظياً في الباك إند (`qty <= min_qty`) لإظهار البادج التحذيري في الواجهة دون الحاجة لحسابها يدوياً.

---

### ١.٢ إضافة صنف جديد في المخزون
- **المسار:** `POST /api/inventory`
- **الصلاحية المطلوبة:** `inv.add`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `name_ar` | `string` | **🔴 إجباري (Required)** | اسم الصنف باللغة العربية (حرف واحد على الأقل). |
| `name_en` | `string` | **⚪ اختياري (Optional)** | اسم الصنف باللغة الإنجليزية أو `null`. |
| `type` | `string` | **🔴 إجباري (Required)** | نوع الصنف: إما `"supplies"` (مستلزمات) أو `"equipment"` (أجهزة). |
| `qty` | `number` | **⚪ اختياري (Optional)** | الكمية الابتدائية (عدد صحيح `>= 0`). القيمة الافتراضية: `0`. |
| `min_qty` | `number` | **⚪ اختياري (Optional)** | الحد الأدنى للكمية للتنبيه (عدد صحيح `>= 0`). يرسل `null` أو يُترك فارغاً للأجهزة. |
| `unit` | `string` | **🔴 إجباري (Required)** | وحدة القياس (مثل `"box"`, `"piece"`, `"roll"`, `"bag"` ...إلخ). |
| `branch_id` | `string` | **⚪ اختياري (Optional)** | معرّف الفرع، وإذا لم يُرسل يتم إسناده لفرع الجلسة الحالية تلقائياً. |

#### Request Body مثال:
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

#### Response 201 (Created):
```json
{
  "ok": true,
  "data": {
    "id": "inv_01HNEW",
    "branch_id": "br_01HZ",
    "name_ar": "قفازات طبية لاتكس",
    "name_en": "Medical Latex Gloves",
    "type": "supplies",
    "qty": 30,
    "min_qty": 10,
    "unit": "box",
    "low_stock": false,
    "is_active": true,
    "updated_at": "2026-08-24T11:00:00Z"
  },
  "warning": null
}
```

---

### ١.٣ تعديل بيانات صنف في المخزون
- **المسار:** `PUT /api/inventory/:id`
- **الصلاحية المطلوبة:** `inv.edit`

#### جدول حقول الـ Request Body (جميع الحقول اختيارية، أرسل فقط ما تريد تعديله):
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `name_ar` | `string` | **⚪ اختياري (Optional)** | الاسم العربي المعدل. |
| `name_en` | `string` | **⚪ اختياري (Optional)** | الاسم الإنجليزي المعدل أو `null`. |
| `type` | `string` | **⚪ اختياري (Optional)** | `"supplies"` أو `"equipment"`. |
| `qty` | `number` | **⚪ اختياري (Optional)** | الكمية الجديدة (`>= 0`). |
| `min_qty` | `number` | **⚪ اختياري (Optional)** | الحد الأدنى المعدل (`>= 0`) أو `null`. |
| `unit` | `string` | **⚪ اختياري (Optional)** | وحدة القياس المعدلة. |
| `is_active` | `boolean` | **⚪ اختياري (Optional)** | تفعيل (`true`) أو أرشفة الصنف (`false`). |

#### Request Body مثال:
```json
{
  "name_ar": "قفازات طبية معقمة فاخرة",
  "name_en": "Premium Sterile Gloves",
  "min_qty": 15,
  "unit": "box",
  "is_active": true
}
```

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "id": "inv_01HNEW",
    "branch_id": "br_01HZ",
    "name_ar": "قفازات طبية معقمة فاخرة",
    "name_en": "Premium Sterile Gloves",
    "type": "supplies",
    "qty": 30,
    "min_qty": 15,
    "unit": "box",
    "low_stock": false,
    "is_active": true,
    "updated_at": "2026-08-24T11:15:00Z"
  },
  "warning": null
}
```

---

### ١.٤ تعديل كمية الصنف السريع (Adjust Quantity)
- **المسار:** `PATCH /api/inventory/:id/adjust-qty`
- **الصلاحية المطلوبة:** `inv.edit`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `qty` | `number` | **🔴 إجباري (Required)** | الكمية الجديدة الفعلية للصنف بعد الجرد أو الاستهلاك (عدد صحيح `>= 0`). |

#### Request Body مثال:
```json
{
  "qty": 3
}
```

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "id": "inv_01H1",
    "qty": 3,
    "min_qty": 10,
    "low_stock": true
  },
  "warning": null
}
```
> 🔔 **تنبيه نظام تلقائي:** إذا أصبحت الكمية `qty <= min_qty`، يقوم السيرفر بإنشاء سجل تنبيه تلقائياً في جدول `system_alerts` من نوع `low_stock` لكي يظهر في جرس التنبيهات.

---

## 👥 ٢. موديول الموظفين والصلاحيات (Employees & Permissions)

### ٢.١ استعراض قائمة الموظفين
- **المسار:** `GET /api/employees`
- **الصلاحية المطلوبة:** `admin.view`

#### معامل الاستعلام (Query Parameters):
| المعامل (Param) | النوع (Type) | الحالة | الوصف |
|---|---|---|---|
| `branch_id` | `string` | **اختياري (Optional)** | فلترة الموظفين بفرع معين. المالك (`is_owner = true`) يظهر دائماً في جميع الفروع. |

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "emp_01HZ",
        "name_ar": "د. أحمد محمود",
        "username": "dr.ahmed",
        "role": "doctor",
        "branch_id": null,
        "is_owner": true,
        "is_active": true,
        "permissions": [
          "pat.view", "pat.add", "pat.edit", "pat.off",
          "att.view", "att.add", "att.edit", "att.done",
          "pay.view", "pay.add", "pay.edit",
          "inv.view", "inv.add", "inv.edit",
          "admin.view", "admin.edit"
        ],
        "created_at": "2026-08-24T08:00:00Z",
        "updated_at": "2026-08-24T08:00:00Z"
      },
      {
        "id": "emp_01HNEW",
        "name_ar": "منى السكرتيرة",
        "username": "mona.sec",
        "role": "secretary",
        "branch_id": "br_01HZ",
        "is_owner": false,
        "is_active": true,
        "permissions": [
          "pat.view", "pat.add", "pat.edit",
          "att.view", "att.add", "att.edit", "att.done",
          "pay.view", "pay.add"
        ],
        "created_at": "2026-08-24T09:00:00Z",
        "updated_at": "2026-08-24T09:00:00Z"
      }
    ]
  },
  "warning": null
}
```

---

### ٢.٢ إنشاء حساب موظف جديد (مع كلمة سر مؤقتة)
- **المسار:** `POST /api/employees`
- **الصلاحية المطلوبة:** `admin.edit`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `name_ar` | `string` | **🔴 إجباري (Required)** | اسم الموظف باللغة العربية (حرف واحد على الأقل). |
| `username` | `string` | **🔴 إجباري (Required)** | اسم المستخدم للدخول (3 أحرف على الأقل، فريد وغير مكرر، أحرف وأرقام بدون مسافات). |
| `role` | `string` | **🔴 إجباري (Required)** | الدور الوظيفي: أحد القيم: `"doctor"` (طبيب), `"nurse"` (تمريض), `"secretary"` (سكرتارية). |
| `branch_id` | `string` | **⚪ اختياري (Optional)** | معرّف الفرع التابع له الموظف أو `null`. |
| `permissions` | `string[]` | **⚪ اختياري (Optional)** | مصفوفة الصلاحيات الممنوحة من الـ 16 صلاحية المعتمدة. القيمة الافتراضية: `[]`. |

#### Request Body مثال:
```json
{
  "name_ar": "منى السكرتيرة",
  "username": "mona.sec",
  "role": "secretary",
  "branch_id": "br_01HZ",
  "permissions": [
    "pat.view",
    "pat.add",
    "pat.edit",
    "att.view",
    "att.add",
    "att.edit",
    "att.done",
    "pay.view",
    "pay.add"
  ]
}
```

#### Response 201 (Created):
```json
{
  "ok": true,
  "data": {
    "id": "emp_01HNEW",
    "name_ar": "منى السكرتيرة",
    "username": "mona.sec",
    "role": "secretary",
    "temporary_password": "Xk7-Nq2-Wp9"
  },
  "warning": null
}
```
> ⚠️ **تنبيه للفرونت:** حقل `temporary_password` يُرجع **مرة واحدة فقط** في استجابة الإنشاء لعرضه في نافذة منبثقة للمسؤول. لا يتم حفظه كنص عادي في قاعدة البيانات ولن يظهر في أي استعلام مستقبلي.

---

### ٢.٣ تعديل صلاحيات الموظف
- **المسار:** `PUT /api/employees/:id/permissions`
- **الصلاحية المطلوبة:** `admin.edit`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `permissions` | `string[]` | **🔴 إجباري (Required)** | مصفوفة كاملة بالصلاحيات الجديدة للموظف (يتم استبدال الصلاحيات القديمة بالجديدة). |

#### Request Body مثال:
```json
{
  "permissions": [
    "pat.view",
    "pat.add",
    "att.view",
    "att.add"
  ]
}
```

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "id": "emp_01HNEW",
    "permissions": [
      "pat.view",
      "pat.add",
      "att.view",
      "att.add"
    ]
  },
  "warning": null
}
```

#### Error 403 (محاولة تعديل صلاحيات المالك):
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "مينفعش تعدّل صلاحيات حساب المالك"
  }
}
```

---

### ٢.٤ إعادة تعيين كلمة سر الموظف
- **المسار:** `PATCH /api/employees/:id/reset-password`
- **الصلاحية المطلوبة:** `admin.edit`
- **الـ Request Body:** فارغ (لا يحتاج Body).

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "id": "emp_01HNEW",
    "temporary_password": "Rt5-Km9-Lq2"
  },
  "warning": null
}
```

---

### ٢.٥ تفعيل / تعطيل حساب الموظف
- **المسار:** `PATCH /api/employees/:id/toggle-active`
- **الصلاحية المطلوبة:** `admin.edit`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `is_active` | `boolean` | **🔴 إجباري (Required)** | `true` لتفعيل الحساب، أو `false` لتعطيل الحساب ومنعه من تسجيل الدخول. |

#### Request Body مثال:
```json
{
  "is_active": false
}
```

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "id": "emp_01HNEW",
    "is_active": false
  },
  "warning": null
}
```

#### Error 403 (محاولة تعطيل حساب المالك):
```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "مينفعش تعطّل حساب المالك"
  }
}
```

---

## 🏢 ٣. موديول الفروع (Branches Module)

### ٣.١ جلب قائمة الفروع
- **المسار:** `GET /api/branches`
- **الصلاحية المطلوبة:** `admin.view`

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "br_01HZ",
        "name_ar": "الفرع الرئيسي",
        "address_ar": "المعادي، القاهرة",
        "phone": "0223456789",
        "opens_at": "09:00",
        "closes_at": "21:00",
        "is_host": true,
        "is_active": true,
        "created_at": "2026-08-24T08:00:00Z",
        "updated_at": "2026-08-24T08:00:00Z"
      },
      {
        "id": "br_02HB",
        "name_ar": "فرع مدينة نصر",
        "address_ar": "شارع عباس العقاد، القاهرة",
        "phone": "0229876543",
        "opens_at": "10:00",
        "closes_at": "22:00",
        "is_host": false,
        "is_active": true,
        "created_at": "2026-08-24T09:00:00Z",
        "updated_at": "2026-08-24T09:00:00Z"
      }
    ]
  },
  "warning": null
}
```

---

### ٣.٢ إنشاء فرع جديد
- **المسار:** `POST /api/branches`
- **الصلاحية المطلوبة:** `admin.edit`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `name_ar` | `string` | **🔴 إجباري (Required)** | اسم الفرع باللغة العربية (حرف واحد على الأقل). |
| `address_ar` | `string` | **⚪ اختياري (Optional)** | عنوان الفرع أو `null`. |
| `phone` | `string` | **🔴 إجباري (Required)** | رقم هاتف الفرع للتواصل. |
| `opens_at` | `string` | **🔴 إجباري (Required)** | توقيت فتح الفرع بصيغة 24 ساعة (`HH:MM` مثل `"09:00"`). |
| `closes_at` | `string` | **🔴 إجباري (Required)** | توقيت إغلاق الفرع بصيغة 24 ساعة (`HH:MM` مثل `"21:00"`). |

#### Request Body مثال:
```json
{
  "name_ar": "فرع المهندسين",
  "address_ar": "شارع جامعة الدول، الجيزة",
  "phone": "0233445566",
  "opens_at": "10:00",
  "closes_at": "20:00"
}
```

#### Response 201 (Created):
```json
{
  "ok": true,
  "data": {
    "id": "br_03HM",
    "name_ar": "فرع المهندسين",
    "is_host": false,
    "is_active": true
  },
  "warning": null
}
```

---

### ٣.٣ تعديل بيانات الفرع
- **المسار:** `PUT /api/branches/:id`
- **الصلاحية المطلوبة:** `admin.edit`

#### جدول حقول الـ Request Body (جميع الحقول اختيارية، أرسل ما تريد تعديله فقط):
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `name_ar` | `string` | **⚪ اختياري (Optional)** | اسم الفرع المعدل. |
| `address_ar` | `string` | **⚪ اختياري (Optional)** | العنوان المعدل أو `null`. |
| `phone` | `string` | **⚪ اختياري (Optional)** | رقم الهاتف المعدل. |
| `opens_at` | `string` | **⚪ اختياري (Optional)** | توقيت الفتح بصيغة `HH:MM`. |
| `closes_at` | `string` | **⚪ اختياري (Optional)** | توقيت الإغلاق بصيغة `HH:MM`. |
| `is_active` | `boolean` | **⚪ اختياري (Optional)** | حالة تفعيل الفرع (`true`/`false`). |

#### Request Body مثال:
```json
{
  "name_ar": "فرع المهندسين التخصصي",
  "address_ar": "شارع جامعة الدول، الجيزة",
  "phone": "0233445577",
  "opens_at": "09:30",
  "closes_at": "21:30",
  "is_active": true
}
```

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "id": "br_03HM",
    "name_ar": "فرع المهندسين التخصصي",
    "address_ar": "شارع جامعة الدول، الجيزة",
    "phone": "0233445577",
    "opens_at": "09:30",
    "closes_at": "21:30",
    "is_host": false,
    "is_active": true,
    "created_at": "2026-08-24T10:00:00Z",
    "updated_at": "2026-08-24T10:30:00Z"
  },
  "warning": null
}
```

#### Error 400 (محاولة تعطيل الفرع الوحيد النشط):
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "لا يمكن تعطيل الفرع الوحيد النشط في النظام",
    "field": "is_active"
  }
}
```

---

## ⚙️ ٤. موديول الإعدادات والأسعار (Settings & Prices)

### ٤.١ جلب إعدادات العيادة والأسعار الافتراضية
- **المسار:** `GET /api/settings`
- **الصلاحية المطلوبة:** جلسة مسجلة (Auth Session)

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "clinic": {
      "name_ar": "عيادة دكتور أحمد للقلب",
      "specialty": "cardio",
      "phone": "0223456789",
      "address": "المعادي، القاهرة",
      "sync_mode": "none"
    },
    "prices": [
      {
        "id": "prc_1",
        "charge_type": "consultation",
        "default_amount": 300
      },
      {
        "id": "prc_2",
        "charge_type": "follow_up_visit",
        "default_amount": 150
      },
      {
        "id": "prc_3",
        "charge_type": "procedure",
        "default_amount": 200
      }
    ]
  },
  "warning": null
}
```

---

### ٤.٢ تحديث إعدادات العيادة وقائمة الأسعار
- **المسار:** `PUT /api/settings`
- **الصلاحية المطلوبة:** `admin.edit`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `clinic` | `object` | **⚪ اختياري (Optional)** | كائن يحتوي بيانات العيادة المراد تعديلها. |
| `clinic.name_ar` | `string` | **⚪ اختياري (Optional)** | اسم العيادة الجديد. |
| `clinic.phone` | `string` | **⚪ اختياري (Optional)** | هاتف العيادة أو `null`. |
| `clinic.address` | `string` | **⚪ اختياري (Optional)** | عنوان العيادة أو `null`. |
| `prices` | `object[]` | **⚪ اختياري (Optional)** | مصفوفة لتعديل أو إضافة الأسعار الافتراضية. |
| `prices[].charge_type` | `string` | **🔴 إجباري إذا أُرسلت الأسعار** | نوع الرسوم (أحد المفاتيح المعتمدة مثل `consultation`, `follow_up_visit`, `procedure`, `radiology`, `labs`, `follow_up`, `other`). |
| `prices[].default_amount` | `number` | **🔴 إجباري إذا أُرسلت الأسعار** | السعر الافتراضي الجديد (رقم `>= 0`). |

#### Request Body مثال:
```json
{
  "clinic": {
    "name_ar": "عيادة دكتور أحمد التخصصية للقلب",
    "phone": "0223456789",
    "address": "المعادي الجديدة، القاهرة"
  },
  "prices": [
    { "charge_type": "consultation", "default_amount": 350 },
    { "charge_type": "follow_up_visit", "default_amount": 150 },
    { "charge_type": "procedure", "default_amount": 250 }
  ]
}
```

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "message": "تم تحديث الإعدادات والأسعار بنجاح"
  },
  "warning": null
}
```
> ⚠️ **ملاحظة:** وضع المزامنة `sync_mode` ثابت للقراءة فقط بعد التثبيت الأولي ولا يمكن تعديله عبر هذا الـ Endpoint.

---

## 💾 ٥. موديول النسخ الاحتياطي (Backup Module)

### ٥.١ تشغيل النسخ الاحتياطي
- **المسار:** `POST /api/backup/run`
- **الصلاحية المطلوبة:** `admin.edit`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `destination` | `string` | **🔴 إجباري (Required)** | وجهة حفظ النسخة: أحد القيم: `"google_drive"`, `"local_device"`, `"usb"`. |
| `kind` | `string` | **⚪ اختياري (Optional)** | نوع التشغيل: `"manual"` (يدوي من المستخدم) أو `"auto"` (تلقائي مجدول). القيمة الافتراضية: `"manual"`. |

#### Request Body مثال:
```json
{
  "destination": "google_drive",
  "kind": "manual"
}
```

#### Response 200 (في حالة النجاح):
```json
{
  "ok": true,
  "data": {
    "id": "bkp_01H1",
    "date": "2026-08-24",
    "time": "22:00:00",
    "status": "ok",
    "fail_reason": null,
    "size_mb": 128.4,
    "kind": "manual",
    "destination": "google_drive"
  },
  "warning": null
}
```

#### Response 200 (في حالة الفشل وتسجيل السبب):
```json
{
  "ok": true,
  "data": {
    "id": "bkp_01H2",
    "date": "2026-08-24",
    "time": "22:05:00",
    "status": "fail",
    "fail_reason": "offline",
    "size_mb": null,
    "kind": "auto",
    "destination": "google_drive"
  },
  "warning": null
}
```
* **أسباب الفشل المحتملة (`fail_reason`):** `"offline"` (انقطاع الإنترنت), `"token"` (انتهاء صلاحية جلسة Google Drive), `"device"` (تعذر الوصول لوحدة التخزين المحلية/USB).

#### Error 400 (عند عدم اختيار الوجهة):
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

---

### ٥.٢ استعراض سجل عمليات النسخ الاحتياطي
- **المسار:** `GET /api/backup/history`
- **الصلاحية المطلوبة:** `admin.view`

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "bkp_01H1",
        "date": "2026-08-24",
        "time": "22:00:00",
        "status": "ok",
        "fail_reason": null,
        "size_mb": 128.4,
        "kind": "manual",
        "destination": "google_drive"
      },
      {
        "id": "bkp_01H2",
        "date": "2026-08-24",
        "time": "22:05:00",
        "status": "fail",
        "fail_reason": "offline",
        "size_mb": null,
        "kind": "auto",
        "destination": "google_drive"
      }
    ]
  },
  "warning": null
}
```

---

### ٥.٣ تعديل وجهة النسخ الاحتياطي الافتراضية
- **المسار:** `PUT /api/backup/destination`
- **الصلاحية المطلوبة:** `admin.edit`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `destination` | `string` | **🔴 إجباري (Required)** | الوجهة الافتراضية الجديدة: `"google_drive"`, `"local_device"`, `"usb"`. |

#### Request Body مثال:
```json
{
  "destination": "google_drive"
}
```

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "destination": "google_drive",
    "message": "تم تحديث وجهة النسخ الاحتياطي بنجاح"
  },
  "warning": null
}
```

---

### ٥.٤ استعادة البيانات من نسخة احتياطية
- **المسار:** `POST /api/backup/restore`
- **الصلاحية المطلوبة:** `admin.edit`

#### جدول حقول الـ Request Body:
| الحقل (Field) | النوع (Type) | الحالة | القيود والشرح |
|---|---|---|---|
| `confirmation_text` | `string` | **🔴 إجباري (Required)** | كلمة تأكيد الاستعادة لمنع الاستعادة بالخطأ. القيم المقبولة: `"RESTORE"`, `"CONFIRM"`, `"استعادة"`, `"تأكيد"`. |
| `backup_id` | `string` | **⚪ اختياري (Optional)** | معرّف النسخة الاحتياطية المراد استعادتها. |

#### Request Body مثال:
```json
{
  "confirmation_text": "RESTORE",
  "backup_id": "bkp_01H1"
}
```

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "message": "تمت استعادة النسخة الاحتياطية بنجاح"
  },
  "warning": null
}
```

#### Error 400 (كلمة التأكيد غير صحيحة):
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

---

## 🔔 ٦. موديول تنبيهات النظام (System Alerts)

### ٦.١ استعراض تنبيهات النظام وعدد غير المقروء
- **المسار:** `GET /api/system-alerts`
- **الصلاحية المطلوبة:** جلسة مسجلة (Auth Session)

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "alt_01H1",
        "type": "low_stock",
        "title": "قفازات طبية أقل من الحد الأدنى",
        "detail": "المتبقي 3 من 10",
        "branch_id": "br_01HZ",
        "is_read": false,
        "created_at": "2026-08-24T11:00:00Z"
      },
      {
        "id": "alt_01H2",
        "type": "backup_failed",
        "title": "فشل النسخ الاحتياطي",
        "detail": "لا يوجد اتصال بالإنترنت",
        "branch_id": null,
        "is_read": false,
        "created_at": "2026-08-24T22:05:00Z"
      }
    ],
    "unread_count": 2
  },
  "warning": null
}
```
* **أنواع التنبيهات (`type`):** `"low_stock"` (نقص مخزون), `"backup_failed"` (فشل نسخ احتياطي).

---

### ٦.٢ تعليم تنبيه كمقروء
- **المسار:** `PATCH /api/system-alerts/:id/read`
- **الصلاحية المطلوبة:** جلسة مسجلة (Auth Session)
- **الـ Request Body:** فارغ.

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "id": "alt_01H1",
    "is_read": true
  },
  "warning": null
}
```

---

## 📋 ٧. القوائم المرجعية الثابتة (Constants & Dropdowns)

### ٧.١ استعراض كافة القوائم الثابتة للنظام
- **المسار:** `GET /api/config/constants`
- **الصلاحية المطلوبة:** مسار عام / متاح للجميع

#### Response 200 (Success):
```json
{
  "ok": true,
  "data": {
    "charge_types": [
      { "key": "consultation", "label_ar": "كشف" },
      { "key": "follow_up_visit", "label_ar": "إعادة كشف" },
      { "key": "procedure", "label_ar": "إجراء / علاج" },
      { "key": "radiology", "label_ar": "أشعة" },
      { "key": "labs", "label_ar": "تحاليل" },
      { "key": "follow_up", "label_ar": "متابعة" },
      { "key": "other", "label_ar": "أخرى" }
    ],
    "payment_methods": [
      { "key": "cash", "label_ar": "كاش" },
      { "key": "card", "label_ar": "فيزا (ماكينة)" },
      { "key": "wallet", "label_ar": "محفظة إلكترونية" },
      { "key": "bank_transfer", "label_ar": "تحويل بنكي" }
    ],
    "attendance_status": ["waiting", "in_progress", "done", "noshow", "left"],
    "roles": ["doctor", "nurse", "secretary"],
    "permissions": [
      "pat.view", "pat.add", "pat.edit", "pat.off",
      "att.view", "att.add", "att.edit", "att.done",
      "pay.view", "pay.add", "pay.edit",
      "inv.view", "inv.add", "inv.edit",
      "admin.view", "admin.edit"
    ],
    "specialties": [
      { "key": "cardio", "label_ar": "قلب وأوعية دموية", "group": "أمراض مزمنة" }
    ]
  },
  "warning": null
}
```
