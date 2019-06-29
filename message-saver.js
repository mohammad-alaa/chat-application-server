const fs = require('fs');
const uuidv1 = require('uuid/v1');

/**
 * 
 * @param {Buffer} msg 
 * 
 * @param {any} info 
 */
let save = (msg, info) => {
    setTimeout(() => {
        let path = getPath(info.senderName, info.receiverName); ///////////////
        let fileName = getFileName(info.senderName, info.receiverName); ///////////////
    
        let exist = fs.existsSync(path);
    
        if(exist){
            _save(msg, info);
        }
        else{
            createFolderAndFile(path, fileName);
            _save(msg, info);
        }

    }, 0);
};

/**
 * 
 * @param {String} username1 
 * @param {String} username2
 * 
 * @returns {String} 
 */
let getPath = (username1, username2) =>{
    
    return './storage/' + getFileName(username1, username2);
};

/**
 * 
 * @param {String} username1 
 * @param {String} username2
 * 
 * @returns {String} 
 */
let getFileName = (username1, username2) => {
    if(username2 < username1) [username1, username2] = [username2, username1];

    return username1 + '#' + username2;
};

/**
 * 
 * @param {String} path 
 * @param {String} fileName 
 */
let createFolderAndFile = (path, fileName) => {

    fs.mkdirSync(path);
    fs.writeFileSync(path + '/' + fileName + '.json', '[]');
};

/**
 * 
 * @param {Buffer} msg 
 * 
 * @param {any} info 
 */
let _save = (msg, info) => {
    let path = getPath(info.senderName, info.receiverName) + '/' + getFileName(info.senderName, info.receiverName) + '.json';
    let data = [];
    try{
        let temp = fs.readFileSync(path);
        data = JSON.parse(temp);
    }catch(e){
        data = [];
    }
         
    let json = {
        id: uuidv1(),
        sender: info.senderName,
        type: info.type,
        ext: info.ext ? info.ext : '',
        sentDate: info.sentDate,
        message: info.media ? '' : msg.toString()
    };

    data.push(json);
    fs.writeFileSync(path, JSON.stringify(data));

    if(info.type === 'BinaryFile'|'Image'|'Audio'){
        fs.promises.writeFile(getPath(info.senderName, info.receiverName) + '/' + json.id + '.' +json.ext, msg)
       .catch((err) => errorPrinter(err));
    }
};

/**
 * 
 * @param {Error} err 
 */
let errorPrinter = (err) =>{
    console.log('- ERROR:', err.message);
    console.log('- ERROR Stack:');
    console.log('-', err.stack)
}

/**
 * 
 * @param {Buffer} msg 
 * @param {any} info 
 */
let saveOffLine = (msg, info) =>{
    let path = `./storage/${info.receiverName}`;
    fs.exists(path, (exist) => {
        if(exist){
           _saveOffLine(msg, info, path);
        }
        else{
            fs.mkdir(path, (err) => {
                _saveOffLine(msg, info, path);    
            });
        }

    });

};

// convert to promises
/**
 * 
 * @param {Buffer} msg 
 * @param {any} info 
 * @param {String} path
 */
let _saveOffLine = (msg, info, path) => {
    let fileName = Date.now();
    fs.writeFile(`${path}/${fileName}.info`, JSON.stringify(info), (err) =>{
        if(!err){
            fs.writeFile(`${path}/${fileName}.bin`, msg, (err) =>{
                if(!err){
                    console.log(`- msg saved in the server until the receiver (${info.receiverName}) connect`);
                }
                else{
                    errorPrinter(err);
                }
            });
        }
        else{
            errorPrinter(err);
        }
    });

};

/**
 * 
 * @param {any} notification 
 */
let saveNotification = async (notification) => {
    let path = `./storage/notifications/${notification.to}.notifications`;
    let exist = fs.existsSync(path);
    if(!exist) await fs.promises.writeFile(path, '[]');
    let data = await fs.promises.readFile(path);
    data = JSON.parse(data.toString());
    data.push(notification);
    await fs.promises.writeFile(path, JSON.stringify(data));
}

module.exports = {
    save,
    saveOffLine,
    saveNotification
};