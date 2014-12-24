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

 WmInterface.prototype.setListeners = function(){
 	this.on('inited', askUsername);
 	this.on('username', handleUsername);
 	this.on('word', handleWord);
 };

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
 		questioner.ask('Definition', /^.*$/, function(value){
 			if(commandPattern.test(value)){
 				var command = value.substring(2);
 				handlCommand.call(that, command);
 			} else {
 				that.backService.handleWordDef(d, w, value);
 			}
 		});
 	});
 	this.backService.on('wordDefined', function(w, d){
 		that.session = d;
 		//TODO
 	});

 	this.setListeners();
 	this.backService.start(function(){
 		that.emit('inited');
 	});
 };

 var askUsername = function(){
 	var that  = this;
 	console.info('May I have your name please!');
 	questioner.ask('username', /^\w+$/, function(name){
 		that.emit('username', name);
 	});
 };

 var handleUsername = function(name){
 	var that  = this;
 	//老用户登录
 	this.backService.once('userFound', function(doc){
 		console.info('Welcome back, ' + doc.username + '!');
 		console.info('Options: 1. Learn new words; 2. Review studied words.');
 		that.session = doc;
 		questioner.ask('[1/2]', /^[1-2]$/, function(sel){
 			that.emit('modeSelected', sel);
 		});
 	});

 	//新用户登录
 	this.backService.once('userCreated', function(doc){
 		
 		that.session = doc;
 		console.info('Nice having you here, ' + doc.username + '!')
 		console.info('You can get started by recording new words right here!');
 		that.state = WmInterface.STATE_LEARN;
 		that.seqGenner = new SeqGenner();
 		askNewWord.call(that);
 	});

 	this.backService.handleUsername(name);
 };

 var askNewWord = function(){
 	var that = this;
 	questioner.ask('word[' + this.seqGenner.getSeqId() + ']', 
 			/^(--)?[a-zA-Z]+$/, function(w){
 				if(commandPattern.test(w)){
 					var command = w.substring(2);
 					handlCommand.call(that, command);
 				} else {
 					that.emit('word', w);
 				}
 			});
 };

 var handleWord = function(w){

 	this.backService.handleWord(this.session, w);
 };

 var handlCommand = function(cmd){
 	switch(cmd){
 		case 'bb':
 			process.exit(1);
 			break;
 		case 'nw': //new word
 			askNewWord.call(this);
 			break;
 		case 'rv':  //review
 			initReviewMode.call(this);
 			break;
 		default :
 			break;
 	}
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




