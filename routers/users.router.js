const express = require('express');
const fs = require('fs')
const router = express.Router();
const usersUtils = require('../utils/users.utils');
const response = require('../shared/responseForm');
const rateLimit = require('../shared/limiterOpts').rateLimit;

const limiterOpts = rateLimit(1000, 1);


// Search For User Using His userName
// TODO: return list
router.get('/search/:user', limiterOpts, (req, res, next) => {
    let user = req.params['user'];
    let result = usersUtils.searchForSimilirUsers(user);
    // TODO : no need for error
    //if(!result) return next(new Error('no one has this username'));

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
    response.data = null ;
    response.status = true ;
    response.errors = null;
    res.json(response);
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


router.post('/blockUser',(req,res, next) => {
    let blockingResult = userUtils.blockUser(req.body.username, req.body.block);
    if(blockingResult) {
      response.status = true;
      response.errors = null;
      response.data = null;
      res.json(response);
    } else {
      next(new Error ('User Not Found !'));
    }
});
  
router.post('/unBlockUser',(req,res,next) => {
    let unBlockResult = userUtils.unBlockUser(req.body.username, req.body.unblock);
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
  

// post -> delete friend || body -> {username, friendName}
// post -> block friend || body -> {username, friendName}
// post -> unblock friend || body -> {username, friendName}
// post -> public key || body -> {username, publicKey}
//

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
