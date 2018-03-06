var http = require('http'),
    fs = require('fs');

http.createServer(function(req, res) {
  try {
    var file = fs.readFileSync(__dirname + req.url);
    res.writeHead(200);
    res.end(file);
  } catch (e) {
    res.writeHead(404);
    res.end();
  }
}).listen(8080);

if (require.main === module) {
  console.log('Did you remember to `npm run bundle`?')
  console.log('Browse to http://localhost:8080/index.html to run the test suite.');
  console.log('Type ^C to exit.')
}
