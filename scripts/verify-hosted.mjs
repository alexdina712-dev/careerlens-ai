// Exercises only fictional disposable data on an explicitly selected HTTPS deployment.
import { request } from '@playwright/test';
import { pdf, docx, cvText } from '../tests/files.ts';
const base = process.env.PUBLIC_DEMO_URL;
if (!base?.startsWith('https://')) throw new Error('Set PUBLIC_DEMO_URL to the demo HTTPS origin.');
const origin = new URL(base).origin;
const context = await request.newContext({ baseURL: origin, extraHTTPHeaders: { Origin: origin } });
const password = 'HostedFictional!2026';
let registered = false;
function check(ok, message) {
  if (!ok) throw new Error(message);
}
try {
  check(
    (await context.get('/api/workspace/cvs')).status() === 401,
    'Private routes must require authentication.',
  );
  const login = await context.post('/api/auth/register', {
    data: {
      name: 'Fictional Hosted Verification',
      email: `verify-${Date.now()}@example.test`,
      password,
    },
  });
  check(login.status() === 201, 'Disposable account registration failed.');
  registered = true;
  const cookies = (await context.storageState()).cookies;
  const session = cookies.find((c) => c.name === 'careerlens_session');
  check(
    session?.secure && session.httpOnly && session.sameSite === 'Lax',
    'Secure production session cookie flags failed.',
  );
  const me = await context.get('/api/auth/me');
  check(me.headers()['cache-control'] === 'no-store', 'Private API responses must not be cached.');
  check(
    (
      await context.post('/api/workspace/jobs', {
        headers: { Origin: 'https://untrusted.example' },
        data: {},
      })
    ).status() === 403,
    'Untrusted origins must be rejected.',
  );
  for (const [name, buffer, mimeType] of [
    ['fictional.txt', Buffer.from(cvText), 'text/plain'],
    [
      'fictional.docx',
      docx(),
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ['fictional.pdf', pdf(), 'application/pdf'],
  ]) {
    const response = await context.post('/api/workspace/cvs/extract', {
      multipart: { file: { name, mimeType, buffer } },
    });
    check(response.status() === 200, `${name} extraction failed.`);
    const data = await response.json();
    check(data.text.includes('React'), `${name} extracted text missing expected fixture evidence.`);
    check((await context.get('/api/health')).ok(), 'API must remain healthy after extraction.');
  }
  console.log(
    'Hosted verification passed: private routes, secure cookies, no-store responses, Origin protection, real TXT/DOCX/PDF extraction and API survival.',
  );
} finally {
  if (registered) {
    const deleted = await context.delete('/api/workspace/account', { data: { password } });
    check(deleted.status() === 204, 'Disposable account cleanup failed.');
  }
  await context.dispose();
}
