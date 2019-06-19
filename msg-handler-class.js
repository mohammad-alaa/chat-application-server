const fs = require('fs');
const net = require('net');
const jwt = require('jsonwebtoken');
const save = require('./message-saver').save;


class MsgHandler{

    /**
     * 
     * @param {net.Server} server 
     */
    constructor(server, blockedUsers){
        this.server = server;
        this.blockedUsers = blockedUsers;
    }

    /**
     * 
     * @param {net.Socket} socket 
     * @param {Buffer | String} msg 
     */
    handle(socket, msg){
        if(socket.auth){ // client authenticated and the msg will be processed.
            // case 1: binary msg
            if(socket.binaryFile !== null){
                this.binaryMsgHandler(socket, msg);
                socket.binaryFile = null;
            }

            // case 2: json msg
            else{    
                let jsonMsg = this.parseMsg(socket, msg);
                if(jsonMsg === null) return;
                // validate msg ..
                this.jsonMsgHandler(socket, jsonMsg)
            }
        }
        else{ // client not authenticated...
            
            let jsonMsg = this.parseMsg(socket, msg);
            if(jsonMsg === null) return;
            // validate msg ...
            
            // case 1: authentication msg -> authenticate the client
            if('authentication' === jsonMsg.type){
                // check the token
                this.authMsgHandler(socket, jsonMsg);
            }
            // case 2: new friend notif -> only from server
            else if('new friend' === jsonMsg.type){
                this.server.emit('notify', jsonMsg);
            }
            // case 3: normal msg -> end the connect with error
            else{
                socket.destroy(new Error('Not authenticated'));
                console.log('- unauthenticated client, connection end.');
            }
        }
    }

    /**
     * 
     * @param {net.Socket} socket
     * @param {String | Buffer} msg 
     * 
     * @returns {any}
     */
    parseMsg(socket, msg){
        try{
           let json = JSON.parse(msg.toString());
           return json;
        }catch(e){
            console.log('- msg is(WJF):', msg.toString());
            socket.emit('error', new Error(e.message));
            return null;
        }
    }

    /**
     * 
     * @param {net.Socket} socket 
     * @param {any} jsonMsg 
     */
    jsonMsgHandler(socket, jsonMsg){
        switch(jsonMsg.type){
            case "Text":
                this.textMsgHandler(socket, jsonMsg);
                break;
            case "BinaryFile":
                this.binaryInfoMsgHandler(socket, jsonMsg);
                break;
            case "Image":
                this.binaryInfoMsgHandler(socket, jsonMsg);
                break;
            case "Audio":
                this.binaryInfoMsgHandler(socket, jsonMsg);
                break;
            default:
                console.log('- msg is:', jsonMsg);
                socket.emit('error', new Error('unknown type of message'));
        }
    }

    /**
     * 
     * @param {net.Socket} socket 
     * @param {Buffer} binaryMsg 
     */
    binaryMsgHandler(socket, binaryMsg){
        let info = {
            senderName: socket.username,
            receiverName: socket.binaryFile.receiver,
            sentDate: socket.binaryFile.sentDate,
            ext: socket.binaryFile.extension,
            type: socket.binaryFile.type
        };

        if(this.blockedUsers[info.receiverName].indexOf(info.senderName) != -1){
            console.log(`${info.receiverName} block ${info.senderName}`); 
            return false;
        }

        save(binaryMsg, info);
        this.server.emit('message', binaryMsg, info);
    }

    /**
     * 
     * @param {net.Socket} socket 
     * @param {Object} textMsg 
     */
    textMsgHandler(socket, textMsg){
        console.log('- msg (text) is:', JSON.stringify(textMsg));

        let info = {
            senderName: socket.username,
            receiverName: textMsg.receiver,
            sentDate: textMsg.sentDate,
            ext: null,
            type: textMsg.type
        }
       
        if(this.blockedUsers[info.receiverName].indexOf(info.senderName) != -1){
            console.log(`${info.receiverName} block ${info.senderName}`); 
            return false;
        }
        save(textMsg.message, info);
        this.server.emit('message', Buffer.from(textMsg.message), info);
    }

    /**
     * 
     * @param {net.Socket} socket 
     * @param {Object} textMsg 
     */
    authMsgHandler(socket, authMsg){
        socket.auth = true;

        let key = fs.readFileSync('./secretKey.key');
            if(key === null){
                console.log('- Internal Server Error. (secret key not found)');
                process.exit(1);
            }
            else{
                jwt.verify(authMsg.AccessToken, key, (err, decode) => {
                    if(!err && decode.username){
                        console.log('- username:', decode.username);
        
                        socket.username = decode.username;
                        this.server.emit('add new socket', socket);
                    }
                    else{
                        socket.auth = false;
                        socket.destroy(new Error("Not authenticated"))
                    }
                    
                });
                console.log('- authentication process complete.');
            }  
    }

    /**
     * 
     * @param {net.Socket} socket 
     * @param {Object} textMsg 
     */
    binaryInfoMsgHandler(socket, binaryInfoMsg){
        socket.binaryFile = binaryInfoMsg;
        console.log('- msg is:', JSON.stringify(binaryInfoMsg));
    }
};

module.exports = MsgHandler;