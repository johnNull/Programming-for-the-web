const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const fs = require('fs');
const sha256 = require('js-sha256');
const crypto = require('crypto');

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
var tokenarr = [];
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
	app.put('/users/:id/auth', auth(app));
}

//gets url for location
function requestUrl(req) {
	const port = req.app.locals.port;
	return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}

//generates unique token id for authenticated users
function generateToken(userid){
	let token = {id: "Bearer " + crypto.randomBytes(5).toString('hex'), user: userid, creationTime: new Date().getTime() / 1000};
	for(i = 0; i < tokenarr.length; i++){
		if(tokenarr[i].user === userid){
			tokenarr.splice(i, i+1);
		}
	}
 	tokenarr.push(token);
	return token;
}

//ensures that user's token is valid
function authenticate(token, user){
	for(i = 0; i < tokenarr.length; i++){
		if(tokenarr[i].user === user && tokenarr[i].id === token)
			if(((new Date().getTime()/1000) - tokenarr[i].creationTime <= authtime))
				return 1;
			else{
				tokenarr.splice(i, i+1);
				return 0;
			}
	}
	return 0;
}

//handles GET requests with users.getUser(id). Sends status codes
function getUser(app){
	return function(req, res){
		const id = req.params.id;
		let token = req.get("Authorization");
		let auth = authenticate(token, id);
		if(typeof id === 'undefined'){
			res.sendStatus(BAD_REQUEST);
		}
		else{
			req.app.locals.model.users.getUser(id).
				then(function(results){
					if(results === 0)
						res.status(NOT_FOUND).json({status: "ERROR_NOT_FOUND", info: "user " + id + " not found"});
					else if(results !== 0 && auth === 0)
						res.status(UNAUTHORIZED).json({status: "ERROR_UNAUTHORIZED", info: "/users/" + id + " requires a bearer authorization header"});
					else if(results !== 0 && auth === 1)
						res.json(results);
				}).catch((err) => {
					console.error(err);
					res.status(NOT_FOUND).json({status: "ERROR_NOT_FOUND", info: "user " + id + " not found"});
				});
		}
	};
}

//handles auth PUT requests with users.updateUser(user). Sends status codes
function auth(app){
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
					if(result === 1){
						let token = generateToken(id);
						res.status(OK).json({status: "OK", authToken: token.id});
					}
					else if(result === 0)
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

//handles register PUT requests with users.put(user). Sends status codes
function putUser(app) {
  	return function(req, res){
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
						let token = generateToken(id);
						res.status(CREATED).json({status: "CREATED", authToken: token.id});
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
