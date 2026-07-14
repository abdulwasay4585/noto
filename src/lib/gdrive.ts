// src/lib/gdrive.ts
// Google Drive URL normalization utilities

/**
 * Extract the file ID from any Google Drive sharing URL format.
 * Handles: /file/d/FILE_ID/view, /open?id=FILE_ID, /uc?id=FILE_ID, ?id=FILE_ID
 */
export function normalizeGDriveUrl(rawUrl: string): string {
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /drive\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = rawUrl.match(pattern);
    if (match) return match[1];
  }
  throw new Error('Could not extract file ID from Google Drive URL');
}

/**
 * Returns an embeddable preview URL for a Drive file.
 */
export function getEmbedUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Returns a thumbnail URL for a Drive file (w400 resolution).
 * NOTE: The file must be shared with "Anyone with the link can view".
 */
export function getThumbnailUrl(fileId: string): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}

/**
 * Returns the standard viewer URL for a Drive file.
 */
export function getViewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Convenience: parse any Drive URL and return all derived URLs.
 * Returns null if the URL is not a recognizable Google Drive URL.
 */
export function parseDriveUrl(rawUrl: string): {
  fileId: string;
  viewUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
} | null {
  try {
    const fileId = normalizeGDriveUrl(rawUrl);
    return {
      fileId,
      viewUrl:      getViewUrl(fileId),
      embedUrl:     getEmbedUrl(fileId),
      thumbnailUrl: getThumbnailUrl(fileId),
    };
  } catch {
    return null;
  }
}
