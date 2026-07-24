# INHAYAT Marketer Mini App

Telegram ichida ishlaydigan marketer kabineti. Ilova Next.js App Router, TanStack
Query, Redux Toolkit, React Hook Form va Yup asosida qurilgan.

## Ishga tushirish

`.env.example` faylidan `.env.local` yarating:

```dotenv
NEXT_PUBLIC_MARKETER_API_URL=http://localhost:3012
NEXT_PUBLIC_MARKETER_BOT_USERNAME=inhayat_marketer_bot
NEXT_PUBLIC_MARKETER_SUPPORT_URL=https://t.me/inhayat
```

So'ng:

```bash
npm run dev
```

`NEXT_PUBLIC_MARKETER_API_URL` faqat API origin bo'lishi kerak. Ilova
`/api/v1/marketer/*` yo'llarini o'zi qo'shadi.

## Telegram ishga tushirish

BotFather orqali Main Mini App yoki named Mini App URL manzilini ushbu frontend
originiga ulang. Bot yuborgan inline Web App tugmasi ham shu originni ochishi
kerak. Frontend `Telegram.WebApp.initData` qiymatini serverga yuboradi; foydalanuvchi
ma'lumoti faqat server imzoni va `auth_date` ni tekshirganidan so'ng qabul qilinadi.

Fullscreen Bot API 8.0 va undan yangi Telegram mijozlarida so'raladi. Eski yoki
fullscreenni rad etgan mijozlarda ilova `expand()` rejimida ishlashda davom etadi.
