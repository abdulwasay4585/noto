const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('/home/abdul/Abdul Wasay/Abdul Wasay Coding/Programming Practice/Web Development/Projects/NOTO/noto_vite_express/src');

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // We want to remove the tag block that matches <span ... tracking-widest ... noto-primary ...> ... </span>
    // Usually it looks like:
    // <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--noto-primary)' }}>
    //   Some Text
    // </span>
    
    const regex = /<\w+\s+className="[^"]*uppercase tracking-widest[^"]*"[^>]*color:\s*'var\(--noto-primary\)'[^>]*>\s*[^<]+\s*<\/\w+>/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, '');
        fs.writeFileSync(file, content, 'utf8');
        console.log('Modified', file);
        count++;
    }
});

console.log('Modified', count, 'files');
