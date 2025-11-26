'use client';

import Link from 'next/link';
import { WalletButton } from './WalletButton';

export function Nav() {
  return (
    <nav className="border-b-4 border-black bg-[#8bd3dd]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-3xl font-black text-[#001858] hover:text-[#f582ae] transition-colors">
              🏆 SOLBRAWL
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link
                href="/contests"
                className="text-[#001858] font-black hover:text-[#f582ae] transition-colors uppercase text-sm"
              >
                Browse
              </Link>
              <Link
                href="/contests/create"
                className="text-[#001858] font-black hover:text-[#f582ae] transition-colors uppercase text-sm"
              >
                Create
              </Link>
            </div>
          </div>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
