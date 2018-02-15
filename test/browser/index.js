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