# SAMTEK VCA — Vehicle Counting Analytics

Aplikasi web real-time untuk menghitung kendaraan menggunakan YOLOv8 + line crossing detection.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| CV / ML | YOLOv8n (Ultralytics) + ByteTrack |
| Backend | FastAPI + SQLite (aiosqlite) |
| Streaming | MJPEG (sekarang) → WebRTC (nanti) |
| Realtime | WebSocket |
| Frontend | React + Recharts |
| Notifikasi | Firebase Cloud Messaging (opsional) |

---

## Cara Install & Jalankan

### Prasyarat
- Python 3.10+
- Node.js 18+

### 1. Clone & Setup
```bash
git clone <repo-url>
cd samtek-vca
bash setup.sh
```

### 2. Siapkan Video
```bash
# Taruh video traffic di folder assets/
# Rename menjadi test.mp4
cp /path/to/your/video.mp4 assets/test.mp4
```
> Atau download video traffic dari internet:
> `yt-dlp -o assets/test.mp4 "URL_YOUTUBE_TRAFFIC_VIDEO"`

### 3. Jalankan Backend
```bash
cd backend
python main.py
```
Backend berjalan di: http://localhost:8000

### 4. Jalankan Frontend (terminal baru)
```bash
cd frontend
npm run dev
```
Frontend berjalan di: http://localhost:5173

### 5. Buka Browser
Akses http://localhost:5173

---

## Konfigurasi

Edit `backend/config.py` untuk mengubah:

```python
VIDEO_SOURCE = "assets/test.mp4"    # Path video / RTSP URL
YOLO_MODEL = "yolov8n.pt"           # nano=ringan, medium=akurat
CONFIDENCE_THRESHOLD = 0.4          # 0.0 - 1.0
FRAME_SKIP = 2                      # Skip frame (lebih tinggi = lebih ringan)
LINE_START = (0, 240)               # Koordinat virtual line
LINE_END = (640, 240)               # (sesuaikan dengan resolusi video)
```

### Atur Virtual Line
Buka video di video player, lihat resolusi, lalu set koordinat line di `config.py`.
Contoh untuk video 1280x720, garis di tengah:
```python
LINE_START = (0, 360)
LINE_END = (1280, 360)
```

---

## API Endpoints

| Method | URL | Keterangan |
|--------|-----|------------|
| GET | `/stream` | MJPEG live stream |
| WS | `/ws/counting` | WebSocket realtime counts |
| GET | `/api/counts` | Current counts (JSON) |
| GET | `/api/events?limit=50` | Crossing events dari DB |
| GET | `/api/stats` | Statistik aggregate |
| GET | `/api/health` | Status server |
| POST | `/webrtc/offer` | WebRTC offer (nanti) |

---

## Setup Firebase (Opsional — untuk FCM)

1. Buka https://console.firebase.google.com
2. Buat project baru
3. Settings → Service Accounts → Generate new private key
4. Simpan file sebagai `backend/firebase-key.json`
5. Restart backend → FCM otomatis aktif

---

## Cara Aktivasi WebRTC (Nanti)

1. Di `backend/streaming/webrtc_server.py` — uncomment semua kode di dalam docstring
2. Di `frontend/src/components/VideoPlayer.jsx` — comment `<img>` dan uncomment `<WebRTCPlayer />`
3. Restart backend dan frontend

---

## Struktur Project

```
samtek-vca/
├── backend/
│   ├── main.py                  # Entry point FastAPI
│   ├── config.py                # ⚙️ EDIT INI untuk konfigurasi
│   ├── database.py              # SQLite models
│   ├── detection/
│   │   ├── yolo_detector.py     # YOLOv8 wrapper
│   │   └── line_counter.py      # Virtual line crossing logic
│   ├── streaming/
│   │   ├── video_processor.py   # Pipeline utama
│   │   └── webrtc_server.py     # WebRTC (stub, siap diaktifkan)
│   ├── websocket/
│   │   └── manager.py           # WS broadcast manager
│   ├── notification/
│   │   └── fcm.py               # Firebase Cloud Messaging
│   └── api/
│       └── routes.py            # Semua REST + WS endpoints
├── frontend/
│   └── src/
│       ├── App.jsx              # Layout utama
│       ├── hooks/useWebSocket.js
│       └── components/
│           ├── VideoPlayer.jsx  # Stream display
│           ├── CountCard.jsx    # Statistik per kendaraan
│           ├── CountChart.jsx   # Bar chart Recharts
│           └── EventLog.jsx     # Live event feed
├── assets/                      # Taruh video di sini
├── captures/                    # Auto-saved truck screenshots
├── setup.sh                     # Script install
└── README.md
```

---

## Troubleshooting

**"Video tidak muncul"**
→ Pastikan `assets/test.mp4` ada. Cek `backend/config.py` VIDEO_SOURCE.

**"YOLO error / model tidak load"**
→ `pip install ultralytics --break-system-packages`

**"WebSocket tidak konek"**
→ Pastikan backend sudah running di port 8000. Cek console browser.

**"CPU terlalu berat"**
→ Naikkan `FRAME_SKIP = 4` atau `FRAME_SKIP = 6` di config.py

**"Deteksi tidak akurat"**
→ Turunkan `CONFIDENCE_THRESHOLD = 0.3` atau coba model lebih besar `yolov8s.pt`
