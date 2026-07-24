# INHAYAT Marketer Mini App

Telegram ichida ishlaydigan marketer kabineti. Ilova Next.js App Router, TanStack
Query, Redux Toolkit, React Hook Form va Yup asosida qurilgan.

## Ishga tushirish

`.env.example` faylidan `.env.local` yarating:

```dotenv
NEXT_PUBLIC_MARKETER_API_URL=http://localhost:3012
NEXT_PUBLIC_MARKETER_BOT_USERNAME=nhayat_marketing_bot
NEXT_PUBLIC_MARKETER_SUPPORT_URL=https://t.me/inhayat
```

So'ng:

```bash
npm run dev
```

`NEXT_PUBLIC_MARKETER_API_URL` faqat API origin bo'lishi kerak. Ilova
`/api/v1/marketer/*` yo'llarini o'zi qo'shadi.

## Docker Compose va Traefik

Production frontend `marketing.inhayat.com` domeniga tayyorlangan. DNS
provayderida shu domen uchun `A` (va kerak bo'lsa `AAAA`) yozuvini Traefik
ishlayotgan serverga yo'naltiring. Traefikda `web`, `websecure` entrypointlari,
`letsencrypt` certificate resolver va tashqi `cu24-network` mavjud bo'lishi
kerak.

`.env.example` faylidan `.env` yarating va kamida bot username qiymatini
tekshiring. So'ng:

```bash
docker network inspect cu24-network >/dev/null 2>&1 \
  || docker network create cu24-network
docker compose up -d --build
docker compose ps
```

Compose HTTP so'rovlarini HTTPS'ga yo'naltiradi va
`marketing.inhayat.com` uchun TLS sertifikatini Traefik orqali avtomatik
oladi. Frontend healthcheck manzili: `/api/health`.

Server loyihasining `.env` faylida quyidagi qiymat aynan mos bo'lishi kerak:

```dotenv
MARKETER_FRONTEND_URL=https://marketing.inhayat.com
MONGO_REPLICA_SET=rs0
MONGO_REPLICA_SET_KEY=<openssl rand -base64 48 bilan yaratilgan doimiy kalit>
```

Server Compose konfiguratsiyasi marketer hamyon operatsiyalari atomik bo'lishi
uchun mavjud `mongo_data` volume ustida bir tugunli replica setni ishga
tushiradi. Bu sozlama mavjud MongoDB ma'lumotlarini o'chirmaydi. Keyinchalik
sharded yoki boshqariladigan replica setga o'tilganda server `.env` faylidagi
`MONGO_DOCKER_URI` bilan tashqi ulanishni berish mumkin.

Lokal Docker/Traefik kerak bo'lmagan development uchun `.env.local` ichida
`NEXT_PUBLIC_MARKETER_API_URL=http://localhost:3012` qiymatidan foydalaning.

## Telegram ishga tushirish

BotFather orqali Main Mini App yoki named Mini App URL manzilini ushbu frontend
originiga (`https://marketing.inhayat.com`) ulang. Bot yuborgan inline Web App
tugmasi ham shu originni ochishi kerak. Frontend `Telegram.WebApp.initData`
qiymatini serverga yuboradi; foydalanuvchi ma'lumoti faqat server imzoni va
`auth_date` ni tekshirganidan so'ng qabul qilinadi.

Fullscreen Bot API 8.0 va undan yangi Telegram mijozlarida so'raladi. Eski yoki
fullscreenni rad etgan mijozlarda ilova `expand()` rejimida ishlashda davom etadi.
