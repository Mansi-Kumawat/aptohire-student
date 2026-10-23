import { formatSeconds } from './format';

export const ALLOWED_DOC_EXTENSIONS = ['pdf', 'docx', 'md', 'zip'] as const;
export const MAX_DOC_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_DOC_COUNT = 5;

export type DocExtension = (typeof ALLOWED_DOC_EXTENSIONS)[number];

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * Checks file signature (magic bytes) against extension.
 * %PDF (25 50 44 46) for PDF
 * PK (50 4B) for DOCX and ZIP
 * UTF-8 text for MD
 */
export async function validateMagicBytes(file: File): Promise<{ valid: boolean; error?: string }> {
  const ext = getFileExtension(file.name);

  if (!ALLOWED_DOC_EXTENSIONS.includes(ext as DocExtension)) {
    return { valid: false, error: `Files must be .pdf, .docx, .md, or .zip` };
  }

  if (file.size > MAX_DOC_SIZE_BYTES) {
    return { valid: false, error: `File is larger than 20 MB limit.` };
  }

  try {
    let buffer: ArrayBuffer;
    const sliced = file.slice(0, 8) as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> };
    if (typeof sliced.arrayBuffer === 'function') {
      try {
        buffer = await sliced.arrayBuffer();
      } catch {
        const full = await file.arrayBuffer();
        buffer = full.slice(0, 8);
      }
    } else if (typeof file.arrayBuffer === 'function') {
      const full = await file.arrayBuffer();
      buffer = full.slice(0, 8);
    } else {
      buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file.slice ? file.slice(0, 8) : file);
      });
    }
    const bytes = new Uint8Array(buffer);

    if (ext === 'pdf') {
      // %PDF header: 0x25, 0x50, 0x44, 0x46
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        return { valid: true };
      }
      return { valid: false, error: 'File content does not match PDF format.' };
    }

    if (ext === 'docx' || ext === 'zip') {
      // PK header: 0x50, 0x4B
      if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
        return { valid: true };
      }
      return { valid: false, error: `File content does not match ${ext.toUpperCase()} format.` };
    }

    if (ext === 'md') {
      // Read a chunk as text to ensure valid UTF-8
      const textDecoder = new TextDecoder('utf-8', { fatal: true });
      try {
        textDecoder.decode(buffer);
        return { valid: true };
      } catch {
        return { valid: false, error: 'Markdown file must be valid UTF-8 text.' };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Unable to verify file signature.' };
  }
}

export function validateVideoFile(
  file: File,
  maxMb: number,
  maxSeconds: number,
  actualDurationSeconds?: number
): { valid: boolean; error?: string } {
  const ext = getFileExtension(file.name);
  const allowed = ['mp4', 'webm', 'mov'];
  if (!allowed.includes(ext)) {
    return {
      valid: false,
      error: 'Demo video must be in MP4, WebM, or MOV format.',
    };
  }

  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    const actualMb = Math.round(file.size / (1024 * 1024));
    return {
      valid: false,
      error: `This video is ${actualMb} MB. The limit is ${maxMb} MB. Compress it and upload again.`,
    };
  }

  if (actualDurationSeconds !== undefined && actualDurationSeconds > maxSeconds) {
    const actualFormatted = formatSeconds(actualDurationSeconds);
    const limitFormatted = formatSeconds(maxSeconds);
    return {
      valid: false,
      error: `This video is ${actualFormatted}. Videos must be ${limitFormatted} or shorter. Trim it and upload again.`,
    };
  }

  return { valid: true };
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}
