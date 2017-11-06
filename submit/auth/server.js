const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const fs = require('fs');
const sha256 = require('js-sha256');

const UNAUTHORIZED = 401;
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
	ssldir = opts.sslDir;
	authtime = opts.authTimeout;
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
				then(function(results){
					if(results === 0)
						res.status(NOT_FOUND).json({status: "ERROR_NOT_FOUND", info: "user " + id + " not found"});
					else if(results === 1)
						res.status(UNAUTHORIZED).json({status: "ERROR_UNAUTHORIZED", info: "/users/" + id + " requires a bearer authorization header"});
					else 
						res.json(results);
				}).catch((err) => {
					console.error(err);
					res.status(NOT_FOUND).json({status: "ERROR_NOT_FOUND", info: "user " + id + " not found"});
				});
		}
	};
}

//handles POST requests with users.updateUser(user). Sends status codes
function postUser(app){
	return function(req, res){
		const id = req.params.id;
		const pw = sha256(req.body.pw);
		if(typeof id === 'undefined'){
			res.sendStatus(BAD_REQUEST);
		}
		else{
			const user = req.body;
			user._id = id;
			user.pw = pw;
			req.app.locals.model.users.updateUser(user).
				then(function(result){
					if(result == 1)
						res.status(OK).json({status: "OK", authToken: "tbd"});
					else if(result == 0)
						res.status(UNAUTHORIZED).json({status: "ERROR_UNAUTHORIZED", info: "/users/" + id + "/auth requires a valid 'pw' password query parameter"});
					else
						res.status(NOT_FOUND).json({status: "ERROR_NOT_FOUND", info: "user " + id + " not found"});
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
		console.log("in put");
		const id = req.params.id;
		const pw = sha256(req.query.pw);
		if(typeof id === 'undefined'){
			res.sendStatus(BAD_REQUEST);
		}
		else{
			const user = req.body;
			user._id = id;
			user.pw = pw;
			req.app.locals.model.users.putUser(user).
				then(function(result){
					res.append('Location', requestUrl(req).substr(0, requestUrl(req).indexOf('?')));
					if(result === 1){
						res.status(CREATED).json({status: "CREATED", authToken: "tbd"});
					}
					else{
						res.status(SEE_OTHER).json({status: "EXISTS", info: 'user ' + id + ' already exists'});
					}
				}).
				catch((err) => {
					console.error(err);
					res.sendStatus(SERVER_ERROR);
				});
		}
	};
}

module.exports = {
	serve: serve,
};
