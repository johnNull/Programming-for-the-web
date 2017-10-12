function Users(db){
	this.db = db;
	this.users = db.collection('users');
}

Users.prototype.getUser = function(id) {
	return this.users.find({_id:String(id)}).toArray().
		then(function(users){
			return new Promise(function(resolve, reject) {
				if(users.length === 1) {
					resolve(users[0]);
				}
				else{
					reject(new Error('cannot find user ${id}'));
				}
			});
		});
}

Users.prototype.deleteUser = function(id){
	return this.users.deleteOne({_id:String(id)}).
		then((results) => {
			return new Promise((resolve, reject) => {
				if(results.deletedCount === 1){
					resolve();
				}
				else{
					reject(new Error('cannot delete user ${id}'));
				}
			});
		});
}

Users.prototype.updateUser = function(user){
	const userSpec = {_id:String(user._id)};
	return this.users.replaceOne(userSpec, user).
		then(function (result){
			return new Promise(function(resolve, reject){
				if(result.modifiedCount != 1){
					reject(new Error('updated $result.modifiedCount} users'));
				}
				else{
					resolve();
				}
			});
		});
}

Users.prototype.putUser = function(user){
	const userSpec = {_id:String(user._id)};
	let db = this;
	return this.users.find(userSpec).toArray().
		then(function(users){
			if(users.length > 0){
				return db.users.replaceOne(userSpec, user).
					then(function (result){
						return new Promise(function(resolve){
							resolve(0);
						});
					});
			}
			else{
				return db.users.insertOne(user).
					then(function(results){
						return new Promise((resolve) => resolve(1));
					});
			}
		});
}
module.exports = {
	Users: Users,
};

//Users.prototype.
