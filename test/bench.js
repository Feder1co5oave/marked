var testing = require('.');

/**
 * Benchmark a function
 */

function bench(name, files, func) {
  var start = Date.now(),
      times = 1000,
      i,
      l = files.length,
      file;

  while (times--) {
    for (i = 0; i < l; i++) {
      file = files[i];
      func(file.markdown);
    }
  }

  console.log('%s completed in %dms.', name, Date.now() - start);
}

/**
 * Benchmark all engines
 */

function runBench(options) {
  options = options || {};
  var files = testing.load(options);
  var marked = require('../');

  // Non-GFM, Non-pedantic
  marked.setOptions({
    gfm: false,
    tables: false,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked', files, marked);

  // GFM
  marked.setOptions({
    gfm: true,
    tables: false,
    breaks: false,
    pedantic: false,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked (gfm)', files, marked);

  // Pedantic
  marked.setOptions({
    gfm: false,
    tables: false,
    breaks: false,
    pedantic: true,
    sanitize: false,
    smartLists: false
  });
  if (options.marked) {
    marked.setOptions(options.marked);
  }
  bench('marked (pedantic)', files, marked);

  // showdown
  try {
    bench('showdown (reuse converter)', files, (function() {
      var Showdown = require('showdown');
      var convert = new Showdown.Converter();
      return function(text) {
        return convert.makeHtml(text);
      };
    })());
    bench('showdown (new converter)', files, (function() {
      var Showdown = require('showdown');
      return function(text) {
        var convert = new Showdown.Converter();
        return convert.makeHtml(text);
      };
    })());
  } catch (e) {
    console.log('Could not bench showdown. (Error: %s)', e.message);
  }

  // markdown-it
  try {
    bench('markdown-it', files, (function() {
      var MarkdownIt = require('markdown-it');
      var md = new MarkdownIt();
      return function(text) {
        return md.render(text);
      };
    })());
  } catch (e) {
    console.log('Could not bench markdown-it. (Error: %s)', e.message);
  }

  // markdown.js
  try {
    bench('markdown.js', files, (function() {
      var markdown = require('markdown').markdown;
      return function(text) {
        return markdown.toHTML(text);
      };
    })());
  } catch (e) {
    console.log('Could not bench markdown.js. (Error: %s)', e.message);
  }

  return true;
}

if (require.main === module) {
	runBench();
}