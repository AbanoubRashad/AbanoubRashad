# وَصلة شحن

تطبيق بيوريك شواحن العربيات الكهربا في أكتوبر وزايد والطريق الصحراوي، وحالة كل شاحن جاية من بلاغات السواقين: **أخضر** شغّال، **أحمر** بايظ، **أصفر** طابور أو بلاغات متضاربة، و**رمادي** لما مفيش تأكيد.

## الفولدر

```
وصلة شحن/
├── app/                       التطبيق (Expo + React Native + TypeScript)
├── backend/
│   ├── schema.sql             الجداول والصلاحيات وقواعد البلاغ وصور البلاغات
│   ├── seed.sql               المحطات (بيتولّد من app/src/data/stations.ts)
│   ├── webhook.sql            بيربط البلاغات بالإشعارات
│   └── supabase/functions/    wasla-notify-watchers: إشعار للي بيراقبوا المحطة
└── design/                    ملفات التصميم الأصلية
```

## التشغيل

```bash
cd app
npm install
npx expo start          # صوّر الـ QR بـ Expo Go، أو اضغط w للمتصفح
npm test                # اختبارات قواعد الحالة ورقم الموبايل
npm run typecheck
```

- **من غير `.env`:** التطبيق بيشتغل محلي، والبلاغات بتتحفظ على الموبايل بس. أي كود من 6 أرقام بينفع في التسجيل.
- **مع `.env`:** التطبيق بيتوصل بـ Supabase (انسخ `.env.example` لـ `.env`). البلاغات بتوصل للكل لحظيًا، والتسجيل بيبقى بكود SMS حقيقي.

## تشغيل السيرفر (Supabase) — مرة واحدة

1. اعمل مشروع على Supabase، وشغّل في SQL Editor بالترتيب: `backend/schema.sql`، وبعده `backend/seed.sql`.
2. في **Authentication ← Sign In / Providers ← Phone** فعّل التسجيل بالموبايل، واختار مزوّد SMS (Twilio أو MessageBird أو Vonage). وأنت بتجرّب، استخدم **Test phone numbers** من نفس الصفحة.
3. الإشعارات:
   ```bash
   npx supabase functions deploy wasla-notify-watchers --no-verify-jwt --workdir backend --project-ref <PROJECT_REF>
   npx supabase secrets set WEBHOOK_SECRET=<سر طويل> --project-ref <PROJECT_REF>
   ```
   بعد كده عدّل `<PROJECT_REF>` و `<WEBHOOK_SECRET>` في `backend/webhook.sql`، وشغّله.
4. حط `EXPO_PUBLIC_SUPABASE_URL` و `EXPO_PUBLIC_SUPABASE_KEY` في `app/.env`.

> **مهم:** لو غيّرت قواعد الحالة في `app/src/domain/status.ts`، شغّل `npm run sync:functions` علشان السيرفر يحسب الحالة بنفس الطريقة.
> ولو غيّرت المحطات في `stations.ts`، شغّل `npm run seed:sql`.

## قواعد الحالة

| الحالة | إمتى |
| --- | --- |
| شغّال | في بلاغ «شحنت تمام» في آخر 3 ساعات |
| طابور | آخر بلاغ في آخر ساعة كان «في طابور» |
| متضارب | بلاغ «بايظ» واحد بس، ومحدش أكده |
| بايظ | سواقين **مختلفين** قالوا «بايظ» في آخر 6 ساعات، ومحدش قال «شغّال» بعدهم |
| مفيش تأكيد | مفيش بلاغات حديثة |

**على السيرفر:**
- وقت البلاغ بيتحدد على السيرفر، فمحدش يقدر يزوّره.
- بلاغ واحد بس لكل مستخدم على نفس المحطة كل 10 دقايق.
- محدش يقدر يبلّغ باسم حد تاني، ولا يشوف تنبيهات حد تاني.
- اتجرّبت على Postgres 16.

## البناء للموبايل (EAS)

```bash
npx eas-cli@latest login
npx eas-cli@latest init                                    # بيدّيك EAS_PROJECT_ID
npx eas-cli@latest build --profile preview --platform android   # APK للتجربة
```

- محتاج `GOOGLE_MAPS_API_KEY` (Maps SDK for Android) في متغيرات البيئة، علشان الخريطة تشتغل في نسخة الأندرويد.
- الإشعارات من السيرفر بتشتغل في نسخة EAS بس، مش في Expo Go.

## اللي فاضل

- [ ] **إحداثيات المحطات تقريبية** (`approximate: true`)، ولازم تتأكد واحدة واحدة.
- [ ] إنشاء مشروع Supabase وتشغيل الخطوات اللي فوق.
- [ ] مزوّد SMS للتسجيل.
- [ ] Google Maps API key، وأول build بـ EAS.
- [ ] شاشة أدمن لمراجعة المحطات اللي المستخدمين ضافوها (`pending_stations`).
