import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export enum ContestStatus {
  Setup = 'Setup',
  Active = 'Active',
  Judging = 'Judging',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface Contest {
  creator: PublicKey;
  contestId: BN;
  title: string;
  description: string;
  prizeAmount: BN;
  submissionDeadline: BN;
  judges: PublicKey[];
  approvalThreshold: number;
  status: ContestStatus;
  submissionCount: number;
  createdAt: BN;
  gasSponsorshipEnabled: boolean;
  funded: boolean;
  bump: number;
}

export interface Submission {
  participant: PublicKey;
  contest: PublicKey;
  submissionUrl: string;
  submittedAt: BN;
  lastModified: BN;
  bump: number;
}

export interface JudgeVote {
  judge: PublicKey;
  contest: PublicKey;
  winner: PublicKey;
  votedAt: BN;
  bump: number;
}

export interface CreateContestForm {
  title: string;
  description: string;
  prizeAmount: number;
  deadline: Date;
  judges: string[];
  approvalThreshold: number;
}
