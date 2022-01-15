import * as anchor from "@project-serum/anchor";
import * as web3 from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { assert } from "chai";
import { ConvergenceHack } from "../target/types/convergence_hack";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";

describe("convergence-hack", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  // @ts-ignore
  const program = anchor.workspace
    .ConvergenceHack as anchor.Program<ConvergenceHack>;
  const { provider, programId } = program;

  const maker = Keypair.generate();
  const taker = Keypair.generate();

  let mintA: Token = null;
  let mintB: Token = null;

  let makerA: PublicKey = null;
  let takerA: PublicKey = null;
  let makerB: PublicKey = null;
  let takerB: PublicKey = null;

  const makerAmountA = 500;
  const takerAmountB = 1000;

  const payer = Keypair.generate();
  const mintAuthority = Keypair.generate();
  const escrowState = new Keypair();

  it("Initialize escrow state", async () => {
    // Airdropping SOL.
    const accountsToFund = [payer, maker, taker];

    // await Promise.all(
    //   accountsToFund.map(async (acc) => {
    //     await provider.connection.confirmTransaction(
    //       await provider.connection.requestAirdrop(acc.publicKey, 2 * LAMPORTS_PER_SOL),
    //       "confirmed"
    //     );
    //   })
    // );

    // for devnet
    // anchor test --provider.cluster https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899/ --skip-deploy
    await Promise.all(
      accountsToFund.map(async (acc) => {
        await web3.sendAndConfirmRawTransaction(
          provider.connection,
          (await provider.wallet.signTransaction(new web3.Transaction({
            recentBlockhash: (await provider.connection.getRecentBlockhash()).blockhash,
            feePayer: provider.wallet.publicKey
          }).add(
            web3.SystemProgram.transfer({
              fromPubkey: provider.wallet.publicKey,
              toPubkey: acc.publicKey,
              lamports: web3.LAMPORTS_PER_SOL * 2,
            }),
          ))).serialize(),
        );
      })
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

    makerA = await mintA.createAssociatedTokenAccount(maker.publicKey);
    takerA = await mintA.createAssociatedTokenAccount(taker.publicKey);

    makerB = await mintB.createAssociatedTokenAccount(maker.publicKey);
    takerB = await mintB.createAssociatedTokenAccount(taker.publicKey);

    await mintA.mintTo(
      makerA,
      mintAuthority.publicKey,
      [mintAuthority],
      makerAmountA
    );

    await mintB.mintTo(
      takerB,
      mintAuthority.publicKey,
      [mintAuthority],
      takerAmountB
    );

    let _initializerTokenAccountA = await mintA.getAccountInfo(makerA);
    let _takerTokenAccountB = await mintB.getAccountInfo(takerB);

    assert.ok(_initializerTokenAccountA.amount.toNumber() == makerAmountA);
    assert.ok(_takerTokenAccountB.amount.toNumber() == takerAmountB);
  });

  it("Init deal", async () => {
    const [pdaAccount] = await PublicKey.findProgramAddress(
      [
        maker.publicKey.toBuffer(),
        mintA.publicKey.toBuffer(),
        escrowState.publicKey.toBuffer(),
      ],
      programId
    );

    await program.rpc.initializeDeal(
      new anchor.BN(0), // lamports from maker
      new anchor.BN(0), // lamports to maker
      [new anchor.BN(makerAmountA)],
      [new anchor.BN(takerAmountB)],
      null,
      {
        accounts: {
          maker: maker.publicKey,
          systemProgram: SystemProgram.programId,
          escrow: escrowState.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [escrowState, maker],
        remainingAccounts: [
          {
            // maker from
            pubkey: makerA,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: makerB, // maker to
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: pdaAccount,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: mintA.publicKey,
            isSigner: false,
            isWritable: false,
          },
        ],
      }
    );

    const makerAmountAAfterInit = await mintA.getAccountInfo(makerA);
    assert.ok(makerAmountAAfterInit.amount.isZero());

    const escrowLockA = await mintA.getAccountInfo(pdaAccount);
    assert.ok(escrowLockA.amount.eq(new anchor.BN(makerAmountA)));
    assert.ok(escrowLockA.owner.equals(pdaAccount));

    const escrowStateInfo = await program.account.escrowAccount.fetch(
      escrowState.publicKey
    );
    assert.ok(escrowStateInfo.maker.equals(maker.publicKey));
  });

  it("Execute deal", async () => {
    const [{ pubkey: pdaAccount }] = (
      await program.account.escrowAccount.fetch(escrowState.publicKey)
    ).makerLockedTokens as { pubkey: PublicKey }[];

    await program.rpc.exchange({
      accounts: {
        maker: maker.publicKey,
        taker: taker.publicKey,
        systemProgram: SystemProgram.programId,
        escrow: escrowState.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      },
      signers: [taker],
      remainingAccounts: [
        {
          // taker from
          pubkey: takerB,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: makerB, // maker to
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: takerA, // taker to
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: pdaAccount, // pda (maker locked funds)
          isSigner: false,
          isWritable: true,
        },
      ],
    });

    const finalTakerAmountA = await mintA.getAccountInfo(takerA);
    const finalTakerAmountB = await mintB.getAccountInfo(takerB);
    assert.ok(finalTakerAmountA.amount.eq(new anchor.BN(makerAmountA)));
    assert.ok(finalTakerAmountB.amount.isZero());

    const finalMakerAmountA = await mintA.getAccountInfo(makerA);
    const finalMakerAmountB = await mintB.getAccountInfo(makerB);
    assert.ok(finalMakerAmountA.amount.isZero());
    assert.ok(finalMakerAmountB.amount.eq(new anchor.BN(takerAmountB)));

    const escrowInfo = await provider.connection.getAccountInfo(
      escrowState.publicKey
    );
    assert.isNull(escrowInfo);

    const pdaInfo = await provider.connection.getAccountInfo(pdaAccount);
    assert.isNull(pdaInfo);
  });

  it('Should close deal and return all money back to maker', async () => {
    // init deal
    // mint tokeA to A again
    await mintA.mintTo(
      makerA,
      mintAuthority.publicKey,
      [mintAuthority],
      makerAmountA
    );

    const [pdaAccount] = await PublicKey.findProgramAddress(
      [
        maker.publicKey.toBuffer(),
        mintA.publicKey.toBuffer(),
        escrowState.publicKey.toBuffer(),
      ],
      programId
    );

    await program.rpc.initializeDeal(
      new anchor.BN(0), // lamports from maker
      new anchor.BN(0), // lamports to maker
      [new anchor.BN(makerAmountA)],
      [new anchor.BN(takerAmountB)],
      null,
      {
        accounts: {
          maker: maker.publicKey,
          systemProgram: SystemProgram.programId,
          escrow: escrowState.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        },
        signers: [maker, escrowState],
        remainingAccounts: [
          {
            // maker from
            pubkey: makerA,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: makerB, // maker to
            isSigner: false,
            isWritable: false,
          },
          {
            pubkey: pdaAccount,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: mintA.publicKey,
            isSigner: false,
            isWritable: true,
          },
        ],
      }
    );

    console.table([
      {
        name: 'maker',
        key: maker.publicKey.toString()
      },
      {
        name: 'pda',
        key: pdaAccount.toString()
      },
      {
        name: 'taker',
        key: taker.publicKey.toString()
      },
      {
        name: 'escrowState',
        key: escrowState.publicKey.toString()
      },
      {
        name: 'payer',
        key: program.provider.wallet.publicKey.toString()
      },
      {
        name: 'makerA',
        key: makerA.toString()
      },
      {
        name: 'makerB',
        key: makerB.toString()
      },
      {
        name: 'takerA',
        key: takerA.toString()
      },
      {
        name: 'takerB',
        key: takerB.toString()
      },
  ]);


    await program.rpc.closeDeal({
      accounts: {
        maker: maker.publicKey,
        escrow: escrowState.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID
      },
      signers: [maker],
      remainingAccounts: [
        {
          // maker to
          pubkey: makerA,
          isSigner: false,
          isWritable: true,
        },
        {
          pubkey: pdaAccount,
          isSigner: false,
          isWritable: true,
        }
      ]
    })


    const escrowInfo = await provider.connection.getAccountInfo(
      escrowState.publicKey
    );
    assert.isNull(escrowInfo);

    const pdaInfo = await provider.connection.getAccountInfo(pdaAccount);
    assert.isNull(pdaInfo);

    const finalMakerAmountA = await mintA.getAccountInfo(makerA);
    assert.ok(finalMakerAmountA.amount.eq(new anchor.BN(makerAmountA)))
  })
});
