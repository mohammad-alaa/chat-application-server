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
        console.error(err);
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
        this.errorHandler(err);
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
        return true;
    }
    return false;
};

let getDate = () => {
    
    let d = new Date();
    return d.getFullYear() + '-' + d.getMonth() + '-' + d.getDay() + ':' + d.getHours() + '.' + d.getMinutes();; 
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
}
  


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
    getDate
}
