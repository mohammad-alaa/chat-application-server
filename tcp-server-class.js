const net = require('net');
const NoName = require('./no-Name');
const MsgHandler = require('./msg-handler-class');
const save = require('./message-saver').save;

class ChatServer{

    /**
     * 
     * @param {Number} port 
     * @param {String} host 
     */
    constructor(port, host){
        this.port = port;
        this.host = host;
        this.sockets = [];
        this.netServer = null;
    }

    runServer(){
        this.netServer = net.createServer();
        
        this.netServer.on('connection', (socket) => { this.connectionHandler(socket); });
        this.netServer.on('error', (err) => { this.errorHandler(err); });
        this.netServer.on('close', () => { this.serverCloseHandler(); });
        this.netServer.on('add new socket', (socket) => { this.addNewSocket(socket); });
        this.netServer.on('message', (msg, receiverName, senderName, media, ext) => { this.send(msg, receiverName, senderName, media, ext); });
        
        
        
        this.netServer.listen(this.port, this.host, () => {
            console.log('- server listen on port:', this.port);
        });
    }

    /**
     * 
     * @param {net.Socket} socket 
     */
    connectionHandler(socket){
        console.log('- new socket connected.');


        this.setupSocket(socket);

        let noName = new NoName(socket);
        noName.init();

        socket.on('message', (msg) => {

            let handler = new MsgHandler(this.netServer);
            handler.handle(socket, msg);
        });

        socket.on('error', (err) => {
            this.errorHandler(err);
        });

        socket.on('close', (had_error) => {
            this.socketCloseHandler(had_error);
        });
    }

    /**
     * 
     * @param {Error} err 
     */
    errorHandler(err){
        console.log('- ERROR:', err.message);
        console.log('- ERROR Stack:');
        console.log(err.stack);
    }

    serverCloseHandler(){
        console.log('- Server Close');
    }

    /**
     * 
     * @param {net.Socket} socket 
     */
    setupSocket(socket){
        socket.auth = false;
        socket.username = null;
        socket.binaryFile = null;
    }

    /**
     * 
     * @param {Boolean} had_error 
     */
    socketCloseHandler(had_error){
        console.log('- socket closed, had_error =', had_error);
        this.sockets = this.sockets.filter(socket => socket.destroyed === false);
    }

    /**
     * 
     * @param {net.Socket} socket 
     */
    addNewSocket(socket){
        console.log('- new socket added ...........', socket.username);
        this.sockets.push(socket);
    }

   /**
    * 
    * @param {Buffer} msg 
    * @param {String} receiverName 
    * @param {String} senderName 
    * @param {Boolean} media 
    * @param {String} ext 
    */
    send(msg, receiverName, senderName, media, ext){
        let receiverSocket = this.getSocket(receiverName);

        if(receiverSocket === null){
            console.log('- receiver is offline .... the message dropped.');
            return;
        }
        let msgLen = Buffer.alloc(4);
        //msgLen.writeUInt32LE(msg.length);
        
        if(media){
            save({ext: ext, file: msg}, media, senderName, receiverName)
            
            msgLen.writeUInt32LE(msg.length);

            receiverSocket.write(msgLen);
            receiverSocket.write(msg);
            console.log(`- message (binary) sent from server to ${receiverName}.`);



        }
        else{
            save(msg.toString(), media, senderName, receiverName);
            let __msg = {
                type: 'Text',
                message: msg.toString(),
                sender: senderName
            };

           
            let _msg = Buffer.from(JSON.stringify(__msg));

            msgLen.writeUInt32LE(_msg.length);


            receiverSocket.write(msgLen);
            receiverSocket.write(_msg);
            console.log(`- message (text) sent from server to ${receiverName}.`);

        }

    }

    /**
     * 
     * @param {String} username 
     * 
     * @returns {net.Socket};
     */
    getSocket(username){
        let socket = this.sockets.filter( socket => socket.username === username )[0];
        
        return socket === undefined ? null : socket;
    } 
};


module.exports = ChatServer;
