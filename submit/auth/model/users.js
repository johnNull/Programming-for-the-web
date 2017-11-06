function Users(db){
	this.db = db;
	this.users = db.collection('users');
}

Users.prototype.getUser = function(id) {
	return this.users.find({_id:String(id)}).toArray().
		then(function(users){
			return new Promise(function(resolve) {
				if(users.length === 1) {
					resolve(users[0]);
				}
				else{
					resolve(0);
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
	return this.users.find(userSpec).toArray().
		then(function (result){
			return new Promise(function(resolve){
				if(result.length == 1 && result[0].pw === user.pw){
					resolve(1);
				}
				else if (result.length == 1 && result[0].pw != user.pw){
					resolve(0);
				}
				else{
					resolve(-1);
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
				return new Promise((resolve) => resolve(0));
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
