import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/socketHandler.js';
import authRoutes from './routes/authRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

import path from 'path';
import fs from 'fs';

dotenv.config();
if (fs.existsSync(path.resolve(process.cwd(), 'backend/.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env'), override: true });
}

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Initialize Socket.io
initSocket(server, CORS_ORIGIN);

// Middlewares
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'AttendIQ Smart Campus Backend',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/schedule', scheduleRoutes);

const candidatePaths = [
  path.resolve(process.cwd(), '../dist'),
  path.resolve(process.cwd(), 'dist'),
];
const distPath = candidatePaths.find((p) => fs.existsSync(path.join(p, 'index.html'))) || candidatePaths[0];

// Serve static frontend build if index.html exists in distPath
if (fs.existsSync(path.join(distPath, 'index.html'))) {
  console.log(`📦 [Frontend] Serving static web app from ${distPath}`);
  app.use(express.static(distPath, { index: false }));
}

// Global Error Handler
app.use(errorHandler);

// SPA fallback: send index.html with focus outline reset for all non-API web page requests
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io') || req.path === '/health') {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    const resetStyles = `
    <style id="focus-outline-reset">
      * {
        -webkit-tap-highlight-color: transparent !important;
      }
      input, textarea, select, button, div, [tabindex] {
        outline: none !important;
        outline-width: 0 !important;
        box-shadow: none !important;
      }
      input:focus, textarea:focus, select:focus, button:focus, *:focus, *:focus-visible {
        outline: none !important;
        outline-width: 0 !important;
        box-shadow: none !important;
      }
    </style>
    </head>`;
    html = html.replace('</head>', resetStyles);
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(html);
  } else {
    res.status(404).send('AttendIQ App is ready. Frontend static build not found.');
  }
});

// Connect to MongoDB and Start Server
import os from 'os';

connectDB().then(() => {
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 [AttendIQ Backend] Server running locally on http://localhost:${PORT}`);
    
    const interfaces = os.networkInterfaces();
    const networkIps: string[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          networkIps.push(iface.address);
          console.log(`📱 [AttendIQ Phone Access] http://${iface.address}:${PORT} (${name})`);
        }
      }
    }
    console.log(`📡 [Socket.io] Ready for real-time live attendance broadcasting`);
  });
});
