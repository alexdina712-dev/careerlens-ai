import { describe, it, expect, vi, afterEach } from 'vitest';
import { localAnalysis, CompatibleProvider } from '../server/services/analysis';
import { analysisSchema, jobSchema, registerSchema } from '../shared/validation';
import { demoCv, demoJob } from '../shared/demo';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('evidence analysis', () => {
  it('is deterministic and identifies supported overlaps and gaps', () => {
    const a = localAnalysis(demoCv, demoJob);
    expect(a).toEqual(localAnalysis(demoCv, demoJob));
    expect(a.overlappingSkills).toContain('React');
    expect(a.missingSkills).toContain('Docker');
    expect(a.evidence.every((e) => demoCv.replace(/\s+/g, ' ').includes(e.excerpt))).toBe(true);
    expect(JSON.stringify(a)).not.toMatch(/hiringProbability|matchScore/);
  });
  it('handles skill boundaries and punctuation', () => {
    const a = localAnalysis(
      'Worked with C++, C# and .NET. Javascript interfaces and PostgreSQL storage.',
      'We need C++, C#, .NET, Java and PostgreSQL engineers for our team.',
    );
    expect(a.overlappingSkills).toEqual(
      expect.arrayContaining(['C++', 'C#', '.NET', 'PostgreSQL']),
    );
    expect(a.overlappingSkills).not.toContain('Java');
  });
  it('does not infer unprovided experience or a profession outside the dictionary', () => {
    const a = localAnalysis(
      'Education and independent project development without dated employment history.',
      'Clinical coordinator with patient care and ward logistics responsibilities.',
    );
    expect(a.experience.statedYears).toBeNull();
    expect(a.keywords).toEqual([]);
    expect(a.summary).toContain('manually');
  });
  it('only extracts explicit years statements', () => {
    const a = localAnalysis(
      'I have 2 years of experience using React on software projects.',
      'React engineer with 3+ years of experience in web development.',
    );
    expect(a.experience.statedYears).toBe(2);
    expect(a.experience.requiredYears).toBe(3);
    expect(
      localAnalysis('95 years of experience.', '80 years of experience.').experience.statedYears,
    ).toBeNull();
  });
  it('requires consent for an external request and rejects unsafe job URLs', () => {
    expect(
      analysisSchema.safeParse({ cvVersionId: 'x', jobId: 'y', useExternal: true, consent: false })
        .success,
    ).toBe(false);
    expect(
      jobSchema.safeParse({
        company: 'ACME',
        position: 'Developer',
        description: demoJob,
        url: 'javascript:alert(1)',
      }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        name: 'Test',
        email: 'test@example.com',
        password: '🔒'.repeat(30),
      }).success,
    ).toBe(false);
  });
  it('validates structured provider results and drops invented evidence', async () => {
    vi.stubEnv('AI_API_KEY', 'test-only-not-a-secret');
    const result = localAnalysis(demoCv, demoJob);
    result.evidence.push({ skill: 'Python', excerpt: 'An invented employment claim' });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ choices: [{ message: { content: JSON.stringify(result) } }] }),
            { status: 200 },
          ),
        ),
    );
    const output = await new CompatibleProvider().analyze(demoCv, demoJob);
    expect(output.evidence.some((e) => e.skill === 'Python')).toBe(false);
  });
  it('reports malformed provider output without silently falling back', async () => {
    vi.stubEnv('AI_API_KEY', 'test-only-not-a-secret');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: 'not JSON' } }] }), {
          status: 200,
        }),
      ),
    );
    await expect(new CompatibleProvider().analyze(demoCv, demoJob)).rejects.toThrow(
      'expected structure',
    );
  });
});
