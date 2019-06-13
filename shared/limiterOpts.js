const _rateLimit = require('express-rate-limit');

let rateLimit = (time, max) => {
    return _rateLimit({
        windowMs: time, // 1 minutes
        max: max,
        message : {
            errors: 'Too Many Reqs, Please Try Again In A While ... ',
            status: false,
            data: null
        }
    });
};

module.exports = {
    rateLimit
};