# 🏥 CareConnect - AI-Powered Healthcare Platform

> Connected Healthcare Platform integrating Patients, Doctors, Radiologists, Labs, Pharmacies, and Emergency Services with AI-Powered Diagnostics.

## 🏗️ Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Frontend   │───▶│   Backend    │───▶│  AI Engine   │
│ React Native │    │  Express.js  │    │   FastAPI     │
│    (Expo)    │    │   Node.js    │    │   Python      │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
                    ┌──────▼───────┐
                    │   MongoDB    │
                    │   Database   │
                    └──────────────┘
```

## 📁 Project Structure

```
careconnect/
├── backend/                    # Node.js Express API (Port 5000)
│   ├── src/
│   │   ├── config/            # Database & constants
│   │   ├── controllers/       # Auth, Patient, Doctor, Radiology, Emergency
│   │   ├── middleware/        # JWT Auth, RBAC, File Upload (PACS sim)
│   │   ├── models/            # User, RadiologyScan, Consultation, Emergency
│   │   ├── routes/            # RESTful API routes
│   │   ├── utils/             # Seed script
│   │   ├── websocket/         # Real-time Socket.IO
│   │   └── server.js          # Entry point
│   └── uploads/               # PACS simulation storage
│
├── ai-service/                # Python FastAPI AI Engine (Port 8000)
│   ├── app/
│   │   ├── main.py            # FastAPI app
│   │   ├── routers/           # Radiology & Symptom endpoints
│   │   ├── services/          # AI analysis engines
│   │   └── models/            # Pydantic schemas
│   └── requirements.txt
│
├── frontend/                  # React Native Expo App
│   ├── src/
│   │   ├── screens/           # All app screens
│   │   ├── navigation/        # Role-based navigation
│   │   ├── services/          # API client
│   │   └── utils/             # Theme & design system
│   └── App.js
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB (running locally or Atlas URI)
- Expo CLI (`npm install -g expo-cli`)

### 1. Backend Setup

```bash
cd careconnect/backend
npm install
# Start MongoDB first, then:
npm run seed    # Seeds demo users
npm run dev     # Starts on port 5000
```

### 2. AI Service Setup

```bash
cd careconnect/ai-service
pip install -r requirements.txt
python -m app.main
# Starts on port 8000, docs at http://localhost:8000/docs
```

### 3. Frontend Setup

```bash
cd careconnect/frontend
npm install
npx expo start
# Scan QR with Expo Go app or press 'w' for web
```

## 🔑 Demo Credentials

| Role         | Email                      | Password     |
|-------------|----------------------------|--------------|
| Patient     | ravi@careconnect.com       | password123  |
| Patient     | priya@careconnect.com      | password123  |
| Doctor      | dr.raj@careconnect.com     | password123  |
| Doctor      | dr.anita@careconnect.com   | password123  |
| Radiologist | dr.meera@careconnect.com   | password123  |
| Radiologist | dr.arjun@careconnect.com   | password123  |
| Admin       | admin@careconnect.com      | admin123     |

## 📡 API Endpoints

### Authentication
| Method | Endpoint                  | Description          |
|--------|--------------------------|----------------------|
| POST   | /api/auth/register       | Register user        |
| POST   | /api/auth/login          | Login                |
| GET    | /api/auth/me             | Get profile          |

### Radiology (Teleradiology Module)
| Method | Endpoint                      | Description              |
|--------|------------------------------|--------------------------|
| POST   | /api/radiology/upload        | Upload scan              |
| POST   | /api/radiology/upload-scan   | Upload scan (alias)      |
| GET    | /api/radiology/list          | List scans               |
| GET    | /api/radiology/:id           | Get scan details         |
| POST   | /api/radiology/report        | Submit radiologist report|
| GET    | /api/radiology/stats         | Dashboard statistics     |

### Patient
| Method | Endpoint                         | Description           |
|--------|----------------------------------|----------------------|
| POST   | /api/patient/check-symptoms      | AI symptom checker   |
| POST   | /api/patient/consultation        | Book consultation    |
| GET    | /api/patient/consultations       | My consultations     |
| GET    | /api/patient/reports             | My scan reports      |
| GET    | /api/patient/doctors             | Available doctors    |

### Doctor
| Method | Endpoint                              | Description            |
|--------|---------------------------------------|------------------------|
| GET    | /api/doctor/patients                  | My patients            |
| GET    | /api/doctor/patients/:id/history      | Patient history        |
| GET    | /api/doctor/consultations             | My consultations       |
| POST   | /api/doctor/request-scan              | Request scan           |
| GET    | /api/doctor/stats                     | Dashboard stats        |

### Emergency
| Method | Endpoint                    | Description           |
|--------|----------------------------|-----------------------|
| POST   | /api/emergency/sos         | Trigger SOS           |
| GET    | /api/emergency/:id         | Get emergency status  |

### AI Engine
| Method | Endpoint                    | Description           |
|--------|----------------------------|-----------------------|
| POST   | /api/ai/analyze-scan       | AI scan analysis      |
| POST   | /api/ai/check-symptoms     | Symptom analysis      |
| GET    | /api/ai/model-info         | Model information     |

## 🔐 Security

- **JWT Authentication** with configurable expiry
- **Role-Based Access Control** (Patient, Doctor, Radiologist, Admin)
- **Helmet.js** security headers
- **CORS** configured
- **File upload validation** with size limits

## 🧠 AI Features

### Radiology AI Engine
- X-Ray analysis (chest, hand, spine)
- CT scan analysis (head, abdomen, chest)
- MRI analysis (brain, knee, spine)
- Risk level classification (low/medium/high/critical)
- Confidence scoring
- Context-aware findings generation

### Symptom Checker
- 12+ symptom categories
- Fuzzy symptom matching
- Age/severity-adjusted urgency
- Evidence-based recommendations

## 🔗 Integration Flow

```
CT/MRI Machine → Upload Scan → Backend API → AI Engine → 
Radiologist Review → Doctor Review → Patient Notification
```

## 📱 Frontend Screens

- **Login** - Role-based with quick demo login
- **Patient Home** - Health stats, feature grid, SOS button
- **Symptom Checker** - AI-powered analysis with results
- **Upload Scan** - CT/MRI/X-ray with priority levels
- **Reports** - Scan history with AI risk indicators
- **Doctor Dashboard** - Stats, patient queue
- **Radiologist Panel** - Filterable scan worklist
- **Report Editor** - AI findings + editable fields
- **Emergency SOS** - Type selection, GPS, ambulance dispatch

## 🔥 Advanced Features

- ✅ PACS simulation (structured file storage)
- ✅ WebSocket real-time updates
- ✅ Priority routing (emergency scans first)
- ✅ DICOM metadata simulation
- ✅ Fallback mock data when services are offline

## 📄 License

MIT License - Built for CareConnect Healthcare
