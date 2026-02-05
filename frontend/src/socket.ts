// import { io } from 'socket.io-client';

// const URL = 'http://localhost:3000';

// export const socket = io(URL, {
//   autoConnect: false,
// });

import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

console.log('🔌 Connecting to:', BACKEND_URL); // ✅ Debug

export const socket = io(BACKEND_URL, {
  autoConnect: false,
});