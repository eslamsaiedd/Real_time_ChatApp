// require('dotenv').config();
// const express = require('express');
// const app = express();
// const path = require('path');
// const http = require('http');
// const server = http.createServer(app);
// const { Server } = require('socket.io');
// const io = new Server(server);

// const Message = require('./models/messagemodel');
// const Room = require('./models/roomModel');
// const User = require('./models/userModel')

// const connectDB = require('./config/db');
// connectDB();

// const roomUsers = {}

// app.use(express.static(path.join(__dirname, 'front-end')));
// app.use(express.json());

// const userRoutes = require('./routes/userRoute');
// app.use('/api/user', userRoutes);

// // SOCKET.IO
// io.on('connection', (socket) => {
//   console.log('🟢 New user connected');

//   // when new user join
//   socket.on('join', async ({ userName, roomName, type }) => {

//      if (!roomName) {
//     console.log('❌ roomName is missing!');
//     return;
//   }
//     socket.userName = userName;
//     socket.roomName = roomName
//     socket.roomType = type || 'public';

    
//     if (!roomUsers[roomName]) {
//         roomUsers[roomName] = [];
//     } 

//     if (!roomUsers[roomName].includes(userName)) {
//       roomUsers[roomName].push(userName);
//     }

//     io.to(roomName).emit('updateUsersList', roomUsers[roomName])
//     socket.emit('updateUsersList', roomUsers[roomName]); 

//     let room = await Room.findOneAndUpdate(
//     { name: roomName },
//     { name: roomName, type: 'public' },
//     { upsert: true, new: true }
//     );

//     if (!room) {
//       room = new Room({ name: roomName, type: socket.roomType, createdAt: Date.now});
//       await room.save();
//       console.log(`🏠 Created new ${socket.roomType} room: ${roomName}`);
//     }

//     socket.join(room.name);
//     socket.currentRoom = room.name;

//     socket.to(room.name).emit('joinedUser', {userName, roomName: room.name, roomType: socket.roomType, status:'join'});

//     const oldMessages = await Message.find({ room: room._id }).sort({ time: 1 }).limit(20);
//     socket.emit('loadMessages', oldMessages);
//   });

//   // send message
//   socket.on('textMessage', async (msg) => {
//     try {
//       let room = await Room.findOne({ name: socket.currentRoom});
//       if (!room) {
//         room = new Room({ name: socket.currentRoom, type: socket.roomType });
//         await room.save();
//       }

//       const newMsg = new Message({
//         username: msg.username,
//         message: msg.message,
//         time: msg.time,
//         room: room._id,
//       });

//       await newMsg.save();

//       io.to(socket.currentRoom).emit('send-message-to-all-users', {
//         _id: newMsg._id,
//         username: msg.username,
//         message: msg.message,
//         time: msg.time,
//       });
//     } catch (err) {
//       console.error('Error saving message:', err);
//     }
//   });

//   //!switching rooms
//   socket.on('switch-room', async ({ username, newRoom, type }) => {
//     if (!newRoom) {
//     console.log('❌ switch is missing!');
//     return;
//     }    

//     const roomType = type || 'public';

//     const oldRoom = socket.currentRoom;
//     if (oldRoom) socket.leave(oldRoom);

//     socket.join(newRoom);
//     socket.currentRoom = newRoom;
//     socket.roomType = roomType;

//     let room = await Room.findOne({ name: newRoom, type: roomType });
//     if (!room) {
//       room = new Room({ name: newRoom, type: roomType });
//       await room.save();
//       console.log(`✅ Created ${roomType} room: ${newRoom}`);
//     }

//     const messages = await Message.find({ room: room._id }).sort({ time: 1 });
//     socket.emit('loadMessages', messages);

//     socket.to(oldRoom).emit('userLeft', `${username} left `);
//     socket.to(newRoom).emit('joinedUser', `${username} joined $}`);
//   });

//   // typing indicator
//   socket.on('typing', (user) => socket.to(user.room).emit('show-typing-status', user));
  
//   socket.on('stop-typing', (user) => socket.broadcast.emit('clear_typing_status', user));

//   // delete message
//   socket.on('delete-message', async (messageId) => {
//     try {
//       const msg = await Message.findById(messageId);
//       if (!msg) return;
//       if (msg.username !== socket.userName) return;

//       await Message.findByIdAndDelete(messageId);
//       io.emit('message-deleted', messageId);
//     } catch (error) {
//       console.error('Error deleting message:', error);
//     }
// });

// // disconnect
// socket.on('disconnect', () => {
//     const { userName, roomName } = socket;
    
//     if (roomUsers[roomName]) {
//         roomUsers[roomName] = roomUsers[roomName].filter(u => u !== userName);
//         io.to(roomName).emit('updateUsersList', roomUsers[roomName]);
//     }
//     io.to(socket.currentRoom).emit('userLeft', {userName: socket.userName, roomName: socket.currentRoom, roomType: socket.roomType, status:'left'});
//   });
// });

// app.get('/', (req, res) => {
//   res.json('Real chat app');
// });

// server.listen(process.env.PORT || 3000, () => {
//   console.log('listening on port 3000');
// });


