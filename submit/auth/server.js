const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const fs = require('fs');

const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;
const SEE_OTHER = 303;
var ssldir;
var authtime;
//initial server setup
function serve(model, opts){
	const app = express();
	app.locals.port = opts.port;
	app.locals.model = model;
	ssldir = opts.authTimeout;
	authtime = opts.sslDir;
	routeSetup(app);
	https.createServer({
		key: fs.readFileSync(ssldir + '/key.pem'),
		cert: fs.readFileSync(ssldir + '/cert.pem'),
	}, app).listen(opts.port);
}

//Defines routes to take for different requests
function routeSetup(app){
	app.get('/users/:id', getUser(app));
	app.use('/users/:id', bodyParser.json());
	app.put('/users/:id?', putUser(app));
	app.put('/users/:id/auth', postUser(app));
}

//gets url for location
function requestUrl(req) {
	const port = req.app.locals.port;
	return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}

//handles GET requests with users.getUser(id). Sends status codes
function getUser(app){
	return function(req, res){
		const id = req.params.id;
		if(typeof id === 'undefined'){
			res.sendStatus(BAD_REQUEST);
		}
		else{
			req.app.locals.model.users.getUser(id).
				then((results) => res.json(results)).
				catch((err) => {
					console.error(err);
					res.sendStatus(NOT_FOUND);
				});
		}
	};
}

//handles POST requests with users.updateUser(user). Sends status codes
function postUser(app){
	return function(req, res){
		const id = req.params.id;
		if(typeof id === 'undefined'){
			res.sendStatus(BAD_REQUEST);
		}
		else{
			const user = req.body;
			user._id = id;
			req.app.locals.model.users.updateUser(user).
				then(function(){
					res.append('Location', requestUrl(req));
					res.sendStatus(SEE_OTHER);
				}).
				catch((err) => {
					console.error(err);
					res.sendStatus(NOT_FOUND);
				});
		}
	};
}

//handles PUT requests with users.put(user). Sends status codes
function putUser(app) {
  	return function(req, res){
		const id = req.params.id;
		const pw = req.query.pw;
		if(typeof id === 'undefined'){
			res.sendStatus(BAD_REQUEST);
		}
		else{
			const user = req.body;
			user._id = id;
			user._pw = pw;
			req.app.locals.model.users.putUser(user).
				then(function(result){
					if(result === 1){
						res.append('Location', requestUrl(req));
						res.sendStatus(CREATED);
					}
					else
						res.sendStatus(NO_CONTENT);
				}).
				catch((err) => {
					console.error(err);
					res.sendStatus(SERVER_ERROR);
				});
		}
	};
}

//handles DELETE requests with users.deleteUser(id). Sends status codes
function deleteUser(app){
	return function(req, res){
		const id = req.params.id;
		if(typeof id === 'undefined'){
			res.sendStatus(BAD_REQUEST);
		}
		else{
			req.app.locals.model.users.deleteUser(id).
				then(() => res.end()).
				catch((err) => {
					console.error(err);
					res.sendStatus(NOT_FOUND);
				});
		}
	};
}

module.exports = {
	serve: serve,
};
