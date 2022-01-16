use std::mem::size_of;

use anchor_lang::prelude::*;
use anchor_lang::solana_program;
use anchor_spl::token::{self, Token, TokenAccount, ID as token_id};

declare_id!("6yBt5s2MMBanRq2k9kCorgnXRjwQG5gRmboKPQ2SnjTd");

#[program]
pub mod convergence_hack {

    use super::*;

    pub fn initialize_deal<'info>(
        ctx: Context<'_, '_, '_, 'info, InitializeDealParams<'info>>,
        maker_lamports_offer: u64,
        maker_lamports_request: u64,
        maker_amounts: Vec<u64>,
        taker_amounts: Vec<u64>,
        taker_key: Option<Pubkey>,
    ) -> Result<()> {
        // Validate incoming data

        if taker_amounts.is_empty() {
            return Err(ErrorCode::NotEnoughAccounts.into());
        }

        if maker_amounts.is_empty() {
            return Err(ErrorCode::NotEnoughAccounts.into());
        }

        // Init escrow account
        ctx.accounts.escrow.maker_lamports_offer = maker_lamports_offer;
        ctx.accounts.escrow.maker_lamports_request = maker_lamports_request;

        // [..maker_accounts_from, ..maker_accounts_to, ..pda_accounts, ..mints]
        let mut accounts = ctx.remaining_accounts.iter();
        let mut maker_token_accounts_from: Vec<(&AccountInfo, u64)> =
            Vec::with_capacity(maker_amounts.len());

        for maker_amount in &maker_amounts {
            let maker_account_from = accounts.next();

            if maker_account_from.is_none() {
                msg!("Not enough maker token accounts from");
                return Err(ErrorCode::NotEnoughMakerTokenAccountsFrom.into());
            }

            let token_account = maker_account_from.unwrap();
            maker_token_accounts_from.push((token_account, *maker_amount));

            if *token_account.owner != token::ID {
                return Err(ErrorCode::BadTokenAccount.into());
            }
        }

        for taker_amount in &taker_amounts {
            let maker_account_to = accounts.next();

            if maker_account_to.is_none() {
                msg!("Not enough maker token accounts to");

                return Err(ErrorCode::NotEnoughMakerTokenAccountsTo.into());
            }

            let maker_account_to = maker_account_to.unwrap();

            if *maker_account_to.owner != token::ID {
                return Err(ErrorCode::BadTokenAccount.into());
            }

            ctx.accounts.escrow.maker_tokens_request.push(TokenInfo {
                pubkey: maker_account_to.key(),
                amount: *taker_amount,
            })
        }

        ctx.accounts.escrow.taker = taker_key;
        ctx.accounts.escrow.maker = *ctx.accounts.maker.key;

        // Move sol to escrow account

        if maker_lamports_offer > 0 {
            solana_program::program::invoke(
                &solana_program::system_instruction::transfer(
                    &ctx.accounts.maker.key(),
                    &ctx.accounts.escrow.key(),
                    maker_lamports_offer,
                ),
                &[
                    ctx.accounts.maker.to_account_info(),
                    ctx.accounts.escrow.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        // Move maker tokens to PDA token accounts
        for (maker_token_account_from, maker_amount) in maker_token_accounts_from.iter() {
            // TODO: pass nonces as params
            let maker_token_from_mint = token::accessor::mint(maker_token_account_from)?;

            let (pda, nonce) = Pubkey::find_program_address(
                &[
                    &ctx.accounts.maker.key.to_bytes(),
                    &maker_token_from_mint.key().to_bytes(),
                    &ctx.accounts.escrow.to_account_info().key.to_bytes(),
                ],
                ctx.program_id,
            );

            let create_token_acc_ix = solana_program::system_instruction::create_account(
                ctx.accounts.maker.key,
                &pda,
                ctx.accounts.rent.minimum_balance(TokenAccount::LEN),
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
                    &maker_token_from_mint.key().to_bytes(),
                    &ctx.accounts.escrow.to_account_info().key.to_bytes(),
                    &[nonce],
                ]],
            )?;

            let mint = accounts.next().unwrap();

            if *mint.key != maker_token_from_mint {
                msg!(
                    "maker_token_from_mint not math provided mint: expected {}, got {}",
                    mint.key,
                    maker_token_from_mint
                );
                return Err(ErrorCode::BadMint.into());
            }

            let init_account_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info().clone(),
                token::InitializeAccount {
                    account: pda_account_info.clone(),
                    authority: pda_account_info.clone(),
                    mint: mint.clone(),
                    rent: ctx.accounts.rent.to_account_info().clone(),
                },
            );
            token::initialize_account(init_account_ctx)?;

            let transfer_tokens_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info().clone(),
                token::Transfer {
                    from: (*maker_token_account_from).clone(),
                    to: pda_account_info.clone(),
                    authority: ctx.accounts.maker.to_account_info().clone(),
                },
            );

            token::transfer(transfer_tokens_ctx, *maker_amount)?;

            ctx.accounts.escrow.maker_locked_tokens.push(TokenInfo {
                amount: *maker_amount,
                pubkey: pda,
            })
        }

        Ok(())
    }

    pub fn exchange<'info>(ctx: Context<'_, '_, '_, 'info, ExchangeParams<'info>>) -> Result<()> {
        if ctx.accounts.escrow.taker.is_some()
            && ctx.accounts.escrow.taker != Some(ctx.accounts.taker.key())
        {
            return Err(ErrorCode::BadTaker.into());
        }

        let mut accounts = ctx.remaining_accounts.iter();

        // move taker funds to maker

        if ctx.accounts.escrow.maker_lamports_request > 0 {
            solana_program::program::invoke(
                &solana_program::system_instruction::transfer(
                    &ctx.accounts.taker.key(),
                    &ctx.accounts.maker.key(),
                    ctx.accounts.escrow.maker_lamports_request,
                ),
                &[
                    ctx.accounts.maker.to_account_info(),
                    ctx.accounts.taker.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        for maker_req in &ctx.accounts.escrow.maker_tokens_request {
            let taker_token_account = accounts.next();
            let maker_token_account = accounts.next();

            if taker_token_account.is_none() {
                return Err(ErrorCode::NotEnoughAccounts.into());
            }

            if maker_token_account.is_none() {
                return Err(ErrorCode::NotEnoughAccounts.into());
            }

            let taker_token_account = taker_token_account.unwrap();
            let maker_token_account = maker_token_account.unwrap();

            if token::accessor::mint(taker_token_account)
                != token::accessor::mint(maker_token_account)
            {
                return Err(ErrorCode::TokenAccountsNotMatched.into());
            }

            let transfer_tokens_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info().clone(),
                token::Transfer {
                    from: taker_token_account.clone(),
                    to: maker_token_account.clone(),
                    authority: ctx.accounts.taker.to_account_info().clone(),
                },
            );

            token::transfer(transfer_tokens_ctx, maker_req.amount)?;
        }

        for maker_lock in &ctx.accounts.escrow.maker_locked_tokens {
            // move maker funds to taker
            let taker_token_account = accounts.next();
            let pda_token_account = accounts.next();

            if taker_token_account.is_none() {
                return Err(ErrorCode::NotEnoughAccounts.into());
            }

            if pda_token_account.is_none() {
                return Err(ErrorCode::NotEnoughAccounts.into());
            }

            let taker_token_account = taker_token_account.unwrap();
            let pda_token_account = pda_token_account.unwrap();

            let pda_token_mint = token::accessor::mint(pda_token_account)?;

            if token::accessor::mint(taker_token_account)? != pda_token_mint {
                return Err(ErrorCode::TokenAccountsNotMatched.into());
            }

            // TODO: pass nonces as params
            let (pda, nonce) = Pubkey::find_program_address(
                &[
                    &ctx.accounts.maker.key.to_bytes(),
                    &pda_token_mint.key().to_bytes(),
                    &ctx.accounts.escrow.to_account_info().key.to_bytes(),
                ],
                ctx.program_id,
            );

            let signers_seeds: &[&[&[u8]]] = &[&[
                &ctx.accounts.maker.key.to_bytes(),
                &pda_token_mint.key().to_bytes(),
                &ctx.accounts.escrow.to_account_info().key.to_bytes(),
                &[nonce],
            ]];

            let token_vault = TokenVault {
                authority: &pda,
                account: pda_token_account.clone(),
                token_program_account: ctx.accounts.token_program.to_account_info(),
                signers_seeds,
            };

            // transfer tokens to taker
            token_vault.transfer_tokens(taker_token_account.clone(), maker_lock.amount)?;

            // Close pda accounts and return lamports to maker
            token_vault.close_account(ctx.accounts.maker.to_account_info())?;
        }

        Ok(())
    }

    pub fn close_deal<'info>(
        ctx: Context<'_, '_, '_, 'info, CloseDealParams<'info>>,
    ) -> Result<()> {
        // return maker lamports
        if ctx.accounts.escrow.maker_lamports_offer > 0 {
            solana_program::program::invoke(
                &solana_program::system_instruction::transfer(
                    &ctx.accounts.escrow.key(),
                    &ctx.accounts.maker.key(),
                    ctx.accounts.escrow.maker_lamports_offer,
                ),
                &[
                    ctx.accounts.maker.to_account_info(),
                    ctx.accounts.escrow.to_account_info(),
                    ctx.accounts.system_program.to_account_info(),
                ],
            )?;
        }

        let mut accounts = ctx.remaining_accounts.iter();

        // return maker funds from pda to maker and close accounts
        for maker_locked_token in &ctx.accounts.escrow.maker_locked_tokens {
            let maker_return_to_token_account = accounts.next();
            let pda_token_account = accounts.next();

            if maker_return_to_token_account.is_none() {
                return Err(ErrorCode::NotEnoughAccounts.into());
            }

            if pda_token_account.is_none() {
                return Err(ErrorCode::NotEnoughAccounts.into());
            }

            let maker_return_to_token_account = maker_return_to_token_account.unwrap();
            let pda_token_account = pda_token_account.unwrap();

            let pda_token_mint = token::accessor::mint(pda_token_account)?;

            if token::accessor::mint(maker_return_to_token_account)? != pda_token_mint {
                return Err(ErrorCode::TokenAccountsNotMatched.into());
            }

            let (pda, nonce) = Pubkey::find_program_address(
                &[
                    &ctx.accounts.maker.key.to_bytes(),
                    &pda_token_mint.key().to_bytes(),
                    &ctx.accounts.escrow.to_account_info().key.to_bytes(),
                ],
                ctx.program_id,
            );

            let signers_seeds: &[&[&[u8]]] = &[&[
                &ctx.accounts.maker.key.to_bytes(),
                &pda_token_mint.key().to_bytes(),
                &ctx.accounts.escrow.to_account_info().key.to_bytes(),
                &[nonce],
            ]];

            let token_vault = TokenVault {
                authority: &pda,
                account: pda_token_account.clone(),
                token_program_account: ctx.accounts.token_program.to_account_info(),
                signers_seeds,
            };

            // transfer tokens back to maker
            token_vault.transfer_tokens(
                maker_return_to_token_account.clone(),
                maker_locked_token.amount,
            )?;

            // Close pda accounts and return lamports to maker
            token_vault.close_account(ctx.accounts.maker.to_account_info())?;
        }

        Ok(())
    }
}

