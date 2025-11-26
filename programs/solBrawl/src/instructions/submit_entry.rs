use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

/// Submit an entry to a contest
///
/// # Anchor Concepts Demonstrated:
/// 1. **Composite PDA Seeds** - Submission PDA uses both contest and participant as seeds
/// 2. **String Validation** - Validates URL format and length
/// 3. **Time-based Access Control** - Uses Clock sysvar to enforce deadline
/// 4. **Saturating Arithmetic** - Prevents overflow when incrementing counters
pub fn submit_entry(
    ctx: Context<SubmitEntry>,
    submission_url: String,
) -> Result<()> {
    let contest = &ctx.accounts.contest;
    let submission = &mut ctx.accounts.submission;
    let clock = Clock::get()?;

    // Validate contest state and timing
    require!(
        contest.status == ContestStatus::Active,
        ErrorCode::InvalidContestState
    );
    require!(
        clock.unix_timestamp < contest.submission_deadline,
        ErrorCode::SubmissionDeadlinePassed
    );

    // Validate submission URL format and length
    require!(submission_url.len() <= 200, ErrorCode::UrlTooLong);
    require!(
        submission_url.starts_with("https://"),
        ErrorCode::InvalidUrl
    );

    // Initialize submission account
    submission.participant = ctx.accounts.participant.key();
    submission.contest = ctx.accounts.contest.key();
    submission.submission_url = submission_url.clone();
    submission.submitted_at = clock.unix_timestamp;
    submission.last_modified = clock.unix_timestamp;
    submission.bump = ctx.bumps.submission;

    // Increment submission count using saturating_add to prevent overflow
    let contest = &mut ctx.accounts.contest;
    contest.submission_count = contest.submission_count.saturating_add(1);

    msg!("Submission recorded: {}", submission_url);
    Ok(())
}

#[derive(Accounts)]
pub struct SubmitEntry<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,

    #[account(
        init,
        payer = participant,
        space = 8 + Submission::INIT_SPACE,
        seeds = [b"submission", contest.key().as_ref(), participant.key().as_ref()],
        bump
    )]
    pub submission: Account<'info, Submission>,

    #[account(mut)]
    pub participant: Signer<'info>,

    pub system_program: Program<'info, System>,
}
