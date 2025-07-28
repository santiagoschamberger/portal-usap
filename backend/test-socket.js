const { io } = require('socket.io-client');

async function testSocketIO() {
  console.log('🔌 Testing Socket.IO Connection...\n');
  
  return new Promise((resolve) => {
    const socket = io('http://localhost:5001', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected with ID:', socket.id);
      
      // Test sending a message
      socket.emit('test-message', { data: 'Hello from test client' });
      
      // Close connection after 2 seconds
      setTimeout(() => {
        socket.disconnect();
        console.log('✅ Socket.IO disconnected successfully');
        console.log('🎉 Socket.IO test completed!');
        resolve();
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      resolve();
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });
  });
}

testSocketIO().then(() => process.exit(0));