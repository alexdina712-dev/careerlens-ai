// A dedicated process isolates native PDF dependencies from the API on Windows.
let input = '';
for await (const chunk of process.stdin) {
  input += chunk;
  if (input.length > 3 * 1024 * 1024) throw new Error('input budget');
}
const workerData = JSON.parse(input);
const respond = (value) => process.stdout.write(JSON.stringify(value));
try {
  const buffer = Buffer.from(workerData.buffer, 'base64');
  let text = '';
  if (workerData.kind === 'txt') {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    if (text.includes('\0')) throw new Error('binary');
  }
  if (workerData.kind === 'pdf') {
    if (buffer.subarray(0, 5).toString() !== '%PDF-') throw new Error('signature');
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    try {
      const info = await parser.getInfo();
      if (info.total > 25) throw new Error('pages');
      text = (await parser.getText()).text;
    } finally {
      await parser.destroy();
    }
  }
  if (workerData.kind === 'docx') {
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) throw new Error('signature');
    const { default: AdmZip } = await import('adm-zip');
    const { default: mammoth } = await import('mammoth');
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    if (
      entries.length > 500 ||
      entries.reduce((n, e) => n + e.header.size, 0) > 10 * 1024 * 1024 ||
      !zip.getEntry('word/document.xml')
    )
      throw new Error('expanded size');
    text = (await mammoth.extractRawText({ buffer })).value;
  }
  text = text.replace(/\u0000/g, '').trim();
  if (text.length < 50 || text.length > 50000) throw new Error('text length');
  respond({ text });
} catch {
  respond({
    error:
      'This file could not be read safely. Use a text-based PDF, DOCX or UTF-8 TXT (2 MB, up to 25 PDF pages and 50,000 text characters), or paste the CV text.',
  });
}
