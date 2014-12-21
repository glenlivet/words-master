
var util = require('util'), 
MongoClient = require('mongodb').MongoClient,
ObjectID = require('mongodb').ObjectID,
assert = require('assert'),
events = require('events'),
url = "mongodb://localhost:27017/words-master",
template = {
	username : null,
	lsize : 10,
	gender : null
},
db = null;

var WmService = module.exports = 
function WmService(opts){
	if(opts){
		url = opts.url||"mongodb://localhost:27017/words-master";
	}
		

	events.EventEmitter.call(this);
};

util.inherits(WmService, events.EventEmitter);

WmService.prototype.start = function(cb){
	MongoClient.connect(url, function(err, _db) {
	
	  if(!err){
		  console.info("Connected correctly to mongodb server");
		  db = _db;
		  col = db.collection('words-master');
		  cb();
	  }else {
	  	console.warn("Service Unavailable!");
	  	process.exit(1);
	  }
	});
};

WmService.prototype.handleUsername = function(name){
	var that = this;
	col.findOne({username : name},function(err, doc){
		if(err)
			that.emit('dberr', 'Database error occured when checking username!');
		else {
			console.log(util.inspect(doc));
			if(doc){
				that.emit('userFound', doc);
			} else {

				col.insert({username : name},function(err, r){
					if(err){
						that.emit('dberr', 'Database error occured when saving user info!');
					}else {
						that.emit('userCreated', r.ops[0]);
					}
				});
				
			}
		}
	});
};

