# SolBrawl Frontend

A Next.js frontend for the SolBrawl decentralized contest platform on Solana.

## Features

- ✅ Create contests with SOL prizes
- ✅ Fund contests with automatic escrow
- ✅ Submit entries before deadline
- ✅ Multisig judge voting
- ✅ Automatic prize distribution
- ✅ Browse all contests
- ✅ Real-time status updates

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Tailwind CSS 4** - Styling
- **@solana/wallet-adapter** - Wallet integration
- **@coral-xyz/anchor** - Solana program interaction
- **TypeScript** - Type safety

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- A Solana wallet (Phantom, Solflare, etc.)
- Devnet SOL for testing

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
pnpm build
pnpm start
```

## Program Details

- **Network:** Devnet
- **Program ID:** `DUB1GR1YwzjhNW7V9EiQjh2ogmgveFmEDMsjsBJh2Rvd`
- **RPC Endpoint:** `https://api.devnet.solana.com`

## Usage

### Creating a Contest

1. Connect your wallet
2. Click "Create Contest"
3. Fill in contest details:
   - Title and description
   - Prize amount (min 0.01 SOL)
   - Submission deadline
   - Judge addresses (1-5 judges)
   - Approval threshold
4. Click "Create Contest"
5. Fund the contest to activate it

### Submitting an Entry

1. Navigate to an active contest
2. Ensure you're connected and before deadline
3. Enter your submission URL (must be HTTPS)
4. Click "Submit Entry"

### Judging

1. Connect with a judge wallet
2. Navigate to contest after deadline
3. Select a winner from submissions
4. Cast your vote

### Prize Distribution

Once the approval threshold is reached (e.g., 2 of 3 judges agree):
- Anyone can trigger prize distribution
- Winner receives the escrowed SOL
- Contest status changes to "Completed"

## Project Structure

```
app/
├── app/
│   ├── components/        # Reusable UI components
│   │   └── WalletButton.tsx
│   ├── contests/          # Contest pages
│   │   ├── create/        # Create contest
│   │   ├── [id]/          # Contest details
│   │   └── page.tsx       # Browse contests
│   ├── lib/               # Utilities
│   │   ├── program.ts     # Program helpers
│   │   ├── types.ts       # TypeScript types
│   │   └── solarena.json  # Program IDL
│   ├── providers/         # Context providers
│   │   └── SolanaProvider.tsx
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── public/                # Static assets
├── package.json
└── README.md
```

## Key Features Explained

### Wallet Integration

The app uses `@solana/wallet-adapter-react` for seamless wallet connections:
- Phantom
- Solflare
- Torus
- And more via Wallet Standard

### Smart Contract Interaction

All interactions with the Solana program use Anchor:
- PDA derivation for contests, submissions, votes
- Automatic transaction signing
- Error handling and user feedback

### Real-time Updates

Contest data is fetched directly from the Solana blockchain:
- No backend required
- Fully decentralized
- Real-time state updates

## Troubleshooting

### "Insufficient Funds" Error

Get devnet SOL from a faucet:
```bash
solana airdrop 2 YOUR_ADDRESS --url devnet
```

### Wallet Not Connecting

- Ensure you have a compatible wallet installed
- Try refreshing the page
- Check browser console for errors

### Transaction Failing

- Ensure you have enough SOL for transaction fees
- Check that you're on Devnet
- Verify contest status (Setup → Active → Completed)



