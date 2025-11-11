const socket = io('http://localhost:3000');
const username = sessionStorage.getItem('username');
const roomname = sessionStorage.getItem('room');
document.querySelector('.group_name').textContent = `${roomname}`

if(!username) window.location.href = 'index.html';

const chat = document.getElementById('chat');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');

// const users = []

socket.on('joinedUser', (data) =>{
    // joinedUsers(data.userName)
    showUserStatus(data.userName, data.roomName, data.roomType, data.status)
})
socket.on('userLeft', (data) => {
    showUserStatus(data.userName, data.roomName, data.roomType, data.status)
})
socket.on('loadMessages', (messages) => messages.forEach(msg => displayMessage(msg.username, msg.message, msg.time, msg._id)));


socket.emit('join', { userName: username, roomName: roomname,  type: 'private'});

function displayMessage(sender, message, timestamp, msgId) {
  const container = document.createElement('div');
  container.classList.add('messageContainer');
  const isMyMsg = sender === username;
  if(isMyMsg) container.classList.add('own');

  const msgDiv = document.createElement('div');
  msgDiv.classList.add(isMyMsg ? 'myMessage' : 'otherMessage');

  // Name for other messages
  if(!isMyMsg){
    const nameDiv = document.createElement('div');
    nameDiv.classList.add('userNameStyle');
    nameDiv.textContent = sender;
    msgDiv.appendChild(nameDiv);
  }

  const textDiv = document.createElement('div');
  textDiv.textContent = message;
  msgDiv.appendChild(textDiv);

  const timeDiv = document.createElement('div');
  timeDiv.classList.add('timeStyle');
  let date = new Date(timestamp);
  let h = date.getHours();
  let m = date.getMinutes();
  h = h % 12 || 12;
  m = m < 10 ? '0'+m : m;
  timeDiv.textContent = `${h}:${m}`;
  msgDiv.appendChild(timeDiv);

  container.appendChild(msgDiv);

  // Delete icon for own messages
  if(isMyMsg){
    const del = document.createElement('span');
    del.classList.add('material-symbols-outlined','deleteIconLeftSide');
    del.textContent = 'delete';
    del.addEventListener('click', ()=>{
      container.remove();
      if(msgId) socket.emit('delete-message', msgId);
    });
    container.appendChild(del);
  }

  chat.appendChild(container);
  chat.scrollTop = chat.scrollHeight;
}

function sendMessage(){
  const msg = input.value.trim();
  if(!msg) return;
  const time = new Date().getTime();
  socket.emit('textMessage',{username,message: msg,time});
  input.value = '';
}
sendBtn.addEventListener('click', sendMessage);

input.addEventListener('keydown',(e)=>{
  if(e.key==='Enter'){ e.preventDefault(); sendMessage(); }
  else socket.emit('typing',{username, room: roomname});
});

input.addEventListener('keyup',()=>{
     setTimeout(()=>{
        typingIndicator.style.display= 'none';
    }, 3000) 
});

socket.on('send-message-to-all-users',(data)=>{
  displayMessage(data.username, data.message, data.time, data._id);
});

socket.on('show-typing-status',(user)=>{
    // if (user.roomname) {
        typingIndicator.style.display='block';
        typingIndicator.textContent = `${user.username} is typing...`;
    // }
});

socket.on('clear_typing_status',()=>{ typingIndicator.style.display='none'; });

function showUserStatus(userName, room, type, status) {
  const userStatus = document.createElement('div');
  userStatus.classList.add('userStatus');
  if (status == 'join') {
      userStatus.textContent = `${userName} joined ${room} (${type})`;
  }else {
      userStatus.textContent = `${userName} left this chat`;
  }
if (chat.contains(typingIndicator)) {
    chat.insertBefore(userStatus, typingIndicator);
  } else {
    chat.appendChild(userStatus); // fallback
  }}

socket.on('updateUsersList', (users) => {
  const users_joined = document.querySelector('.joined_users');
  users_joined.textContent = users.join(', ')
//   console.log(users);
  
});