require('dotenv').config();
const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const Message = require('./models/messagemodel');
const Room = require('./models/roomModel');
const User = require('./models/userModel');

const connectDB = require('./config/db');
connectDB();

const roomUsers = {};

app.use(express.static(path.join(__dirname, 'front-end')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/uploads', express.static('uploads'));


app.use(express.json());

const userRoutes = require('./routes/userRoute');
app.use('/api/user', userRoutes);

// ========================== SOCKET.IO ==========================
io.on('connection', (socket) => {
  console.log('🟢 New user connected');

  const token = socket.handshake.auth.token;

  if (!token) {
    console.log('❌ No token provided');
    socket.disconnect();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.jwt_secret_key);
    socket.user = decoded; // ✅ بنحفظ بيانات المستخدم هنا
  } catch (err) {
    console.log('❌ Invalid token');
    socket.disconnect();
  }

  socket.on('join', async ({ userName, roomName }) => {
    // if (!roomName) {
    //   console.log('❌ roomName is missing!');
    //   return;
    // }

    socket.userName = userName;
    socket.roomName = roomName;

    // تأكد إن الغرفة موجودة في الذاكرة
    if (!roomUsers[roomName]) {
      roomUsers[roomName] = [];
    }

    // أضف المستخدم للقائمة لو مش موجود
    if (!roomUsers[roomName].includes(userName)) {
      roomUsers[roomName].push(userName);
    }

    // حدث قائمة المستخدمين
    io.to(roomName).emit('updateUsersList', roomUsers[roomName]);
    socket.emit('updateUsersList', roomUsers[roomName]);

    // تأكد إن الغرفة موجودة في الداتابيز
    let room = await Room.findOneAndUpdate(
      { name: roomName },
      { name: roomName },
      { upsert: true, new: true }
    );

    socket.join(room.name);
    socket.currentRoom = room.name;

    // بلغ باقي المستخدمين إن حد جديد دخل
    socket.to(room.name).emit('joinedUser', { userName, roomName });

    // رجع آخر 20 رسالة
    const oldMessages = await Message.find({ room: room._id }).sort({ time: 1 }).limit(20);
    socket.emit('loadMessages', oldMessages);
  });

  // 🟨 إرسال رسالة
  socket.on('textMessage', async (msg) => {

    try {
      const room = await Room.findOne({ name: socket.currentRoom });
      if (!room) return; // review 

      const newMsg = new Message({
        userId: socket.user.id,
        username: msg.userName,
        message: msg.message,
        time: msg.time,
        room: room._id,
      });

      await newMsg.save();

      // console.log('socket.user'  ,socket.user);
      // console.log(newMsg);
      
      io.to(socket.currentRoom).emit('send-message-to-all-users', {
        _id: newMsg._id,
        userId: socket.user.id,
        username: msg.username,
        message: msg.message,
        time: msg.time,
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // switching between rooms 
  socket.on('switch-room', async ({ userName, newRoom }) => {
    
    if (!newRoom) {
      console.log('❌ newRoom is missing!');
      return;
    }

    const oldRoom = socket.currentRoom;
    if (oldRoom) socket.leave(oldRoom);

    socket.join(newRoom);
    socket.currentRoom = newRoom;

    let room = await Room.findOne({ name: newRoom });
    if (!room) {
      room = new Room({ name: newRoom });
      await room.save();
      console.log(`✅ Created room: ${newRoom}`);
    }

    const messages = await Message.find({ room: room._id}).sort({ time: 1 }).populate('userId', '_id username');

    
    socket.emit('loadMessages', messages.map(msg => ({
      _id: msg._id,
      username: msg.username,
      userId: msg.userId._id,  
      message: msg.message,
      time: msg.time,
    })));

    socket.to(oldRoom).emit('userLeft', `${userName} left`);
    socket.to(newRoom).emit('joinedUser', `${userName} joined`);
  });

  // 🟧 Typing indicator
  socket.on('typing', (user) =>
    socket.to(user.room).emit('show-typing-status', user)
  );

  socket.on('stop-typing', (user) =>
    socket.broadcast.emit('clear_typing_status', user)
  );

  console.log(socket.userName);
  
  // 🟥 حذف رسالة
  socket.on('delete-message', async (messageId) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      // console.log(msg.username, socket.userName);
      // console.log(messageId);
      if (msg.username !== socket.userName) return;

      await Message.findByIdAndDelete(messageId);
      io.emit('message-deleted', messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  });

  // 📴 عند فصل الاتصال
  socket.on('disconnect', () => {
    const { userName, roomName } = socket;

    if (roomUsers[roomName]) {
      roomUsers[roomName] = roomUsers[roomName].filter((u) => u !== userName);
      io.to(roomName).emit('updateUsersList', roomUsers[roomName]);
    }

    io.to(socket.currentRoom).emit('userLeft', {
      userName: socket.userName,
      roomName: socket.currentRoom,
      status: 'left',
    });
  });
});

// ========================== EXPRESS ==========================
app.get('/', (req, res) => {
  res.json('Real chat app');
});

server.listen(process.env.PORT || 3000, () => {
  console.log('listening on port 3000');
});
