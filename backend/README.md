# AttendIQ Backend API & Real-time Server

**Tech Stack:** Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.io, JWT, bcryptjs

---

## 🚀 Quick Setup & Run

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment (`.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/attendiq
JWT_SECRET=ggu_attendiq_jwt_secret_token_secure_key_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```
*(If you are using MongoDB Atlas in the cloud, simply paste your cloud connection string into `MONGODB_URI`)*

### 3. Seed Demo Data (Optional)
```bash
npm run seed
```
Creates demo teacher (`FAC-CS-8924` / `password123`) and demo student (`GGV/22/0892` / `password123`).

### 4. Start Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000`.

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/register/student` | Register student account |
| `POST` | `/api/auth/register/teacher` | Register teacher account |
| `POST` | `/api/auth/login` | Login with ID / Email and password |
| `GET` | `/api/auth/me` | Fetch logged-in user details (Bearer Token) |

### 🎙️ Broadcast Sessions (`/api/sessions`)
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/sessions/start` | Teacher starts 2-digit PIN broadcast |
| `GET` | `/api/sessions/active` | Get active session for classroom / course |
| `POST` | `/api/sessions/end/:id` | Teacher stops broadcast session |
| `PATCH` | `/api/sessions/headcount/:id`| Update physical headcount and audit discrepancy |

### 📝 Attendance (`/api/attendance`)
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/attendance/mark` | Student submits PIN & GPS coordinates |
| `GET` | `/api/attendance/session/:sessionId` | Real-time attendee roster for a session |
| `GET` | `/api/attendance/reports` | Filter roster by dept, category, search query |
| `PATCH` | `/api/attendance/toggle/:id` | Teacher manually toggles present / absent |
| `GET` | `/api/attendance/export/csv` | Download official attendance CSV |

### 📅 Timetable / Schedules (`/api/schedule`)
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/schedule/teacher/:facultyId` | Daily routine for faculty |
| `GET` | `/api/schedule/student/:enrollmentNo` | Daily timetable for student |
| `POST` | `/api/schedule/sync` | Batch sync uploaded timetable entries |

---

## ⚡ Real-Time Socket.io Events
- `session:started` — Emitted when teacher starts a broadcast.
- `session:ended` — Emitted when broadcast expires or is stopped.
- `attendance:student_joined` — Emitted in real-time when student submits matching PIN.
- `session:headcount_updated` — Emitted when teacher updates manual headcount audit.
