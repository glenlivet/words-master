/**
 * The front'end object. 
 */

 var util = require('util'), 
 events = require('events'),
 questioner = require('./questioner.js'),
 SeqGenner = require('./seq-genner.js'),
 WmService = require('./service.js');

 var commandPattern = /^--[a-zA-Z]+$/;

 var WmInterface = module.exports = 
 function WmInterface(){
 	
 	this.state = WmInterface.STATE_LOGIN;

 	events.EventEmitter.call(this);
 };

 util.inherits(WmInterface, events.EventEmitter);

 WmInterface.STATE_LOGIN = 0;
 WmInterface.STATE_LEARN = 1;
 WmInterface.STATE_REVIEW = 2;

 WmInterface.prototype.init = function(){
 	this.backService = new WmService();
 	var that = this;
 	this.backService.on('dberr', function(msg){
 		console.error('--------------------');
 		console.error(msg);
 		console.error('--------------------');
 	});
 	this.backService.on('wordInserted', function(w,d){
 		that.session = d;
 		askDefinition.call(that, w, d);
 	});
 	this.backService.on('wordExisted', function(w){
 		console.error('Word: "' + w + '" has already been in your word list.');
 		askNewWord.call(that);
 	});

 	this.backService.on('wordDefined', function(w, d){
 		if(that.state == WmInterface.STATE_LEARN){
 			//学习新词状态
 			that.session = d;
 			console.log('Give some Examples please.');
 			that.exampleIdGenner = new SeqGenner();
 			askExample.call(that, w);
 		}else {
 			//复习状态
 			that.backService.updateReviewWord(that.session, that.reviewBundle, 1);
 			
 		}
 		
 	});

 	this.backService.on('exampleInserted', function(w){
 		askExample.call(that, w);
 	});

 	this.backService.on('wordsLoad', function(){
 		reviewWord.call(that, 0);
 	});

 	this.backService.on('wordsDrain', function(){
 		console.log('There is no word ready for reviewing now!');
 		console.log('Press 1 to learn new words;Press 2 to exit.');

 		questioner.ask('[1/2]', /^[1-2]$/, function(sel){
 			if(sel == 1){
 				initLearnMode.call(that);
 			}else {
 				exit();
 			}
 		});
 	});

 	this.backService.on('reviewWordUpdated', function(type){
 		if(type == 0)
 			afterReviewRecorded.call(that, that.reviewBundle.words[that.reviewBundle.currentIndex]);
 		else 
 			reviewDef.call(that, that.reviewBundle.words[that.reviewBundle.currentIndex]);
 	});

 	this.backService.on('wordReviewRecorded', function(w){
 		afterReviewRecorded.call(that, w);
 	});

 	this.backService.start(function(){		
 		askUsername.call(that);
 	});
 };
 
 /**
  * 复习单词。
  * 数据库记录复习。
  *
  */ 
 var reviewWord = function(index){
 	var that  = this;
 	//检查是否读取的单词都复习完
 	var isCurBundleDone = (index == this.reviewBundle.words.length);
 	if(isCurBundleDone){
 		//拉取新的bundle
 		++this.reviewBundle.page;
 		this.backService.queryReview(this.session, this.reviewBundle);
 	}else {
 		//get the word 
 		var word = this.reviewBundle.words[index];
 		this.backService.handleWordReview(this.session, word);
 	}
 	
 };
 
 /**
  * 数据库记录复习后，开始复习。
  *
  */
 var afterReviewRecorded = function(w){
 	var that = this;
 	console.log('Reviewing word: ' + w.spell);
 		var _patt;
 		var _disp;
 		if(w.examples.length){
 			console.log('Press 0 to the next word; Press 1 to add some examples; Press 2 to view examples.');
 			_patt = /^([0-2])|(--[a-zA-Z]+)$/;
 			_disp = '[0/1/2]';
 		} else {
 			console.log('Press 0 to the next word; Press 1 to add some examples.');
 			_patt = /^([0-1]|(--[a-zA-Z]+)$)/;
 			_disp = '[0/1]';

 		}
 		questioner.ask(_disp, _patt, function(sel){
 			if(commandPattern.test(sel)){
 				handlCommand.call(that, sel);
 			}else if(sel == 0){
 				reviewWord.call(that, ++that.reviewBundle.currentIndex);
 			} else if(sel == 1){
 				that.exampleIdGenner = new SeqGenner();
 				askExample.call(that, w.spell);

 			} else if (sel == 2){
 				for(var i in w.examples){
 					console.log('' + i + ': ' + w.examples[i]);
 				}
 				reviewDef.call(that, w);
 			}
 		});
 };

 var reviewDef = function(w){
 	var that  = this;
 	var _patt;
 	var _disp;
 	if(w.definition){
 		//有注解
 		console.log('Press 0 to the next word; Press 1 to view definition; Press 2 to review the word again.');
 		_patt = /^([0-2])|(--[a-zA-Z]+)$/;
 		_disp = '[0/1/2]';
 	} else {
 		console.log('Press 0 to the next word; Press 1 to set the definition; Press 2 to review the word again.');
 		_patt = /^([0-2])|(--[a-zA-Z]+)$/;
 		_disp = '[0/1/2]';
 	}

 	questioner.ask(_disp, _patt, function(sel){
 			if(commandPattern.test(sel)){
 				handlCommand.call(that, sel);
 			}else if(sel == 0){
 				reviewWord.call(that, ++that.reviewBundle.currentIndex);
 			} else if(sel == 1){
 				//TODO  view or set the definition
 				if(w.definition){
 					//查看定义
 					console.log(w.spell + ': ' + w.definition);
 					reviewDef.call(that, w);
 				}else {
 					askDefinition.call(that, w.spell, that.session);
 				}
 			} else if (sel == 2){
 				//重新复习该词语
 				afterReviewRecorded.call(that, w);
 			}
 		});

 };

 var askDefinition = function(w, d){
 	var that = this;
 		questioner.ask('Definition', /^.*$/, function(value){
 			if(commandPattern.test(value)){
 				handlCommand.call(that, value);
 			} else {
 				that.backService.handleWordDef(d, w, value);
 			}
 		});
 }

 var askExample = function(w){
 	var that = this;
 	if(this.state == WmInterface.STATE_REVIEW){
 		console.log('Type [--cr] continue to review!');
 	}
 	questioner.ask('Example[' + that.exampleIdGenner.getSeqId() + ']', 
 			/^.+$/, function(example){

 		if(commandPattern.test(example)){
 			handlCommand.call(that, example);
 		}else {
 			that.backService.handleExample(that.session, w, example);
 		}
 	});
 };


 var askUsername = function(){
 	var that  = this;
 	console.info('May I have your name please!');
 	questioner.ask('username', /^\w+$/, function(name){
 		
 		handleUsername.call(that, name);
 	});
 };

 var handleUsername = function(name){
 	var that  = this;
 	//老用户登录
 	this.backService.once('userFound', function(doc){
 		console.info('Welcome back, ' + doc.username + '!');
 		console.info('Options: 1. Learn new words; 2. Review studied words.');
 		that.session = doc;
 		questioner.ask('[1/2]', /^([1-2])|(--[a-zA-Z]+)$/, function(sel){
 			if(commandPattern.test(sel)){
 				handleCommand.call(that, sel);
 			}else if(sel == 1){
 				initLearnMode.call(that);
 			}else {
 				initReviewMode.call(that);
 			}
 		});
 	});

 	//新用户登录
 	this.backService.once('userCreated', function(doc){
 		
 		that.session = doc;
 		console.info('Nice having you here, ' + doc.username + '!')
 		console.info('You can get started by recording new words right here!');
 		initLearnMode.call(that);
 	});

 	this.backService.handleUsername(name);
 };

 var askNewWord = function(){
 	var that = this;
 	that.state = WmInterface.STATE_LEARN;
 	questioner.ask('word[' + this.seqGenner.getSeqId() + ']', 
 			/^(--)?[a-zA-Z]+(-[a-zA-Z]+)*$/, function(w){
 				if(commandPattern.test(w)){
 					handlCommand.call(that, w);
 				} else {
 					handleWord.call(that, w);
 				}
 			});
 };

 var handleWord = function(w){

 	this.backService.handleWord(this.session, w);
 };

 var handlCommand = function(cmd){

 	// 根据不同状态，处理命令。
 	switch(cmd){
 		case '--bb':
 			exit();
 			break;
 		case '--nw': //new word
 			if(this.state == WmInterface.STATE_REVIEW){
 				reviewWord.call(this, ++this.reviewBundle.currentIndex);
 			}else {
 				askNewWord.call(this);
 			}
 			break;
 		case '--rv':  //review
 			initReviewMode.call(this);
 			break;
 		case '--cr':  	//continue review
 			if(this.state == WmInterface.STATE_REVIEW){
 				this.backService.updateReviewWord(this.session, this.reviewBundle, 0);
 				
 			}else {
 				console.error('Error command: Command [-cr] is review-only command!');
 				askNewWord.call(this);
 			}
 			break;
 		default :
 			break;
 	}
 };

 var initLearnMode = function(){
 	this.state = WmInterface.STATE_LEARN;
 	this.seqGenner = new SeqGenner();
 	askNewWord.call(this);
 };

 var initReviewMode = function(){
 	var that = this;
 	this.state = WmInterface.STATE_REVIEW;
 	this.reviewBundle = {
 		words : [],
 		page : 0,
 		wordsPerPage : 10
 	};
 	this.backService.queryReview(this.session, this.reviewBundle);
 };

 var exit = function(){
 	console.log('See ya later!');
 	process.exit(1);
 };


