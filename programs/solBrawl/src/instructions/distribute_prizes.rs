use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

/// Distributes prizes when consensus is reached
///
/// # Anchor Concepts Demonstrated:
/// 1. **PDA Signing** - Escrow PDA signs the transfer without a private key
/// 2. **remaining_accounts** - Dynamic number of vote accounts passed in
/// 3. **Vote Counting Logic** - Iterates through vote PDAs to reach consensus
/// 4. **Lamport Manipulation** - Direct SOL transfer using try_borrow_mut_lamports
/// 5. **Account Deserialization in Loop** - Safely deserializes vote accounts
pub fn distribute_prizes<'info>(ctx: Context<'_, '_, 'info, 'info, DistributePrizes<'info>>) -> Result<()> {
    let contest = &ctx.accounts.contest;

    // Validate contest state
    require!(contest.funded, ErrorCode::ContestNotFunded);
    require!(
        contest.status == ContestStatus::Active,
        ErrorCode::InvalidContestState
    );

    // Count votes for the specified winner using remaining_accounts
    let mut winner_votes = 0;
    for account in ctx.remaining_accounts.iter() {
        // Try to deserialize as JudgeVoteAccount
        match Account::<JudgeVoteAccount>::try_from(account) {
            Ok(vote_data) => {
                // Check if vote is for this contest and this winner
                if vote_data.contest == contest.key() &&
                   vote_data.winner == ctx.accounts.winner.key() {
                    winner_votes += 1;
                }
            }
            Err(_) => continue,
        }
    }

    // Verify consensus threshold is reached
    require!(
        winner_votes >= contest.approval_threshold as usize,
        ErrorCode::ConsensusNotReached
    );

    let distribution_amount = contest.prize_amount;

    // Transfer lamports from escrow to winner
    **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? -= distribution_amount;
    **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += distribution_amount;

    // Update contest status to Completed
    let contest = &mut ctx.accounts.contest;
    contest.status = ContestStatus::Completed;

    msg!(
        "Prize distributed: {} lamports ({} SOL) to winner: {}",
        distribution_amount,
        distribution_amount as f64 / 1_000_000_000.0,
        ctx.accounts.winner.key()
    );

    Ok(())
}

#[derive(Accounts)]
pub struct DistributePrizes<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,

    #[account(
        mut,
        seeds = [b"escrow", contest.creator.as_ref(), &contest.contest_id.to_le_bytes()],
        bump = contest.bump
    )]
    /// CHECK: Escrow PDA validated by seeds
    pub escrow: AccountInfo<'info>,

    /// CHECK: Winner address validated through judge vote consensus
    #[account(mut)]
    pub winner: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}
