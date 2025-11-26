'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { WalletButton } from '../components/WalletButton';
import { getProgram } from '../lib/program';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

export default function ContestsPage() {
  const { connection } = useConnection();
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContests();
  }, [connection]);

  const fetchContests = async () => {
    try {
      // Create a dummy wallet for fetching (read-only operations)
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

      // Fetch all contest accounts
      const contestAccounts = await (program.account as any).contest.all();
      setContests(contestAccounts);
    } catch (err) {
      console.error('Error fetching contests:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: any) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      setup: { color: 'bg-[#ffbe0b] border-4 border-black text-[#001858]', text: 'SETUP' },
      active: { color: 'bg-[#06ffa5] border-4 border-black text-[#001858]', text: 'ACTIVE' },
      judging: { color: 'bg-[#8bd3dd] border-4 border-black text-[#001858]', text: 'JUDGING' },
      completed: { color: 'bg-[#f582ae] border-4 border-black text-[#001858]', text: 'COMPLETED' },
      cancelled: { color: 'bg-[#f3d2c1] border-4 border-black text-[#001858]', text: 'CANCELLED' },
    };

    const statusKey = Object.keys(status)[0].toLowerCase();
    const statusInfo = statusMap[statusKey] || statusMap.setup;

    return (
      <span className={`px-4 py-2 text-sm font-black uppercase neo-brutalism-shadow ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    );
  };

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
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-[#001858] mb-2 uppercase">
              All Contests
            </h1>
            <p className="text-[#001858] font-bold text-sm md:text-base">
              Browse and participate in active contests
            </p>
          </div>
          <Link
            href="/contests/create"
            className="btn-neo bg-[#f582ae] text-[#001858] text-center"
          >
            Create Contest
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="card-neo bg-[#8bd3dd] inline-block">
              <p className="text-[#001858] font-black text-xl uppercase">Loading contests...</p>
            </div>
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-12">
            <div className="card-neo bg-[#ffbe0b] inline-block mb-4">
              <p className="text-[#001858] font-black text-xl uppercase mb-2">No contests found</p>
              <Link
                href="/contests/create"
                className="btn-neo bg-[#06ffa5] text-[#001858] inline-block"
              >
                Create the first contest
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contests.map((contest, idx) => (
              <Link
                key={contest.publicKey.toString()}
                href={`/contests/${contest.publicKey.toString()}`}
                className={`card-neo bg-white hover:translate-y-[-4px] transition-transform ${
                  idx % 3 === 0 ? 'rotate-[1deg]' : idx % 3 === 1 ? 'rotate-[-1deg]' : 'rotate-[2deg]'
                }`}
              >
                <div className="mb-4 flex flex-wrap gap-2">
                  {getStatusBadge(contest.account.status)}
                  {contest.account.gasSponsorshipEnabled && (
                    <span className="px-3 py-1.5 text-xs font-black uppercase border-3 border-black neo-brutalism-shadow bg-[#06ffa5] text-[#001858]">
                      ⛽ FREE GAS
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-[#001858] mb-2 uppercase">
                  {contest.account.title}
                </h3>
                <p className="text-[#001858] font-bold mb-4 line-clamp-2 text-sm">
                  {contest.account.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2">
                    <span className="text-[#001858] font-bold">Prize:</span>
                    <span className="text-[#001858] font-black text-lg">
                      {(contest.account.prizeAmount.toNumber() / LAMPORTS_PER_SOL).toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#001858] font-bold">Submissions:</span>
                    <span className="text-[#001858] font-black">
                      {contest.account.submissionCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#001858] font-bold">Judges:</span>
                    <span className="text-[#001858] font-black">
                      {contest.account.judges.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#001858] font-bold">Deadline:</span>
                    <span className="text-[#001858] font-black">
                      {new Date(contest.account.submissionDeadline.toNumber() * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
