import socket from 'socket.io-client';

export default socket(`${window.location.protocol}//${window.location.hostname}:8080`);