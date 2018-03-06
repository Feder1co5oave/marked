var webdriver = require('selenium-webdriver'),
    needle = require('needle'),
    server = require('../browser');

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

driver.get('http://localhost:8080/index.html').then( () => {
  return driver.findElement(webdriver.By.id('body')).getText().then(log => {
    console.log(log);
    return /0\/\d+ tests failed\./.test(log) ? 0 : 1;
  });
}).then(status => {
  driver.session_.then(session => {
    needle.put(
      'https://fredsoave1:7jAkFfaCgZKuaoMt1SxW@api.browserstack.com/automate/sessions/' + session.id_ + '.json',
      { status: status ? 'failed' : 'passed',
        reason: '' }
    );
  }).then( () => {
    driver.quit().then( () => {
      process.exit(status);
    })
  });
}).catch(err => {
  driver.quit().then( () => {
    console.error(err);
    process.exit(-1);
  })
});
