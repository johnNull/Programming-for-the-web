const express = require('express');
const bodyParser = require('body-parser');

const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;
const SEE_OTHER = 303;

//initial server setup
function serve(port, model){
	const app = express();
	app.locals.port = port;
	app.locals.model = model;
	routeSetup(app);
	app.listen(port);
}

//Defines routes to take for different requests
function routeSetup(app){
	app.get('/users/:id', getUser(app));
	app.delete('/users/:id', deleteUser(app));
	app.use('/users/:id', bodyParser.json());
	app.post('/users/:id', postUser(app));
	app.put('/users/:id', putUser(app));
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
		if(typeof id === 'undefined'){
			res.sendStatus(BAD_REQUEST);
		}
		else{
			const user = req.body;
			user._id = id;
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