struct TokenVault<'a, 'b> {
    pub token_program_account: AccountInfo<'a>,
    pub account: AccountInfo<'a>,
    pub authority: &'b Pubkey,
    pub signers_seeds: &'b [&'b [&'b [u8]]],
}

impl<'a, 'b> TokenVault<'a, 'b> {
    pub fn transfer_tokens(
        &self,
        dest_account_info: AccountInfo<'a>,
        amount: u64,
    ) -> ProgramResult {
        let transfer_tokens_ix = spl_token::instruction::transfer(
            &self.token_program_account.key(),
            self.authority,
            &dest_account_info.key(),
            self.authority,
            &[self.authority],
            amount,
        )?;

        solana_program::program::invoke_signed(
            &transfer_tokens_ix,
            &[
                dest_account_info,
                self.account.clone(),
                self.token_program_account.clone(),
            ],
            self.signers_seeds,
        )
    }

    pub fn close_account(&self, dest_lamports_account_info: AccountInfo<'a>) -> ProgramResult {
        let close_account_ix = spl_token::instruction::close_account(
            &self.token_program_account.key(),
            self.authority,
            &dest_lamports_account_info.key(),
            self.authority,
            &[self.authority],
        )?;

        solana_program::program::invoke_signed(
            &close_account_ix,
            &[
                dest_lamports_account_info.clone(),
                self.account.clone(),
                self.token_program_account.clone(),
            ],
            self.signers_seeds,
        )
    }
}

#[derive(AnchorDeserialize, AnchorSerialize, Default, Clone, Copy)]
pub struct TokenInfo {
    pubkey: Pubkey,
    amount: u64,
}

#[account]
#[derive(Default)]
pub struct EscrowAccount {
    maker: Pubkey,               // 32
    taker: Option<Pubkey>,       // 32
    maker_lamports_offer: u64,   // 8
    maker_lamports_request: u64, // 8
    // maker destination accounts
    maker_tokens_request: Vec<TokenInfo>, // 4 (vec len https://borsh.io/) + 40 * MAX_TOKENS
    // pda accounts where tokens locked
    maker_locked_tokens: Vec<TokenInfo>, // 4 + 40 * MAX_TOKENS
}

impl EscrowAccount {
    pub fn space(amounts_from: &[u64], amounts_to: &[u64]) -> usize {
        32 + // maker
        32 + // taker
        8 + // maker_lamports_offer
        8 + // maker_lamports_request
        4 + size_of::<TokenInfo>() *amounts_to.len() + // maker_locked_tokens
        4 + size_of::<TokenInfo>() *amounts_from.len() // maker_tokens_request
    }
}

// token accounts should be passed through `remaining_accounts`
// remaining_accounts = [..maker_accounts_from, ..maker_accounts_to, ..pda_accounts, ..maker_accounts_from_mint]
#[derive(Accounts)]
#[instruction(
    maker_lamports_offer: u64,
    maker_lamports_request: u64,
    maker_amounts: Vec<u64>,
    taker_amounts: Vec<u64>
)]
pub struct InitializeDealParams<'info> {
    #[account(mut)]
    maker: Signer<'info>,
    #[account(init, payer = maker, space = 8 + EscrowAccount::space(&maker_amounts, &taker_amounts))]
    escrow: Account<'info, EscrowAccount>,
    // Programs
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}

