# 💳 Credit System & Authentication Guide

## ✅ تم إضافة نظام Credits كامل!

تم إضافة نظام Credits مع تسجيل دخول كامل وإدارة المستخدمين.

---

## 🚀 Quick Start

### 1. إنشاء Admin User (أول خطوة)

```powershell
cd "c:\Users\totma\Downloads\New folder (5)\PrixBone_fixedsss\PrixBone_fixed\clean_project"
npm run create-admin
```

هذا سيُنشئ Admin user بـ:
- **Username**: `admin`
- **Password**: `admin123`
- **Credits**: 100
- **Role**: Admin

⚠️ **مهم**: غير الباسورد بعد أول تسجيل دخول!

### 2. تشغيل السيرفر

```powershell
npm start
```

### 3. فتح صفحة تسجيل الدخول

```
http://localhost:8080/login
```

---

## 🎯 كيف يعمل النظام؟

### 💳 Credits System

1. **كل user يحتاج 1 credit لإنشاء بطولة**
2. **عند إنشاء بطولة، يُخصم 1 credit تلقائياً**
3. **إذا كان لديك 0 credits، لا يمكنك إنشاء بطولة**
4. **فقط الـ Admin يمكنه إضافة/إزالة Credits**

### 👤 User Roles

#### User (مستخدم عادي)
- ✅ يمكنه إنشاء بطولات (إذا كان لديه credits)
- ✅ يمكنه عرض بطولاته
- ❌ لا يمكنه إضافة credits لنفسه
- ❌ لا يمكنه الوصول لـ Admin Panel

#### Admin (مدير)
- ✅ جميع صلاحيات User
- ✅ يمكنه عرض جميع المستخدمين
- ✅ يمكنه إضافة Credits لأي مستخدم
- ✅ يمكنه إزالة Credits من أي مستخدم
- ✅ يمكنه تعيين Credits لأي مستخدم
- ✅ الوصول لـ Admin Panel

---

## 📱 استخدام الداشبورد

### تسجيل الدخول
1. افتح `http://localhost:8080/login`
2. أدخل username و password
3. إذا نجح، سيتم توجيهك للداشبورد

### تسجيل مستخدم جديد
1. اضغط على تبويب **Register**
2. أدخل username (3-30 حرف)
3. أدخل email (اختياري)
4. أدخل password (6 أحرف على الأقل)
5. أكد password
6. بعد التسجيل، سجل دخول

⚠️ **المستخدمون الجدد يبدأون بـ 0 credits**

### عرض Credits
- بعد تسجيل الدخول، سترى Credits الخاصة بك في الـ Sidebar
- يظهر رقم كبير أزرق/بنفسجي

### إنشاء بطولة
1. اضغط على **Create Tournament**
2. املأ معلومات البطولة
3. إذا كان لديك credits كافية، سيُخصم 1 credit
4. إذا لم يكن لديك credits، سيظهر خطأ

### تسجيل الخروج
- اضغط على زر **Logout** في الـ Sidebar

---

## 👑 Admin Panel

### الوصول للـ Admin Panel
- فقط الـ Admin يرى **Admin Panel** في القائمة الجانبية
- اضغط عليها لفتح لوحة التحكم

### إدارة المستخدمين

#### عرض جميع المستخدمين
1. افتح **Admin Panel**
2. اضغط **Load All Users**
3. ستظهر قائمة بجميع المستخدمين

#### إضافة Credits
1. اضغط **➕ Add Credits** بجانب المستخدم
2. أدخل الكمية (مثلاً: 10)
3. سيتم إضافة Credits فوراً

#### إزالة Credits
1. اضغط **➖ Remove Credits**
2. أدخل الكمية
3. سيتم خصم Credits (لن تقل عن 0)

#### تعيين Credits
1. اضغط **⚙️ Set Credits**
2. أدخل الرقم الجديد
3. سيتم تعيين Credits مباشرةً

---

## 🔧 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | تسجيل مستخدم جديد | ❌ |
| POST | `/api/auth/login` | تسجيل الدخول | ❌ |
| POST | `/api/auth/logout` | تسجيل الخروج | ✅ |
| GET | `/api/auth/me` | الحصول على معلومات المستخدم الحالي | ✅ |

### Tournaments

| Method | Endpoint | Description | Auth Required | Credits Cost |
|--------|----------|-------------|---------------|--------------|
| GET | `/api/tournaments` | جلب جميع البطولات | ✅ | 0 |
| POST | `/api/tournaments/create` | إنشاء بطولة | ✅ | 1 |
| DELETE | `/api/tournaments/:id` | حذف بطولة | ✅ | 0 |

