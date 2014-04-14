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
 * REQUIRED --TestsPath: Path or FileName to Test file(s)
 * 
 * --Addons: Path to any JS or Package file(s) to load before executing tests
 * --AddonsSub: 'true' to process sub folders
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
          throw new Error("ERROR -- Invalid Argument name '" + arg + "'.  Argument names must begin with '--'");
        }
        if (args.length <= index + 1) {
          throw new Error("ERROR -- Missing value for argument '" + arg + "'.");
        }
        
        // passed simple validation so add to our collection.
        options[arg.substr(2)] = args[index + 1];
      }
    });
    this.options = options;
    console.log("SUCCESS -- Initialization and Simple Validation Completed.");
  },
  run: function(){
    this.loadCoreAddons();
    
    this.validateOptions();
    
    console.log("INFO -- Loading QUnit...");
    phantom.injectJs(this.options.QUnitFileName);
    console.log("SUCCESS -- QUnit loaded.");
    
    if (this.options.Addons) {
      console.log("INFO -- Loading Addons");
      this.processFolder(this.options.Addons, this.options.AddonsSub && this.options.AddonsSub == 'true');
      console.log("SUCCESS -- Addons loaded.");
    }
    
    this.startQUnit();
    /*
     * No Errors so we're done
     */
    console.log("SUCCESS -- QUnit Test Runner Completed!");
    phantom.exit(0);
  },
  startQUnit: function(){
    
  },
  loadTests: function(){
    console.log("INFO -- Load Tests");
    if (this.fs.isFile(this.options.Test)) {
      console.log("INFO -- Load test file: " + this.options.Test);
      if (this.fs.isReadable(this.options.Test)) {
        phantom.injectJs(this.options.Test);
      }
      else {
        throw new Error("ERROR -- \"" + this.options.Test + "\" can not be read.");
      }
    }
    else if (this.fs.isDirectory(this.options.Test)) {
      var data = this.fs.list(this.options.tests);
      
      for (var i = 0; i < data.length; i++) {
        if (data[i].indexOf(".js") !== -1) {
          console.log("INFO -- Load test file: " + this.options.tests + this.fs.separator + data[i]);
          phantom.injectJs(this.options.tests + this.fs.separator + data[i]);
        }
      }
    }
    // Now run the tests.
    this.startQunit();
  },
  validateOptions: function(){
    // Required Options
    ["QUnitFileName", "Test"].forEach(function(optionName, index){
      optionName = optionName;
      if (!this.options[optionName]) {
        throw new Error("ERROR -- Missing REQUIRED option '" + optionName + "'. Use the format \"--" + optionName + " optionValue\".");
      }
      if (typeof this["validateOption" + optionName] == 'function') {
        this["validateOption" + optionName](optionName, this.options[optionName]);
      }
    }, this);
    console.log("SUCCESS -- Option Validation Complete.");
  },
  validateOptionQUnitFileName: function(optionName, optionValue){
    if (!this.fs.isFile(optionValue) || !this.fs.isReadable(optionValue)) {
      throw new Error("ERROR -- \"" + optionValue + "\" does not point to a valid file or the file can not be read for option '" + optionName + "'.");
    }
  },
  validateOptionTest: function(optionName, optionValue){
    if (!this.fs.isFile(optionValue) && !this.fs.isDirectory(optionValue)) {
      throw new Error("ERROR -- \"" + optionName + "\" must point to a valid file or directory. '" + this.options.tests + "' cannot be found.");
    }
    else if (!this.fs.isReadable(optionValue)) {
      throw new Error("ERROR -- Cannot read file or directory '" + optionValue + "' for option '" + optionName + "'.");
    }
  },
  loadPackage: function(path, filename){
    if (this.fs.isFile(path + filename) && this.fs.isReadable(path + filename)) {
      console.log("INFO -- Loading JSON Package file: " + path + filename);
      var fileContents = this.fs.read(path + filename);
      var pkg = JSON.parse(fileContents);
      console.log("  INFO -- JSON Package file: '" + (pkg.name || (path + filename)) + "' Loaded");
      for (var key in pkg.scripts) {
        console.log(key);
        if (pkg.scripts.hasOwnProperty(key)) {
          console.log("  INFO -- Injecting: '" + key + "': " + path + pkg.scripts[key]);
          phantom.injectJs(path + pkg.scripts[key]);
        }
      }
    }
    else {
      throw new Error("ERROR -- \"" + filename + "\" does not point to a valid file or the file can not be read for option.");
    }
  },
  endsWith: function(str, suffix){
    return str.toLowerCase().indexOf(suffix, str.length - suffix.length) !== -1;
  },
  processFolder: function(path, subFolders){
    console.log("INFO -- Processing Folder '" + path + "' " + (subFolders ? " With Sub-Folders." : "With Out Sub-Folders."));
    if (this.fs.isDirectory(path)) {
      var fileList = this.fs.list(path);
      
      var hasPackage = fileList.some(function(fileName){
        return this.endsWith(fileName, ".json");
      }, this);
      
      fileList.forEach(function(fileName){
        if (!hasPackage && this.endsWith(fileName, ".js")) {
          console.log("INFO -- Loading JS file: " + path + fileName);
          phantom.injectJs(path + fileName);
        }
        else if (hasPackage && this.endsWith(fileName, ".json")) {
          this.loadPackage(path, fileName);
        }
        else if (subFolders && fileName !== "." && fileName !== ".." && this.fs.isDirectory(path + fileName)){
          this.processFolder(path + fileName, subFolders);
        }
      }, this);
    }
    else {
      throw new Error("ERROR -- Cannot read directory '" + path + "'.");
    }
  },
  loadCoreAddons: function(){
    this.processFolder(phantom.libraryPath + "/CoreAddons/");
  }
};

(new QUnitRunner()).run();
