const fs = require('fs');
const net = require('net');
const path = require('path');
const NoName = require('./no-Name');
const MsgHandler = require('./msg-handler-class');
const save = require('./message-saver').save;
const saveOffLine = require('./message-saver').saveOffLine;

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
    
    //create tcp server and link between events and functions
    runServer(){
        this.netServer = net.createServer();
        
        this.netServer.on('connection', (socket) => { this.connectionHandler(socket); });
        this.netServer.on('error', (err) => { this.errorHandler(err); });
        this.netServer.on('close', () => { this.serverCloseHandler(); });
        this.netServer.on('add new socket', (socket) => { this.addNewSocket(socket); });
        this.netServer.on('message', (msg, info) => { this.send(msg, info); });
        
        
        
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
        this.loadOffLineMsgs(socket);
    }

   /**
    * 
    * @param {Buffer} msg 
    * @param {any} info 
    *  
    */
    send(msg, info){
        let receiverSocket = this.getSocket(info.receiverName);

        if(receiverSocket === null){
            saveOffLine(msg, info);
            //console.log('- receiver is offline .... the message dropped.');
            return false;
        }
        
        let msgLen = Buffer.alloc(4);
        if(info.type === 'BinaryFile' || info.type === 'Image' || info.type === 'Audio' ){

            let binInfo = {
                type: info.type,
                extension: info.ext,
                sender: info.senderName,
                sendDate: info.sendDate 

            };
            let binInfoBuff = Buffer.from(JSON.stringify(binInfo));
            let binInfoBuffLen = Buffer.alloc(4);
           
            binInfoBuffLen.writeUInt32LE(binInfoBuff.length);
            msgLen.writeUInt32LE(msg.length);

            this._send(binInfoBuffLen, binInfoBuff, receiverSocket)
            .then((res) => {
                this._send(msgLen, msg, receiverSocket);
            });

            console.log(`- message (binary) sent from ${info.senderName} to ${info.receiverName}.`);
            // TODO: remove save from here
            //save({ext: info.ext, file: msg}, true, info.senderName, info.receiverName)

        }
        else{ 
            let __msg = {
                type: info.type,
                message: msg.toString(),
                sender: info.senderName,
                sendDate: info.sendDate 
                
            };

            let _msg = Buffer.from(JSON.stringify(__msg));
            msgLen.writeUInt32LE(_msg.length);
            this._send(msgLen, _msg, receiverSocket);            
            console.log(`- message (text) sent from ${info.senderName} to ${info.receiverName}.`);
            // TODO: remove save from here
            //save(msg.toString(), false, info.senderName, info.receiverName);
        }
    }

    /**
     * 
     * @param {Buffer} msgLen 
     * @param {Buffer} msg 
     * @param {net.Socket} socket 
     * 
     * @returns {Promise}
     */
    _send(msgLen, msg, socket){
        return new Promise ((resolve, reject) => {
            socket.write(msgLen, (err) => {
                if(err){
                    this.errorHandler(err);
                    reject(err);
                  
                }
                else{
                    socket.write(msg, (err) => {
                        if(err) {
                            this.errorHandler(err);
                            reject(err);
                        }
                        else{
                            resolve(true);
                        }
                    });
                }
            });
        });
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


    
    /**
     * 
     * @param {net.Socket} socket 
     */
    loadOffLineMsgs(socket){
        let _path = `./storage/${socket.username}`;
        fs.promises.readdir(_path)
        .then((files) => {
            files = files.filter(file => path.extname(file).toLowerCase() === '.info');
            for(let i = 0; i< files.length; i++) files[i] = path.basename(files[i], '.info');
            
            for(let i=0; i<files.length; i++){
                let msgInfo;
                fs.promises.readFile(`${_path}/${files[i]}.info`)
                .then((info) => {
                    msgInfo = info;
                    return fs.promises.readFile(`${_path}/${files[i]}.bin`);
                })
                .then((msg) => { // all is array [info, msg]
                    this.send(msg, JSON.parse(msgInfo));
                    fs.promises.unlink(`${_path}/${files[i]}.info`);
                    fs.promises.unlink(`${_path}/${files[i]}.bin`);
                })
                .catch((err) => { this.errorHandler(err) });
            }
        })
        .catch((err) => { console.log("- no offline messages for this client"); });
    }
};


module.exports = ChatServer;
