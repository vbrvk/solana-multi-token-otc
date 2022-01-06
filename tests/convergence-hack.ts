import * as anchor from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { assert } from 'chai';
import { ConvergenceHack } from '../target/types/convergence_hack';
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";


describe('convergence-hack', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.ConvergenceHack as anchor.Program<ConvergenceHack>;
  const {provider} = program;

  let mintA: Token = null;
  let mintB: Token = null;

  let makerA: PublicKey = null;
  let takerA: PublicKey = null;
  let makerB: PublicKey = null;
  let takerB: PublicKey = null;

  const makerAmount = 500;
  const takerAmount = 1000;

  const payer = Keypair.generate();
  const mintAuthority = Keypair.generate();

  it("Initialize escrow state", async () => {
    // Airdropping tokens to a payer.
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(payer.publicKey, 10000000000),
      "confirmed"
    );

    mintA = await Token.createMint(
      provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    );

    mintB = await Token.createMint(
      provider.connection,
      payer,
      mintAuthority.publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    );

    makerA = await mintA.createAccount(
      provider.wallet.publicKey
    );
    takerA = await mintA.createAccount(provider.wallet.publicKey);

    makerB = await mintB.createAccount(
      provider.wallet.publicKey
    );
    takerB = await mintB.createAccount(provider.wallet.publicKey);

    await mintA.mintTo(
      makerA,
      mintAuthority.publicKey,
      [mintAuthority],
      makerAmount
    );

    await mintB.mintTo(
      takerB,
      mintAuthority.publicKey,
      [mintAuthority],
      takerAmount
    );

    let _initializerTokenAccountA = await mintA.getAccountInfo(
      makerA
    );
    let _takerTokenAccountB = await mintB.getAccountInfo(takerB);

    assert.ok(_initializerTokenAccountA.amount.toNumber() == makerAmount);
    assert.ok(_takerTokenAccountB.amount.toNumber() == takerAmount);
  });

  it('Init deal', async () => {
    const escrow = new anchor.web3.Keypair();

    // Add your test here.
    const tx = await program.rpc.initializeDeal(
      [new anchor.BN(makerAmount)],
      [new anchor.BN(takerAmount)],
      null,
      {
        accounts: {
          maker: program.provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
          escrow: escrow.publicKey,
        },
        signers: [escrow],
        remainingAccounts: [{
          pubkey: makerA,
          isSigner: false,
          isWritable: true
        }, {
          pubkey: takerB,
          isSigner: false,
          isWritable: false
        }]
      }
    );
    console.log("Your transaction signature", tx);
  });
});
