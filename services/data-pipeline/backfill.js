import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import { extractMarkdown } from './extract.js';
import { chunkByHeading, chunkByQuestion } from './chunk.js';
import { runTagger } from './synthesize/tagger.js';
import { runEmbeddings } from './synthesize/embeddings.js';
import { runExtractor } from './synthesize/extractor.js';

// Ensure dataset directory exists
if (!fs.existsSync('/app/datasets')) {
    fs.mkdirSync('/app/datasets');
}

async function backfillAll() {
    const db = new Client({
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'password',
        host: process.env.POSTGRES_HOST || 'db',
        database: process.env.POSTGRES_DB || 'noto_db',
        port: process.env.POSTGRES_PORT || 5432,
    });

    try {
        await db.connect();
        console.log('[Backfill] Connected to database.');

        // 1. Process Resources (Tagger + Embeddings)
        console.log('[Backfill] Fetching resources...');
        const resourcesResult = await db.query('SELECT id, google_drive_url, type FROM resources');
        const resources = resourcesResult.rows;
        
        for (const resource of resources) {
            console.log(`[Backfill] Processing resource ${resource.id} (${resource.type})...`);
            
            // In a real pipeline, we'd fetch the PDF from google_drive_url or local file_path
            const md = await extractMarkdown(resource.google_drive_url);
            
            if (!md) {
                console.log(`[Backfill] Skipping resource ${resource.id} (empty extraction).`);
                continue;
            }

            const chunks = chunkByHeading(md);
            console.log(`[Backfill] Extracted ${chunks.length} chunks.`);

            await runTagger(db, resource.id, chunks);
            await runEmbeddings(db, resource.id, chunks);
        }

        // 2. Process Past Papers (Extractor) - Stub for now
        console.log('[Backfill] Skipping Past Papers (Schema pending in Phase 4)');

        console.log('[Backfill] Pipeline completed successfully!');

    } catch (err) {
        console.error('[Backfill] Error during pipeline execution:', err);
    } finally {
        await db.end();
    }
}

backfillAll();
