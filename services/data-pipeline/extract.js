import fs from 'fs';
import pdf from 'pdf-parse';

export async function extractMarkdown(filePathOrUrl) {
    // For MVP: we assume filePathOrUrl is a local file path. 
    // If we need to support Google Drive URLs, we'd add a download step here.
    try {
        if (filePathOrUrl.startsWith('http')) {
            console.log(`[extract] Skipping URL for now, requires download logic: ${filePathOrUrl}`);
            return `Mock extracted content for ${filePathOrUrl}\n# Introduction\nThis is a mock.`;
        }

        const dataBuffer = fs.readFileSync(filePathOrUrl);
        const data = await pdf(dataBuffer);
        
        // Simple heuristic to convert raw text to rough markdown
        let text = data.text;
        // Try to identify headings (lines in ALL CAPS or short lines ending with :)
        text = text.replace(/^[A-Z\s]{4,}$/gm, match => `\n## ${match.trim()}\n`);
        return text;
    } catch (err) {
        console.error(`Error extracting ${filePathOrUrl}:`, err);
        return "";
    }
}
