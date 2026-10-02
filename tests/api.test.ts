import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server/app';
import { db } from '../server/db';
import { demoCv, demoJob } from '../shared/demo';
import { cvText, docx, pdf } from './files';
const owner = request.agent(app),
  other = request.agent(app),
  suffix = Date.now() + '-' + Math.random().toString(36).slice(2);
let userId: string,
  otherId: string,
  cvId: string,
  versionId: string,
  jobId: string,
  analysisId: string;
beforeAll(async () => {
  const a = await owner
    .post('/api/auth/register')
    .send({
      name: 'API Owner',
      email: `api-${suffix}@example.com`,
      password: 'SecurePassword!123',
    });
  expect(a.status).toBe(201);
  userId = a.body.id;
  const b = await other
    .post('/api/auth/register')
    .send({
      name: 'Other User',
      email: `other-${suffix}@example.com`,
      password: 'SecurePassword!123',
    });
  otherId = b.body.id;
});
afterAll(async () => {
  await db.user.deleteMany({ where: { id: { in: [userId, otherId].filter(Boolean) } } });
  await db.$disconnect();
});
describe('authentication and ownership', () => {
  it('protects workspace APIs and rejects wrong credentials', async () => {
    expect((await request(app).get('/api/workspace/cvs')).status).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ email: `api-${suffix}@example.com`, password: 'wrong' })
      ).status,
    ).toBe(401);
  });
  it('hashes passwords and stores session digests only', async () => {
    const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(u.passwordHash).toMatch(/^\$2/);
    const sessions = await db.session.findMany({ where: { userId } });
    expect(sessions[0].id).toMatch(/^[a-f0-9]{64}$/);
  });
  it('validates duplicate registration and untrusted Origins', async () => {
    expect(
      (
        await request(app)
          .post('/api/auth/register')
          .send({
            name: 'API Owner',
            email: `api-${suffix}@example.com`,
            password: 'SecurePassword!123',
          })
      ).status,
    ).toBe(409);
    expect(
      (
        await owner
          .post('/api/workspace/jobs')
          .set('Origin', 'https://attacker.example')
          .send({ company: 'ACME', position: 'Dev', description: demoJob })
      ).status,
    ).toBe(403);
  });
  it('creates a default CV and private version history', async () => {
    const r = await owner.post('/api/workspace/cvs').send({ title: 'API CV', text: demoCv });
    expect(r.status).toBe(201);
    cvId = r.body.id;
    versionId = r.body.versions[0].id;
    expect(r.body.isDefault).toBe(true);
    expect((await other.get('/api/workspace/cvs')).body).toEqual([]);
    expect(
      (await other.post('/api/workspace/cvs/' + cvId + '/versions').send({ text: demoCv })).status,
    ).toBe(404);
  });
  it('serializes concurrent versions without losing sequence numbers', async () => {
    const r = await Promise.all([
      owner
        .post('/api/workspace/cvs/' + cvId + '/versions')
        .send({ text: demoCv + ' Version two.' }),
      owner
        .post('/api/workspace/cvs/' + cvId + '/versions')
        .send({ text: demoCv + ' Version three.' }),
    ]);
    expect(r.map((x) => x.status)).toEqual([201, 201]);
    const c = (await owner.get('/api/workspace/cvs')).body.find(
      (x: { id: string }) => x.id === cvId,
    );
    expect(c.versions.map((v: { number: number }) => v.number)).toEqual([3, 2, 1]);
  });
  it('extracts TXT, DOCX and PDF into reviewable text', async () => {
    for (const [name, buffer] of [
      ['cv.txt', Buffer.from(cvText)],
      ['cv.docx', docx()],
      ['cv.pdf', pdf()],
    ] as const) {
      const r = await owner.post('/api/workspace/cvs/extract').attach('file', buffer, name);
      expect(r.body.error).toBeUndefined();
      expect(r.status).toBe(200);
      expect(r.body.text).toContain('React');
      expect(r.body.sourceName).toBe(name);
    }
  });
  it('rejects binary disguises, unsupported uploads and oversized files', async () => {
    expect(
      (await owner.post('/api/workspace/cvs/extract').attach('file', Buffer.from(cvText), 'cv.exe'))
        .status,
    ).toBe(400);
    expect(
      (
        await owner
          .post('/api/workspace/cvs/extract')
          .attach('file', Buffer.from('not a real PDF'), 'cv.pdf')
      ).status,
    ).toBe(400);
    expect(
      (
        await owner
          .post('/api/workspace/cvs/extract')
          .attach('file', Buffer.alloc(2 * 1024 * 1024 + 1), 'cv.txt')
      ).status,
    ).toBe(400);
  });
  it('creates and edits a job without fetching its URL', async () => {
    const r = await owner
      .post('/api/workspace/jobs')
      .send({
        company: 'API Company',
        position: 'Developer',
        description: demoJob,
        url: 'https://example.com/role',
      });
    expect(r.status).toBe(201);
    jobId = r.body.id;
    expect(
      (
        await owner
          .patch('/api/workspace/jobs/' + jobId)
          .send({
            company: 'Updated Company',
            position: 'Developer',
            description: demoJob,
            notes: 'Prepare a project walkthrough',
          })
      ).status,
    ).toBe(200);
    expect(
      (await other.patch('/api/workspace/jobs/' + jobId + '/status').send({ status: 'OFFER' }))
        .status,
    ).toBe(404);
  });
  it('records real status transitions but avoids duplicate history', async () => {
    expect(
      (await owner.patch('/api/workspace/jobs/' + jobId + '/status').send({ status: 'APPLIED' }))
        .status,
    ).toBe(200);
    await owner.patch('/api/workspace/jobs/' + jobId + '/status').send({ status: 'APPLIED' });
    const j = await db.job.findUniqueOrThrow({ where: { id: jobId }, include: { events: true } });
    expect(j.appliedAt).not.toBeNull();
    expect(j.events).toHaveLength(2);
  });
  it('rejects foreign versions and jobs in analysis requests', async () => {
    expect(
      (await other.post('/api/workspace/analyses').send({ cvVersionId: versionId, jobId })).status,
    ).toBe(404);
    const c = await other.post('/api/workspace/cvs').send({ title: 'Other CV', text: demoCv });
    expect(
      (
        await other
          .post('/api/workspace/analyses')
          .send({ cvVersionId: c.body.versions[0].id, jobId })
      ).status,
    ).toBe(404);
  });
  it('persists a reproducible result and immutable job snapshot', async () => {
    const r = await owner.post('/api/workspace/analyses').send({ cvVersionId: versionId, jobId });
    expect(r.status).toBe(201);
    analysisId = r.body.id;
    expect(r.body.provider).toBe('local-v1');
    expect(r.body.result.overlappingSkills).toContain('React');
    await owner
      .patch('/api/workspace/jobs/' + jobId)
      .send({ company: 'Changed later', position: 'Different later', description: demoJob });
    const a = (await owner.get('/api/workspace/analyses')).body.find(
      (x: { id: string }) => x.id === analysisId,
    );
    expect(a.jobSnapshot.position).toBe('Developer');
    expect(a.cvVersion.number).toBe(1);
    expect((await other.get('/api/workspace/analyses')).body).toEqual([]);
    expect((await other.delete('/api/workspace/analyses/' + analysisId)).status).toBe(404);
  });
  it('requires external consent and reports absent configuration', async () => {
    expect(
      (
        await owner
          .post('/api/workspace/analyses')
          .send({ cvVersionId: versionId, jobId, useExternal: true, consent: false })
      ).status,
    ).toBe(400);
    expect(
      (
        await owner
          .post('/api/workspace/analyses')
          .send({ cvVersionId: versionId, jobId, useExternal: true, consent: true })
      ).status,
    ).toBe(503);
  });
  it('deletes a CV and its analyses while retaining saved jobs', async () => {
    expect((await owner.delete('/api/workspace/cvs/' + cvId)).status).toBe(204);
    expect(await db.analysis.findUnique({ where: { id: analysisId } })).toBeNull();
    expect(await db.cvVersion.findUnique({ where: { id: versionId } })).toBeNull();
    expect(await db.job.findUnique({ where: { id: jobId } })).not.toBeNull();
  });
  it('keeps exactly one default through changes and deletion', async () => {
    const a = await owner.post('/api/workspace/cvs').send({ title: 'First CV', text: demoCv });
    const b = await owner.post('/api/workspace/cvs').send({ title: 'Second CV', text: demoCv });
    await owner.post('/api/workspace/cvs/' + b.body.id + '/default');
    expect(await db.cv.count({ where: { userId, isDefault: true } })).toBe(1);
    await owner.delete('/api/workspace/cvs/' + b.body.id);
    expect((await db.cv.findUniqueOrThrow({ where: { id: a.body.id } })).isDefault).toBe(true);
  });
  it('blocks private CV writes on the shared fictional demo', async () => {
    const demo = request.agent(app);
    await demo
      .post('/api/auth/login')
      .send({ email: 'demo@careerlens.app', password: 'CareerLensDemo!2026' });
    expect(
      (await demo.post('/api/workspace/cvs').send({ title: 'Personal CV', text: demoCv })).status,
    ).toBe(403);
    expect(
      (await demo.post('/api/workspace/cvs/extract').attach('file', Buffer.from(cvText), 'cv.txt'))
        .status,
    ).toBe(403);
  });
  it('revokes sessions on logout and deletes an account only after password confirmation', async () => {
    const one = request.agent(app);
    await one
      .post('/api/auth/login')
      .send({ email: `other-${suffix}@example.com`, password: 'SecurePassword!123' });
    await one.post('/api/auth/logout');
    expect((await one.get('/api/workspace/cvs')).status).toBe(401);
    expect((await other.delete('/api/workspace/account').send({ password: 'wrong' })).status).toBe(
      400,
    );
    expect(
      (await other.delete('/api/workspace/account').send({ password: 'SecurePassword!123' }))
        .status,
    ).toBe(204);
    expect(await db.user.findUnique({ where: { id: otherId } })).toBeNull();
    expect((await other.get('/api/workspace/cvs')).status).toBe(401);
  });
});
