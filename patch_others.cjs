const fs = require('fs');

['src/pages/StudyChat.tsx', 'src/pages/ResourceDetail.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace("import ReactMarkdown from 'react-markdown';", "import MarkdownRenderer from '../components/MarkdownRenderer';");
  
  // replace <ReactMarkdown>...</ReactMarkdown> with <MarkdownRenderer content={...} />
  content = content.replace(/<ReactMarkdown>\s*{([^}]*)}\s*<\/ReactMarkdown>/g, '<MarkdownRenderer content={$1} />');
  
  fs.writeFileSync(file, content);
});
console.log('patched other files');
