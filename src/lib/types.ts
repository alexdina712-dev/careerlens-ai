import type { AnalysisResult } from '../../shared/validation';
export interface User {
  id: string;
  name: string;
  email: string;
}
export interface CvVersion {
  id: string;
  number: number;
  text: string;
  sourceName: string | null;
  createdAt: string;
}
export interface Cv {
  id: string;
  title: string;
  isDefault: boolean;
  updatedAt: string;
  versions: CvVersion[];
}
export type Status = 'INTERESTED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'ARCHIVED';
export interface Job {
  id: string;
  company: string;
  position: string;
  location: string;
  url: string | null;
  description: string;
  notes: string;
  status: Status;
  appliedAt: string | null;
  updatedAt: string;
  events: { id: string; status: Status; createdAt: string }[];
  _count?: { analyses: number };
}
export interface Analysis {
  id: string;
  jobId: string;
  cvVersionId: string;
  provider: string;
  model: string | null;
  createdAt: string;
  result: AnalysisResult;
  jobSnapshot: { company: string; position: string; description: string; location: string };
  cvVersion: CvVersion & { cv: { title: string } };
  job: Job;
}
