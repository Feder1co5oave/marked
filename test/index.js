#!/usr/bin/env node

/**
 * marked tests
 * Copyright (c) 2011-2013, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/chjj/marked
 */

/**
 * Modules
 */

var fs = require('fs'),
    path = require('path'),
    fm = require('front-matter'),
    g2r = require('glob-to-regexp'),
    HtmlDiffer = require('html-differ').HtmlDiffer,
    htmlDiffer = new HtmlDiffer(),
    diffLogger = require('html-differ/lib/logger'),
    marked = require('../'),
    markedMin = require('../marked.min.js');

/**
 * Load Tests
 */

function load(options) {
  options = options || {};
  var compiled = path.join(__dirname, 'compiled_tests.json'),
      files,
      glob = g2r(options.glob || '*', { extended: true });

  files = options.json
    ? JSON.parse(options.json)
    : JSON.parse(fs.readFileSync(compiled, 'utf8'));

  if (options.glob) {
    files = files.filter(function(test) {
      return glob.test(test.section);
    });
  }

  files.sort(function(a, b) {
    if (a.section < b.section) return -1;
    else if (a.section > b.section) return 1;
    else return a.example - b.example;
  });

  return files;
}

/**
 * Test Runner
 */

function runTests(engine, options) {
  if (typeof engine !== 'function') {
    options = engine;
    engine = marked;
  }

  engine = engine || marked;
  options = options || {};
  var succeeded = 0,
      failed = 0,
      tests = options.files || load(options),
      test,
      testName,
      len,
      errors = '',
      i,
      index = 1,
      oldSection = tests[0].section;

  if (options.marked) {
    marked.setOptions(options.marked);
  }

  tests.push({section: '', markdown: '', html: '', options: {}, example: 0});
  len = tests.length;

  for (i = 0; i < len; i++) {
    test = tests[i];
    testName = test.section + '#' + test.example;
    if (test.section !== oldSection) {
      if (!errors) {
        console.log('#%d. %s succeded.', index, oldSection);
        succeeded++;
      } else {
        console.log('#%d. %s failed.', index, oldSection);
        console.log(errors);
        failed++;
        if (options.stop) {
          break;
        }
      }
      index++;
      errors = '';
      oldSection = test.section;
    }
    errors += testFile(engine, test, testName);
  }

  console.log('\n%d/%d tests completed successfully.', succeeded, index - 1);
  console.log('%d/%d tests failed.', failed, index - 1);

  return !failed;
}

/**
 * Test a file
 */

function testFile(engine, file, name) {
  var opts = Object.keys(file.options),
      text,
      html,
      diff;

  if (marked._original) {
    marked.defaults = marked._original;
    delete marked._original;
  }

  if (opts.length) {
    marked._original = marked.defaults;
    marked.defaults = {};
    Object.keys(marked._original).forEach(function(key) {
      marked.defaults[key] = marked._original[key];
    });
    opts.forEach(function(key) {
      if (marked.defaults.hasOwnProperty(key)) {
        marked.defaults[key] = file.options[key];
      }
    });
  }

  try {
    text = engine(file.markdown);
    html = file.html;
  } catch (e) {
    return name + ' failed.';
  }

  if (text === html) return '';
  diff = htmlDiffer.diffHtml(text, html);
  if (!htmlDiffer.isEqual(text, html)) {
    return ''
      + '\n    ' + name + ' failed.\n'
      + '\n    ' + diffLogger.getDiffText(diff).substring(1)
      + '\n';
  } else {
    return '';
  }
}

/**
 * Markdown Test Suite Fixer
 *   This function is responsible for "fixing"
 *   the markdown test suite. There are
 *   certain aspects of the suite that
 *   are strange or might make tests
 *   fail for reasons unrelated to
 *   conformance.
 */

