import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { demoCv, demoJob } from '../shared/demo.js';
import { localAnalysis } from '../server/services/analysis.js';
const db = new PrismaClient();
try {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true')
    throw new Error('Explicit ALLOW_DEMO_SEED=true is required for public sample data.');
  if (await db.user.findUnique({ where: { email: 'demo@careerlens.app' } })) {
    console.log('Existing demo preserved.');
  } else {
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: 'Alex Taylor',
          email: 'demo@careerlens.app',
          passwordHash: await bcrypt.hash('CareerLensDemo!2026', 12),
        },
      });
      const cv = await tx.cv.create({
        data: {
          userId: user.id,
          title: 'Full-stack developer CV',
          isDefault: true,
          versions: {
            create: [
              {
                number: 1,
                text: demoCv.replace('Wrote Vitest unit tests and Playwright browser tests.', ''),
              },
              { number: 2, text: demoCv },
            ],
          },
        },
        include: { versions: { orderBy: { number: 'desc' } } },
      });
      const samples = [
        [
          'Northstar Digital',
          'Junior Full-Stack Developer',
          'Bucharest / Hybrid',
          demoJob,
          'INTERVIEW',
        ],
        [
          'Juniper Labs',
          'React Developer',
          'Remote / Europe',
          demoJob.replace('Node.js, Express and PostgreSQL', 'Next.js, Figma and Tailwind CSS'),
          'APPLIED',
        ],
        [
          'Signalworks',
          'QA Automation Engineer',
          'Remote',
          `Build Playwright and Python automation. Use REST APIs, SQL, Git, Docker and CI/CD. Experience with Cypress and accessibility testing is helpful. We value clear communication and maintainable test suites.`,
          'INTERESTED',
        ],
        [
          'Studio Atlas',
          'Junior Frontend Developer',
          'Cluj / Hybrid',
          `Build responsive interfaces with React, JavaScript, HTML and CSS. Use Git, unit testing and Figma. Explain how you approach accessibility and communication with designers.`,
          'OFFER',
        ],
        [
          'Evergreen Tech',
          'Backend Developer',
          'Remote',
          `Build services with Python, FastAPI, PostgreSQL, Docker and AWS. We require 3 years of experience and clear communication. Maintain REST APIs and CI/CD pipelines.`,
          'REJECTED',
        ],
        ['Acorn Systems', 'Web Developer', 'Remote', demoJob, 'ARCHIVED'],
      ] as const;
      for (const [company, position, location, description, status] of samples) {
        const job = await tx.job.create({
          data: {
            userId: user.id,
            company,
            position,
            location,
            description,
            status,
            notes: 'Fictional sample opportunity for exploring the product.',
            appliedAt: ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'].includes(status)
              ? new Date()
              : null,
            events: {
              create: [{ status: 'INTERESTED' }, ...(status !== 'INTERESTED' ? [{ status }] : [])],
            },
          },
        });
        if (['INTERVIEW', 'APPLIED', 'INTERESTED'].includes(status))
          await tx.analysis.create({
            data: {
              userId: user.id,
              cvVersionId: cv.versions[0].id,
              jobId: job.id,
              jobSnapshot: { company, position, description, location },
              provider: 'local-v1',
              result: localAnalysis(demoCv, description),
            },
          });
      }
    });
    console.log('Fictional demo seeded.');
  }
} finally {
  await db.$disconnect();
}
