/*
 * Tim Fluehr - Notes:
 * 
 * resource - https://gist.github.com/gcoop/1588423
 * resource - https://code.google.com/p/phantomjs-qunit-runner/source/browse/trunk/src/main/resources/phantomjs-qunit-runner.js
 * 
 * Phantom API - http://phantomjs.org/api/
 */
/*
 * Arguments:
 * 
 * --QUnitFileName: Path and file name for QUnit.js
 * --TestsPath: Path to Test files
 */

/*
 * catch any unhandled errors and report to console.
 * 
 * TODO - Log to Jenkins
 */
phantom.onError = function(msg, trace) {
  /*
   * pulled from Phantom example
   */
  var msgStack = ['PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t["function"] ? ' (in function ' + t["function"] +')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
};

function QUnitRunner() {
  /*
   * setup globals and do basic validation on arguments
   */
  this.initialize();
}

QUnitRunner.prototype = {
  initialize: function(){
    this.system = require('system');
    this.fs = require("fs");
    
    var args = JSON.parse(JSON.stringify(this.system.args));
    args.splice(0, 1); // remove first element because it is just the name of this file.
    
    var options = {};
    args.forEach(function(arg, index){
      if (index % 2 === 0){
        // even so should be our key name      
        if (arg.substr(0, 2) != "--"){
          throw new Error("Invalid Argument name '" + arg + "'.  Argument names must begin with '--'");
        }
        if (args.length <= index + 1){
          throw new Error("Missing value for argument '" + arg + "'.");
        }
        
        // passed simple validation so add to our collection.
        options[arg.substr(2).toUpperCase()] = args[index + 1];
      }
    });
    this.options = options;
    console.log("Initialization and Simple Validation Completed Successfully.");
  },
  run: function(){
    this.loadPolyfills();
    
    this.validateOptions();
    
    /*
     * No Errors so we're done
     */
    console.log("QUnit Test Runner Completed Successfully!");
    phantom.exit(0);
  },
  validateOptions: function(){
    // Required Options
    ["QUnitFileName", "TestsPath"].forEach(function(optionName, index){
      optionName = optionName.toUpperCase();
      if (!this.options[optionName]){
        throw new Error("Missing REQUIRED option '" + optionName + "'.");
      }
      if (typeof this["validateOption" + optionName] == 'function'){
        this["validateOption" + optionName]();
      }
    }.bind(this));
  },
  validateOptionqunitfilename: function(){
    console.log(123);
  },
  loadPolyfills: function(){
    var path = phantom.libraryPath + "/polyfills/";
    if (this.fs.isDirectory(path)) {
      var fileList = this.fs.list(path);
      
      fileList.forEach(function(fileName){
        if (fileName.indexOf(".js") !== -1) {
          console.log("Load Polyfill file: " + fileName);
          phantom.injectJs(path + fileName);
        }
      });
    }
  }
};

(new QUnitRunner()).run();