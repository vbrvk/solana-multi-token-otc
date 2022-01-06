use std::mem::size_of;

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, ID as token_id};

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod convergence_hack {
    use anchor_lang::solana_program;

    use super::*;

    pub fn initialize_deal<'info>(
        ctx: Context<'_, '_, '_, 'info, InitializeDealParams<'info>>,
        maker_amounts: Vec<u64>,
        taker_amounts: Vec<u64>,
        taker_key: Option<Pubkey>,
    ) -> Result<()> {
        // Validate incoming data

        if taker_amounts.len() > EscrowAccount::MAX_TOKENS {
            return Err(ErrorCode::TooMuchTakerTokens.into());
        }

        if maker_amounts.len() > EscrowAccount::MAX_TOKENS {
            return Err(ErrorCode::TooMuchMakerTokens.into());
        }

        if taker_amounts.is_empty() {
            return Err(ErrorCode::NoTakerTokens.into());
        }

        if maker_amounts.is_empty() {
            return Err(ErrorCode::NoMakerTokens.into());
        }

        // Init escrow account
        // [..maker_accounts, ..taker_accounts, ..pda_accounts, ..mints] // TODO: add checks for mint
        let mut accounts = ctx.remaining_accounts.iter();
        let mut maker_token_accounts: Vec<&AccountInfo> = Vec::with_capacity(maker_amounts.len());

        for maker_amount in maker_amounts {
            let token_account = accounts.next();

            if token_account.is_none() {
                return Err(ErrorCode::NotEnoughMakerTokenAccounts.into());
            }

            let token_account = token_account.unwrap();
            maker_token_accounts.push(token_account);

            if *token_account.owner != token::ID {
                return Err(ErrorCode::BadTokenAccount.into());
            }

            ctx.accounts.escrow.maker_tokens.push(TokenInfo {
                account_key: *token_account.key,
                amount: maker_amount,
            })
        }

        for taker_amount in taker_amounts {
            let token_account = accounts.next();

            if token_account.is_none() {
                return Err(ErrorCode::NotEnoughTakerTokenAccounts.into());
            }

            let token_account = token_account.unwrap();

            if *token_account.owner != token::ID {
                return Err(ErrorCode::BadTokenAccount.into());
            }

            ctx.accounts.escrow.taker_tokens.push(TokenInfo {
                account_key: *token_account.key,
                amount: taker_amount,
            })
        }

        ctx.accounts.escrow.taker_key = taker_key;
        ctx.accounts.escrow.maker_key = *ctx.accounts.maker.key;

        // Move maker tokens to PDA token accounts
        for (i, maker_token_info) in ctx.accounts.escrow.maker_tokens.iter().enumerate() {
            let (pda, nonce) = Pubkey::find_program_address(
                &[
                    &ctx.accounts.maker.key.to_bytes(),
                    &maker_token_info.account_key.to_bytes(),
                    &ctx.accounts.escrow.as_ref().key.to_bytes(),
                ],
                ctx.program_id,
            );

            let rent = solana_program::rent::Rent::from_account_info(&ctx.accounts.rent)
                .expect("Bad rent account");

            let create_token_acc_ix = solana_program::system_instruction::create_account(
                ctx.accounts.maker.key,
                &pda,
                rent.minimum_balance(TokenAccount::LEN),
                TokenAccount::LEN as u64,
                &token_id,
            );

            let pda_account_info = accounts.next();

            if pda_account_info.is_none() {
                msg!("Not enough pda accounts provided")
            }

            let pda_account_info = pda_account_info.unwrap();

            solana_program::program::invoke_signed(
                &create_token_acc_ix,
                &[
                    ctx.accounts.maker.to_account_info().clone(),
                    pda_account_info.clone(),
                    ctx.accounts.token_program.to_account_info().clone(),
                ],
                &[&[
                    &ctx.accounts.maker.key.to_bytes(),
                    &maker_token_info.account_key.to_bytes(),
                    &ctx.accounts.escrow.as_ref().key.to_bytes(),
                    &[nonce],
                ]],
            )?;

            let mint = accounts.next().unwrap();

            if *mint.key != token::accessor::mint(maker_token_accounts[i])? {
                return Err(ErrorCode::BadMint.into());
            }

            let ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info().clone(),
                token::InitializeAccount {
                    account: pda_account_info.clone(),
                    authority: ctx.accounts.self_program.clone(),
                    mint: mint.clone(),
                    rent: ctx.accounts.rent.clone(),
                },
            );
            token::initialize_account(ctx)?;
        }

        Ok(())
    }
}

// token accounts should be passed through `remaining_accounts`
// remaining_accounts = [..maker_accounts, ..taker_accounts, ..pda_accounts]
#[derive(Accounts)]
pub struct InitializeDealParams<'info> {
    #[account()]
    maker: Signer<'info>,
    #[account(init, payer = maker, space = 8 + EscrowAccount::LEN)]
    escrow: Account<'info, EscrowAccount>,
    // Programs
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: AccountInfo<'info>,
    self_program: AccountInfo<'info>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Default, Clone, Copy)]
pub struct TokenInfo {
    account_key: Pubkey,
    amount: u64,
}

#[account]
#[derive(Default)]
pub struct EscrowAccount {
    maker_key: Pubkey,            // 32
    taker_key: Option<Pubkey>,    // 32
    maker_tokens: Vec<TokenInfo>, // 40 * MAX_TOKENS
    taker_tokens: Vec<TokenInfo>, // 40 * MAX_TOKENS
}

impl EscrowAccount {
    pub const MAX_TOKENS: usize = 20;
    pub const LEN: usize = 32 + 32 + size_of::<TokenInfo>() * EscrowAccount::MAX_TOKENS * 2;
}

#[error]
pub enum ErrorCode {
    #[msg(format!("Maximum {} taker different tokens supported", EscrowAccount::LEN))]
    TooMuchTakerTokens,
    #[msg(format!("Maximum {} maker different tokens supported", EscrowAccount::LEN))]
    TooMuchMakerTokens,
    #[msg("No taker tokens was provided")]
    NoTakerTokens,
    #[msg("No maker tokens was provided")]
    NoMakerTokens,
    #[msg("Bad token account")]
    BadTokenAccount,
    #[msg("Not enough taker token accounts was provided")]
    NotEnoughTakerTokenAccounts,
    #[msg("Not enough maker token accounts was provided")]
    NotEnoughMakerTokenAccounts,
    #[msg("Bad mint account")]
    BadMint,
}
