# دليل ربط الموقع بمشروع Firebase جديد

يوضح هذا الدليل الخطوات اللازمة لإلغاء ربط الموقع بالمشروع الحالي وربطه بمشروع Firebase جديد خاص بك.

## الخطوة 1: إنشاء مشروع جديد في Firebase
1. توجه إلى [Firebase Console](https://console.firebase.google.com/).
2. اضغط على **Add Project** واتبع الخطوات لتسمية مشروعك.
3. بعد إنشاء المشروع، اضغط على أيقونة الويب `</>` لإضافة تطبيق ويب للمشروع.
4. سجل التطبيق باسم من اختيارك، ثم انسخ كائن الإعدادات (Firebase Configuration) الذي سيظهر لك، وسيكون بهذا الشكل:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_ID",
     appId: "YOUR_APP_ID"
   };
   ```

## الخطوة 2: تفعيل الخدمات المطلوبة
في لوحة تحكم Firebase للمشروع الجديد، تأكد من تفعيل الخدمات التالية:
1. **Authentication:**
   - فعل خيار **Google Sign-In** من تبويب `Sign-in method`.
2. **Firestore Database:**
   - اضغط على `Create database`.
   - اختر الموقع الجغرافي الأقرب لك.
   - ابدأ في وضع الاختبار (Test Mode) مؤقتاً لتسهيل الربط.

## الخطوة 3: تحديث ملف الإعدادات في الموقع
1. ابحث عن ملف باسم `firebase-applet-config.json` في المجلد الرئيسي للمشروع.
2. قم باستبدال القيم القديمة بالقيم الجديدة التي حصلت عليها من الخطوة الأولى.
3. تأكد من تحديث قيمة `firestoreDatabaseId` إذا كنت قد استخدمت قاعدة بيانات مخصصة (القيمة الافتراضية هي `(default)`).

سيبدو الملف بهذا الشكل تقريباً:
```json
{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "...",
  "firestoreDatabaseId": "(default)"
}
```

## الخطوة 4: تحديث قواعد الحماية (Security Rules)
1. انسخ محتويات ملف `firestore.rules` الموجود في مشروعك.
2. في Firebase Console، اذهب إلى **Firestore Database** ثم تبويب **Rules**.
3. الصق القواعد واضغط على **Publish**.

## الخطوة 5: إضافة المسؤولين (Admins)
للوصول إلى لوحة الإدارة في المشروع الجديد:
1. قم بتسجيل الدخول في الموقع لأول مرة باستخدام بريدك الإلكتروني.
2. اذهب إلى Firebase Console -> Firestore Database.
3. ابحث عن مستندك في مجموعة `users`.
4. قم بتغيير حقل `isAdmin` إلى `true`.
5. أو يمكنك إضافة بريدك الإلكتروني يدوياً في ملف `firestore.rules` ضمن قائمة الايميلات المسموح لها بالإدارة.

---
**ملاحظة:** عند تغيير المشروع، ستبدأ قاعدة البيانات من الصفر، لذا ستحتاج لإعادة إضافة التصنيفات والمحافظات من لوحة الإدارة في الموقع.
