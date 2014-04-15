/*
 * NUnit version 2.6
 */
QUnit.extend(QUnitRunner.prototype, {
  globalOutput: [],
  outputModuleStart: function(module){
    this.currentModuleOutput = [];
    this.currentModuleTestsOutput = [];
  },
  outputModuleDone: function(module){
    this.currentModuleOutput.pushReplace('<test-suite name="{0}" type="Module" executed="True" result="{1}" success="{2}" time="{3}" asserts="{4}">', module.name, module.failed ? "Failure" : "Success", module.failed ? "False" : "True", (module.endTime - module.startTime) / 1000, module.total);
    this.currentModuleOutput.push("<results>");
    this.currentModuleOutput = this.currentModuleOutput.concat(this.currentModuleTestsOutput);
    this.currentModuleOutput.push("</results>");
    this.currentModuleOutput.push('</test-suite>');
    
    this.globalOutput = this.globalOutput.concat(this.currentModuleOutput);
  },
  outputTestStart: function(test){
    this.currentTestOutput = [];
    this.testFailures = [];
  },
  outputLog: function(details){
    if (details.result) {
      // currently don't log success of assertion?
      return;
    }
    var message = details.message || "";
    if (details.expected) {
      if (message) {
        message += ", ";
      }
      message += "expected: " + QUnit.jsDump.parse(details.expected) + ", but was: " + QUnit.jsDump.parse(details.actual);
    }
    
    this.testFailures.push('<failure>');
    this.testFailures.pushReplace('<message><![CDATA[{0}]]></message>', message);
  
    if (details.source){
      this.testFailures.pushReplace('<stack-trace><![CDATA[{0}]]></stack-trace>', details.source);
    }
    
    this.testFailures.push('</failure>');
  },
  outputTestDone: function(test){
    this.currentTestOutput.pushReplace('<test-case name="{0}" executed="True" result="{1}" success="{2}" time="{3}" asserts="{4}">', test.name, test.failed ? "Error" : "Success", test.failed ? "False" : "True", test.duration/1000, test.total);
    
    this.currentTestOutput = this.currentTestOutput.concat(this.testFailures);

    this.currentTestOutput.push('</test-case>');
    
    this.currentModuleTestsOutput = this.currentModuleTestsOutput.concat(this.currentTestOutput);
  },
  outputDone: function(details){
    var env = this.system.env;

    if (this.fs.isDirectory(details.name)) {
      details.name = this.fs.absolute(details.name);
    }

    var output = [];
    output.push('<?xml version="1.0" encoding="utf-8" standalone="no"?>');
    output.pushReplace('<test-results name="{0}" total="{1}" failures="{2}">', details.name, details.total, details.failed);
    //nunit-version="2.6.0.12035" clr-version="2.0.50727.4963" 
    output.pushReplace('<environment platform="{0}" machine-name="{1}" user="{2}" user-domain="{3}" />', env.OS, env.COMPUTERNAME, env.USERNAME, env.USERDOMAIN);

    output = output.concat(this.globalOutput);
    
    output.push('</test-results>');
    
    var xml = output.join("\n");
    this.fs.write(this.options.junit, xml, "w");
  }
});
