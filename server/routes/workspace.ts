import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '../db.js';
import { ApiError } from '../errors.js';
import {
  cvSchema,
  versionSchema,
  jobSchema,
  statusSchema,
  analysisSchema,
} from '../../shared/validation.js';
import { extract } from '../services/extraction.js';
import { LocalProvider, CompatibleProvider } from '../services/analysis.js';
export const workspaceRoutes = express.Router();
const cvInclude = { versions: { orderBy: { number: 'desc' as const } } };
const limit = rateLimit({
  windowMs: 3600000,
  limit: 30,
  keyGenerator: (req) => req.userId!,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Analysis/extraction limit reached. Try again in an hour.' },
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 2, fieldSize: 50000, parts: 3 },
});
async function privateCv(userId: string) {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (u.email === 'demo@careerlens.app')
    throw new ApiError(
      403,
      'Demo CVs are read-only. Create your own account before uploading personal information.',
    );
}
async function cv(id: string, userId: string) {
  const c = await db.cv.findFirst({ where: { id, userId }, include: cvInclude });
  if (!c) throw new ApiError(404, 'CV not found.');
  return c;
}
async function job(id: string, userId: string) {
  const j = await db.job.findFirst({ where: { id, userId } });
  if (!j) throw new ApiError(404, 'Job not found.');
  return j;
}
async function lock(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`;
}
workspaceRoutes.get('/config', (_req, res) =>
  res.json({
    externalAvailable: !!process.env.AI_API_KEY,
    externalLabel: process.env.AI_PROVIDER_LABEL || 'Configured OpenAI-compatible provider',
    mode: 'local-v1',
  }),
);
workspaceRoutes.get('/cvs', async (req, res) =>
  res.json(
    await db.cv.findMany({
      where: { userId: req.userId },
      include: cvInclude,
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    }),
  ),
);
workspaceRoutes.post('/cvs', async (req, res) => {
  await privateCv(req.userId!);
  const input = cvSchema.parse(req.body);
  const c = await db.$transaction(async (tx) => {
    await lock(tx, req.userId!);
    const count = await tx.cv.count({ where: { userId: req.userId } });
    if (count >= 10)
      throw new ApiError(400, 'Your library holds up to 10 CVs. Delete a CV to add another.');
    return tx.cv.create({
      data: {
        userId: req.userId!,
        title: input.title,
        isDefault: count === 0,
        versions: { create: { number: 1, text: input.text, sourceName: input.sourceName } },
      },
      include: cvInclude,
    });
  });
  res.status(201).json(c);
});
workspaceRoutes.post(
  '/cvs/extract',
  limit,
  async (req, _res, next) => {
    await privateCv(req.userId!);
    next();
  },
  upload.single('file'),
  async (req, res) => {
    if (!req.file) throw new ApiError(400, 'Choose a file to extract.');
    res.json(await extract(req.file));
  },
);
workspaceRoutes.post('/cvs/:id/versions', async (req, res) => {
  await privateCv(req.userId!);
  const input = versionSchema.parse(req.body);
  const value = await db.$transaction(async (tx) => {
    await lock(tx, req.userId!);
    const current = await tx.cv.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: cvInclude,
    });
    if (!current) throw new ApiError(404, 'CV not found.');
    if (current.versions.length >= 20)
      throw new ApiError(400, 'This CV holds up to 20 versions. Create a new CV instead.');
    await tx.cvVersion.create({
      data: { cvId: current.id, number: current.versions[0].number + 1, ...input },
    });
    return tx.cv.update({
      where: { id: current.id },
      data: { updatedAt: new Date() },
      include: cvInclude,
    });
  });
  res.status(201).json(value);
});
workspaceRoutes.patch('/cvs/:id', async (req, res) => {
  await privateCv(req.userId!);
  const { title } = z.object({ title: z.string().trim().min(2).max(100) }).parse(req.body);
  await cv(req.params.id, req.userId!);
  res.json(
    await db.cv.update({ where: { id: req.params.id }, data: { title }, include: cvInclude }),
  );
});
workspaceRoutes.post('/cvs/:id/default', async (req, res) => {
  await privateCv(req.userId!);
  await db.$transaction(async (tx) => {
    await lock(tx, req.userId!);
    if (!(await tx.cv.findFirst({ where: { id: req.params.id, userId: req.userId } })))
      throw new ApiError(404, 'CV not found.');
    await tx.cv.updateMany({ where: { userId: req.userId }, data: { isDefault: false } });
    await tx.cv.update({ where: { id: req.params.id }, data: { isDefault: true } });
  });
  res.status(204).end();
});
workspaceRoutes.delete('/cvs/:id', async (req, res) => {
  await privateCv(req.userId!);
  await db.$transaction(async (tx) => {
    await lock(tx, req.userId!);
    const c = await tx.cv.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!c) throw new ApiError(404, 'CV not found.');
    await tx.cv.delete({ where: { id: c.id } });
    if (c.isDefault) {
      const next = await tx.cv.findFirst({
        where: { userId: req.userId },
        orderBy: { createdAt: 'asc' },
      });
      if (next) await tx.cv.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  res.status(204).end();
});
workspaceRoutes.get('/jobs', async (req, res) =>
  res.json(
    await db.job.findMany({
      where: { userId: req.userId },
      include: {
        _count: { select: { analyses: true } },
        events: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ),
);
workspaceRoutes.post('/jobs', async (req, res) => {
  const input = jobSchema.parse(req.body);
  const j = await db.$transaction(async (tx) => {
    await lock(tx, req.userId!);
    if ((await tx.job.count({ where: { userId: req.userId } })) >= 200)
      throw new ApiError(
        400,
        'This account holds up to 200 saved jobs. Delete an old job to add another.',
      );
    return tx.job.create({
      data: { ...input, userId: req.userId!, events: { create: { status: 'INTERESTED' } } },
    });
  });
  res.status(201).json(j);
});
workspaceRoutes.patch('/jobs/:id', async (req, res) => {
  const input = jobSchema.parse(req.body);
  await job(req.params.id, req.userId!);
  res.json(await db.job.update({ where: { id: req.params.id }, data: input }));
});
workspaceRoutes.patch('/jobs/:id/status', async (req, res) => {
  const input = statusSchema.parse(req.body);
  const updated = await db.$transaction(async (tx) => {
    await lock(tx, req.userId!);
    const j = await tx.job.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!j) throw new ApiError(404, 'Job not found.');
    if (j.status === input.status) return j;
    return tx.job.update({
      where: { id: j.id },
      data: {
        status: input.status,
        appliedAt: input.status === 'APPLIED' && !j.appliedAt ? new Date() : j.appliedAt,
        events: { create: { status: input.status } },
      },
    });
  });
  res.json(updated);
});
workspaceRoutes.delete('/jobs/:id', async (req, res) => {
  await job(req.params.id, req.userId!);
  await db.job.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
workspaceRoutes.get('/analyses', async (req, res) =>
  res.json(
    await db.analysis.findMany({
      where: { userId: req.userId },
      include: { cvVersion: { include: { cv: { select: { title: true } } } }, job: true },
      orderBy: { createdAt: 'desc' },
    }),
  ),
);
workspaceRoutes.post('/analyses', limit, async (req, res) => {
  const input = analysisSchema.parse(req.body);
  const version = await db.cvVersion.findFirst({
    where: { id: input.cvVersionId, cv: { userId: req.userId } },
  });
  if (!version) throw new ApiError(404, 'CV version not found.');
  const j = await job(input.jobId, req.userId!);
  if ((await db.analysis.count({ where: { userId: req.userId } })) >= 200)
    throw new ApiError(
      400,
      'This account holds up to 200 analyses. Delete an old analysis to continue.',
    );
  const provider = input.useExternal ? new CompatibleProvider() : new LocalProvider();
  const result = await provider.analyze(version.text, j.description);
  res
    .status(201)
    .json(
      await db.analysis.create({
        data: {
          userId: req.userId!,
          cvVersionId: version.id,
          jobId: j.id,
          jobSnapshot: {
            company: j.company,
            position: j.position,
            description: j.description,
            location: j.location,
          },
          provider: provider.name,
          model: input.useExternal ? process.env.AI_MODEL || 'gpt-4o-mini' : null,
          result,
        },
        include: { cvVersion: { include: { cv: { select: { title: true } } } }, job: true },
      }),
    );
});
workspaceRoutes.delete('/analyses/:id', async (req, res) => {
  const a = await db.analysis.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!a) throw new ApiError(404, 'Analysis not found.');
  await db.analysis.delete({ where: { id: a.id } });
  res.status(204).end();
});
workspaceRoutes.delete('/account', async (req, res) => {
  await privateCv(req.userId!);
  const { password } = z.object({ password: z.string().min(1).max(72) }).parse(req.body);
  const u = await db.user.findUniqueOrThrow({ where: { id: req.userId } });
  if (!(await bcrypt.compare(password, u.passwordHash)))
    throw new ApiError(400, 'Password is incorrect.');
  await db.user.delete({ where: { id: u.id } });
  res.clearCookie('careerlens_session', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  res.status(204).end();
});
