import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runExtractor(db, paperId, chunks) {
    if (chunks.length === 0) return;
    
    console.log(`[Extractor] Stub: extracting questions for paper ${paperId} (Schema pending Phase 4)`);
    
    // In full implementation, we iterate through chunks (which are individual questions)
    // and prompt Gemini to extract structured data (marks, tags, text).
    const sampleChunk = chunks[0];
    const jsonlLine = JSON.stringify({ 
        input: sampleChunk, 
        output: { question_number: 1, marks: 5, topic_tags: ["Stub"], text: sampleChunk.substring(0, 50) } 
    }) + '\n';
    
    fs.appendFileSync('/app/datasets/questions.jsonl', jsonlLine);
}
