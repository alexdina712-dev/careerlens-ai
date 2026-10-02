import { Worker } from 'node:worker_threads';
import { resolve, extname, basename } from 'node:path';
import { ApiError } from '../errors.js';
let active = 0;
export async function extract(file: Express.Multer.File) {
  const kind = extname(file.originalname).slice(1).toLowerCase();
  if (!['txt', 'pdf', 'docx'].includes(kind))
    throw new ApiError(400, 'Upload a PDF, DOCX or UTF-8 TXT file.');
  if (active >= 3) throw new ApiError(429, 'Document extraction is busy. Try again shortly.');
  active++;
  try {
    return await new Promise<{ text: string; sourceName: string }>((resolveResult, reject) => {
      const worker = new Worker(resolve('scripts/extract-document.mjs'), {
        workerData: { buffer: file.buffer, kind },
        resourceLimits: { maxOldGenerationSizeMb: 128 },
      });
      let settled = false;
      const finish = (error?: Error, value?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        void worker.terminate();
        error
          ? reject(error)
          : resolveResult({
              text: value!,
              sourceName: basename(file.originalname.replace(/\\/g, '/'))
                .replace(/[\x00-\x1f]/g, '')
                .slice(0, 150),
            });
      };
      const timer = setTimeout(
        () =>
          finish(new ApiError(400, 'Document extraction timed out. Paste the CV text instead.')),
        15000,
      );
      worker.once('message', (m) =>
        m.error ? finish(new ApiError(400, m.error)) : finish(undefined, m.text),
      );
      worker.once('error', () =>
        finish(new ApiError(400, 'Document extraction failed. Paste the CV text instead.')),
      );
      worker.once('exit', () => {
        if (!settled) finish(new ApiError(400, 'Document extraction ended unexpectedly.'));
      });
    });
  } finally {
    active--;
  }
}
