
 /**
  * Sequence Generator.
  */
 var SeqGenner = module.exports = function SeqGenner(){
 	this.index = 0;
 };

 SeqGenner.prototype.getSeqId = function(){
 	return ++this.index;
 };

 SeqGenner.prototype.reset = function(){
 	this.index = 0;
 };

