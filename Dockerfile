FROM node:20-slim

WORKDIR /app

# Install dependencies for both frontend and backend
COPY package*.json ./
COPY backend/package*.json ./backend/

RUN npm ci --legacy-peer-deps
RUN npm --prefix backend ci

# Copy full application code
COPY . .

# Build frontend web export into dist/
RUN npm run build

# Build backend TypeScript into backend/dist/
RUN npm --prefix backend run build

# Set production environment
ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# Start unified AttendIQ Server (Serves API, WebSockets & Web App)
CMD ["node", "backend/dist/server.js"]
