const fs = require('fs');
const path = require('path');

const dir = '/home/abdul/Abdul Wasay/Abdul Wasay Coding/Programming Practice/Web Development/Projects/NOTO/noto_vite_express/src/pages';
const files = fs.readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.tsx')).map(f => path.join(dir, f));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const iconRegex = /<div className="flex items-center gap-2 mb-2">[\s\S]*?<\/div>\s*<h1/g;
  if (iconRegex.test(content)) {
    content = content.replace(iconRegex, '<h1');
    changed = true;
  }

  const badgeRegex = /<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold border"[\s\S]*?NOTO Tutoring\s*<\/div>/g;
  if (badgeRegex.test(content)) {
    content = content.replace(badgeRegex, '');
    changed = true;
  }

  if (content.includes(' — ')) {
    content = content.replace(/ — /g, ' - ');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
