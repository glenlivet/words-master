 
 var WmService = require('../lib/service.js');

 var backService = new WmService();

 backService.start(function(){
 	// var session = {
 	// 	username : 'oll'
 	// };
 	// var reviewBundle = {
 	// 	words : [],
 	// 	page : 0,
 	// 	wordsPerPage : 10
 	// };
 	// backService.queryReview(session, reviewBundle);

 	testHandleWord(backService);
 });


 var testHandleWord = function(bs){
 	var session = {
 		username : 'kikyou'
 	};
 	bs.on('wordExisted', function(w){
 		console.error(w + ' has already existed!');
 	});
 	bs.handleWord(session, 'impossible');

 }