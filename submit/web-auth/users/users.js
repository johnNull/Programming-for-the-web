'use strict';

const axios = require('axios');
const options = require('./../options').options;

//Constructor to set baseURL for webservices and allow https access
function Users(){
	this.baseURL = options.ws_url;
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

//Send login info to loginUserHandler webservice and return auth token on success
Users.prototype.login = function(id, pass) {
	let data = {pw: pass};
	let url = this.baseURL + "/users/" + id + "/auth";
	return axios.put(url, data, {maxRedirects: 0})
	.then((response) => {
		return response.data.authToken;
	})
	.catch();
}

//Send registration info to registerUserHandler webservice and return auth token on success
Users.prototype.register = function(id, pass, fn, ln){
	const data = {firstName : fn, lastName : ln};
	const url = this.baseURL + "/users/" + id + "?pw=" + pass;
	return axios.put(url, data, { maxRedirects: 0 })
	.then((response) => {
		return response.data.authToken;
	}).catch();
}

//Send ID and authToken to getUserHandler webservice and return the response body
Users.prototype.account = function(id, auth){
	let auther = 'Bearer ' + auth;
	let url = this.baseURL + "/users/" + id;
	return axios.get(url, {headers: {Authorization: auther}})
	.then((response) => {
		return response.data;
	}).catch();
}

module.exports = new Users();
