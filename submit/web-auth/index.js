#!/usr/bin/env nodejs

'use strict';

//nodejs dependencies
const fs = require('fs');
const process = require('process');
const https = require('https');

//external dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mustache = require('mustache');
const TEMPLATES_DIR = 'templates';
const EMAIL_REG = /^(([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\.([a-zA-Z])+([a-zA-Z])+)?$/;
const PASS_REG = /\w{8,}/;

//local dependencies
const users = require('./users/users');

/*************************** Route Handling ****************************/

function setupRoutes(app) {
  app.get('/', rootRedirectHandler(app));
  app.get('/logout', logoutHandler(app));
  app.get('/account/:id', viewAccount(app));
  app.get('/login', loginHandler(app));
  app.get('/register', registerHandler(app));
}

//send user to account page if trying to access home directory
function rootRedirectHandler(app) {
  return function(req, res) {
    res.redirect('account/' + req.cookies['ID']);
  };
}

//delete cookies for authentication if logout it pressed, redirect to login page
function logoutHandler(app){
	return function(req, res){
		res.clearCookie('AUTH');
		res.clearCookie('ID');
		res.redirect('/login');
	}
}

//redirects to viewUserHandler with arguments
function viewAccount(app){
	return function(req, res){
		viewUserHandler(app, req.cookies['AUTH'], res, req.params.id);
	}
}

//checks auth and login id and displays firstname and last name account page if there is a match
function viewUserHandler(app, auth, res, id){
	app.users.account(id, auth)
	.then((data) => {
    		res.send(doMustache(app, 'account', {fn: data.firstName, ln: data.lastName}));
	})
	.catch(() => res.redirect('../../login'));
}

//renders login page and validates form data on submit. Transfers to account on success
function loginHandler(app){
	return function(req, res) {
   	 	const isDisplay = (typeof req.query.submit === 'undefined');
    		if (isDisplay) { //simply render search page
      			res.send(doMustache(app, 'login', {}));
    		}
    		else {
			const q = req.query.q;
			const p = req.query.p;
			if(typeof q === 'undefined' || q.trim().length === 0 || !(EMAIL_REG.test(q))){
				const view = {qError : 'Please enter email in valid format', q : q};
				res.send(doMustache(app, 'login', view));
			}
			else if (typeof p === 'undefined' || p.trim().length === 0) {
				const view = {qError : 'Please enter password', q : q};
				res.send(doMustache(app, 'login', view));
      			}
			else{
				app.users.login(q, p)
				.then((auth) => {
					res.cookie('ID', q, {maxAge: 365 * 24 * 60 * 60 * 1000});
					res.cookie('AUTH', auth, {maxAge: 365 * 24 * 60 * 60 * 1000});
					viewUserHandler(app, auth,res, q);})
				.catch(() => res.send(doMustache(app, 'login', { q: q, qError: 'Please enter valid user email and password' }))
				);
			}
    		}
  	};
}

//renders registration page and validates parameters, on success redirect to account
function registerHandler(app){
	return function(req, res) {
		const isDisplay = (typeof req.query.submit === 'undefined');
		if(isDisplay){
    			res.send(doMustache(app, 'register', {}));
		}
		else{
			const id = req.query.q;
			const pass = req.query.p;
			const pass2 = req.query.p2;
			const first = req.query.fn;
			const last = req.query.ln;
			if(!EMAIL_REG.test(id)){
				res.send(doMustache(app, 'register', {qError: 'Please enter valid format email address', fn : first, ln : last, q : id}));
			}
			else if(typeof id === 'undefined' || id.trim().length === 0 || typeof pass === 'undefined' || pass.trim().length === 0 || typeof first === 'undefined' || first.trim().length === 0 || typeof last === 'undefined' || last.trim().length === 0 || typeof pass2 === 'undefined' || pass2.trim().length === 0){
				res.send(doMustache(app, 'register', {qError: 'Please enter all fields correctly', fn : first, ln : last, q : id}));
			}
			else if(!PASS_REG.test(pass))
				res.send(doMustache(app, 'register', {qError: 'Passwords must be 8 or more alphanumeric characters', fn : first, ln : last, q : id}));
			else if(pass != pass2)
				res.send(doMustache(app, 'register', {qError: 'Passwords do no match', fn : first, ln : last, q : id}));
			else{
				app.users.register(id, pass, first, last)
				.then((auth) => {
					res.cookie('ID', id, {maxAge: 365 * 24 * 60 * 60 * 1000});
					res.cookie('AUTH', auth, {maxAge: 365 * 24 * 60 * 60 * 1000});
					viewUserHandler(app, auth,res, id);
				}).catch(() => {res.send(doMustache(app, 'register', {qError: 'User already exists', fn : first, ln : last, q : id}));});
			}
		}
	};
}


/************************ Utility functions ****************************/

function doMustache(app, templateId, view) {
  return mustache.render(app.templates[templateId], view);
}

function errorPage(app, errors, res) {
  if (!Array.isArray(errors)) errors = [ errors ];
  const html = doMustache(app, 'errors', { errors: errors });
  res.send(html);
}
  
/*************************** Initialization ****************************/

function setupTemplates(app) {
  app.templates = {};
  for (let fname of fs.readdirSync(TEMPLATES_DIR)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
	String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}

const options = require('./options').options;

function setup() {
  process.chdir(__dirname);
  const port = options.port;
  const WS_URL = options.ws_url;
  const app = express();
  app.use(cookieParser());
  setupTemplates(app);
  app.users = users;
  app.use(bodyParser.urlencoded({extended: true}));
  setupRoutes(app);
  https.createServer({
    key: fs.readFileSync(`${options.sslDir}/key.pem`),
    cert: fs.readFileSync(`${options.sslDir}/cert.pem`),
  }, app).listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

setup();
