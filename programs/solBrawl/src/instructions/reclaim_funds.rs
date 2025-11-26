use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

/// Reclaim unused funds after contest expiry
///
/// # Anchor Concepts Demonstrated:
/// 1. **Time-locked operations** - 30-day grace period before reclaim
/// 2. **Fund recovery pattern** - Allows creator to retrieve unused funds
/// 3. **State-based validation** - Only works if contest not completed
pub fn reclaim_funds(ctx: Context<ReclaimFunds>) -> Result<()> {
    let contest = &ctx.accounts.contest;
    let clock = Clock::get()?;

    // Validate conditions for reclaiming
    require!(
        contest.status != ContestStatus::Completed,
        ErrorCode::ContestAlreadyCompleted
    );

    // Allow reclaim after 30 days past deadline (time-lock mechanism)
    let reclaim_period = contest.submission_deadline + (30 * 24 * 60 * 60);
    require!(
        clock.unix_timestamp >= reclaim_period,
        ErrorCode::ReclaimPeriodNotReached
    );

    // Transfer all remaining funds back to creator
    let escrow_balance = ctx.accounts.escrow.to_account_info().lamports();

    **ctx.accounts.escrow.to_account_info().try_borrow_mut_lamports()? = 0;
    **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += escrow_balance;

    msg!("Reclaimed {} lamports", escrow_balance);
    Ok(())
}

#[derive(Accounts)]
pub struct ReclaimFunds<'info> {
    #[account(
        mut,
        has_one = creator @ ErrorCode::UnauthorizedCreator,
    )]
    pub contest: Account<'info, Contest>,

    #[account(
        mut,
        seeds = [b"escrow", creator.key().as_ref(), &contest.contest_id.to_le_bytes()],
        bump = contest.bump
    )]
    /// CHECK: Escrow PDA
    pub escrow: AccountInfo<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,
}
