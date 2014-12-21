/**
 * The front'end object. 
 */

 var util = require('util'), 
 events = require('events'),
 questioner = require('./questioner.js'),
 WmService = require('./service.js');

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
 	this.on('inited', this.askUsername);
 	this.on('username', this.handleUsername);
 };

 WmInterface.prototype.init = function(){
 	this.backService = new WmService();
 	var that = this;
 	this.backService.on('dberr', function(msg){
 		console.error('--------------------');
 		console.error(msg);
 		console.error('--------------------');
 	});
 	this.setListeners();
 	this.backService.start(function(){
 		that.emit('inited');
 	});
 };

 WmInterface.prototype.askUsername = function(){
 	var that  = this;
 	console.info('May I have your name please!');
 	questioner.ask('username', /^\w+$/, function(name){
 		that.emit('username', name);
 	});
 };

 WmInterface.prototype.handleUsername = function(name){
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
 		var that = this;
 		console.info('Nice having you here, ' + doc.username + '!')
 		console.info('Tell me more about you?');
 		questioner.ask('[Y/N]',/^[YyNn]$/, function(sel){
 			if(sel == 'Y' || sel == 'y'){
 				//询问更多信息
 			} else {
 				//询问单词
 				console.info('You can get started by recording new words right here!');
 				that.state = WmInterface.STATE_LEARN;
 				
 			}
 		});
 	});

 	this.backService.handleUsername(name);
 };






