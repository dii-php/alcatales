# ALCA ♡ — Love Story Website
> Website kenangan cinta Aldi & Caca

## 📁 Struktur Folder

```
alca-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Navigasi + theme toggle + login
│   │   ├── LoginModal.jsx      # Modal login admin
│   │   ├── Countdown.jsx       # Timer sejak awal hubungan
│   │   └── Footer.jsx
│   ├── context/
│   │   ├── AuthContext.js      # State autentikasi admin
│   │   └── ThemeContext.js     # Sunset Blush / Midnight Dream
│   ├── pages/
│   │   ├── Home.jsx            # Landing page utama
│   │   ├── OurStory.jsx        # Cerita hubungan
│   │   ├── Gallery.jsx         # Gallery foto (upload Cloudinary)
│   │   ├── Timeline.jsx        # Timeline momen
│   │   └── LoveLetter.jsx      # Surat cinta
│   ├── utils/
│   │   ├── cloudinary.js       # Upload foto ke Cloudinary
│   │   └── dataService.js      # CRUD ke Firebase Firestore
│   ├── firebase.js             # Inisialisasi Firebase
│   ├── App.jsx                 # Router utama
│   ├── index.js
│   └── index.css               # Global styles + CSS variables
├── .env.example                # Template env variables
├── vercel.json                 # Config deploy Vercel (SPA routing)
└── package.json
```

---

## 🚀 Cara Setup & Deploy

### 1. Install dependencies

```bash
npm install
```

### 2. Setup Firebase (untuk data persisten)

1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Buat project baru → nama bebas misal `alca-love`
3. Aktifkan **Firestore Database** (mode Production atau Test)
4. Di **Firestore Rules**, set:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read: if true;
         allow write: if true;
       }
     }
   }
   ```
5. Di Project Settings → **Web Apps**, klik "Add app" → salin config

### 3. Setup Cloudinary (untuk upload foto)

1. Daftar gratis di [cloudinary.com](https://cloudinary.com)
2. Di Dashboard, catat **Cloud Name**
3. Buka Settings → **Upload** → Scroll ke "Upload presets"
4. Klik "Add upload preset" → Mode: **Unsigned** → Simpan → catat nama preset

### 4. Buat file `.env`

Salin `.env.example` menjadi `.env` lalu isi:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=nama_cloud_kamu
REACT_APP_CLOUDINARY_UPLOAD_PRESET=nama_preset_kamu

REACT_APP_ADMIN_USERNAME=aldi
REACT_APP_ADMIN_PASSWORD=passwordRahasia123

REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=alca-love.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=alca-love
REACT_APP_FIREBASE_STORAGE_BUCKET=alca-love.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123:web:abc
```

### 5. Jalankan lokal

```bash
npm start
```

---

## 🌐 Deploy ke Vercel

### Cara 1: Via GitHub (Direkomendasikan)

1. Push semua file ke GitHub repo
2. Buka [vercel.com](https://vercel.com) → New Project → import repo
3. Di **Environment Variables**, tambahkan semua isi `.env` (tanpa `REACT_APP_` dihapus, biarkan apa adanya)
4. Klik Deploy ✅

### Cara 2: Via CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```
Saat ditanya environment variables, masukkan satu per satu.

---

## 🔐 Admin Features

Login sebagai admin untuk:
- ✅ Upload & hapus foto di Gallery (disimpan permanen di Cloudinary + Firestore)
- ✅ Tambah & hapus momen di Timeline
- ✅ Tulis & hapus Love Letter

Data tersimpan di **Firebase Firestore** → bisa dibuka dari device manapun, permanen.

---

## 🎨 Tema

| Tema | Deskripsi |
|------|-----------|
| Sunset Blush | Hangat, pink lembut dan romantis (default) |
| Midnight Dream | Elegan, gelap dan modern |

Toggle tema ada di Navbar, preferensi disimpan di localStorage.

---

## 📦 Dependencies Utama

| Package | Kegunaan |
|---------|----------|
| `react-router-dom` | Routing halaman |
| `firebase` | Database Firestore (data persisten) |
| `lucide-react` | Icon set |
| `framer-motion` | Animasi (opsional) |

---

## 🗺️ Halaman

| URL | Halaman |
|-----|---------|
| `/` | Home (hero, countdown, preview) |
| `/our-story` | Cerita hubungan |
| `/gallery` | Gallery foto |
| `/timeline` | Timeline momen |
| `/love-letter` | Surat cinta |
