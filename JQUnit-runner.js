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
 * REQUIRED --QUnitFileName: Path and file name for QUnit.js
 * REQUIRED --Test: Path or FileName to Test file(s)
 *
 * --Addons: Path to any JS or Package file(s) to load before executing tests
 * --AddonsSub: 'true' to process sub folders
 * --Debug: 'true' to output console messages
 *
 * --OutputProcessor: file to load that will process the output of the runner for creating any format needed.
 */
/*
 * OutputProcessor
 *
 * methods correspond to QUnit's callbacks http://api.qunitjs.com/category/callbacks/
 *
 * arguments passed to the functions are the same as QUnit with the addition of startTime/endTime properties for module/test start/end
 *
 * Methods that it can use:
 *
 *  outputBegin, outputModuleStart, outputModuleDone, outputTestStart, outputTestDone, outputDone
 *
 */
/*
 * catch any unhandled errors and report to console.
 *
 * TODO - Log to Jenkins
 */
phantom.onError = function(msg, trace){
  /*
   * pulled from Phantom example
   */
  var msgStack = [msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t){
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t["function"] ? ' (in function ' + t["function"] + ')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
};

function QUnitRunner(){
  /*
   * setup globals and do basic validation on arguments
   */
  this.QUnitOptions = {};
  
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
      if (index % 2 === 0) {
        // even so should be our key name      
        if (arg.substr(0, 2) != "--") {
          this.error("ERROR -- Invalid Argument name '" + arg + "'.  Argument names must begin with '--'");
        }
        if (args.length <= index + 1) {
          this.error("ERROR -- Missing value for argument '" + arg + "'.");
        }
        
        // passed simple validation so add to our collection.
        options[arg.substr(2)] = args[index + 1];
      }
    });
    this.options = options;
    
    this.loadCoreAddons();
    
    this.debug("SUCCESS -- Initialization and Simple Validation Completed.");
  },
  error: function(msg){
    console.error(msg);
    phantom.exit(1);
  },
  debug: function(){
    if (this.options.Debug === "true") {
      var val = Array.prototype.slice.call(arguments, 0).join(" ");
      console.log(val + "\n");
    }
  },
  run: function(){
    this.validateOptions();
    
    this.debug("INFO -- Loading QUnit...");
    phantom.injectJs(this.options.QUnitFileName);
    this.debug("SUCCESS -- QUnit loaded.");
    
    if (this.options.OutputProcessor) {
      this.debug("INFO -- Loading Output Processor: " + this.options.OutputProcessor);
      phantom.injectJs(this.options.OutputProcessor);
      this.debug("SUCCESS -- Output Processor: " + this.options.OutputProcessor);
    }
    
    this.startTests();
  },
  startTests: function(){
    this.currentModule = {};
    this.anonCounter = 0;
    
    // reset all options
    QUnit.init();
    QUnit.config.autostart = false;
    
    // binding Callbacks
    //    QUnit.begin(this.qUnitBegin.bind(this)); // does not fire so call directly below
    QUnit.done(this.qUnitDone.bind(this));
    QUnit.log(this.qUnitLog.bind(this));
    QUnit.moduleDone(this.qUnitModuleDone.bind(this));
    QUnit.moduleStart(this.qUnitModuleStart.bind(this));
    QUnit.testDone(this.qUnitTestDone.bind(this));
    QUnit.testStart(this.qUnitTestStart.bind(this));
    
    // load any addons
    if (this.options.Addons) {
      this.debug("INFO -- Loading Addons");
      this.processFolder({
        path: this.options.Addons,
        subFolders: this.options.AddonsSub && this.options.AddonsSub == 'true'
      });
      this.debug("SUCCESS -- Addons loaded.");
    }
    
    module("Anonymous_Module"); // this is here in case there are no modules specified in the tests.
    // currently need a module so we can process the logs correctly.  Will work on changing things once I have everything else working
    this.qUnitBegin(); // call directly because qunits callback does not fire. 
    this.loadTests();
    
    // Execute tests
    QUnit.start();
  },
  waitFor: function(testFx, onReady, timeOutMillis){
    // pulled from phantomjs example
    var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3000; //< Default Max Timout is 3s
    var start = new Date().getTime();
    var condition = false;
    var interval = setInterval(function(){
      if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
        // If not time-out yet and condition not yet fulfilled
        condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
      }
      else {
        if (!condition) {
          // If condition still not fulfilled (timeout but condition is 'false')
          this.debug("'waitFor()' timeout");
          phantom.exit(1);
        }
        else {
          // Condition fulfilled (timeout and/or condition is 'true')
          this.debug("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
          typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
          clearInterval(interval); //< Stop this interval
        }
      }
    }, 250); //< repeat check every 250ms
  },
  outputGlobalStart: function(){
    
  },
  outputBegin: function(){
    },
  outputModuleStart: function(){
    },
  outputTestStart: function(){
    },
  outputModuleDone: function(){
    },
  outputTestDone: function(){
    },
  outputDone: function(){
    },
  qUnitBegin: function(){
    this.outputBegin();
  },
  outputGlobalDone: function(){
    
  },
  qUnitDone: function(details){
    this.debug("All Tests Completed - Total: ", details.total, " Failed: ", details.failed, " Passed: ", details.passed, " Runtime: ", details.runtime, "ms");
    details.name = this.options.Test;
    this.outputDone(details);
    
    phantom.exit(details.failed);
  },
  qUnitLog: function(details){
    this.debug(details.result, details.actual, details.expected, details.message, details.source, details.name);
    this.outputLog(details);
  },
  qUnitModuleDone: function(details){
    if (details.name !== this.currentModule.name) {
      this.error("ERROR -- Module names do not match in moduleDone - module.name: '" + module.name + "', currentModule.name: '" + this.currentModule.name + "'.");
    }
    
    details.endTime = new Date();
    
    QUnit.extend(details, this.currentModule);
    
    this.outputModuleDone(details);
    this.currentModule = null;
  },
  qUnitModuleStart: function(details){
    details.startTime = new Date();
    
    this.currentModule = details;
    
    this.outputModuleStart(details);
  },
  qUnitTestDone: function(details){
    this.debug("Completed Test - '" + details.name + "'\t\t in Module '" + details.module + "' \t\tTotal: ", details.total, " Failed: ", details.failed, " Passed: ", details.passed, " Runtime: ", details.runtime, "ms");
    
    details.endTime = new Date();
    
    QUnit.extend(details, this.currentTest);
    
    this.outputTestDone(details);
  },
  qUnitTestStart: function(details){
    this.debug("qUnitTestStart - ", details.name, " Total: ", details.total, " Failed: ", details.failed, " Passed: ", details.passed, " Runtime: ", details.runtime);
    details.startTime = new Date();
    
    this.currentTest = details;
    
    this.outputTestStart(details);
  },
  loadTests: function(){
    if (this.fs.isFile(this.options.Test)) {
      this.debug("INFO -- Load test file: " + this.options.Test);
      if (this.fs.isReadable(this.options.Test)) {
        phantom.injectJs(this.options.Test);
      }
      else {
        this.error("ERROR -- \"" + this.options.Test + "\" can not be read.");
      }
    }
    else if (this.fs.isDirectory(this.options.Test)) {
      this.processFolder({
        path: this.options.Test,
        ext: ".Test.js"
      });
    }
    this.debug('INFO -- Tests loaded');
  },
  validateOptions: function(){
    // Required Options
    ["QUnitFileName", "Test"].forEach(function(optionName, index){
      optionName = optionName;
      if (!this.options[optionName]) {
        this.error("ERROR -- Missing REQUIRED option '" + optionName + "'. Use the format \"--" + optionName + " optionValue\".");
      }
      if (typeof this["validateOption" + optionName] == 'function') {
        this["validateOption" + optionName](optionName, this.options[optionName]);
      }
    }, this);
    this.debug("SUCCESS -- Option Validation Complete.");
  },
  validateOptionQUnitFileName: function(optionName, optionValue){
    if (!this.fs.isFile(optionValue) || !this.fs.isReadable(optionValue)) {
      this.error("ERROR -- \"" + optionValue + "\" does not point to a valid file or the file can not be read for option '" + optionName + "'.");
    }
  },
  validateOptionTest: function(optionName, optionValue){
    if (!this.fs.isFile(optionValue) && !this.fs.isDirectory(optionValue)) {
      this.error("ERROR -- \"" + optionName + "\" must point to a valid file or directory. '" + this.options.tests + "' cannot be found.");
    }
    else if (!this.fs.isReadable(optionValue)) {
      this.error("ERROR -- Cannot read file or directory '" + optionValue + "' for option '" + optionName + "'.");
    }
  },
  loadPackage: function(path, filename){
    if (this.fs.isFile(path + filename) && this.fs.isReadable(path + filename)) {
      this.debug("INFO -- Loading JSON Package file: " + path + filename);
      var fileContents = this.fs.read(path + filename);
      var pkg = JSON.parse(fileContents);
      this.debug("  INFO -- JSON Package file: '" + (pkg.name || (path + filename)) + "' Loaded");
      for (var key in pkg.scripts) {
        if (pkg.scripts.hasOwnProperty(key)) {
          this.debug("  INFO -- Injecting: '" + key + "': " + path + pkg.scripts[key]);
          phantom.injectJs(path + pkg.scripts[key]);
        }
      }
    }
    else {
      this.error("ERROR -- \"" + filename + "\" does not point to a valid file or the file can not be read for option.");
    }
  },
  endsWith: function(str, suffix){
    return str.toLowerCase().indexOf(suffix.toLowerCase(), str.length - suffix.length) !== -1;
  },
  processFolder: function(options){
    var path = typeof options === 'string' ? options : options.path;
    this.debug("INFO -- Processing Folder '" + path + "' " + (options.subFolders ? " With Sub-Folders." : "With Out Sub-Folders."));
    if (this.fs.isDirectory(path)) {
      path = this.fs.absolute(path) + "/";
      var fileList = this.fs.list(path);
      
      var hasPackage = fileList.some(function(filename){
        return this.endsWith(filename, ".json");
      }, this);
      
      fileList.forEach(function(filename){
        if (!hasPackage && this.endsWith(filename, options.ext || ".js")) {
          this.debug("INFO -- Loading JS file: " + path + filename);
          if (this.fs.isFile(path + filename) && this.fs.isReadable(path + filename)) {
            phantom.injectJs(path + filename);
          }
          else {
            this.error("ERROR -- Cannot read file or directory '" + path + filename + "'.");
          }
        }
        else if (hasPackage && this.endsWith(filename, ".json")) {
          this.loadPackage(path, filename);
        }
        else if (options.subFolders && filename !== "." && filename !== ".." && this.fs.isDirectory(path + filename)) {
          this.processFolder({
            path: path + filename,
            subFolders: options.subFolders,
            ext: options.ext
          });
        }
      }, this);
    }
    else {
      this.error("ERROR -- Cannot read directory '" + path + "'.");
    }
  },
  loadCoreAddons: function(){
    this.processFolder(phantom.libraryPath + "/CoreAddons");
  }
};

(new QUnitRunner()).run();
