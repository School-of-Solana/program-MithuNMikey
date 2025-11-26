'use client';

import Link from 'next/link';
import { WalletButton } from './components/WalletButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fef6e4]">
      {/* Navigation */}
      <nav className="border-b-4 border-black bg-[#8bd3dd]">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 md:space-x-8">
              <Link href="/" className="text-lg sm:text-xl md:text-3xl font-black text-[#001858] hover:text-[#f582ae] transition-colors whitespace-nowrap">
                🏆 SOLARENA
              </Link>
              <div className="hidden sm:flex space-x-3 md:space-x-6">
                <Link
                  href="/contests"
                  className="text-[#001858] font-black hover:text-[#f582ae] transition-colors uppercase text-xs md:text-sm"
                >
                  Browse
                </Link>
                <Link
                  href="/contests/create"
                  className="text-[#001858] font-black hover:text-[#f582ae] transition-colors uppercase text-xs md:text-sm"
                >
                  Create
                </Link>
              </div>
            </div>
            <WalletButton />
          </div>
          {/* Mobile nav links */}
          <div className="flex sm:hidden justify-center space-x-6 mt-3 pt-3 border-t-2 border-black/20">
            <Link
              href="/contests"
              className="text-[#001858] font-black hover:text-[#f582ae] transition-colors uppercase text-xs"
            >
              Browse
            </Link>
            <Link
              href="/contests/create"
              className="text-[#001858] font-black hover:text-[#f582ae] transition-colors uppercase text-xs"
            >
              Create
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero Card */}
          <div className="card-neo bg-[#f582ae] mb-8 md:mb-12 text-center rotate-[-1deg]">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-[#001858] mb-4 md:mb-6 leading-tight">
              DECENTRALIZED
              <br />
              CONTEST PLATFORM
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#001858] font-bold mb-6 md:mb-8 max-w-3xl mx-auto">
              Launch competitions with built-in escrow, multisig judging, and optional gas sponsorship 🚀
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link
                href="/contests/create"
                className="btn-neo bg-[#06ffa5] text-[#001858] text-sm md:text-base"
              >
                Create Contest
              </Link>
              <Link
                href="/contests"
                className="btn-neo bg-[#ffbe0b] text-[#001858] text-sm md:text-base"
              >
                Browse Contests
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <div className="card-neo bg-[#8bd3dd] rotate-0 sm:rotate-[1deg]">
              <div className="text-4xl md:text-5xl mb-2 md:mb-3">💰</div>
              <h3 className="text-lg md:text-xl font-black text-[#001858] mb-2 uppercase">
                SOL Prizes
              </h3>
              <p className="text-[#001858] font-bold text-xs md:text-sm">
                Direct SOL prize amounts held securely in escrow
              </p>
            </div>

            <div className="card-neo bg-[#06ffa5] rotate-0 sm:rotate-[-2deg]">
              <div className="text-4xl md:text-5xl mb-2 md:mb-3">⚖️</div>
              <h3 className="text-lg md:text-xl font-black text-[#001858] mb-2 uppercase">
                Multisig Judging
              </h3>
              <p className="text-[#001858] font-bold text-xs md:text-sm">
                Configurable judge panel with customizable approval
              </p>
            </div>

            <div className="card-neo bg-[#ffbe0b] rotate-0 sm:rotate-[2deg]">
              <div className="text-4xl md:text-5xl mb-2 md:mb-3">⛽</div>
              <h3 className="text-lg md:text-xl font-black text-[#001858] mb-2 uppercase">
                Gas Sponsorship
              </h3>
              <p className="text-[#001858] font-bold text-xs md:text-sm">
                Optional fee sponsorship enables barrier-free entry
              </p>
            </div>

            <div className="card-neo bg-[#f3d2c1] rotate-0 sm:rotate-[-1deg]">
              <div className="text-4xl md:text-5xl mb-2 md:mb-3">🔒</div>
              <h3 className="text-lg md:text-xl font-black text-[#001858] mb-2 uppercase">
                Trustless Escrow
              </h3>
              <p className="text-[#001858] font-bold text-xs md:text-sm">
                Automatic fund locking using Solana PDAs
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-12 md:mt-20">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#001858] text-center mb-8 md:mb-12 uppercase">
              How It Works
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="card-neo bg-white text-center">
                <div className="w-16 h-16 bg-[#f582ae] border-4 border-black flex items-center justify-center text-[#001858] font-black text-2xl mx-auto mb-4 neo-brutalism-shadow">
                  1
                </div>
                <h3 className="text-lg font-black text-[#001858] mb-2 uppercase">
                  Create & Fund
                </h3>
                <p className="text-[#001858] font-bold text-sm">
                  Set up contest with prizes and judges
                </p>
              </div>
              <div className="card-neo bg-white text-center">
                <div className="w-16 h-16 bg-[#8bd3dd] border-4 border-black flex items-center justify-center text-[#001858] font-black text-2xl mx-auto mb-4 neo-brutalism-shadow">
                  2
                </div>
                <h3 className="text-lg font-black text-[#001858] mb-2 uppercase">
                  Accept Submissions
                </h3>
                <p className="text-[#001858] font-bold text-sm">
                  Participants submit before deadline
                </p>
              </div>
              <div className="card-neo bg-white text-center">
                <div className="w-16 h-16 bg-[#06ffa5] border-4 border-black flex items-center justify-center text-[#001858] font-black text-2xl mx-auto mb-4 neo-brutalism-shadow">
                  3
                </div>
                <h3 className="text-lg font-black text-[#001858] mb-2 uppercase">
                  Judges Vote
                </h3>
                <p className="text-[#001858] font-bold text-sm">
                  Judges independently select winner
                </p>
              </div>
              <div className="card-neo bg-white text-center">
                <div className="w-16 h-16 bg-[#ffbe0b] border-4 border-black flex items-center justify-center text-[#001858] font-black text-2xl mx-auto mb-4 neo-brutalism-shadow">
                  4
                </div>
                <h3 className="text-lg font-black text-[#001858] mb-2 uppercase">
                  Prize Distribution
                </h3>
                <p className="text-[#001858] font-bold text-sm">
                  Winner gets SOL when consensus reached
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-black bg-[#f3d2c1] mt-20">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-[#001858] font-black uppercase text-sm">
            Built on Solana • Powered by Anchor • Open Source
          </p>
        </div>
      </footer>
    </div>
  );
}
