# العمران - Frontend (Angular)

تطبيق Angular حقيقي متصل بالكامل بالـ Backend (`al-omran-backend`).
كل صفحة هون بتنادي API فعلي - مش بيانات ثابتة.

## هيكلية المشروع

```
src/app/
  core/
    services/       كل استدعاءات الـ API (auth, products, invoices, employees, activity-log)
    interceptors/    auth.interceptor.ts - يضيف JWT تلقائيًا لكل طلب
    guards/          auth.guard.ts - يمنع دخول الصفحات بدون تسجيل دخول
  shared/
    sidebar/         القائمة الجانبية المشتركة (اللوغو + التنقل)
  features/
    login/           تسجيل الدخول
    dashboard/        لوحة التحكم الرئيسية (KPIs + تنبيه نواقص)
    products/         عرض المنتجات + إضافة منتج (مدير/مشرف بس)
    invoices/          قائمة الفواتير + إنشاء فاتورة جديدة
    employees/         إدارة الموظفين + تقرير أداء كل موظف
    activity-log/       سجل النشاط الكامل
```

## تشغيل المشروع محليًا

```bash
npm install
ng serve
```

الموقع رح يشتغل على: `http://localhost:4200`

**مهم:** لازم الباك اند (`al-omran-backend`) يكون شغال بنفس الوقت على `http://localhost:3000`
(هيك مضبوط افتراضيًا بـ `src/environments/environment.ts`).

## قبل الرفع (Production)

افتح `src/environments/environment.prod.ts` وحط فيه رابط الباك اند الحقيقي بعد ما ترفعه
(مثلاً `https://al-omran-backend-production.up.railway.app/api`).

```bash
ng build
```
رح يطلعلك ملفات جاهزة بمجلد `dist/al-omran-frontend/browser` - هاد يلي بترفعه على Vercel/Netlify.

## تسجيل الدخول للتجربة (من بيانات الـ Seed بالباك اند)

- مدير: `admin@al-omran.com` / `Admin@123`
- موظف: `employee@al-omran.com` / `Employee@123`
