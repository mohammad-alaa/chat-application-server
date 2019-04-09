const ChatServer = require('./tcp-server-class');

let chatServer = new ChatServer(3001, '0.0.0.0');

chatServer.runServer();