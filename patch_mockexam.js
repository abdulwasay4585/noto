const fs = require('fs');
let content = fs.readFileSync('src/pages/MockExam.tsx', 'utf8');

content = content.replace("import ReactMarkdown from 'react-markdown';", "import MarkdownRenderer from '../components/MarkdownRenderer';");
content = content.replace(/<ReactMarkdown[^>]*>([\s\S]*?)<\/ReactMarkdown>/g, '<MarkdownRenderer content={$1} />');

fs.writeFileSync('src/pages/MockExam.tsx', content);
console.log('patched mockexam');
