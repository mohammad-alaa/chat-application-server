const fs = require('fs');
const net = require('net');
const express = require('express');
const router = express.Router();
const usersUtils = require('../utils/users.utils');
const response = require('../shared/responseForm');
const rateLimit = require('../shared/limiterOpts').rateLimit;

const limiterOpts = rateLimit(1000, 1000);



router.get('/search/:user', limiterOpts, (req, res, next) => {
    let user = req.params['user'];
    let result = usersUtils.searchForSimilirUsers(user);
    
    response.data = result;
    response.status = true ;
    response.errors = null;
    res.json(response);
});

router.get('/friends/:user', limiterOpts, (req, res, next) => {
    let reqUser = req.params['user'];
    let currentUser = usersUtils.searchForUser(reqUser);
    if(!currentUser) return next(new Error('wrong username'));

    response.data = currentUser.friends;
    response.status = true ;
    response.errors = null;
    res.json(response);
    
});

router.post('/addFriend', limiterOpts, (req, res, next) => {
       
    let currUser= req.body.current;
    let userFriend= req.body.friend;
    if(! usersUtils.addFriend(currUser, userFriend)) return next(new Error('wrong username or friend name'));
    // TODO: data must be empty
    //-----------------------------------
    let sock = new net.Socket();
    sock.connect(3001, () => {
        let _msg = {type:'new friend', from:currUser, to:userFriend};
        let msg = Buffer.from(JSON.stringify(_msg));
        let msgLen = Buffer.alloc(4);
        msgLen.writeUInt32LE(msg.length);

        sock.write(msgLen); sock.write(msg);

        response.data = null ;
        response.status = true ;
        response.errors = null;
        res.json(response);
        
        sock.end();
    });
    //-----------------------------------
   
});

router.get('/lastSeen/:user', limiterOpts, async (req, res, next) => {
    username = req.params['user'];
    let result = await usersUtils.getUserLastSeen(username);
    if(!result) return next(new Error('wrong username'));

    response.status = true;
    response.errors = null;
    response.data = result;

    res.json(response);
});

router.post('/blockUser',(req, res, next) => {
    let blockingResult = usersUtils.blockUser(req.body.username, req.body.block);
    if(blockingResult) {
      response.status = true;
      response.errors = null;
      response.data = null;
      res.json(response);
    } else {
      next(new Error ('User Not Found !'));
    }
});
  
router.post('/unBlockUser',(req, res, next) => {
    let unBlockingResult = usersUtils.unBlockUser(req.body.username, req.body.unblock);
    if(unBlockingResult) {
      response.status = true;
      response.errors = null;
      response.data = null;
      res.json(response);
    } else {
      next(new Error ('User Not Found !'));
    }
});
  
router.post('/delete', (req,res,next) => {
    userUtils.deleteUser(req.body.username, req.body.delete);
    response.status = true;
    response.errors = null;
    response.data = null;
    res.json(response);
});

router.post('/setPublicKey', (req, res, next) => {
    if(!req.body.username || !req.body.platform || !req.body.publicKey) return next(new Error('bad request.'));
    usersUtils.addPublicKey(req.body.username, req.body.platform, req.body.publicKey);
    response.status = true;
    response.errors = null;
    response.data = null;
    res.json(response);
});

router.get('/getPublicKeys/:username', async (req, res, next) => {
    let username = req.params['username'];
    let result = await usersUtils.getPublicKeys(username);

    if(result.length === 0) return next(new Error('wrong username'));

    response.status = true;
    response.errors = null;
    response.data = result;
    res.json(response);
});
//Get All Users ...
router.get('/users', limiterOpts  , (req, res, next) => {
   
    fs.promises.readFile('./storage/users.json')
    .then((data) => {
        res.json(JSON.parse(data.toString()));
    })
    .catch((err) => {
        console.log(err);
    });
});

module.exports = router;
