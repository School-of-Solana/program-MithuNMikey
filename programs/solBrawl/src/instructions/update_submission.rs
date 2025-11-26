use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::ErrorCode;

/// Update an existing submission before the deadline
///
/// # Anchor Concepts Demonstrated:
/// 1. **has_one constraint** - Ensures only original participant can update
/// 2. **Mutable account updates** - Modifies existing account data
/// 3. **seeds + bump validation** - Verifies the submission PDA is correct
pub fn update_submission(
    ctx: Context<UpdateSubmission>,
    new_url: String,
) -> Result<()> {
    let contest = &ctx.accounts.contest;
    let submission = &mut ctx.accounts.submission;
    let clock = Clock::get()?;

    // Validate timing - can only update before deadline
    require!(
        clock.unix_timestamp < contest.submission_deadline,
        ErrorCode::SubmissionDeadlinePassed
    );

    // Validate new URL
    require!(new_url.len() <= 200, ErrorCode::UrlTooLong);
    require!(new_url.starts_with("https://"), ErrorCode::InvalidUrl);

    // Update submission with new URL and timestamp
    submission.submission_url = new_url.clone();
    submission.last_modified = clock.unix_timestamp;

    msg!("Submission updated: {}", new_url);
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateSubmission<'info> {
    #[account(mut)]
    pub contest: Account<'info, Contest>,

    #[account(
        mut,
        has_one = participant @ ErrorCode::UnauthorizedParticipant,
        seeds = [b"submission", contest.key().as_ref(), participant.key().as_ref()],
        bump = submission.bump
    )]
    pub submission: Account<'info, Submission>,

    pub participant: Signer<'info>,
}
