var webdriver = require('selenium-webdriver');
require('../browser');

// Input capabilities
var capabilities = {
 'browserName': 'IE',
 'browser_version': '11.0',
 'os': 'Windows',
 'os_version': '10',
 'resolution': '1920x1080',
 'project': 'marked/' + process.env['TRAVIS_BRANCH'],
 'build': process.env['TRAVIS_JOB_NUMBER'],
 'browserstack.user': 'fredsoave1',
 'browserstack.key': '7jAkFfaCgZKuaoMt1SxW',
 'browserstack.local': 'true',
 'browserstack.localIdentifier': process.env['BROWSERSTACK_LOCAL_IDENTIFIER']
};

var driver = new webdriver.Builder()
  .usingServer('http://hub-cloud.browserstack.com/wd/hub')
  .withCapabilities(capabilities)
  .build();

driver.get('http://localhost:8080').then(function(){
  driver.findElement(webdriver.By.id('body')).getText().then(function(log){
    console.log(log);
    driver.quit().then(function() {
      if (/0\/\d+ tests failed\./.test(log)) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    });
  }, function(err) {
    driver.quit().then(function() {
      console.error(err);
      process.exit(-1);
    })
  });
});