# Dil Kursu

Bu proje Vue.js frontend ve Node.js backend'den oluşan bir dil kursu uygulamasıdır.

## Proje Yapısı

- `frontend/` - Vue.js uygulaması
- `backend/` - Node.js/Express API
- `.do/` - Digital Ocean App Platform yapılandırması

## Lokal Geliştirme

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Digital Ocean App Platform Deployment

Bu proje Digital Ocean App Platform'da deploy edilmek üzere yapılandırılmıştır.

### Deployment Adımları:

1. **GitHub'a Push**: Kodunuzu GitHub'a push edin
2. **Digital Ocean Console**: Digital Ocean Console'a gidin
3. **App Platform**: "Create App" > "Create App from Source Code"
4. **GitHub Bağlantısı**: GitHub repository'nizi seçin
5. **Yapılandırma**: `.do/app.yaml` dosyası otomatik olarak yapılandırmayı sağlayacak
6. **Deploy**: "Create Resources" ile deploy edin

### Yapılandırma Detayları:

- **Backend**: Node.js servisi, `/api` route'unda çalışır
- **Frontend**: Vue.js uygulaması, root route'unda çalışır
- **Database**: PostgreSQL veritabanı (opsiyonel)

### Environment Variables:

Backend için:
- `NODE_ENV=production`
- `PORT=3000`

Frontend için:
- `NODE_ENV=production`
- `VITE_API_URL` (backend URL'i otomatik olarak ayarlanır)

## API Endpoints

- `GET /api/health` - Backend sağlık kontrolü

## Notlar

- Frontend build dosyaları backend tarafından serve edilir
- CORS yapılandırılmıştır
- Production ortamında güvenlik ayarları aktif edilmelidir 