const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Раздаем наш index.html
app.use(express.static(path.join(__dirname)));

let waitingPeer = null;

wss.on('connection', (ws) => {
    console.log('Кто-то подключился');

    // Очень простая логика рулетки: соединяем двоих
    if (!waitingPeer) {
        waitingPeer = ws;
        ws.send(JSON.stringify({ type: 'status', message: 'Ожидаем собеседника...' }));
    } else {
        // Связываем их друг с другом
        ws.peer = waitingPeer;
        waitingPeer.peer = ws;
        
        // Говорим первому создавать звонок (Offer)
        waitingPeer.send(JSON.stringify({ type: 'initiate' }));
        ws.send(JSON.stringify({ type: 'status', message: 'Собеседник найден! Соединяем...' }));
        
        waitingPeer = null;
    }

    // Пересылаем сообщения (сигналы WebRTC) напрямую между собеседниками
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (ws.peer && ws.peer.readyState === WebSocket.OPEN) {
            ws.peer.send(JSON.stringify(data));
        }
    });

    ws.on('close', () => {
        console.log('Кто-то отключился');
        if (waitingPeer === ws) waitingPeer = null;
        if (ws.peer) {
            ws.peer.send(JSON.stringify({ type: 'status', message: 'Собеседник отключился.' }));
            ws.peer.peer = null;
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
