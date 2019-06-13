const nodemailer = require('nodemailer');
const Promise = require('bluebird');

const transporter = nodemailer.createTransport({
    service: 'Outlook',
    auth:{
        user: 'TESTING_EMAIL_HERE',
        pass: 'PASS_WORD_HERE_SOMEONE_CREATE_TEST_ACCOUNT'
    }
});

exports.verificationMail = function (username, email,code) {
    return new Promise((resolve, reject) => {
        let mailOpts = {
            from:'',
            to: email,
            subject:'Welcome To IMessenger App !',
            html:'<h3 style="margin: auto auto ; display:block">Welcome To Your New Account </h3>'+
                '<p>Your Username is : </p>' + username + 'And You Code is /Need Some Random Generator Here !!/' + code +
                '<p>For any question please contact us @ : _____</p>' +
                '<p>Best Regards, IMess Team !</p>'
        };
        transporter.sendMail(mailOpts,(err, result)=>{
            if(err){
                // this.verificationMail(username,email);
                reject(false);
            }else {
                resolve(true);
            }
        })
    });
};
