/*
 * This needs a lot of cleanup and reorg
 */
QUnit.extend(QUnitRunner.prototype, {
  outputCache: {
    suite: [],
    tests: [],
    currentTest: []
  },
  outputModuleStart: function(module){
    this.outputCache.tests = [];
  },
  outputModuleDone: function(module){
    this.outputCache.suite.push('\t<testsuite name="' + module.name + '" errors="0" failures="' + module.failed + '" tests="' + module.total + '" time="' + (module.endTime - module.startTime) / 1000 + '">');
    this.outputCache.tests.forEach(function(testXML){
      this.outputCache.suite.push(testXML);
    }, this);
    this.outputCache.suite.push('\t</testsuite>');
  },
  outputTestStart: function(test){
    this.outputCache.currentTest = [];
  },
  outputLog: function(details){
    var message = details.message || "";
    if (details.expected) {
      if (message) {
        message += ", ";
      }
      message += "expected: " + details.expected + ", but was: " + details.actual;
    }
    var xml = '<failure type="failed" message="' + details.message.replace(/ - \{((.|\n)*)\}/, "") + '"/>\n';
    
    this.outputCache.currentTest.push(xml);
  },
  outputTestDone: function(test){
    var cache = [];
    cache.push('\t\t<testcase classname="' + test.module + '" name="' + test.name + '" time="' + (test.endDate - test.startDate) / 1000 + '">');
    for (var i = 0; i < this.outputCache.currentTest.length; i++) {
      cache.push("\t\t\t" + this.outputCache.currentTest[i]);
    }
    cache.push('\t\t</testcase>\n');
    
    this.outputCache.tests.push(cache.join(''));
  }
});

//QUnitRunner.prototype.outputCache = {
//  suite: [],
//  tests: [],
//  currentTest: []
//};
//
//QUnitRunner.prototype.outputModuleStart = function(module){
//  console.log('m start');
//  // clear cache for next module
//  this.outputCache.tests = [];
//};
//
//QUnitRunner.prototype.outputModuleDone = function(module){
//  console.log("INFO -- Module Done Output: '" + module.name + "'.");
//  // context = { name, failed, passed, total }
//  this.outputCache.suite.push('\t<testsuite name="' + module.name + '" errors="0" failures="' + module.failed + '" tests="' + module.total + '" time="' + (module.endTime - module.startTime) / 1000 + '">');
//  this.outputCache.tests.forEach(function(testXML){
//    this.outputCache.suite.push(testXML);
//  }, this);
//  this.outputCache.suite.push('\t</testsuite>');
//};
//
//QUnitRunner.prototype.outputTestStart = function(test){
//  console.log('t start');
//  this.outputCache.currentTest = [];
//  // clear cache for next module
//  //this.outputCache.tests = [];
//};
//QUnitRunner.prototype.outputLog = function(details){
//  console.log('log');
//  var message = details.message || "";
//  if (details.expected) {
//    if (message) {
//      message += ", ";
//    }
//    message += "expected: " + details.expected + ", but was: " + details.actual;
//  }
//  console.log(134123423);
//  var xml = '<failure type="failed" message="' + details.message.replace(/ - \{((.|\n)*)\}/, "") + '"/>\n';
//  
//  this.outputCache.currentTest.push(xml);
//};
//QUnitRunner.prototype.outputTestDone = function(test){
//  console.log('t end');
//  var cache = [];
//  cache.push('\t\t<testcase classname="' + test.module + '" name="' + test.name + '" time="' + (test.endDate - test.startDate) / 1000 + '">');
//  //  if (result.failed) {
//  for (var i = 0; i < this.outputCache.currentTest.length; i++) {
//    cache.push("\t\t\t" + this.outputCache.currentTest[i]);
//  }
//  
//  //  }
//  //  else {
//  //    xml += '/>\n';
//  //  }
//  cache.push('\t\t</testcase>\n');
//  
//  console.log("**********************");
//  this.outputCache.tests.push(cache.join(''));
//};
