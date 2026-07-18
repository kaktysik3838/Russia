const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Отдаем твой красивый index.html
app.use(express.static(path.join(__dirname)));

// Переменная для хранения пользователя, который ищет пару
let waitingSocket = null;

io.on('connection', (socket) => {
    console.log(`[+] Подключился клиент: ${socket.id}`);

    // Клиент нажал "Найти собутыльника"
    socket.on('start-search', () => {
        // Если кто-то уже ищет пару, и это не тот же самый человек
        if (waitingSocket && waitingSocket.id !== socket.id) {
            const partner = waitingSocket;
            waitingSocket = null; // Очищаем комнату ожидания

            console.log(`[♥] Найдена пара: ${socket.id} и ${partner.id}`);

            // Сообщаем обоим, что пара найдена.
            // Текущий сокет будет инициатором (создает Offer)
            socket.emit('match-found', { partnerId: partner.id, initiator: true });
            partner.emit('match-found', { partnerId: socket.id, initiator: false });
        } else {
            // Если никого нет, ставим текущего в ожидание
            waitingSocket = socket;
            console.log(`[⏳] ${socket.id} ждет собутыльника...`);
        }
    });

    // Пересылка WebRTC сигналов (Offer, Answer, ICE) строго по ID собеседника
    socket.on('signal', (data) => {
        // data = { to: partnerId, signalData: { ... } }
        io.to(data.to).emit('signal', {
            from: socket.id,
            signalData: data.signalData
        });
    });

    socket.on('disconnect', () => {
        console.log(`[-] Отключился клиент: ${socket.id}`);
        // Если отключился тот, кто был в поиске — убираем его из очереди
        if (waitingSocket && waitingSocket.id === socket.id) {
            waitingSocket = null;
        }
        // В идеале тут можно добавить уведомление собеседнику, что партнер сбежал
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Сервер на Socket.IO запущен на порту ${PORT}`);
});
