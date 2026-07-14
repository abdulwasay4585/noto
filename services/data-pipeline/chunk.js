export function chunkByHeading(markdown) {
    // Split on markdown headings (e.g. # Heading, ## Heading)
    const chunks = markdown.split(/^#{1,3}\s/m).filter(Boolean);
    return chunks.map(c => c.trim()).filter(c => c.length > 50);
}

export function chunkByQuestion(markdown) {
    // Split on "Question <num>"
    const chunks = markdown.split(/^Question\s+\d+/im).filter(Boolean);
    return chunks.map(c => c.trim()).filter(c => c.length > 20);
}
