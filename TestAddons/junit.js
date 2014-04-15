/*
 * This needs a lot of cleanup and reorg
 */
QUnit.extend(QUnitRunner.prototype, {
  globalOutput: [],
  outputModuleStart: function(module){
    this.currentModuleOutput = [];
    this.currentModuleTestsOutput = [];
  },
  outputModuleDone: function(module){
    this.currentModuleOutput.push('\t<testsuite name="' + module.name + '" errors="0" failures="' + module.failed + '" tests="' + module.total + '" time="' + (module.endTime - module.startTime) / 1000 + '">');
    
    this.currentModuleOutput = this.currentModuleOutput.concat(this.currentModuleTestsOutput);
    
    this.currentModuleOutput.push('\t</testsuite>');
    
    this.globalOutput = this.globalOutput.concat(this.currentModuleOutput);
  },
  outputTestStart: function(test){
    this.currentTestOutput = [];
    this.testFailures = [];
  },
  outputLog: function(details){
    if (details.result) {
      // currently don't log success?
      return;
    }
    var message = details.message || "";
    if (details.expected) {
      if (message) {
        message += ", ";
      }
      message += "expected: " + details.expected + ", but was: " + details.actual;
    }
    this.testFailures.push('\t\t\t<failure type="failed" message="' + details.message.replace(/ - \{((.|\n)*)\}/, "") + '">');
    if (details.source){
      this.testFailures.push(details.source);
    }
    this.testFailures.push('\t\t\t</failure>');
  },
  outputTestDone: function(test){
    this.currentTestOutput.push('\t\t<testcase classname="' + test.module + '" name="' + test.name + '" time="' + (test.endTime - test.startTime) / 1000 + '">');
    
    this.currentTestOutput = this.currentTestOutput.concat(this.testFailures);

    this.currentTestOutput.push('\t\t</testcase>');
    
    this.currentModuleTestsOutput = this.currentModuleTestsOutput.concat(this.currentTestOutput);
  },
  outputDone: function(details){
    var output = [];
    output.push('<?xml version="1.0" encoding="UTF-8"?>');
    output.push('<testsuites name="testsuites">');
    
    output = output.concat(this.globalOutput);
    
    output.push('</testsuites>');
    
    var xml = output.join("\n");
    
    this.fs.write(this.options.junit, xml, "w");
  }
});
