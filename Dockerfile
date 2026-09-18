FROM node:20-slim
WORKDIR /app
COPY backend/package*.json ./backend/
RUN cd backend && npm install
COPY backend/ ./backend/
CMD ["node", "backend/index.js"]
