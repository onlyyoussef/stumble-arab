# 🎮 Tournament Dashboard Guide

## ✅ Setup Complete!

تم إصلاح الداشبورد بنجاح! الآن يمكنك استخدامه لإدارة البطولات.

## 🚀 Quick Start

### 1. تشغيل السيرفر:
```bash
npm start
```

### 2. فتح الداشبورد:
افتح المتصفح على: `http://localhost:8080`

## 🎯 Features

### ✨ الصفحة الرئيسية (Overview)
- إحصائيات البطولات (إجمالي، نشطة، مجدولة، المشاركين)
- آخر 5 بطولات
- تصميم احترافي أسود (#0a0a0a)

### 📝 إنشاء بطولة (Create Tournament)
يمكنك إنشاء بطولة جديدة بالحقول التالية:
- **Tournament Name**: اسم البطولة
- **Mode**: وضع اللعب (1v1, 2v2, 3v3, 4v4)
- **Region**: المنطقة (EU, NA, SA, ASIA, OCE)
- **Max Participants**: الحد الأقصى للاعبين
- **Map**: الخريطة (BlockDash, LaserTracer, إلخ)
- **Rounds**: عدد الجولات
- **Description**: وصف البطولة
- **Scheduled Date**: تاريخ البدء (اختياري)

### 📊 عرض البطولات
- **Active**: البطولات النشطة حالياً
- **Scheduled**: البطولات المجدولة
- **History**: البطولات المنتهية

## 🔧 API Endpoints

جميع API endpoints تعمل على `/api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tournaments` | جلب جميع البطولات |
| GET | `/api/tournaments/:id` | جلب بطولة محددة |
| POST | `/api/tournaments/create` | إنشاء بطولة جديدة |
| DELETE | `/api/tournaments/:id` | حذف بطولة |
| GET | `/api/stats` | إحصائيات البطولات |

## 🎨 Design

التصميم يطابق Image Maker:
- خلفية سوداء (#0a0a0a)
- حواف خفيفة وشفافة
- تدرجات بنفسجية
- انيميشن "Made By Tot" عند التحميل

## ⚙️ Settings

في صفحة Settings يمكنك:
- تفعيل التحديث التلقائي
- تغيير فترة التحديث (10-120 ثانية)

## 🔑 Keyboard Shortcuts

- `Ctrl/Cmd + N`: إنشاء بطولة جديدة
- `Ctrl/Cmd + R`: تحديث البيانات

## 🐛 Troubleshooting

### الصفحة بيضاء؟
1. تأكد أن السيرفر يعمل (`npm start`)
2. تحقق من Console في المتصفح (F12)
3. تأكد أن MongoDB متصل (شوف Logs)

### API لا يعمل؟
- تأكد أن السيرفر بنى بنجاح: `npm run build`
- تحقق من `.env` أن `DATABASE_URI` مضبوط

### البطولات لا تظهر؟
- افتح Console وشوف الأخطاء
- تأكد أن MongoDB فيه بطولات: استخدم MongoDB Compass
- جرب تسوي Refresh يدوي من الزر في الداشبورد

## 📱 Mobile Support

الداشبورد responsive ويعمل على الموبايل والتابلت!

## 🎉 Done!

الداشبورد جاهز للاستخدام. استمتع! 🚀

**Made By Tot**
