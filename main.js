const ChatServer = require('./tcp-server-class');

let chatServer = new ChatServer(3001, '0.0.0.0');

chatServer.runServer();



//HTTP PORT
const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const response = require('./shared/responseForm');
const PORT = 8080;

const userRoute = require('./routers/users.router');
const indexRoute = require('./routers/indexRouter');


app.use(bodyParser.json());


app.use('/index',indexRoute);
app.use('/user',userRoute);

let errHandler = (err, req, res, next) => {
	response.status = false;
	response.errors = err.message;
	response.data = null;

	res.json(response);
};

app.use(errHandler);

app.listen(PORT, () => console.log(`Express HTTP Server listening on port ${PORT}!`));
