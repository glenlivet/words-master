
var util = require('util'), 
MongoClient = require('mongodb').MongoClient,
ObjectID = require('mongodb').ObjectID,
assert = require('assert'),
events = require('events'),
WordBuilder = require('./word-builder.js'),
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
			
			if(doc){
				that.emit('userFound', doc);
			} else {

				col.insert({username : name, words : []},function(err, r){
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

WmService.prototype.handleWord = function(session, word){
	var that = this;
	//判断是否存在
	col.findOne({username : session.username, 'words.spell' : word}, function(err, doc){
		if(err){
			console.error('Database error occured when handling words!');
			return;
		}
		if(doc){
			//已经存在
			that.emit('wordExisted', word);
		}else {
			var w = WordBuilder.gen(word);
			col.findOneAndUpdate({username : session.username}, {$push:{words : w}},{returnOriginal:false}, function(err, result){
				if(err){
					console.error('Database error occured when handling words!');
				}else{
					that.emit('wordInserted',word, result.value);	
				}
			});
		}

	});

	
};

WmService.prototype.handleWordDef = function(session, word, definition){
	var that = this;
	col.findOneAndUpdate({username : session.username, 'words.spell' : word}, 
			{$set : {'words.$.definition' : definition}}, {returnOriginal : false},
			function(err, result){
				if(err){
					console.error('Database error occured when handling words!');
				}else {
					that.emit('wordDefined', word, result.value);
				}
				
			});
};

WmService.prototype.handleExample = function(session, word, example){
	var that = this;
	col.updateOne({username: session.username,'words.spell':word}, 
		{$push: {'words.$.examples' : example}}, function(err, r){
			if(err){
				console.error('Database error occured when handling examples!');
			} else {
				that.emit('exampleInserted', word);
			}
		});
}

WmService.prototype.queryReview = function(session, reviewBundle){
	var that = this;
	var aggregateParam = [
	//filter
	{$match : {username : session.username}},
	{$unwind : '$words'},
	{$project : {_id:0, words:1}},
	{$match:{'words.nextDate':{$lt : new Date().getTime()}, 'words.state' : {$gte : 0}}},
	{$sort : {'words.nextDate' : 1}},
	//因为词已经更新 所以不需要skip
	//{$skip : reviewBundle.page*reviewBundle.wordsPerPage},
	{$limit : reviewBundle.wordsPerPage}
	];
	//清空reviewBundle中之前的words
	reviewBundle.words = [];
	reviewBundle.currentIndex = null;
	col.aggregate(aggregateParam, function(err,result){
		if(!result.length){
			//没有符合条件的词汇
			that.emit('wordsDrain');
			return;
		}
		//有词语
		for(var i in result){
			var w = result[i].words;
			reviewBundle.words.push(w);	
		}
		//console.log(util.inspect(reviewBundle.words));
		reviewBundle.currentIndex = 0;
		that.emit('wordsLoad');
	});
};

/**
 *
 * @param type 0: 新增了example; 1: 新增了definition.
 */
WmService.prototype.updateReviewWord = function(session, reviewBundle, type){
	var that  = this;
	var wordSpell = reviewBundle.words[reviewBundle.currentIndex].spell;
	var aggregateParam = [
	//filter
	{$match : {username : session.username}},
	{$unwind : '$words'},
	{$project : {_id:0, words:1}},
	{$match:{'words.spell': wordSpell}}
	];
	col.aggregate(aggregateParam, function(err,result){
		for(var i in result){
			var w = result[i].words;
			reviewBundle.words[reviewBundle.currentIndex] = w;
		}
		that.emit('reviewWordUpdated', type);
	});
};

WmService.prototype.handleWordReview = function(session, word){
	var that = this;
	//update word status
	WordBuilder.update(word);
	col.findOneAndUpdate({username: session.username,'words.spell':word.spell},
		{$set : {'words.$' : word}}, {returnOriginal : false},
		function(err, result){
			if(err){
				console.error('Database error occured when updating word\'s state!');
			}else {
				that.emit('wordReviewRecorded', word);
			}
		}
	);


};
