const fs = require('fs');
let content = fs.readFileSync('src/pages/MockExam.tsx', 'utf8');

content = content.replace("import ReactMarkdown from 'react-markdown';", "import MarkdownRenderer from '../components/MarkdownRenderer';");

// Use a regular expression that handles the components prop block
content = content.replace(/<ReactMarkdown[^>]*>([\s\S]*?)<\/ReactMarkdown>/g, '<MarkdownRenderer content={$1} />');

fs.writeFileSync('src/pages/MockExam.tsx', content);
console.log('patched mockexam');
