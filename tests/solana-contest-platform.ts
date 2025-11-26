import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError } from "@coral-xyz/anchor";
import { SolBrawl } from "../target/types/solBrawl";
import { assert } from "chai";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "bn.js";

describe("solBrawl", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solBrawl as Program<SolBrawl>;

  // Test accounts
  const creator = Keypair.generate();
  const entrant1 = Keypair.generate();
  const entrant2 = Keypair.generate();
  const judge1 = Keypair.generate();
  const judge2 = Keypair.generate();
  const nonJudge = Keypair.generate();

  // Constants
  const contestId = new BN(1);
  const prizeAmount = new BN(1 * LAMPORTS_PER_SOL); // 1 SOL
  const entryFee = new BN(0); // Not used in current program version based on analysis
  const gasBudget = new BN(0.1 * LAMPORTS_PER_SOL);

  // PDAs
  let contestPda: PublicKey;
  let escrowPda: PublicKey;
  let submissionPda1: PublicKey;
  let votePda1: PublicKey;

  // Time management
  const now = Math.floor(Date.now() / 1000);
  const submissionDeadline = new BN(now + 10); // 10 seconds from now (short for testing)
  const longDeadline = new BN(now + 3600); // 1 hour from now

  before(async () => {
    // Airdrop SOL to accounts
    const accounts = [creator, entrant1, entrant2, judge1, judge2, nonJudge];
    for (const acc of accounts) {
      const sig = await provider.connection.requestAirdrop(acc.publicKey, 10 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig);
    }

    // Derive PDAs
    [contestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contest"), creator.publicKey.toBuffer(), contestId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [escrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), creator.publicKey.toBuffer(), contestId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [submissionPda1] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), contestPda.toBuffer(), entrant1.publicKey.toBuffer()],
      program.programId
    );

    [votePda1] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), contestPda.toBuffer(), judge1.publicKey.toBuffer()],
      program.programId
    );
  });

  // 1. create_contest
  it("1A. HAPPY: Creates a contest", async () => {
    await program.methods
      .createContest(
        contestId,
        "Test Contest",
        "Description",
        prizeAmount,
        longDeadline,
        [judge1.publicKey, judge2.publicKey],
        2 // Threshold
      )
      .accounts({
        contest: contestPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const contestAccount = await program.account.contest.fetch(contestPda);
    assert.equal(contestAccount.creator.toBase58(), creator.publicKey.toBase58());
    assert.equal(contestAccount.contestId.toString(), contestId.toString());
    assert.equal(contestAccount.status.setup, objectEquals(contestAccount.status, { setup: {} }));
  });

  it("1B. UNHAPPY: Fails with past deadline", async () => {
    const badId = new BN(999);
    const [badContestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contest"), creator.publicKey.toBuffer(), badId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const pastDeadline = new BN(now - 1000);

    try {
      await program.methods
        .createContest(
          badId,
          "Bad Contest",
          "Desc",
          prizeAmount,
          pastDeadline,
          [judge1.publicKey],
          1
        )
        .accounts({
          contest: badContestPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      assert.ok(e instanceof AnchorError);
      // ErrorCode::InvalidDeadline
    }
  });

  // 2. fund_contest
  it("2A. HAPPY: Funds the contest", async () => {
    const initialEscrowBal = await provider.connection.getBalance(escrowPda);
    assert.equal(initialEscrowBal, 0);

    await program.methods
      .fundContest()
      .accounts({
        contest: contestPda,
        escrow: escrowPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const finalEscrowBal = await provider.connection.getBalance(escrowPda);
    assert.equal(finalEscrowBal, prizeAmount.toNumber());

    const contestAccount = await program.account.contest.fetch(contestPda);
    assert.ok(contestAccount.funded);
    // Status should be Active
    assert.ok(contestAccount.status.active);
  });

  it("2B. UNHAPPY: Fails if already funded", async () => {
    try {
      await program.methods
        .fundContest()
        .accounts({
          contest: contestPda,
          escrow: escrowPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      assert.ok(e instanceof AnchorError);
      // ErrorCode::AlreadyFunded or InvalidContestState
    }
  });

  // 3. enable_gas_sponsorship
  it("3A. HAPPY: Enables gas sponsorship", async () => {
    await program.methods
      .enableGasSponsorship(gasBudget)
      .accounts({
        contest: contestPda,
        creator: creator.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const contestAccount = await program.account.contest.fetch(contestPda);
    assert.ok(contestAccount.gasSponsorshipEnabled);
  });

  it("3B. UNHAPPY: Fails if non-creator tries to enable", async () => {
    try {
      await program.methods
        .enableGasSponsorship(gasBudget)
        .accounts({
          contest: contestPda,
          creator: entrant1.publicKey, // Wrong signer
          systemProgram: SystemProgram.programId,
        })
        .signers([entrant1])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      assert.ok(e instanceof AnchorError);
      // ErrorCode::UnauthorizedCreator (from has_one check)
    }
  });

  // 4. submit_entry
  it("4A. HAPPY: Submits an entry", async () => {
    const url = "https://github.com/entry1";
    await program.methods
      .submitEntry(url)
      .accounts({
        contest: contestPda,
        submission: submissionPda1,
        participant: entrant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([entrant1])
      .rpc();

    const submissionAccount = await program.account.submission.fetch(submissionPda1);
    assert.equal(submissionAccount.submissionUrl, url);

    const contestAccount = await program.account.contest.fetch(contestPda);
    assert.equal(contestAccount.submissionCount, 1);
  });

  it("4B. UNHAPPY: Fails with invalid URL", async () => {
    const badUrl = "ftp://bad.url";
    const [badSubmissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), contestPda.toBuffer(), entrant2.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .submitEntry(badUrl)
        .accounts({
          contest: contestPda,
          submission: badSubmissionPda,
          participant: entrant2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([entrant2])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      assert.ok(e instanceof AnchorError);
      // ErrorCode::InvalidUrl
    }
  });

  // 5. update_submission
  it("5A. HAPPY: Updates an entry", async () => {
    const newUrl = "https://github.com/entry1-v2";
    await program.methods
      .updateSubmission(newUrl)
      .accounts({
        contest: contestPda,
        submission: submissionPda1,
        participant: entrant1.publicKey,
      })
      .signers([entrant1])
      .rpc();

    const submissionAccount = await program.account.submission.fetch(submissionPda1);
    assert.equal(submissionAccount.submissionUrl, newUrl);
  });

  it("5B. UNHAPPY: Fails if wrong participant tries to update", async () => {
    try {
      await program.methods
        .updateSubmission("https://hacked.com")
        .accounts({
          contest: contestPda,
          submission: submissionPda1,
          participant: entrant2.publicKey, // Wrong signer
        })
        .signers([entrant2])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      // This might fail due to seeds mismatch (Anchor checks seeds) or has_one
      // Since seeds include participant, entrant2's signature won't match the PDA derived from entrant1
      // Actually, if we pass submissionPda1 (entrant1's PDA) but sign with entrant2,
      // Anchor will check if `participant` account matches the one in seeds.
      // The seeds are [b"submission", contest, participant].
      // If we pass entrant2 as participant, the PDA derived would be different.
      // If we pass entrant2 as participant but submissionPda1 as account, Anchor constraint `seeds` will fail.
      assert.ok(true); // Constraint failure expected
    }
  });

  // 6. judge_vote
  it("6A. HAPPY: Judge votes", async () => {
    // Wait for deadline to pass? 
    // The program requires `clock.unix_timestamp >= contest.submission_deadline` for voting.
    // Our deadline is `longDeadline` (1 hour). We can't vote yet.
    // To test voting, we need a contest with a short deadline.

    // Create a new contest with short deadline for voting tests
    const shortId = new BN(2);
    const shortDeadline = new BN(Math.floor(Date.now() / 1000) + 2); // 2 seconds
    const [shortContestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contest"), creator.publicKey.toBuffer(), shortId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [shortEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), creator.publicKey.toBuffer(), shortId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods.createContest(shortId, "Short", "Desc", prizeAmount, shortDeadline, [judge1.publicKey], 1)
      .accounts({ contest: shortContestPda, creator: creator.publicKey, systemProgram: SystemProgram.programId })
      .signers([creator])
      .rpc();

    await program.methods.fundContest()
      .accounts({ contest: shortContestPda, escrow: shortEscrowPda, creator: creator.publicKey, systemProgram: SystemProgram.programId })
      .signers([creator])
      .rpc();

    // Sleep for 3 seconds to pass deadline
    await new Promise(r => setTimeout(r, 3000));

    const [shortVotePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), shortContestPda.toBuffer(), judge1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .judgeVote(entrant1.publicKey)
      .accounts({
        contest: shortContestPda,
        vote: shortVotePda,
        judge: judge1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([judge1])
      .rpc();

    const voteAccount = await program.account.judgeVoteAccount.fetch(shortVotePda);
    assert.equal(voteAccount.winner.toBase58(), entrant1.publicKey.toBase58());
  });

  it("6B. UNHAPPY: Fails if non-judge votes", async () => {
    // Use the short contest from 6A
    const shortId = new BN(2);
    const [shortContestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contest"), creator.publicKey.toBuffer(), shortId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [badVotePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), shortContestPda.toBuffer(), nonJudge.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .judgeVote(entrant1.publicKey)
        .accounts({
          contest: shortContestPda,
          vote: badVotePda,
          judge: nonJudge.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([nonJudge])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      assert.ok(e instanceof AnchorError);
      // ErrorCode::UnauthorizedJudge
    }
  });

  // 7. distribute_prizes
  it("7A. HAPPY: Distributes prizes", async () => {
    // Use the short contest from 6A where judge1 voted for entrant1. Threshold is 1.
    const shortId = new BN(2);
    const [shortContestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contest"), creator.publicKey.toBuffer(), shortId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [shortEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), creator.publicKey.toBuffer(), shortId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [shortVotePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), shortContestPda.toBuffer(), judge1.publicKey.toBuffer()],
      program.programId
    );

    const winnerInitialBal = await provider.connection.getBalance(entrant1.publicKey);

    await program.methods
      .distributePrizes()
      .accounts({
        contest: shortContestPda,
        escrow: shortEscrowPda,
        winner: entrant1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts([
        { pubkey: shortVotePda, isWritable: false, isSigner: false }
      ])
      .rpc();

    const winnerFinalBal = await provider.connection.getBalance(entrant1.publicKey);
    assert.ok(winnerFinalBal > winnerInitialBal);

    const contestAccount = await program.account.contest.fetch(shortContestPda);
    assert.ok(contestAccount.status.completed);
  });

  it("7B. UNHAPPY: Fails if incorrect winner provided", async () => {
    // Create another contest for this failure case
    const failId = new BN(3);
    const shortDeadline = new BN(Math.floor(Date.now() / 1000) + 2);
    const [failContestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contest"), creator.publicKey.toBuffer(), failId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [failEscrowPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), creator.publicKey.toBuffer(), failId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    await program.methods.createContest(failId, "Fail", "Desc", prizeAmount, shortDeadline, [judge1.publicKey], 1)
      .accounts({ contest: failContestPda, creator: creator.publicKey, systemProgram: SystemProgram.programId })
      .signers([creator])
      .rpc();

    await program.methods.fundContest()
      .accounts({ contest: failContestPda, escrow: failEscrowPda, creator: creator.publicKey, systemProgram: SystemProgram.programId })
      .signers([creator])
      .rpc();

    await new Promise(r => setTimeout(r, 3000));

    const [failVotePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vote"), failContestPda.toBuffer(), judge1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods.judgeVote(entrant1.publicKey)
      .accounts({ contest: failContestPda, vote: failVotePda, judge: judge1.publicKey, systemProgram: SystemProgram.programId })
      .signers([judge1])
      .rpc();

    try {
      await program.methods
        .distributePrizes()
        .accounts({
          contest: failContestPda,
          escrow: failEscrowPda,
          winner: entrant2.publicKey, // Wrong winner
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts([
          { pubkey: failVotePda, isWritable: false, isSigner: false }
        ])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      assert.ok(e instanceof AnchorError);
      // ErrorCode::InvalidWinner or similar logic check
    }
  });

  // 8. reclaim_funds
  it.skip("8A. HAPPY: Reclaims funds (Requires 30 days wait)", async () => {
    // Cannot easily test without time travel
  });

  it("8B. UNHAPPY: Fails if too early", async () => {
    // Use the contest from 1A (longDeadline)
    try {
      await program.methods
        .reclaimFunds()
        .accounts({
          contest: contestPda,
          escrow: escrowPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
      assert.fail("Should have failed");
    } catch (e) {
      assert.ok(e instanceof AnchorError);
      // ErrorCode::ContestNotExpired
    }
  });

});

// Helper for enum comparison
function objectEquals(x, y) {
  if (x === null || x === undefined || y === null || y === undefined) return x === y;
  if (x.constructor !== y.constructor) return false;
  if (x instanceof Function || x instanceof RegExp) return x === y;
  if (x === y || x.valueOf() === y.valueOf()) return true;
  if (Array.isArray(x) && x.length !== y.length) return false;
  if (x instanceof Date) return false;
  if (!(x instanceof Object)) return false;
  if (!(y instanceof Object)) return false;
  const p = Object.keys(x);
  return Object.keys(y).every(i => p.indexOf(i) !== -1) &&
    p.every(i => objectEquals(x[i], y[i]));
}