### Admin Only

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/admin/users` | جلب جميع المستخدمين | ✅ | Admin |
| POST | `/api/admin/credits/add` | إضافة Credits | ✅ | Admin |
| POST | `/api/admin/credits/remove` | إزالة Credits | ✅ | Admin |
| POST | `/api/admin/credits/set` | تعيين Credits | ✅ | Admin |

---

## 🗄️ Database Models

### User Model
```typescript
{
  username: string;        // اسم المستخدم (فريد)
  password: string;        // كلمة المرور (مشفرة SHA256)
  email?: string;          // البريد الإلكتروني (اختياري)
  credits: number;         // عدد الـ Credits
  role: "admin" | "user";  // الدور
  createdAt: Date;         // تاريخ الإنشاء
  lastLogin?: Date;        // آخر تسجيل دخول
  tournamentsCreated: number; // عدد البطولات المُنشأة
}
```

### Session Model
```typescript
{
  userId: string;      // معرف المستخدم
  token: string;       // رمز الجلسة (فريد)
  expiresAt: Date;     // تاريخ الانتهاء (7 أيام)
  createdAt: Date;     // تاريخ الإنشاء
  ipAddress?: string;  // عنوان IP
  userAgent?: string;  // معلومات المتصفح
}
```

---

## 🔐 Security

### Password Hashing
- يتم تشفير كلمات المرور باستخدام **SHA256**
- لا يتم حفظ كلمات المرور كنص عادي أبداً

### Session Management
- كل جلسة صالحة لمدة **7 أيام**
- يتم حذف الجلسات المنتهية تلقائياً من MongoDB
- Token فريد لكل جلسة

### Authorization
- جميع APIs المحمية تتطلب Token صالح
- Admin APIs تتطلب role = "admin"
- Middleware يتحقق من الصلاحيات تلقائياً

---

## 📊 معلومات Database

### الاتصال
```
mongodb+srv://malek14322011_db_user:C7EpyqUmYDAjO3h4@cluster0.1bg99ox.mongodb.net/?appName=Cluster0
```

### Collections
- `users` - معلومات المستخدمين
- `sessions` - جلسات تسجيل الدخول
- `tournaments` - البطولات (موجودة مسبقاً)

---

## 🐛 استكشاف الأخطاء

### المشكلة: لا أستطيع تسجيل الدخول
**الحل**:
1. تأكد من إنشاء Admin user: `npm run create-admin`
2. استخدم username: `admin` و password: `admin123`
3. تحقق من اتصال MongoDB في console

### المشكلة: "Insufficient credits"
**الحل**:
1. سجل دخول كـ Admin
2. افتح **Admin Panel**
3. أضف Credits للمستخدم

### المشكلة: لا أرى Admin Panel
**الحل**:
- فقط المستخدمون بـ role = "admin" يرون Admin Panel
- تحقق من أنك مسجل دخول كـ admin

### المشكلة: Token expired
**الحل**:
- سجل خروج ثم سجل دخول مرة أخرى
- الجلسات صالحة لمدة 7 أيام فقط

---

## 📝 أمثلة على الاستخدام

### مثال 1: إنشاء مستخدم جديد وإعطائه Credits

```bash
# 1. سجل دخول كـ Admin
http://localhost:8080/login
Username: admin
Password: admin123

# 2. سجل مستخدم جديد (من نافذة أخرى)
http://localhost:8080/login → Register Tab
Username: player1
Password: 123456

# 3. في Admin Panel
اضغط "Load All Users"
ابحث عن "player1"
اضغط "Add Credits"
أدخل: 5

# 4. الآن player1 يمكنه إنشاء 5 بطولات!
```

### مثال 2: التحقق من Credits المتبقية

```javascript
// في Console المتصفح
const user = JSON.parse(localStorage.getItem('user'));
console.log('Credits:', user.credits);
```

---

## ✨ المميزات الجديدة

### ✅ تم إضافة:
1. 🔐 نظام تسجيل دخول كامل
2. 👤 إدارة المستخدمين
3. 💳 نظام Credits
4. 👑 Admin Panel
5. 🗄️ Database Models (User & Session)
6. 🔒 Authentication Middleware
7. 📱 Login/Register UI
8. 🎨 User Info في Sidebar
9. ⚡ Auto-refresh للـ Credits
10. 🛡️ حماية APIs بـ Token

---

## 🎉 جاهز!

النظام الآن جاهز للاستخدام الكامل!

### الخطوات التالية:
1. ✅ `npm run create-admin` - أنشئ Admin
2. ✅ `npm start` - شغل السيرفر
3. ✅ افتح `http://localhost:8080/login`
4. ✅ سجل دخول وابدأ الإدارة!

---

**Made By Tot** ❤️

Need help? Check the logs or contact support!
