import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { Cv, Job, Analysis } from '../lib/types';
interface Workspace {
  cvs: Cv[];
  jobs: Job[];
  analyses: Analysis[];
  config: { externalAvailable: boolean; externalLabel: string };
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}
const Context = createContext<Workspace>(null!);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [cvs, setCvs] = useState<Cv[]>([]),
    [jobs, setJobs] = useState<Job[]>([]),
    [analyses, setAnalyses] = useState<Analysis[]>([]),
    [config, setConfig] = useState({ externalAvailable: false, externalLabel: '' }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  async function reload() {
    try {
      const [a, b, c, d] = await Promise.all([
        api<Cv[]>('/workspace/cvs'),
        api<Job[]>('/workspace/jobs'),
        api<Analysis[]>('/workspace/analyses'),
        api<typeof config>('/workspace/config'),
      ]);
      setCvs(a);
      setJobs(b);
      setAnalyses(c);
      setConfig(d);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  return (
    <Context.Provider value={{ cvs, jobs, analyses, config, loading, error, reload }}>
      {children}
    </Context.Provider>
  );
}
export const useWorkspace = () => useContext(Context);
