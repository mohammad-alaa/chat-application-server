const fs = require('fs');
const uuidv1 = require('uuid/v1');

/**
 * 
 * @param {Buffer} msg 
 * @param {Boolean} media 
 * @param {String} senderName 
 * @param {String} receiverName 
 */
let save = (msg, media, senderName, receiverName) => {
    setTimeout(() => {
        let path = getPath(senderName, receiverName); ///////////////
        let fileName = getFileName(senderName, receiverName); ///////////////
    
        let exist = fs.existsSync(path);
    
        if(exist){
            _save(msg, media, senderName, receiverName);
        }
        else{
            createFolderAndFile(path, fileName);
            _save(msg, media, senderName, receiverName);
        }

    }, 0)
   

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
 * @param {Boolean} media 
 * @param {String} senderName 
 * @param {String} receiverName 
 */
let _save = (msg, media, senderName, receiverName) => {

    let path = getPath(senderName, receiverName) + '/' + getFileName(senderName, receiverName) + '.json';
    let data = [];
    try{
        let temp = fs.readFileSync(path);
        //console.log('>>>>> ', temp.toString());
        data = JSON.parse(temp);
    }catch(e){
        data = [];
        console.log('<<<<<<<<<<<< Exception >>>>>>>>>>>>>>');
    }
         
    let json = {
        id: uuidv1(),
        sender: senderName,
        type: '',
        ext: '',
        message: ''
    }

    if(media){
        json.ext = msg.ext; 
        json.type = 'binary';

        fs.writeFile(getPath(senderName, receiverName) + '/' + json.id + '.' +json.ext, msg.file, (err) => {
            if(err){
                errorPrinter(err);
            }
        });
    }

    else{
        json.type = 'text';
        json.message = msg;
    }

    data.push(json);
    fs.writeFile(path, JSON.stringify(data), (err) => {
        if(err){
            errorPrinter(err);
        }
    });

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
                if(!err){
                    _saveOffLine(msg, info, path);
                }
                else{
                    errorPrinter(err);
                }
            });
        }

    });

};

/**
 * 
 * @param {Buffer} msg 
 * @param {any} info 
 * @param {String} path
 */
let _saveOffLine = (msg, info, path) => {
    let fileName = uuidv1();
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

module.exports = {
    save,
    saveOffLine

};