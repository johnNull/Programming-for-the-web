#!/usr/bin/env nodejs

const mongo = require('mongodb').MongoClient;
const process = require('process');
const express = require('express', '4.16.1');
const DB_URL = 'mongodb://localhost:27017/users';
const model = require('./model/model');
const server = require('./server');

function getPort(argv) {
  let port = null;
  if (argv.length !== 3 || !(port = Number(argv[2]))) {
    console.error(`usage: ${argv[1]} PORT`);
    process.exit(1);
  }
  return port;
}

const port = getPort(process.argv);

mongo.connect(DB_URL).
  then(function(db) {
    const model1 = new model.Model(db);
    server.serve(port, model1);
  }).
  catch((e) => console.error(e));
