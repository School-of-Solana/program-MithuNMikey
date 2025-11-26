use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("EyMxoUu8So5nRVsAewjuWDZM16wVHJEKAzLSHs8kuEr9");

/// SolBrawl - A decentralized, gas-free contest platform on Solana
///
/// This program enables organizations to launch competitions with:
/// - Built-in escrow for SOL prizes
/// - Multisig judging with configurable thresholds
/// - Optional transaction fee sponsorship
/// - Trustless prize distribution
///
/// # Architecture
/// - 8 Instructions for full contest lifecycle
/// - 5 PDA types for accounts (contest, escrow, gas_pool, submission, vote)
/// - State machine for contest status management
/// - Time-based access control with deadlines
///
/// # Security Features
/// - PDA-based authorization
/// - Input validation
/// - State transition validation
/// - Time-locked operations
/// - Integer overflow protection
#[program]
pub mod solBrawl {
    use super::*;

    /// Creates a new contest with SOL prizes
    ///
    /// # Arguments
    /// * `contest_id` - Unique identifier for the contest
    /// * `title` - Contest title (max 100 chars)
    /// * `description` - Contest description (max 500 chars)
    /// * `prize_amount` - Prize in lamports (min 0.01 SOL)
    /// * `submission_deadline` - Unix timestamp for deadline
    /// * `judges` - List of authorized judge public keys (max 5)
    /// * `approval_threshold` - Votes needed for consensus (e.g., 2 of 3)
    pub fn create_contest(
        ctx: Context<CreateContest>,
        contest_id: u64,
        title: String,
        description: String,
        prize_amount: u64,
        submission_deadline: i64,
        judges: Vec<Pubkey>,
        approval_threshold: u8,
    ) -> Result<()> {
        instructions::create_contest::create_contest(
            ctx,
            contest_id,
            title,
            description,
            prize_amount,
            submission_deadline,
            judges,
            approval_threshold,
        )
    }

    /// Funds the contest escrow to activate it
    ///
    /// Transfers the prize amount from creator to escrow PDA
    /// and changes contest status from Setup to Active
    pub fn fund_contest(ctx: Context<FundContest>) -> Result<()> {
        instructions::fund_contest::fund_contest(ctx)
    }

    /// Enables gas sponsorship for the contest
    ///
    /// # Arguments
    /// * `gas_budget` - Amount of SOL to allocate for gas fees
    pub fn enable_gas_sponsorship(
        ctx: Context<EnableGasSponsorship>,
        gas_budget: u64,
    ) -> Result<()> {
        instructions::enable_gas_sponsorship::enable_gas_sponsorship(ctx, gas_budget)
    }

    /// Submits an entry to the contest
    ///
    /// # Arguments
    /// * `submission_url` - HTTPS URL to the submission (max 200 chars)
    pub fn submit_entry(
        ctx: Context<SubmitEntry>,
        submission_url: String,
    ) -> Result<()> {
        instructions::submit_entry::submit_entry(ctx, submission_url)
    }

    /// Updates an existing submission before deadline
    ///
    /// # Arguments
    /// * `new_url` - New HTTPS URL for the submission
    pub fn update_submission(
        ctx: Context<UpdateSubmission>,
        new_url: String,
    ) -> Result<()> {
        instructions::update_submission::update_submission(ctx, new_url)
    }

    /// Judge votes for a winner
    ///
    /// # Arguments
    /// * `winner` - Public key of the winning participant
    pub fn judge_vote(
        ctx: Context<JudgeVote>,
        winner: Pubkey,
    ) -> Result<()> {
        instructions::judge_vote::judge_vote(ctx, winner)
    }

    /// Distributes prizes when consensus is reached
    ///
    /// Counts votes from remaining_accounts and transfers
    /// prize to winner if threshold is met
    pub fn distribute_prizes<'info>(
        ctx: Context<'_, '_, 'info, 'info, DistributePrizes<'info>>,
    ) -> Result<()> {
        instructions::distribute_prizes::distribute_prizes(ctx)
    }

    /// Reclaims unused funds after contest expiry
    ///
    /// Available 30 days after deadline if contest not completed
    pub fn reclaim_funds(ctx: Context<ReclaimFunds>) -> Result<()> {
        instructions::reclaim_funds::reclaim_funds(ctx)
    }
}
