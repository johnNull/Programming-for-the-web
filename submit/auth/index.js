#!/usr/bin/env nodejs

const mongo = require('mongodb').MongoClient;
const process = require('process');
const express = require('express', '4.16.1');
const DB_URL = 'mongodb://localhost:27017/users';
const model = require('./model/model');
const options = require('./options');
const server = require('./server');

function getOpts(){
	if (!(opts = options.options)) {
    		console.error(`usage: ${argv[1]} PORT`);
    		process.exit(1);
	}
}

//var opts = options.options;

mongo.connect(DB_URL).
  then(function(db) {
    const model1 = new model.Model(db);
	let opts = options.options;
    server.serve(model1, opts);
  }).
  catch((e) => console.error(e));