function fix() {
  var files = [],
      id = 1000;

  // parse original tests
  fs.readdirSync(path.resolve(__dirname, 'original')).forEach(function(file) {
    if (path.extname(file) !== '.md') { return; }
    var markdown = fs.readFileSync(path.resolve(__dirname, 'original', file), 'utf8'),
        name = path.basename(file, '.md'),
        html,
        options;
    try {
      html = fs.readFileSync(path.resolve(
        __dirname,
        'original',
        name + '.html'
      ), 'utf8');
    } catch (ex) {
      console.error('Cannot find original/%s.html', name);
      return;
    }
    html = html.replace(/<(h[1-6])>([^<]+)<\/\1>/g, function(s, h, text) {
      var id = text.toLowerCase().replace(/[^\w]+/g, '-');
      return '<' + h + ' id="' + id + '">' + text + '</' + h + '>';
    }).replace(/='([^\n']*)'(?=[^<>\n]*>)/g, '=&__APOS__;$1&__APOS__;')
      .replace(/="([^\n"]*)"(?=[^<>\n]*>)/g, '=&__QUOT__;$1&__QUOT__;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/&__QUOT__;/g, '"')
      .replace(/&__APOS__;/g, '\'');
    html = html.replace(/(<|&lt;)hr\s*\/(>|&gt;)/g, '$1hr$2');
    markdown = fm(markdown);
    options = markdown.attributes;
    markdown = markdown.body;
    markdown = markdown.replace(/(<|&lt;)hr\s*\/(>|&gt;)/g, '$1hr$2');
    options.gfm = false;
    files.push({
      section: name,
      markdown: markdown,
      html: html,
      options: options,
      example: id++
    });
  });

  // parse new tests
  fs.readdirSync(path.resolve(__dirname, 'new')).forEach(function(file) {
    if (path.extname(file) !== '.md') { return; }
    var markdown = fs.readFileSync(path.resolve(__dirname, 'new', file), 'utf8'),
        name = path.basename(file, '.md'),
        html,
        options,
        subMd,
        subHtml,
        i,
        l;
    try {
      html = fs.readFileSync(path.resolve(
        __dirname,
        'new',
        name + '.html'
      ), 'utf8');
    } catch (ex) {
      console.error('Cannot find new/%s.html', name);
      return;
    }
    markdown = fm(markdown);
    options = markdown.attributes;
    markdown = markdown.body;

    if (options.fixHeadingsId) {
      delete options.fixHeadingsId;
      html = html.replace(/<(h[1-6])>([^<]+)<\/\1>/g, function(s, h, text) {
        var id = text.toLowerCase().replace(/[^\w]+/g, '-');
        return '<' + h + ' id="' + id + '">' + text + '</' + h + '>';
      })
    }

    if (/^### Example \d+\n+/m.test(markdown)) {
      subMd = markdown.split(/^### Example (\d+)\n+/m);
      subHtml = html.split(/^<h3 (?:id="example-\d+")?>Example (\d+)<\/h3>\n+/m);
      if (subMd.length !== subHtml.length) {
        console.error('Non-matching subtests in %s', name);
        return;
      }

      l = subMd.length;
      if (subMd[0].trim()) {
        files.push({
          section: name,
          markdown: subMd[0],
          html: subHtml[0],
          options: options,
          example: id++
        });
      }

      for (i = 1; i < l; i += 2) {
        files.push({
          section: name,
          markdown: subMd[i + 1],
          html: subHtml[i + 1],
          options: options,
          example: +subMd[i]
        });
      }
    } else {
      files.push({
        section: name,
        markdown: markdown,
        html: html,
        options: options,
        example: id++
      });
    }
  });

  fs.writeFileSync(
    path.join(__dirname, 'compiled_tests.json'),
    JSON.stringify(files, null, 2)
  );
}

/**
 * Argument Parsing
 */

function parseArg() {
  var argv = process.argv.slice(2),
      options = {},
      opt = '',
      orphans = [],
      arg;

  function getarg() {
    var arg = argv.shift();

    if (arg.indexOf('--') === 0) {
      // e.g. --opt
      arg = arg.split('=');
      if (arg.length > 1) {
        // e.g. --opt=val
        argv.unshift(arg.slice(1).join('='));
      }
      arg = arg[0];
    } else if (arg[0] === '-') {
      if (arg.length > 2) {
        // e.g. -abc
        argv = arg.substring(1).split('').map(function(ch) {
          return '-' + ch;
        }).concat(argv);
        arg = argv.shift();
      } else {
        // e.g. -a
      }
    } else {
      // e.g. foo
    }

    return arg;
  }

  while (argv.length) {
    arg = getarg();
    switch (arg) {
      case '-f':
      case '--fix':
      case 'fix':
        if (options.fix !== false) {
          options.fix = true;
        }
        break;
      case '--no-fix':
      case 'no-fix':
        options.fix = false;
        break;
      case '-s':
      case '--stop':
        options.stop = true;
        break;
      case '-m':
      case '--minified':
        options.minified = true;
        break;
      case '--glob':
        arg = argv.shift();
        options.glob = arg.replace(/^=/, '');
        break;
      default:
        if (arg.indexOf('--') === 0) {
          opt = camelize(arg.replace(/^--(no-)?/, ''));
          if (!marked.defaults.hasOwnProperty(opt)) {
            continue;
          }
          options.marked = options.marked || {};
          if (arg.indexOf('--no-') === 0) {
            options.marked[opt] = typeof marked.defaults[opt] !== 'boolean'
              ? null
              : false;
          } else {
            options.marked[opt] = typeof marked.defaults[opt] !== 'boolean'
              ? argv.shift()
              : true;
          }
        } else {
          orphans.push(arg);
        }
        break;
    }
  }

  return options;
}

/**
 * Helpers
 */

function camelize(text) {
  return text.replace(/(\w)-(\w)/g, function(_, a, b) {
    return a + b.toUpperCase();
  });
}

/**
 * Main
 */

function main(argv) {
  var opt = parseArg();

  if (opt.fix !== false) {
    fix();
  }

  if (opt.fix) {
    return true;
  }

  if (opt.minified) {
    marked = markedMin;
  }
  return runTests(opt);
}

/**
 * Execute
 */

if (require.main === module) {
  process.title = 'marked';
  process.exit(main(process.argv.slice()) ? 0 : 1);
} else {
  exports = main;
  exports.main = main;
  exports.runTests = runTests;
  exports.testFile = testFile;
  exports.load = load;
  module.exports = exports;
}
