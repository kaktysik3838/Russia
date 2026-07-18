FROM node:20-alpine
WORKDIR /app

# Устанавливаем Express и Socket.IO
RUN npm install express socket.io

COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
