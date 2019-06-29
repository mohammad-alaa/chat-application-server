const fs = require('fs');

let fetchUsers = () => {
    try{
       let users = fs.readFileSync('./storage/users.json');
       return JSON.parse(users);
    }catch(e){
        return [];
    }
};

/**
 *
 * @param {String} username
 *
 * @return {User} || -1
 */
let searchForUser = function(username) {
    let userList = fetchUsers();
    // TODO : Change to for of: completed
    for(let val of userList){
        if(val.username === username) return val;
    }
};

let getUserObject = (body) => {
    let user = {
        username: body.username,
        password: body.password,
        email: body.email,
        name: body.name === undefined ? body.username : body.name,
        friends: [],
        blockedUsers: [],
        signupData: getDate(),
        // Need Handling
        verified : false ,
        generatedCode: null,
        // delete or not ???? 
        status: body.status === undefined ? '' : body.status,
        private: body.private === undefined ? false : body.private,
    };

    return user;
    
};

let isBlockUser = (blockedUsers, username) => {
    for(let name of blockedUsers)
        if(name === username) return true;
    return false;
};

let writeUsers = (users) => {
    fs.writeFile('./storage/users.json', JSON.stringify(users), (err) => {
        if(err){
            console.log('ERROR: write', err.message);
        }
    });
};

let addUser = (user) => {
    users = fetchUsers();

    let result = checkDuplication(users, user);
    if(result !== null){
        return { err: result };
    }
    else{
        users.push(user);
        writeUsers(users);
        addToLastSeen(user.username);
        return { err: result };
    } 
};

let addToLastSeen = (username) => {

    fs.promises.readFile('./storage/lastSeen.json')
    .then((data) => {
        try{
            data = JSON.parse(data);
        }
        catch(e){ data = {}; }
        data[username] = 1;
        fs.promises.writeFile('./storage/lastSeen.json', JSON.stringify(data));
    })
    .catch((err) => {
        let data = {};
        data[username] = 1;
        fs.promises.writeFile('./storage/lastSeen.json', JSON.stringify(data));
    });
};

let checkDuplication = (users, user) => {

    for(let _user of users){
        if(_user.username === user.username) return 'username already exist';
        if(_user.email === user.email) return 'email already exist';
    }

    return null;
};

let login = (username, password) => {
    let users = fetchUsers();
    for(let user of users){
        if(user.username === username && user.password === password) return true
    }
    return false;
};

let getUserLastSeen = (username) => {
    return fs.promises.readFile('./storage/lastSeen.json')
    .then((data) => {
        data = JSON.parse(data);
        if(data[username]) return data[username];
        return null;
    })
    .catch((err) => {
        console.error(err);
    });
};

let updateUserLastSeen = (username, date) => {
    // TODO:
    fs.promises.readFile('./storage/lastSeen.json')
    .then((data) => {
        data = JSON.parse(data);
        data[username] = date;
        fs.promises.writeFile('./storage/lastSeen.json', JSON.stringify(data));
    })
    .catch((err) => {
        console.log(err);
    });
};

/**
 *
 * @param currentUser
 * @param newFriend
 *
 * @return {boolean}
 */
let addFriend =function(currentUser, newFriend){
    let usersList = fetchUsers();
    let a1 = false, a2 = false;
    for(let u of usersList){
        if(u.username == currentUser){
            if(u.friends.indexOf(newFriend)!==-1) return {status:false, error:"this friend already exist."};
            u.friends.push(newFriend);
            a1 = true;
        }
        if(u.username == newFriend){
            u.friends.push(currentUser);
            a2 = true;
        }
    }
    if(a1 && a2){
        writeUsers(usersList);
        return {status:true, error:null};
    }
    return {status:false, error:'wrong username or friend name'};
};

let getDate = () => {
    
    let d = new Date();
    return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate() + ':' + d.getHours() + '.' + d.getMinutes();; 
};

let getAllBlockedUsers = () => {
    let usersList = fetchUsers();
    let AllblockedUsers = {};

    for(let user of usersList){
        AllblockedUsers[user.username] = user.blockedUsers
    }
    return AllblockedUsers;
};

let blockUser = function (currentUser, blocked) {
    let usersList = fetchUsers();
    for (let user of usersList) {
      if (user.username == currentUser) {
        user.blockedUsers.push(blocked);
        writeUsers(usersList);
        return true ;
      }
    }
    return false ;
};
  
let unBlockUser = function(currentUser, blocked){
    let usersList = fetchUsers();
    for (let user of usersList) {
      if (user.username == currentUser) {
      let index = user.blockedUsers.indexOf(blocked);
      if (index != -1){
        usersList.blockedUsers.splice(index,1);
        console.log(user);
        writeUsers(usersList);
        return true ;
        }
      }
    }
    return false ;
};
  
let deleteUser = function(currentUser, deleted){
    let usersList = fetchUsers();
    for (let user of usersList) {
      if (user.username == currentUser) {
      let index = user.friends.indexOf(delted);
      if (index != -1){
        usersList.friends.splice(index,1);
        console.log(user);
        writeUsers(usersList);
        }
      }
      else if (user.username == deleted) {
      let index = user.friends.indexOf(currentUser);
      if (index != -1){
        usersList.friends.splice(index,1);
        console.log(user);
        writeUsers(usersList);
        }
      }
    }
    return true ;
};

let getAllUsernames = () => {
    let usernames = [];
    let userList = fetchUsers();
    for(let u of userList) usernames.push(u.username);
    return usernames;
};
  
// str coude be any string
let searchForSimilirUsers = (str) => {
    let usersList = fetchUsers();
    let result = [];
    for(let user of usersList){
        if(user.username.includes(str) || user.name.includes(str) || user.email.includes(str))
            result.push({name: user.name, username: user.username,  email: user.email });
    }
    return result;
};

let addPublicKey = (username, platform, key) => {
    let path = `./storage/keys/${username}.${platform}.key`;
    fs.writeFile(path, key, (err) => {
        if(err) console.log(err);
    });
};

let getPublicKeys = async (username) => {
    // TODO
    let result = [];
    let wPath = `./storage/keys/${username}.windows.key`;
    let aPath = `./storage/keys/${username}.android.key`;

    let wExist = fs.existsSync(wPath);
    let aExist = fs.existsSync(aPath);

    if(wExist){
        let k = await fs.promises.readFile(wPath);
        result.push({ publicKey:k.toString(), platform: 'windows' });
    }
    if(aExist){
        let k = await fs.promises.readFile(aPath);
        result.push({ publicKey:k.toString(), platform: 'android' });
    }

    return result;
};

module.exports = {
    addUser,
    login,
    addFriend,
    searchForUser,
    getUserObject,
    searchForSimilirUsers,
    getUserLastSeen,
    updateUserLastSeen,
    isBlockUser,
    getAllBlockedUsers,
    getDate,
    blockUser,
    unBlockUser,
    getAllUsernames,
    addPublicKey,
    getPublicKeys,
}
