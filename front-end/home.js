
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// get personal info
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const payload = JSON.parse(atob(token.split(".")[1]));
  localStorage.setItem('userId', payload.id)
  
  const currentTime = Date.now() / 1000;

  if (payload.exp < currentTime) {
    localStorage.removeItem("token"); 
    window.location.href = "index.html"; 
    return;
  }

  const userRes = await fetch('http://localhost:3000/api/user/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });

  
  const userData = await userRes.json();

  
  if (userData && userData.data && userData.data.username) {
    localStorage.setItem('username', userData.data.username);
  } else {
    console.error("User data not found!");
    window.location.href = "index.html"; 
  }
});
const userName = localStorage.getItem('username')
const roomName = localStorage.getItem('room')


const chat = document.getElementById('chat');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const roomList = document.getElementById('roomList');
const groupname = document.querySelector('.roomName')
let currentRoom = "general";
groupname.textContent = currentRoom

// join افتراضي للروم العامة
socket.emit('join', { userName, roomName});

// switching rooms
roomList.addEventListener('click', (e) => {
  if (e.target.classList.contains('room')) {
    document.querySelectorAll('.room').forEach(r => r.classList.remove('active-room'));
    e.target.classList.add('active-room');

    const newRoom = e.target.getAttribute('data-room');
    const roomType = e.target.getAttribute('data-type') || 'public';

    socket.emit('switch-room', { userName, newRoom, type: roomType });
    currentRoom = newRoom;
    groupname.textContent = currentRoom
    chat.innerHTML = '';
  }
});



// server events
socket.on('joinedUser', (data) => showUserStatus(data));
socket.on('userLeft', (msg) => showUserStatus(msg));
socket.on('loadMessages', (messages) => messages.forEach(msg =>
  displayMessage(msg.username, msg.message, msg.time, msg._id, msg.userId)));



const typingIndicator = document.createElement('div');
typingIndicator.id = 'typingIndicator';
typingIndicator.classList.add('typing-indicator');
chat.appendChild(typingIndicator);


input.addEventListener('keydown', () => socket.emit('typing', { userName, room: currentRoom }));
input.addEventListener('keyup', () => socket.emit('stop-typing', { userName, room: currentRoom }));

socket.on('show-typing-status', (user) => {
  typingIndicator.innerHTML = `${user.username} is typing...`;
  typingIndicator.style.display = 'block';
});
socket.on('clear_typing_status', () => {
  setTimeout(() => {
    typingIndicator.innerHTML = '';
    typingIndicator.style.display = 'none';
  }, 3000);
});


sendBtn.addEventListener('click', () => {
  const message = input.value.trim();
  if (message) {
    socket.emit('textMessage', { userName, message, time: new Date().getTime(), });
    input.value = "";
  }
});

socket.on('send-message-to-all-users', (data) => displayMessage(data.username, data.message, data.time, data._id, data.userId));

socket.on('message-deleted', (messageId) => {
  const msgElement = document.querySelector(`[data-id="${messageId}"]`);
  if (msgElement) msgElement.remove();
});


function displayMessage(sender, message, timestamp, msgId, userId) {

  const messageContainer = document.createElement('div');
  const msgDiv = document.createElement('div');
  const msgText = document.createElement('div');
  const timeDiv = document.createElement('div');

  messageContainer.classList.add('messageContainer');
  const isMyMsg = userId === localStorage.getItem('userId');

  msgDiv.classList.add(isMyMsg ? 'myMessage' : 'otherMessage');
  msgDiv.setAttribute('data-username', sender);
  if (msgId) messageContainer.setAttribute('data-id', msgId);

  if (isMyMsg) {
    messageContainer.classList.add('own');
    const deleteIcon = document.createElement('span');
    deleteIcon.classList.add('material-symbols-outlined', 'delete', 'deleteIconLeftSide');
    deleteIcon.textContent = 'delete';
    messageContainer.appendChild(deleteIcon);

    deleteIcon.addEventListener('click', () => {
      const messageId = messageContainer.getAttribute('data-id');
      socket.emit('delete-message', messageId);
    });
  }

  msgText.textContent = message;
  msgText.classList.add('textContent');

  let date = new Date(timestamp);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const amPm = hours >= 12 ? 'Pm' : 'Am';
  hours = hours % 12;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  timeDiv.textContent = `${hours}:${minutes} ${amPm}`;
  timeDiv.classList.add('timeStyle');

  if (!isMyMsg) {
    const userName = document.createElement('div');
    userName.classList.add('userNameStyle');
    userName.textContent = sender;
    msgDiv.appendChild(userName);
  }

  msgDiv.appendChild(msgText);
  msgDiv.appendChild(timeDiv);
  messageContainer.appendChild(msgDiv);

  if (chat.contains(typingIndicator)) chat.insertBefore(messageContainer, typingIndicator);
  else chat.appendChild(messageContainer);
  chat.scrollTop = chat.scrollHeight;
}

