var fs = require('fs');
var marked = require('../');

//var nested = [349, 353, 369, 387, 388, 389, 392, 395, 396, 402, 403, 404, 409, 438, 440, 441, 442, 443, 445];

if (process.argv.length !== 3) {
	console.warn(`Usage: node ${__filename} '<test_section>'`);
	console.warn('<test_section> must match one in spec.json');
	process.exit(1);
}

var name = process.argv[2];

var all = JSON.parse(fs.readFileSync('spec.json', 'utf8'));
var md = `${name}\n===================\n\n`;
var html = marked(md) + '\n';

for (var test of all.filter(t => t.section == name )) {
	var heading = `### Example ${test.example}\n`;
	md += heading + '\n' + test.markdown + '\n';
	html += marked(heading) + '\n' + test.html + '\n';
}

var slug = name.toLowerCase().replace(/\s+/, '_');
fs.writeFileSync(`cm_${slug}.md`, md);
fs.writeFileSync(`cm_${slug}.html`, html);

console.log(`Saved in cm_${slug}.md and cm_${slug}.html`);