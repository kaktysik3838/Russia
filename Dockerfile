FROM node:20-alpine
WORKDIR /app
# Быстрая установка нужных серверу библиотек прямо при сборке
RUN npm install express ws
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
