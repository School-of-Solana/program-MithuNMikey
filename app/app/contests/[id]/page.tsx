'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram } from '@solana/web3.js';
import { WalletButton } from '../../components/WalletButton';
import { getProgram, getEscrowPDA, getSubmissionPDA, getVotePDA, getGasPoolPDA } from '../../lib/program';

export default function ContestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { connection } = useConnection();
  const wallet = useWallet();
  const [contest, setContest] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [selectedWinner, setSelectedWinner] = useState('');
  const [fundingAmount, setFundingAmount] = useState('');
  const [gasBudget, setGasBudget] = useState('');

  useEffect(() => {
    fetchContestData();
  }, [resolvedParams.id, connection]);

  const fetchContestData = async () => {
    try {
      const dummyWallet = {
        publicKey: PublicKey.default,
        signTransaction: async () => { throw new Error('Not implemented'); },
        signAllTransactions: async () => { throw new Error('Not implemented'); },
      } as any as Wallet;

      const provider = new AnchorProvider(
        connection,
        dummyWallet,
        AnchorProvider.defaultOptions()
      );
      const program = getProgram(provider);

      const contestPubkey = new PublicKey(resolvedParams.id);
      const contestData = await (program.account as any).contest.fetch(contestPubkey);
      setContest({ publicKey: contestPubkey, account: contestData });

      // Fetch submissions
      const allSubmissions = await (program.account as any).submission.all([
        {
          memcmp: {
            offset: 8 + 32,
            bytes: contestPubkey.toBase58(),
          },
        },
      ]);
      setSubmissions(allSubmissions);

      // Fetch votes
      const allVotes = await (program.account as any).judgeVoteAccount.all([
        {
          memcmp: {
            offset: 8 + 32,
            bytes: contestPubkey.toBase58(),
          },
        },
      ]);
      setVotes(allVotes);
    } catch (err) {
      console.error('Error fetching contest:', err);
      setError('Failed to load contest');
    } finally {
      setLoading(false);
    }
  };

  const handleFundContest = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !contest) return;

    setActionLoading(true);
    setError('');

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      const program = getProgram(provider);

      const [escrowPDA] = getEscrowPDA(
        contest.account.creator,
        BigInt(contest.account.contestId.toString())
      );

      const tx = await program.methods
        .fundContest()
        .accounts({
          contest: contest.publicKey,
          escrow: escrowPDA,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Contest funded:', tx);
      await fetchContestData();
    } catch (err: any) {
      console.error('Error funding contest:', err);
      setError(err.message || 'Failed to fund contest');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey || !wallet.signTransaction || !contest) return;

    setActionLoading(true);
    setError('');

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      const program = getProgram(provider);

      const [submissionPDA] = getSubmissionPDA(contest.publicKey, wallet.publicKey);

      const tx = await program.methods
        .submitEntry(submissionUrl)
        .accounts({
          contest: contest.publicKey,
          submission: submissionPDA,
          participant: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Entry submitted:', tx);
      setSubmissionUrl('');
      await fetchContestData();
    } catch (err: any) {
      console.error('Error submitting entry:', err);
      setError(err.message || 'Failed to submit entry');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey || !wallet.signTransaction || !contest) return;

    setActionLoading(true);
    setError('');

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      const program = getProgram(provider);

      const [votePDA] = getVotePDA(contest.publicKey, wallet.publicKey);
      const winnerPubkey = new PublicKey(selectedWinner);

      const tx = await program.methods
        .judgeVote(winnerPubkey)
        .accounts({
          contest: contest.publicKey,
          vote: votePDA,
          judge: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Vote cast:', tx);
      setSelectedWinner('');
      await fetchContestData();
    } catch (err: any) {
      console.error('Error voting:', err);
      setError(err.message || 'Failed to cast vote');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDistributePrizes = async () => {
    if (!wallet.publicKey || !wallet.signTransaction || !contest) return;

    setActionLoading(true);
    setError('');

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      const program = getProgram(provider);

      const [escrowPDA] = getEscrowPDA(
        contest.account.creator,
        BigInt(contest.account.contestId.toString())
      );

      // Find the winner based on votes
      const voteCounts = new Map<string, number>();
      votes.forEach((vote) => {
        const winner = vote.account.winner.toString();
        voteCounts.set(winner, (voteCounts.get(winner) || 0) + 1);
      });

      const winnerEntry = Array.from(voteCounts.entries()).find(
        ([_, count]) => count >= contest.account.approvalThreshold
      );

      if (!winnerEntry) {
        throw new Error('No consensus reached yet');
      }

      const winnerPubkey = new PublicKey(winnerEntry[0]);

      // Get all vote PDAs for remaining accounts
      const voteAccounts = votes.map((v) => ({
        pubkey: v.publicKey,
        isSigner: false,
        isWritable: false,
      }));

      const tx = await program.methods
        .distributePrizes()
        .accounts({
          contest: contest.publicKey,
          escrow: escrowPDA,
          winner: winnerPubkey,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(voteAccounts)
        .rpc();

      console.log('Prizes distributed:', tx);
      await fetchContestData();
    } catch (err: any) {
      console.error('Error distributing prizes:', err);
      setError(err.message || 'Failed to distribute prizes');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnableGasSponsorship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.publicKey || !wallet.signTransaction || !contest) return;

    setActionLoading(true);
    setError('');

    try {
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        AnchorProvider.defaultOptions()
      );
      const program = getProgram(provider);

      const [gasPoolPDA] = getGasPoolPDA(contest.publicKey);

      // Convert SOL to lamports
      const gasInLamports = new BN(parseFloat(gasBudget) * LAMPORTS_PER_SOL);

      const tx = await program.methods
        .enableGasSponsorship(gasInLamports)
        .accounts({
          contest: contest.publicKey,
          gasPool: gasPoolPDA,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('Gas sponsorship enabled:', tx);
      setGasBudget('');
      await fetchContestData();
    } catch (err: any) {
      console.error('Error enabling gas sponsorship:', err);
      setError(err.message || 'Failed to enable gas sponsorship');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fef6e4] flex items-center justify-center">
        <div className="card-neo bg-[#8bd3dd]">
          <p className="text-[#001858] font-black text-xl uppercase">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-[#fef6e4] flex items-center justify-center">
        <div className="card-neo bg-[#ffbe0b] text-center">
          <p className="text-[#001858] font-black mb-4 text-xl uppercase">Contest not found</p>
          <Link href="/contests" className="btn-neo bg-[#f582ae] text-[#001858] inline-block">
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  const isCreator = wallet.publicKey?.equals(contest.account.creator);
  const isJudge = wallet.publicKey && contest.account.judges.some((j: PublicKey) => j.equals(wallet.publicKey!));
  const deadline = new Date(contest.account.submissionDeadline.toNumber() * 1000);
  const isBeforeDeadline = new Date() < deadline;
  const statusKey = Object.keys(contest.account.status)[0].toLowerCase();

  return (
    <div className="min-h-screen bg-[#fef6e4]">
      {/* Navigation */}
      <nav className="border-b-4 border-black bg-[#8bd3dd]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-xl md:text-3xl font-black text-[#001858] hover:text-[#f582ae] transition-colors">
              🏆 SOLARENA
            </Link>
            <WalletButton />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <Link href="/contests" className="text-[#001858] font-black hover:text-[#f582ae] transition-colors text-lg">
            ← BACK TO CONTESTS
          </Link>
        </div>

        {error && (
          <div className="mb-6 card-neo bg-[#f582ae]">
            {error}
          </div>
        )}

        {/* Contest Details */}
        <div className="card-neo bg-[#f582ae] mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#001858] mb-2 uppercase break-words">
                {contest.account.title}
              </h1>
              <p className="text-[#001858] font-bold text-sm md:text-base">{contest.account.description}</p>
            </div>
            <span className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-black uppercase border-4 border-black neo-brutalism-shadow shrink-0 ${
              statusKey === 'active' ? 'bg-[#06ffa5] text-[#001858]' :
              statusKey === 'setup' ? 'bg-[#ffbe0b] text-[#001858]' :
              statusKey === 'completed' ? 'bg-[#8bd3dd] text-[#001858]' :
              'bg-[#f3d2c1] text-[#001858]'
            }`}>
              {statusKey.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            <div className="bg-white border-4 border-black p-3 md:p-4 neo-brutalism-shadow">
              <p className="text-[#001858] text-xs md:text-sm mb-1 font-bold uppercase">Prize Amount</p>
              <p className="text-xl md:text-3xl font-black text-[#001858]">
                {(contest.account.prizeAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL
              </p>
            </div>
            <div className="bg-white border-4 border-black p-3 md:p-4 neo-brutalism-shadow">
              <p className="text-[#001858] text-xs md:text-sm mb-1 font-bold uppercase">Submissions</p>
              <p className="text-xl md:text-3xl font-black text-[#001858]">
                {contest.account.submissionCount}
              </p>
            </div>
            <div className="bg-white border-4 border-black p-3 md:p-4 neo-brutalism-shadow">
              <p className="text-[#001858] text-xs md:text-sm mb-1 font-bold uppercase">Deadline</p>
              <p className="text-sm md:text-lg font-black text-[#001858]">
                {deadline.toLocaleDateString()}
              </p>
            </div>
            <div className="bg-white border-4 border-black p-3 md:p-4 neo-brutalism-shadow">
              <p className="text-[#001858] text-xs md:text-sm mb-1 font-bold uppercase">Judges</p>
              <p className="text-sm md:text-lg font-black text-[#001858]">
                {contest.account.judges.length} ({contest.account.approvalThreshold} needed)
              </p>
            </div>
          </div>

          {/* Fund Contest (Creator only, if not funded) */}
          {isCreator && !contest.account.funded && statusKey === 'setup' && (
            <div className="mt-6 card-neo bg-[#ffbe0b]">
              <p className="text-[#001858] font-black mb-3 uppercase">⚠️ Contest needs to be funded to activate</p>
              <button
                onClick={handleFundContest}
                disabled={actionLoading}
                className="btn-neo bg-[#06ffa5] text-[#001858]"
              >
                {actionLoading ? 'Funding...' : `Fund Contest (${(contest.account.prizeAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL)`}
              </button>
            </div>
          )}

          {/* Gas Sponsorship Status */}
          {contest.account.gasSponsorshipEnabled && (
            <div className="mt-6 flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-black uppercase border-3 border-black neo-brutalism-shadow bg-[#06ffa5] text-[#001858]">
                ⛽ GAS SPONSORED
              </span>
              <span className="text-[#001858] font-bold text-sm">
                Participants' transaction fees are covered
              </span>
            </div>
          )}

          {/* Enable Gas Sponsorship (Creator only, when active and not yet enabled) */}
          {isCreator && statusKey === 'active' && !contest.account.gasSponsorshipEnabled && (
            <div className="mt-6 card-neo bg-[#8bd3dd]">
              <h3 className="text-xl font-black text-[#001858] mb-3 uppercase">⛽ Enable Gas Sponsorship</h3>
              <p className="text-[#001858] font-bold text-sm mb-4">
                Sponsor transaction fees for participants to enable barrier-free entry
              </p>
              <form onSubmit={handleEnableGasSponsorship} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={gasBudget}
                    onChange={(e) => setGasBudget(e.target.value)}
                    className="input-neo w-full bg-white text-[#001858] placeholder-gray-500"
                    placeholder="Gas budget in SOL (e.g., 0.5)"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading || !gasBudget}
                  className="btn-neo bg-[#06ffa5] text-[#001858] whitespace-nowrap"
                >
                  {actionLoading ? 'ENABLING...' : 'ENABLE'}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Submit Entry */}
          {isBeforeDeadline && statusKey === 'active' && wallet.publicKey && (
            <div className="card-neo bg-[#06ffa5]">
              <h2 className="text-2xl font-black text-[#001858] mb-4 uppercase">📝 Submit Entry</h2>
              <form onSubmit={handleSubmitEntry} className="space-y-4">
                <div>
                  <label className="block text-[#001858] font-black mb-2 uppercase text-sm">
                    Submission URL
                  </label>
                  <input
                    type="url"
                    value={submissionUrl}
                    onChange={(e) => setSubmissionUrl(e.target.value)}
                    className="input-neo w-full bg-white text-[#001858] placeholder-gray-500"
                    placeholder="https://github.com/user/project"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={actionLoading || !wallet.publicKey}
                  className="btn-neo w-full bg-[#f582ae] text-[#001858]"
                >
                  {actionLoading ? 'SUBMITTING...' : 'SUBMIT ENTRY'}
                </button>
              </form>
            </div>
          )}

          {/* Judge Vote */}
          {isJudge && !isBeforeDeadline && statusKey === 'active' && (
            <div className="card-neo bg-[#8bd3dd]">
              <h2 className="text-2xl font-black text-[#001858] mb-4 uppercase">⚖️ Cast Your Vote</h2>
              <form onSubmit={handleVote} className="space-y-4">
                <div>
                  <label className="block text-[#001858] font-black mb-2 uppercase text-sm">
                    Select Winner
                  </label>
                  <select
                    value={selectedWinner}
                    onChange={(e) => setSelectedWinner(e.target.value)}
                    className="input-neo w-full bg-white text-[#001858] font-bold"
                    required
                  >
                    <option value="">Choose a participant...</option>
                    {submissions.map((sub) => (
                      <option key={sub.publicKey.toString()} value={sub.account.participant.toString()}>
                        {sub.account.participant.toString().slice(0, 8)}...
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedWinner}
                  className="btn-neo w-full bg-[#ffbe0b] text-[#001858]"
                >
                  {actionLoading ? 'VOTING...' : 'CAST VOTE'}
                </button>
              </form>
            </div>
          )}

          {/* Distribute Prizes */}
          {!isBeforeDeadline && statusKey === 'active' && votes.length >= contest.account.approvalThreshold && (
            <div className="card-neo bg-[#ffbe0b]">
              <h2 className="text-2xl font-black text-[#001858] mb-4 uppercase">🏆 Distribute Prizes</h2>
              <p className="text-[#001858] font-bold mb-4">
                Consensus reached! Click to distribute prizes to the winner.
              </p>
              <button
                onClick={handleDistributePrizes}
                disabled={actionLoading}
                className="btn-neo w-full bg-[#06ffa5] text-[#001858]"
              >
                {actionLoading ? 'DISTRIBUTING...' : 'DISTRIBUTE PRIZES'}
              </button>
            </div>
          )}
        </div>

        {/* Submissions List */}
        {submissions.length > 0 && (
          <div className="mt-8 card-neo bg-[#f3d2c1]">
            <h2 className="text-2xl font-black text-[#001858] mb-4 uppercase">
              Submissions ({submissions.length})
            </h2>
            <div className="space-y-4">
              {submissions.map((sub) => (
                <div
                  key={sub.publicKey.toString()}
                  className="p-4 bg-white border-4 border-black neo-brutalism-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[#001858] font-black mb-1 truncate">
                        {sub.account.participant.toString().slice(0, 16)}...
                      </p>
                      <a
                        href={sub.account.submissionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#f582ae] hover:text-[#001858] break-all font-bold"
                      >
                        {sub.account.submissionUrl}
                      </a>
                      <p className="text-[#001858] text-sm mt-2 font-bold">
                        Submitted: {new Date(sub.account.submittedAt.toNumber() * 1000).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right sm:ml-4">
                      {votes.filter((v) => v.account.winner.equals(sub.account.participant)).length > 0 && (
                        <span className="text-[#06ffa5] text-sm font-black bg-[#001858] px-2 py-1 border-2 border-black">
                          {votes.filter((v) => v.account.winner.equals(sub.account.participant)).length} VOTE(S)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Votes List */}
        {votes.length > 0 && isJudge && (
          <div className="mt-8 card-neo bg-[#8bd3dd]">
            <h2 className="text-2xl font-black text-[#001858] mb-4 uppercase">
              Judge Votes ({votes.length})
            </h2>
            <div className="space-y-2">
              {votes.map((vote) => (
                <div
                  key={vote.publicKey.toString()}
                  className="p-3 bg-white border-3 border-black neo-brutalism-shadow flex flex-col sm:flex-row sm:justify-between gap-2"
                >
                  <span className="text-[#001858] font-bold truncate">
                    Judge: {vote.account.judge.toString().slice(0, 16)}...
                  </span>
                  <span className="text-[#001858] font-black truncate">
                    Winner: {vote.account.winner.toString().slice(0, 16)}...
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
