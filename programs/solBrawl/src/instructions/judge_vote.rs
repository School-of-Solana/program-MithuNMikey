use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

/// Judge votes for a winner
///
/// # Anchor Concepts Demonstrated:
/// 1. **Multisig Pattern with PDAs** - Each judge creates independent vote PDA
/// 2. **Runtime Authorization Check** - Validates judge is in authorized list
/// 3. **One vote per judge** - PDA seeds [contest, judge] enforce uniqueness
pub fn judge_vote(
    ctx: Context<JudgeVote>,
    winner: Pubkey,
) -> Result<()> {
    let contest = &ctx.accounts.contest;
    let vote = &mut ctx.accounts.vote;
    let clock = Clock::get()?;

    // Validate contest state
    require!(
        contest.status == ContestStatus::Active,
        ErrorCode::InvalidContestState
    );
    require!(
        clock.unix_timestamp >= contest.submission_deadline,
        ErrorCode::SubmissionPeriodNotEnded
    );

    // Runtime check: Verify judge is in authorized judges list
    require!(
        contest.judges.contains(&ctx.accounts.judge.key()),
        ErrorCode::UnauthorizedJudge
    );

    // Record vote in a new PDA
    vote.judge = ctx.accounts.judge.key();
    vote.contest = ctx.accounts.contest.key();
    vote.winner = winner;
    vote.voted_at = clock.unix_timestamp;
    vote.bump = ctx.bumps.vote;

    msg!("Judge {} voted for winner: {}", vote.judge, winner);
    Ok(())
}

#[derive(Accounts)]
pub struct JudgeVote<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,

    #[account(
        init,
        payer = judge,
        space = 8 + JudgeVoteAccount::INIT_SPACE,
        seeds = [b"vote", contest.key().as_ref(), judge.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, JudgeVoteAccount>,

    #[account(mut)]
    pub judge: Signer<'info>,

    pub system_program: Program<'info, System>,
}