function showUserStatus(msg) {
  const userStatus = document.createElement('div');
  userStatus.classList.add('userStatus');
  userStatus.textContent = msg;
  if (chat.contains(typingIndicator)) {
    chat.insertBefore(userStatus, typingIndicator);
  } else {
    chat.appendChild(userStatus);
  }
}

const profile = document.querySelector('.profile').addEventListener('click', () => {
  window.location.href = './profile.html'
}) 

// home.js

// const socket = io('http://localhost:3000');

// const token = localStorage.getItem('token');
// const roomName = localStorage.getItem('room');

// // DOM Elements
// const roomsContainer = document.getElementById('roomsContainer'); // حط الـ div اللي هيعرض فيه الـ rooms
// const messagesContainer = document.getElementById('messagesContainer'); // حط الـ div اللي هيعرض فيه الرسائل
// const messageForm = document.getElementById('messageForm');
// const messageInput = document.getElementById('messageInput');

// // Fade-in animation helper
// function fadeIn(element) {
//   element.style.opacity = 0;
//   element.style.display = 'block';
//   let op = 0;
//   const timer = setInterval(() => {
//     if (op >= 1) clearInterval(timer);
//     element.style.opacity = op;
//     op += 0.05;
//   }, 15);
// }

// // Load user profile
// async function loadUserProfile() {
//   try {
//     const res = await fetch('http://localhost:3000/api/user/profile', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     const data = await res.json();
//     if (data.success) {
//       console.log('User loaded:', data.data);
//     } else {
//       console.error('Failed to load user');
//     }
//   } catch (err) {
//     console.error(err);
//   }
// }

// // Join room
// function joinRoom(room) {
//   socket.emit('joinRoom', room);
//   localStorage.setItem('room', room);
//   messagesContainer.innerHTML = ''; // نظف الرسائل القديمة
//   fadeIn(messagesContainer); // تأثير fade-in
// }

// // Send message
// messageForm.addEventListener('submit', e => {
//   e.preventDefault();
//   const msg = messageInput.value.trim();
//   if (!msg) return;
//   socket.emit('chatMessage', { room: roomName, message: msg });
//   messageInput.value = '';
//   messageInput.focus();
// });

// // Receive messages
// socket.on('message', data => {
//   const div = document.createElement('div');
//   div.classList.add('message');
//   div.innerHTML = `<strong>${data.user}</strong>: ${data.text}`;
//   messagesContainer.appendChild(div);
//   messagesContainer.scrollTop = messagesContainer.scrollHeight;
// });

// // Load rooms list
// async function loadRooms() {
//   try {
//     const res = await fetch('http://localhost:3000/api/rooms', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     const data = await res.json();
//     if (data.success) {
//       roomsContainer.innerHTML = '';
//       data.rooms.forEach(room => {
//         const div = document.createElement('div');
//         div.classList.add('room');
//         div.textContent = room.name;
//         div.addEventListener('click', () => joinRoom(room.name));
//         roomsContainer.appendChild(div);
//       });
//       fadeIn(roomsContainer); // تأثير fade-in للـ rooms
//     }
//   } catch (err) {
//     console.error(err);
//   }
// }

// // Initialize
// document.addEventListener('DOMContentLoaded', () => {
//   loadUserProfile();
//   loadRooms();
// });
