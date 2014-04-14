QUnitRunner.prototype.outputCache = {
  suite: [],
  tests: []
};

QUnitRunner.prototype.outputModuleStart = function(module){
  console.log('m start');
  // clear cache for next module
  this.outputCache.tests = [];
};

QUnitRunner.prototype.outputModuleDone = function(module){
  console.log("INFO -- Module Done Output: '" + module.name + "'.");
  // context = { name, failed, passed, total }
  this.outputCache.suite.push('\t<testsuite name="' + module.name + '" errors="0" failures="' + module.failed + '" tests="' + module.total + '" time="' + (module.endTime - module.startTime) / 1000 + '">');
  this.outputCache.tests.forEach(function(testXML){
    this.outputCache.suite.push(testXML);
  }, this);
  this.outputCache.suite.push('\t</testsuite>');
};

QUnitRunner.prototype.outputTestStart = function(test){
  console.log('t start');
  // clear cache for next module
  //this.outputCache.tests = [];
};

QUnitRunner.prototype.outputTestDone = function(test){
  console.log('t end');
  // clear cache for next module
//  this.outputCache.tests = [];
};