// token accounts should be passed through `remaining_accounts`
// remaining_accounts = [..[taker_accounts_from, maker_accounts_to], ..[taker_accounts_to, pda_accounts]]
#[derive(Accounts)]
pub struct ExchangeParams<'info> {
    #[account(mut)]
    maker: AccountInfo<'info>,
    #[account(mut)]
    taker: Signer<'info>,
    #[account(mut, has_one = maker, close = maker)]
    escrow: Account<'info, EscrowAccount>,
    // Programs
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}

// remaining_accounts = [..[maker_accounts_to, pda_accounts]]
#[derive(Accounts)]
pub struct CloseDealParams<'info> {
    #[account(mut)]
    maker: Signer<'info>,
    #[account(mut, has_one = maker, close = maker)]
    escrow: Account<'info, EscrowAccount>,
    // Programs
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
}

#[error]
pub enum ErrorCode {
    #[msg("Not enough accounts was provided")]
    NotEnoughAccounts, // 0
    #[msg("Bad token account")]
    BadTokenAccount, // 1
    #[msg("Not enough maker token destination accounts was provided")]
    NotEnoughMakerTokenAccountsTo, // 2
    #[msg("Not enough maker token source accounts was provided")]
    NotEnoughMakerTokenAccountsFrom, // 3
    #[msg("Bad mint account")]
    BadMint, // 4
    #[msg("Bad taker account")]
    BadTaker, // 5
    #[msg("Token accounts from different mint")]
    TokenAccountsNotMatched, // 6
}
