const net = require('net');

class NoName{

    /**
     * 
     * @param {net.Socket} socket 
     */
    constructor(socket){
        this.queue = [];
        this.socket = socket;
        this.readSize = 4;
        this.readState = 'HEADER';
        this.contentLen = 0;
        this.bufferdBytes = 0;
        this.all = 0;
    }

    init(){
        this.socket.on('data', (data) => {
            this.all += data.length;
            this.receive(data);
        });
    }

    /**
     * 
     * @param {Buffer} data 
     */
    receive(data){
        this.queue.push(data);
        this.bufferdBytes += data.length;

        while(this.hasEnough(this.readSize)){
            
            if(this.readState === 'HEADER' && this.hasEnough(4)){
                this.contentLen = this.readByts(4).readUInt32LE(0);
                this.readSize = this.contentLen;
                this.readState = 'BODY';
                
            }
            if(this.readState === 'BODY' && this.hasEnough(this.contentLen)){
                let msg = this.readByts(this.contentLen);

                this.readSize = 4;
                this.readState = 'HEADER';

                this.socket.emit('message', msg);
            }

        }

    }

    /**
     * 
     * @param {Number} size 
     * 
     * @returns {Boolean}
     */
    hasEnough(size){
        return this.bufferdBytes >= size;
    }

    /**
     * 
     * @param {Number} size 
     * 
     * @returns {Buffer}
     */
    readByts(size){

        this.bufferdBytes -= size;

		if(this.queue[0].length === size){
			return this.queue.shift();
		}

		else if(this.queue[0].length > size){
			
			let result = this.queue[0].slice(0, size);
			this.queue[0] = this.queue[0].slice(size);
			return result;
			
		}

		else{
			let result = Buffer.allocUnsafe(size);
			let offset = 0;
			while(size > 0){

				// read body size from queue[i] and add it to result
				// update the content of queue each iteration (delete queue[i] or update it)

				if(size >= this.queue[0].length){
					this.queue[0].copy(result, offset);
					offset += this.queue[0].length;
					size -= this.queue[0].length;
					this.queue.shift();

				}
				else{
					this.queue[0].copy(result, offset, 0, size);
					this.queue[0] = this.queue[0].slice(size);
					size -= this.queue[0].length;
				}

			}
			return result;
		}
    }
};

module.exports = NoName;