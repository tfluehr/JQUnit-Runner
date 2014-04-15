console.log(243423234234234);
Array.prototype.pushReplace = function(pattern){
  var args = Array.prototype.slice.call(arguments, 1);
  
  this.push(pattern.replace(/\{(\d+)\}/g, function(pattern, index){
    return args[index].toString();
  }));
  return this;
};