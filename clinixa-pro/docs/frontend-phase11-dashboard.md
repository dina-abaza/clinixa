# Clinixa Frontend — المرحلة ١١: لوحة التحكم (Dashboard)

> **الهدف:** بناء الشاشة الرئيسية للتطبيق التي تعرض ملخص الحالة اليومية للعيادة (الإحصائيات + قائمة مرضى اليوم) بناءً على التصميم المعتمد في `disen/clinixa/prototype/screens/dashboard/02-dashboard.html`.

---

## 🏗️ ١. الهيكل البرمجي (Architecture)

### الـ API Layer
- إضافة دالة `getDashboardSummary` في `packages/client/src/api/dashboard.ts`.
- استخدام `react-query` (TanStack Query) لإدارة جلب البيانات والتحديث التلقائي (Refetching).

### المكونات (Components)
- `DashboardPage.tsx`: المكون الرئيسي.
- `StatCard.tsx`: مكون بطاقة الإحصائيات (إجمالي الحالات، الانتظار، التحصيل، النواقص).
- `TodayPatientsTable.tsx`: جدول يعرض قائمة مرضى اليوم وحالاتهم.

---

## 🎨 ٢. التصميم والتفاعل (UI/UX)

- **بطاقات الإحصائيات:**
  - عرض الأرقام بشكل كبير وواضح.
  - أيقونات تعبيرية لكل حالة (Lock للحضور، User للانتظار، Dollar للتحصيل، Alert للنواقص).
- **قائمة مرضى اليوم:**
  - عرض الوقت، الاسم، الهاتف، والحالة (Waiting, In Progress, Done).
  - استخدام ألوان الحالات المعتمدة في التصميم (Blue للانتظار، Green للمنتهي).

---

## 🛠️ ٣. التنفيذ (Implementation Steps)

1. **الـ API:**
   ```typescript
   export const getDashboardSummary = () => 
     apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
   ```

2. **الـ Hook:**
   استخدام `useQuery` مع `refetchInterval` (مثلاً كل  و مع زرار ريلود ) لضمان بقاء الأرقام محدثة دائماً دون تدخل المستخدم.

3. **الـ Routing:**
   تفعيل مسار `/dashboard` وجعله الصفحة الافتراضية بعد تسجيل الدخول.

---

## ✅ ٤. الربط مع الباك إند
- المسار: `GET /api/dashboard/summary`.
- البيانات المتوقعة:
  ```json

{
  "ok": true,
  "data": {
    "stats": {
      "today_attendance": 1,
      "waiting_count": 0,
      "today_payments": 150,
      "low_stock_count": 0
    },
    "today_patients": [
      {
        "attendance_id": "att_5d7ea644-3660-4120-a8d6-d1fa605bf742",
        "status": "done",
        "time": "12:40:21",
        "patient_id": "pat_b0870ec7-09b9-461e-952a-dfce57ed27eb",
        "display_id": "P-1",
        "name_ar": "مصطفي",
        "phone": "01256489756"
      }
    ]
  },
  "warning": null
}
  ```
