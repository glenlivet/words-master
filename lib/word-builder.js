 
 var formatDate = function(date){
 	return date.getFullYear().toString()
	+ ((date.getMonth()+1) > 9?(date.getMonth() + 1).toString():('0'+ (date.getMonth() + 1).toString()))
	+ (date.getDate()>9?date.getDate().toString():('0'+ date.getDate().toString()));
 };

 /**
  * 0: 12 hours; 1: 36 hours; 2: 1 week; 3: 1 months; 
  * 4: 3 months; 5: 9 months;
  */
 var pattern = [1000*60*60*12, 1000*60*60*36, 
 			   1000*60*60*24*7, 1000*60*60*24*31, 
 			   1000*60*60*24*31*3, 1000*60*60*24*31*9];

 exports.gen = function(w){
 	var date = new Date();
 	var dateLabel = formatDate(date);
 	var _nextDate = new Date(date.getTime() + pattern[0]);
 	var _nextDateLabel = formatDate(_nextDate);
 	var rtn = {
 		spell : w,
 		state : 0,
 		inDate : date.getTime(),
 		inDateLabel : formatDate(date),
 		nextDate : _nextDate.getTime(),
 		nextDateLabel : _nextDateLabel,
 		examples : []
 	}
 	return rtn;
 };