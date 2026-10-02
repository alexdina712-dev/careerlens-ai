import { spawn } from 'node:child_process';
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
      const parser = spawn(
        process.execPath,
        ['--max-old-space-size=128', resolve('scripts/extract-document.mjs')],
        {
          windowsHide: true,
          stdio: ['pipe', 'pipe', 'ignore'],
          env: {
            PATH: process.env.PATH,
            SystemRoot: process.env.SystemRoot,
            TEMP: process.env.TEMP,
            TMP: process.env.TMP,
            NODE_ENV: process.env.NODE_ENV,
          },
        },
      );
      let settled = false,
        output = '';
      const finish = (error?: Error, text?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) parser.kill();
        error
          ? reject(error)
          : resolveResult({
              text: text!,
              sourceName: basename(file.originalname.replace(/\\/g, '/'))
                .replace(/[\x00-\x1f]/g, '')
                .slice(0, 150),
            });
      };
      const failed = () =>
        new ApiError(400, 'Document extraction failed. Paste the CV text instead.');
      const timer = setTimeout(
        () =>
          finish(new ApiError(400, 'Document extraction timed out. Paste the CV text instead.')),
        15000,
      );
      parser.stdout.setEncoding('utf8');
      parser.stdout.on('data', (chunk) => {
        output += chunk.toString();
        if (output.length > 1024 * 1024) finish(failed());
      });
      parser.once('error', () => finish(failed()));
      parser.stdin.on('error', () => finish(failed()));
      parser.once('close', (code) => {
        if (settled) return;
        if (code !== 0) return finish(failed());
        try {
          const result = JSON.parse(output);
          if (result.error) return finish(new ApiError(400, String(result.error)));
          if (
            typeof result.text !== 'string' ||
            result.text.length < 50 ||
            result.text.length > 50000
          )
            return finish(failed());
          finish(undefined, result.text);
        } catch {
          finish(failed());
        }
      });
      parser.stdin.end(JSON.stringify({ kind, buffer: file.buffer.toString('base64') }));
    });
  } finally {
    active--;
  }
}
