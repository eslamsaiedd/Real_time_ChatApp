const socket = io('http://localhost:3000');
const form = document.getElementById('joinHiddenForm');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const roomName = document.getElementById('roomName').value.trim();
    const password = document.getElementById('roomPassword').value.trim();
    const userId = localStorage.getItem('userId')
    const username = localStorage.getItem('username')

    if (!roomName || !password) {
    alert('Please fill in all fields!');
    return;
    }

    socket.emit('joinHiddenRoom', { roomName, password, userId, username});
});

socket.on('previousMessages', (messages) => messages.forEach(msg => {
    console.log(msg);
    
}))