# MAZZA — Fast Food Online Ordering Platform

EVOS.uz dizayn estetikasi asosida yaratilgan zamonaviy, to'liq funksional **MAZZA** fast food onlayn buyurtma va yetkazib berish platformasi (O'zbekcha / Русский).

## Texnologiyalar

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (Responsive: Desktop, Laptop, Tablet, Mobile)
- **Backend:** Node.js, Express.js, MVC arxitekturasi
- **Ma'lumotlar bazasi:** PostgreSQL + Sequelize ORM
- **Xavfsizlik va Fayl yuklash:** JWT Authentication (`users` va `admins` alohida), `bcrypt`, `helmet`, `cors`, `multer`, `dotenv`

---

## Loyiha strukturasi

```text
ai-shop-bot/
├── README.md
├── backend/
│   ├── app.js                 # Express ilovasi, static frontend, API router
│   ├── server.js              # Server va DB ulanish nuqtasi
│   ├── config/                # database.js, auth.js, upload.js (Multer)
│   ├── controllers/           # Auth, Admin, Category, Product, Banner, Promotion, Address, Order, Info
│   ├── database/
│   │   ├── schema.sql         # PostgreSQL DDL (10 ta jadval, FK, enum va indekslar)
│   │   ├── initDb.js          # Bazani avtomatik yaratish, sync va seed qilish skripti
│   │   └── seed.js            # Boshlang'ich ma'lumotlar (12 kategoriya, 23 taom, bannerlar, aksiyalar)
│   ├── middleware/            # JWT user/admin himoyasi va xatolarni boshqarish
│   ├── models/                # 10 ta Sequelize modeli va assotsiatsiyalari
│   ├── routes/                # REST API marshrutlari
│   ├── tests/                 # Node testlar (npm test)
│   └── uploads/               # Mahsulot va banner rasmlari
└── frontend/
    ├── index.html             # Asosiy mijozlar do'koni
    ├── admin.html             # Alohida himoyalangan Admin Dashboard
    ├── css/                   # styles.css & admin.css
    ├── js/                    # i18n.js, api.js, state.js, ui.js, main.js, admin.js
    └── assets/images/         # Ornament va brend aktivlari
```

---

## PostgreSQL Jadvallari (10 ta)

1. `users` — ro'yxatdan o'tgan mijozlar
2. `admins` — administratorlar (`super_admin`, `manager`, `operator`)
3. `categories` — 12 ta kategoriya (`Aksiyalar`, `Yangiliklar`, `Lavash`, `Burger`, `Shaurma`, `Hot-dog`, `Pizza`, `Donar`, `Kartoshka`, `Ichimliklar`, `Desertlar`, `Setlar`)
4. `products` — mahsulotlar (narx, eski narx, tarkib, tavsif, kaloriya, hajm, badge)
5. `product_images` — mahsulot galereyasi rasmlari
6. `orders` — buyurtmalar (`new`, `accepted`, `preparing`, `delivering`, `completed`, `cancelled`)
7. `order_items` — buyurtma ichidagi mahsulotlar
8. `banners` — gorizontal reklama bannerlari
9. `promotions` — aksiyalar va promo kodlar (`MAZZA15`, `BURGER20`, `SET10`)
10. `addresses` — foydalanuvchilarning saqlangan yetkazib berish manzillari

---

## Ishga tushirish yo'riqnomasi

### 1. Bog'liqliklarni o'rnatish

```bash
cd backend
npm install
```

### 2. Muhit o'zgaruvchilarini sozlash (`.env`)

`backend/.env` faylini oching va o'zingizning PostgreSQL parolingizni kiriting:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=mazza_food_db
DB_USER=postgres
DB_PASSWORD=SIZNING_POSTGRES_PAROLINGIZ
```

### 3. PostgreSQL bazasini yaratish va boshlang'ich ma'lumotlarni yuklash

```bash
cd backend
npm run db:setup
```

*(Ixtiyoriy: agar jadvallarni qo'lda SQL orqali yaratmoqchi bo'lsangiz, `backend/database/schema.sql` faylidan foydalanishingiz mumkin).*

### 4. Serverni ishga tushirish

```bash
cd backend
npm start
```

Server ishga tushgandan so'ng:
- **Asosiy sayt:** `http://localhost:5000`
- **Admin Dashboard:** `http://localhost:5000/admin`

---

## Boshlang'ich Test Hisoblar (Seed)

- **Admin Panel (`/admin`):**
  - Login: `admin` (yoki `admin@mazza.uz`)
  - Parol: `Admin123!`
- **Demo Mijoz:**
  - Telefon: `+998901234567`
  - Parol: `User123!`
- **Faol Promo Kodlar:**
  - `MAZZA15` (15% chegirma, min. 40 000 so'm)
  - `BURGER20` (20 000 so'm chegirma, min. 80 000 so'm)
  - `SET10` (10% chegirma, min. 50 000 so'm)

---

## Testlarni ishga tushirish

```bash
cd backend
npm test
```
