# AttendIQ - Smart Classroom Attendance System

**Guru Ghasidas Vishwavidyalaya (GGU), Bilaspur**  
Smart campus attendance system featuring live teacher broadcasting, ultrasonic / GPS geofencing verification, student & faculty schedule hubs, and headcount discrepancy auditing.

---

## 🚀 Quick Start (Expo Go & Web)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Expo Go app](https://expo.dev/go) on your Android or iOS device (free on Google Play / App Store)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npx expo start
```

### 3. Open the App
- **On Android / iPhone:** Open the **Expo Go** app and scan the QR code displayed in the terminal.
- **In Web Browser:** Press `w` in the terminal (or open `http://localhost:8081`).
- **Over different networks (hotspot/cellular):** Run `npx expo start --tunnel`.

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
