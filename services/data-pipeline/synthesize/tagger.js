import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runTagger(db, resourceId, chunks) {
    if (chunks.length === 0) return;
    
    // We sample the first substantial chunk for tagging to save tokens in this MVP
    const sampleChunk = chunks[0].substring(0, 2000);
    
    const tagPrompt = `Given this study resource excerpt:\n${sampleChunk}\n\nReturn ONLY a JSON object exactly like this: { "topics": ["topic1", "topic2"], "difficulty": "medium" } (difficulty must be easy, medium, or hard). Do not wrap in markdown tags.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: tagPrompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        let text = response.text || "{}";
        const result = JSON.parse(text);
        const topics = result.topics || [];
        const difficulty = result.difficulty || 'medium';

        // Write to datasets/tags.jsonl
        const jsonlLine = JSON.stringify({ input: sampleChunk, output: result }) + '\n';
        fs.appendFileSync('/app/datasets/tags.jsonl', jsonlLine);

        // Convert array to Postgres syntax
        const pgArray = '{' + topics.map(t => `"${t.replace(/"/g, '""')}"`).join(',') + '}';

        await db.query(
            'UPDATE resources SET topic_tags = $1, difficulty_level = $2 WHERE id = $3',
            [pgArray, difficulty, resourceId]
        );
        console.log(`[Tagger] Resource ${resourceId} tagged: ${topics.join(', ')}`);
    } catch (err) {
        console.error(`[Tagger] Error on resource ${resourceId}:`, err.message);
    }
}
