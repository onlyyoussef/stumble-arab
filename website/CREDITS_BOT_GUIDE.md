# 🤖 دليل استخدام Credits Bot

## ✅ تم إضافة كل المطلوب:

### 1️⃣ نظام User ID من 5 أرقام
- كل مستخدم يسجل يحصل على ID عشوائي من 10000 إلى 99999
- الـ ID يستخدم في البوت لإضافة الكريديت

### 2️⃣ الـ Admins فقط
الأشخاص المسموح لهم:
- `1394118417275031672`
- `1548373280438886444`

### 3️⃣ أوامر البوت

#### `/addcredits`
إضافة كريديت لمستخدم
```
/addcredits userid:12345 amount:1000
```
- `userid`: الـ ID المكون من 5 أرقام
- `amount`: عدد الكريديت

#### `/checkuser`
عرض معلومات مستخدم
```
/checkuser userid:12345
```
يعرض:
- User ID
- Username
- Discord ID
- Credits
- Tournaments
- تاريخ التسجيل
- آخر نشاط

#### `/listusers`
عرض كل المستخدمين (مع pagination)
```
/listusers page:1
```
يعرض 10 مستخدمين في كل صفحة

#### `/stats`
إحصائيات النظام
```
/stats
```
يعرض:
- إجمالي المستخدمين
- إجمالي الكريديت
- إجمالي البطولات
- أعلى 3 مستخدمين

---

## 🔧 إعداد البوت

### 1. تفعيل البوت في Discord Developer Portal

#### رابط البوت:
https://discord.com/developers/applications/1549116046114422844

#### الخطوات:
1. اذهب للرابط أعلاه
2. تبويب **"Bot"** من اليسار
3. تأكد أن "Privileged Gateway Intents" مفعلة:
   - ✅ Presence Intent
   - ✅ Server Members Intent  
   - ✅ Message Content Intent
4. اضغط **"Save Changes"**

### 2. إضافة البوت للسيرفر

#### رابط الدعوة:
```
https://discord.com/api/oauth2/authorize?client_id=1549116046114422844&permissions=8&scope=bot%20applications.commands
```

1. افتح الرابط أعلاه
2. اختر السيرفر
3. اضغط **"Authorize"**

### 3. تشغيل السيرفر
```bash
npm start
```

البوت سيبدأ تلقائياً مع السيرفر!

---

## 🛡️ الأمان

### صلاحيات الـ Admin:
- ✅ استخدام كل أوامر البوت
- ✅ إضافة كريديت لأي مستخدم
- ✅ عرض كل المستخدمين وبياناتهم
- ✅ حذف البطولات (Dashboard)

### صلاحيات المستخدم العادي:
- ✅ إنشاء بطولات
- ✅ حذف بطولاته فقط
- ❌ لا يستطيع استخدام البوت
- ❌ لا يستطيع حذف بطولات غيره

---

## 📊 Dashboard - Admin Panel

الـ Admins يشوفون:
- قائمة كل المستخدمين
- كريديت كل مستخدم
- عدد البطولات
- User ID لكل واحد

(سيتم إضافة واجهة Admin Panel قريباً)

---

## 🎯 مثال على الاستخدام

### السيناريو:
1. مستخدم يسجل في Dashboard
2. يحصل على User ID: `45231`
3. Admin يكتب في Discord:
   ```
   /addcredits userid:45231 amount:5000
   ```
4. المستخدم يدخل Dashboard ويشوف 5000 كريديت!

---

## ⚠️ ملاحظات مهمة

1. **البوت منفصل عن البوت الرئيسي**
   - البوت الرئيسي (Tournament Bot) للبطولات
   - Credits Bot للكريديت فقط

2. **User ID عشوائي**
   - من 10000 إلى 99999
   - لا يتكرر أبداً
   - يظهر في Dashboard

3. **الأوامر خاصة**
   - فقط Admin IDs المحددين
   - باقي الناس يطلع لهم رسالة خطأ

4. **كل الأوامر ephemeral**
   - يعني أن الرد يطلع لك أنت فقط
   - ما يشوفه باقي الناس

---

## 🐛 المشاكل الشائعة

### البوت ما يرد على الأوامر
✅ تأكد أن البوت online
✅ تأكد أن البوت موجود في السيرفر
✅ تأكد أن Discord ID صحيح في `.env`

### "ليس لديك صلاحية"
✅ تأكد أن Discord ID موجود في ADMIN_DISCORD_IDS في `.env`

### "User not found"
✅ المستخدم لازم يسجل دخول في Dashboard أولاً
✅ تأكد من User ID صحيح (5 أرقام)

---

## 📝 الملفات المضافة/المعدلة

### ملفات جديدة:
- `Source/Handlers/CreditsBot.ts` - البوت
- `Source/Utils/AdminHelpers.ts` - Helper functions
- `CREDITS_BOT_GUIDE.md` - هذا الملف

### ملفات معدلة:
- `.env` - إضافة بيانات البوت
- `Source/Models/DashboardUser.ts` - إضافة userId
- `Source/Routes/Root.ts` - Admin endpoints
- `Source/index.ts` - تشغيل Credits Bot

---

**جاهز! البوت شغال ويعطيك العافية! 🎉**
