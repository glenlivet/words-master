
 var util = require('util'), 
 events = require('events');

 var A = function(){
 	events.EventEmitter.call(this);
 };

 util.inherits(A, events.EventEmitter);

 A.prototype.start = function(){
 	console.log('emiting start event');
 	this.emit('start');
 	console.log('after emiting');
 };


 var B = function(){
 	this.a = new A();
 	this.a.on('start',function(){
 		console.log('A on start!');
 	});
 };

 B.prototype.startA = function(){
 	this.a.start();
 };


 var b = new B();
 b.startA();