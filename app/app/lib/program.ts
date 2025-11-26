import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import idl from './solBrawl.json';

export const PROGRAM_ID = new PublicKey(idl.address);

export function getProgram(provider: AnchorProvider) {
  return new Program(idl as any, provider);
}

export function getProgramPDA(
  seeds: (Buffer | Uint8Array)[],
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(seeds, programId);
}

// Helper to get contest PDA
export function getContestPDA(creator: PublicKey, contestId: bigint) {
  // Convert bigint to 8-byte buffer (little-endian)
  const buffer = Buffer.alloc(8);
  const bn = new (require('bn.js'))(contestId.toString());
  bn.toArrayLike(Buffer, 'le', 8).copy(buffer);

  return getProgramPDA([
    Buffer.from('contest'),
    creator.toBuffer(),
    buffer,
  ]);
}

// Helper to get escrow PDA
export function getEscrowPDA(creator: PublicKey, contestId: bigint) {
  // Convert bigint to 8-byte buffer (little-endian)
  const buffer = Buffer.alloc(8);
  const bn = new (require('bn.js'))(contestId.toString());
  bn.toArrayLike(Buffer, 'le', 8).copy(buffer);

  return getProgramPDA([
    Buffer.from('escrow'),
    creator.toBuffer(),
    buffer,
  ]);
}

// Helper to get submission PDA
export function getSubmissionPDA(contest: PublicKey, participant: PublicKey) {
  return getProgramPDA([
    Buffer.from('submission'),
    contest.toBuffer(),
    participant.toBuffer(),
  ]);
}

// Helper to get vote PDA
export function getVotePDA(contest: PublicKey, judge: PublicKey) {
  return getProgramPDA([
    Buffer.from('vote'),
    contest.toBuffer(),
    judge.toBuffer(),
  ]);
}

// Helper to get gas pool PDA
export function getGasPoolPDA(contest: PublicKey) {
  return getProgramPDA([
    Buffer.from('gas_pool'),
    contest.toBuffer(),
  ]);
}
