const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, turbopack: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // You can join rooms based on user role or agent ID
        socket.on('join-room', (userId, role) => {
            if (role === 'agent') {
                socket.join(`agent-${userId}`);
            } else if (role === 'admin') {
                socket.join('admin');
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    // Make io accessible to API routes (store as global)
    global.io = io;

    server.listen(3000, (err) => {
        if (err) throw err;
        console.log('> Ready on http://localhost:3000');
    });
});