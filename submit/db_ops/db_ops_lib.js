'use strict';

const assert = require('assert');
const mongo = require('mongodb').MongoClient;


//used to build a mapper function for the update op.  Returns a
//function F = arg => body.  Subsequently, the invocation,
//F.call(null, value) can be used to map value to its updated value.
function newMapper(arg, body) {
  return new (Function.prototype.bind.call(Function, Function, arg, body));
}

//print msg on stderr and exit.
function error(msg) {
  console.error(msg);
  process.exit(1);
}

//export error() so that it can be used externally.
module.exports.error = error;


//auxiliary functions; break up your code into small functions with
//well-defined responsibilities.

//perform op on mongo db specified by url.
function dbOp(url, op) {
  //your code goes here
	let command = JSON.parse(op);
	if(command.op === "create"){
		dbCreate(url, command);
	}
	else if(command.op === "read"){
		dbRead(url, command);
	}
	else if(command.op === "delete"){
		dbDelete(url, command);
	}
	else if(command.op === "update"){
		dbUpdate(url, command);
	}
	else{
		console.log("Incorrect op");
	}
}

//inserts object/objects into the database
function dbCreate(url, op){
	if(op.collection && op.args){
		var mdb;		
		mongo.connect(url)
		.then(function(db){
			mdb = db;
			return db.collection(op.collection).insert(op.args);	
		})
		.then(function(){
			mdb.close();
		})
		.catch(function(err){
			console.log(err);
		});
	}
	else{
		console.log("No collection or args specified");
	}
}

//reads object/objects from the database
function dbRead(url, op){
	if(op.collection && op.args != undefined){
		var mdb;
		var result;		
		mongo.connect(url)
		.then(function(db){
			mdb = db;
			if(op.args.length != undefined){
				db.collection(op.collection).find({$or: op.args}).toArray(function(err,result) {
				if(err) throw err;
				console.log(result);
				mdb.close();
				});
			}
			else{
				db.collection(op.collection).find(op.args).toArray(function(err,result) {
				if(err) throw err;
				console.log(result);
				mdb.close();
				});
			}
		});
	}
	else if(op.collection){
		var mdb;
		var result;		
		mongo.connect(url)
		.then(function(db){
			mdb = db;
			db.collection(op.collection).find({}).toArray(function(err,result) {
			if(err) throw err;
			console.log(result);
			mdb.close();
			});
		});
	}
	else{
		console.log("No collection specified");
	}
}

//deletes object/objects from the database
function dbDelete(url, op){
	if(op.collection){
		var mdb;		
		return mongo.connect(url)
		.then(function(db){
			mdb = db;
			if(op.args != undefined && op.args.length != undefined)
				return db.collection(op.collection).remove({$or: op.args});
			else if(op.args!= undefined)
				return db.collection(op.collection).remove(op.args);
			else
				return db.collection(op.collection).remove({});
		})
		.then(function(){
			mdb.close();
		})
		.catch(function(err){
			console.log(err);
		});
	}
	else{
		console.log("No collection or args specified");
	}
}

//updates objects from the database with given function. Finds values, applies function, deletes old entries, adds new entries.
function dbUpdate(url, op){
	if(op.collection && op.fn.length === 2){
		var mdb;
		var result;
		let mapper = newMapper(op.fn[0],op.fn[1]);
		mongo.connect(url)
		.then(function(db){
			mdb = db;
			if(op.args != undefined && op.args.length != undefined){
				db.collection(op.collection).find({$or: op.args}).toArray(function(err,list) {
				result = list;
				if(err) throw err;
				for(let i = 0; i < result.length; i++){
					let temp = result[i]._id;	
					result[i] = mapper.call(null, result[i]);
					result[i]._id = temp;
				}
				dbDelete(url, op).then(function(){
					return db.collection(op.collection).insert(result);
				}).then(function(){
					mdb.close();
				});			
				});
			}
			else if(op.args != undefined){
				db.collection(op.collection).find(op.args).toArray(function(err,list) {
				result = list
				if(err) throw err;
				for(let i = 0; i < result.length; i++){
					let temp = result[i]._id;	
					result[i] = mapper.call(null, result[i]);
					result[i]._id = temp;
				}
				dbDelete(url, op).then(function(){
					return db.collection(op.collection).insert(result);
				}).then(function(){
					mdb.close();
				});
				});
			}
			else{
				db.collection(op.collection).find({}).toArray(function(err,list) {
				result = list;
				if(err) throw err;
				for(let i = 0; i < result.length; i++){
					let temp = result[i]._id;	
					result[i] = mapper.call(null, result[i]);
					result[i]._id = temp;
				}
				dbDelete(url, op).then(function(){
					return db.collection(op.collection).insert(result);
				}).then(function(){
					mdb.close();
				});
				});
			}
			
		});
	}
	else{
		console.log("No collection or function specified");
	}
}

//make main dbOp() function available externally
module.exports.dbOp = dbOp;
