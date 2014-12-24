 
 var WmService = require('../lib/service.js');

 var backService = new WmService();

 backService.start(function(){
 	var session = {
 		username : 'oll'
 	};
 	var reviewBundle = {
 		words : [],
 		page : 0,
 		wordsPerPage : 10
 	};
 	backService.queryReview(session, reviewBundle);
 });