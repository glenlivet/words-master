 
 var formatDate = function(date){
 	return date.getFullYear().toString()
	+ ((date.getMonth()+1) > 9?(date.getMonth() + 1).toString():('0'+ (date.getMonth() + 1).toString()))
	+ (date.getDate()>9?date.getDate().toString():('0'+ date.getDate().toString()));
 };

 /**
  * 0: 12 hours; 1: 36 hours; 2: 1 week; 3: 1 months; 
  * 4: 3 months; 5: 9 months; －1: done.
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

 exports.update = function(w){
 	if(needReset(w)){
 		resetState(w);
 	} else {
 		nextState(w);
 	}
 };

 var resetState = function(w){
 	var _nextDate = new Date(new Date().getTime() + pattern[0]);
 	w.state = 0;
 	w.nextDate = _nextDate.getTime();
 	w.nextDateLabel = formatDate(_nextDate);
 };

 var nextState = function(w){
 	//阶段 ＋1
 	if(w.state == 5){
 		//该单词学习已经结束
 		w.state = -1;
 		w.nextDate = null;
 		w.nextDateLabel = null;
 	}else {
 		w.state += 1;
 		var _nextDate = calculateNextDate(w);
 		w.nextDate = _nextDate.getTime();
 		w.nextDateLabel = formatDate(_nextDate);
 	}
 	
 };

 /**
  * 计算新的nextDate属性值，根据state值
  */
 var calculateNextDate = function(w){
 	return new Date(new Date().getTime() + pattern[w.state]);
 };


 /**
  * 需要重置词语状态。
  * 当复习单词时间超过了预定复习时间的时长一倍时，重置词语状态，重新学习。
  *
  */
 var needReset = function(w){
 	var _now = new Date().getTime();
 	var diff = _now - w.nextDate;
 	if(diff >= pattern[w.state]){
 		return true;
 	}else {
 		return false;
 	}
 };



