import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runEmbeddings(db, resourceId, chunks) {
    if (chunks.length === 0) return;
    
    // For MVP, we embed the first few chunks combined up to token limit
    const combinedText = chunks.slice(0, 3).join('\n\n').substring(0, 8000);
    
    try {
        const response = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: combinedText
        });
        
        const embedding = response.embeddings[0].values;
        
        // Write to datasets/embeddings_eval.jsonl
        const jsonlLine = JSON.stringify({ query: combinedText.substring(0, 500), expected_resource_id: resourceId }) + '\n';
        fs.appendFileSync('/app/datasets/embeddings_eval.jsonl', jsonlLine);

        const vectorString = '[' + embedding.join(',') + ']';

        await db.query(
            'UPDATE resources SET embedding = $1 WHERE id = $2',
            [vectorString, resourceId]
        );
        console.log(`[Embeddings] Resource ${resourceId} embedded.`);
    } catch (err) {
        console.error(`[Embeddings] Error on resource ${resourceId}:`, err.message);
    }
}
