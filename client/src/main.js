import Vue from 'vue';
import App from './App.vue';
import VueSocketIOExt from 'vue-socket.io-extended';
import io from 'socket.io-client';

const socket = io(process.env.NODE_ENV === 'production' 
  ? 'https://barangaypatrol.lgu1.com'  // Production WebSocket URL
  : 'http://localhost:5000',           // Development WebSocket URL
  {
    transports: ['websocket', 'polling'], // Ensure WebSocket and polling transports are used
    withCredentials: true, // Enable cookies and authorization headers
  }
);

Vue.use(VueSocketIOExt, socket);

new Vue({
  render: h => h(App),
}).$mount('#app');
