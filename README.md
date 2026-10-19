# AttendIQ - Smart Classroom Attendance System

**Guru Ghasidas Vishwavidyalaya (GGU), Bilaspur**  
Smart campus attendance system featuring live teacher broadcasting, ultrasonic / GPS geofencing verification, student & faculty schedule hubs, and headcount discrepancy auditing.

---

## 🌐 Single-Port Local Hosting (PC Chrome + Phone on Same Wi-Fi)

Run the **entire application** (React Native Web frontend + Express REST API + WebSocket + In-Memory MongoDB) on a **single port (5000)**:

### 1-Command Startup:
```bash
npm run serve
```
> *(This command builds the static web bundle and starts the unified server on port `5000`)*.

### Accessing the App:
- **On PC (Chrome / Edge / Firefox):**
  Open [http://localhost:5000](http://localhost:5000)
- **On Phone (connected to the same Wi-Fi network):**
  Open the LAN IP displayed in your terminal, for example:
  `http://<YOUR_PC_IP>:5000` (e.g. `http://10.151.17.118:5000`)
- **Demo Logins Pre-Configured:**
  - **Teacher:** `FAC-CS-8924` / Password: `password123`
  - **Student:** `GGV/22/0892` / Password: `password123`

---

## 🚀 Alternative: Development Mode (Expo Go & Metro Bundler)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Expo Go app](https://expo.dev/go) on your Android or iOS device

### 1. Install Dependencies
```bash
npm install
npm --prefix backend install
```

### 2. Start Backend
```bash
npm run backend:dev
```

### 3. Start Expo Dev Bundler
```bash
npm start
```

---

## 📱 Features & Screens

1. **Role Selection:** Split-screen interface for Teacher (Warm Orange) and Student (Deep Teal) with gesture controls.
2. **Authentication:** Role-based Login and Register with GGU department picker modal.
3. **ID Verification:** Institutional Smart Card verification.
4. **Faculty Schedule Hub:** Daily teaching routine, room assignments, active teaching slots, and 1-tap "Start Attendance".
5. **Student Academic Hub:** Live attendance alert banner, daily timetable, attendance tracking percentages, and NEP 2020 course breakdown.
6. **Teacher Live Broadcast:** 2-digit PIN generation, countdown timer, live attendance progress bar, recent joins feed, and physical headcount audit.
7. **Student Attendance:** GGU campus GPS geofence validation, 2-digit PIN entry with keypad, and slide-to-confirm button.
8. **Attendance Reports:** Filterable roster (CSIT, CSE, IT, ECE), attendance toggle, discrepancy detection, and CSV export.
9. **Quick Screen Switcher:** Floating developer tool at the bottom-right to jump directly to any of the 10 screens.

---

## 🛠️ Project Structure

```text
├── App.tsx                     # Main App Entry & Screen Navigator
├── app.json                    # Expo Configuration
├── index.ts                    # Expo Root Entrypoint
├── package.json                # Dependencies & Scripts
├── tsconfig.json               # TypeScript Configuration
└── src/
    ├── components/             # Reusable UI components (Keypad, SlideToConfirm, Picker, TopBar, Modals)
    ├── context/                # AttendanceContext state management & business logic
    ├── data/                   # Types, models, and GGU University department data
    ├── screens/                # All 10 application screens
    └── theme/                  # Brand colors & design tokens
```

---

## 👥 Team Collaboration (Git Workflow)

1. Check out the active branch:
   ```bash
   git checkout babua
   ```
2. Pull latest updates:
   ```bash
   git pull origin babua
   ```
3. Push your work:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin babua
   ```
