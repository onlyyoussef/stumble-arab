# 🔐 دليل إعداد Discord OAuth - خطوة بخطوة

## الخطوة 1: إنشاء Application في Discord Developer Portal

### 1.1 الذهاب إلى Discord Developer Portal
1. افتح المتصفح واذهب إلى: https://discord.com/developers/applications
2. سجل دخول بحساب Discord الخاص بك
3. اضغط على زر **"New Application"** في الأعلى يمين

### 1.2 إنشاء التطبيق
1. أدخل اسم التطبيق (مثلاً: "Tournament System")
2. اقرأ الشروط واضغط **"Create"**
3. الآن لديك Application جديد!

---

## الخطوة 2: الحصول على Client ID و Client Secret

### 2.1 نسخ Client ID
1. في صفحة التطبيق، ابحث عن **"APPLICATION ID"** أو **"CLIENT ID"**
2. انسخه (مثال: `1234567890123456789`)
3. احفظه في ملف `.env`:
```
DISCORD_CLIENT_ID=1234567890123456789
```

### 2.2 الحصول على Client Secret
1. في نفس الصفحة، اذهب إلى تبويب **"OAuth2"** من القائمة اليسار
2. ابحث عن **"CLIENT SECRET"**
3. اضغط **"Reset Secret"** (إذا لم يكن ظاهراً)
4. انسخ الـ Secret (⚠️ مهم جداً: لن تراه مرة أخرى!)
5. احفظه في `.env`:
```
DISCORD_CLIENT_SECRET=abc123xyz789...
```

---

## الخطوة 3: إضافة Redirect URLs

### 3.1 إعداد OAuth2 Redirects
1. في تبويب **"OAuth2"**
2. ابحث عن **"Redirects"** أو **"Redirect URIs"**
3. اضغط **"Add Redirect"**
4. أضف الروابط التالية:

**للتطوير المحلي:**
```
http://localhost:3000/auth/callback
http://localhost:3000/landing.html
```

**للإنتاج (بعد رفع الموقع):**
```
https://yourdomain.com/auth/callback
https://yourdomain.com/landing.html
```

5. اضغط **"Save Changes"** في الأسفل

---

## الخطوة 4: تحديث ملف `.env`

افتح ملف `.env` في المشروع وأضف:

```env
# Discord OAuth
DISCORD_CLIENT_ID=YOUR_CLIENT_ID_HERE
DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
DISCORD_REDIRECT_URI=http://localhost:3000/auth/callback

# Bot Token (إذا كنت تستخدم بوت)
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
```

---

## الخطوة 5: تحديث ملف `landing.js`

افتح `public/assets/landing.js` وغيّر:

```javascript
const DISCORD_CONFIG = {
    clientId: 'YOUR_CLIENT_ID_HERE',  // ضع الـ Client ID هنا
    redirectUri: window.location.origin + '/auth/callback',
    scopes: ['identify', 'email']
};
```

إلى:

```javascript
const DISCORD_CONFIG = {
    clientId: '1234567890123456789',  // Client ID الخاص بك
    redirectUri: window.location.origin + '/auth/callback',
    scopes: ['identify', 'email']
};
```

---

## الخطوة 6: فهم كيفية عمل OAuth Flow

### تسلسل الأحداث:

1. **المستخدم يضغط "Login"**
   - يفتح رابط Discord OAuth
   - الرابط: `https://discord.com/api/oauth2/authorize?client_id=...&redirect_uri=...&response_type=code&scope=identify email`

2. **Discord يطلب من المستخدم الموافقة**
   - المستخدم يوافق على الصلاحيات (identify, email)

3. **Discord يرجع للموقع مع Code**
   - Discord يحول المستخدم إلى: `http://localhost:3000/auth/callback?code=ABC123XYZ`

4. **الـ Frontend يرسل الـ Code للـ Backend**
   - `POST /api/auth/discord/callback`
   - Body: `{ "code": "ABC123XYZ" }`

5. **الـ Backend يبادل الـ Code بـ Access Token**
   - يرسل طلب إلى Discord API
   - يحصل على Access Token

6. **الـ Backend يستخدم الـ Token لجلب بيانات المستخدم**
   - يحصل على: Username, ID, Email, Avatar

7. **الـ Backend يُنشئ/يُسجل المستخدم**
   - يحفظ البيانات في قاعدة البيانات
   - يُنشئ JWT Token للمستخدم

8. **المستخدم يدخل Dashboard**
   - يحفظ الـ JWT Token في LocalStorage
   - يستخدمه في كل طلب للـ API

---

## الخطوة 7: اختبار النظام

### 7.1 تشغيل السيرفر
```bash
npm run build
npm start
```

### 7.2 فتح الصفحة
1. افتح المتصفح واذهب إلى: http://localhost:3000/landing.html
2. اضغط على **"Login"** أو **"Get Started"**
3. سيفتح صفحة Discord للموافقة
4. اضغط **"Authorize"**
5. يجب أن يرجعك إلى الموقع ويدخلك Dashboard

---

## 🔧 استكشاف الأخطاء

### الخطأ: "Invalid OAuth2 redirect_uri"
**الحل:** تأكد أن الرابط في Discord Developer Portal يطابق تماماً الرابط في الكود

### الخطأ: "Invalid client"
**الحل:** تحقق من Client ID و Client Secret في `.env`

### الخطأ: "Access denied"
**الحل:** المستخدم رفض الموافقة، اطلب منه المحاولة مرة أخرى

### الخطأ: Code expired
**الحل:** الـ Code صالح لـ 10 دقائق فقط، يجب استخدامه فوراً

---

## 📚 موارد إضافية

- Discord OAuth2 Documentation: https://discord.com/developers/docs/topics/oauth2
- Discord API Reference: https://discord.com/developers/docs/reference

---

## ⚠️ ملاحظات أمنية مهمة

1. **لا تشارك Client Secret أبداً** - احفظه في `.env` فقط
2. **لا ترفع `.env` إلى Git** - أضفه في `.gitignore`
3. **استخدم HTTPS في الإنتاج** - OAuth يجب أن يكون آمناً
4. **تحقق من الـ State Parameter** - لحماية ضد CSRF attacks (اختياري لكن مهم)

---

## ✅ Checklist سريع

- [ ] أنشأت Application في Discord Developer Portal
- [ ] نسخت Client ID و Client Secret
- [ ] أضفت Redirect URIs
- [ ] حدثت ملف `.env`
- [ ] حدثت `landing.js` بالـ Client ID
- [ ] أضفت الـ Backend endpoint للـ callback
- [ ] اختبرت تسجيل الدخول

---

**جاهز؟ جرب تسجيل الدخول الآن! 🚀**
