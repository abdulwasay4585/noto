const fs = require('fs');
let content = fs.readFileSync('src/pages/StudyChat.tsx', 'utf8');

content = content.replace("import remarkMath from 'remark-math';\nimport rehypeKatex from 'rehype-katex';\nimport 'katex/dist/katex.min.css';", "");
content = content.replace(/remarkPlugins=\{\[remarkMath\]\}\s*rehypePlugins=\{\[rehypeKatex\]\}/g, "");

fs.writeFileSync('src/pages/StudyChat.tsx', content);
console.log('patched studychat');
