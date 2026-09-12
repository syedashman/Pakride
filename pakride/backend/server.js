require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const userRoutes = require('./routes/users');
const matchRoutes = require('./routes/match');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/users', userRoutes);
app.use('/api/match', matchRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'PakRide API is running!', version: '1.0.0' });
});

const userSockets = {};
const chatRooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register_user', (userId) => {
    userSockets[userId] = socket.id;
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('send_message', (data) => {
    const { rideId, senderId, receiverId, senderName, text } = data;
    const roomKey = `ride_${rideId}`;
    if (!chatRooms[roomKey]) chatRooms[roomKey] = [];
    const msg = {
      id: Date.now(),
      rideId,
      senderId,
      senderName,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    chatRooms[roomKey].push(msg);
    socket.emit('message_received', msg);
    const receiverSocket = userSockets[receiverId];
    if (receiverSocket) {
      io.to(receiverSocket).emit('message_received', msg);
      io.to(receiverSocket).emit('new_notification', {
        type: 'message',
        title: `New message from ${senderName}`,
        body: text,
        rideId
      });
    }
  });

  socket.on('get_messages', (rideId) => {
    const roomKey = `ride_${rideId}`;
    socket.emit('chat_history', chatRooms[roomKey] || []);
  });

  socket.on('ride_booked', (data) => {
    const { driverId, riderName, rideId, pickup, drop } = data;
    const driverSocket = userSockets[driverId];
    if (driverSocket) {
      io.to(driverSocket).emit('new_notification', {
        type: 'booking',
        title: '🎉 Ride Book Ho Gayi!',
        body: `${riderName} ne aapki ride book ki — ${pickup} se ${drop} tak`,
        rideId
      });
    }
  });

  socket.on('disconnect', () => {
    for (const userId in userSockets) {
      if (userSockets[userId] === socket.id) {
        delete userSockets[userId];
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io);
app.set('userSockets', userSockets);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`PakRide server running on http://localhost:${PORT}`);
});