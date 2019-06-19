const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const mail = require('../utils/mail.utils');
const response = require('../shared/responseForm');
const users = require('../utils/users.utils');

const rateLimit = require("../shared/limiterOpts").rateLimit;

// TODO:????
const limiterOpts = rateLimit(1000 * 60, 1000);

let router = express.Router();

router.post('/signup', (req, res, next) => {
    if(!req.body.username) return next(new Error('username require to complete signup'));
    if(!req.body.password) return next(new Error('password require to complete signup'));
	if(!req.body.email) return next(new Error('email require to complete signup'));

    let user = users.getUserObject(req.body);

    let result = users.addUser(user);
    if(result.err != null) return next(new Error(result.err));

    fs.promises.readFile('./secretKey.key')
    .then((secretKey) => {
        let payload = {
            username: user.username,
            date: new Date()
        };
        let token = jwt.sign(payload, secretKey.toString());

        response.data = token;
        response.status = true;
        response.errors = null;

        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch((err) => {
        console.log(err);
        process.exit(-111);
    });
});

router.post('/login',limiterOpts ,  (req, res, next) => {
    let exist = users.login(req.body.username, req.body.password);

    if(!exist) return next(new Error('wrong in username or password'));
    
    fs.promises.readFile('./secretKey.key')
    .then((secretKey) => {
        
        let payload = {
            username: req.body.username,
            date: new Date(),
        };

        let token = jwt.sign(payload, secretKey.toString());

        response.status = true ;
        response.data = token;
        response.errors = null;
        
        res.setHeader('Content-Type', 'application/json');
        res.json(response);
    })
    .catch((err) => {
        console.log(err);
        process.exit(-111);
    });
});


module.exports = router;

 /*mail.verificationMail(user.username, user.email, user.generatedCode)
        .then((res) => {
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
});*/
