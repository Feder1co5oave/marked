;(function() {

var testMod = require('../'),
    fs = require('fs'),
    files;

var path = require('path');

if (typeof window !== 'undefined' && window.console) {
  window.console._log = window.console.log;
  window.console.log = function(text) {
    var args = Array.prototype.slice.call(arguments, 1),
        i = 0;

    text = text.replace(/%[disoOf]/g, function() {
      return args[i++] || '';
    });

    window.console._log(text);
    document.body.innerHTML += '<pre>' + escape(text) + '</pre>';
  };
}

if (!Object.keys) {
  Object.keys = function(obj) {
    var out = [],
        key;

    for (key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        out.push(key);
      }
    }

    return out;
  };
}

files = fs.readFileSync(path.resolve(__dirname, '../compiled_tests.json'), 'utf8');

function escape(html, encode) {
  return html
    .replace(!encode ? /&(?!#?\w+;)/g : /&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

testMod.runTests({files: testMod.load({json: files})});

})();
