// import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Account, Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import { ESCROW_ACCOUNT_DATA_LAYOUT, EscrowLayout } from "./layout";

const connection = new Connection("http://localhost:8899", 'singleGossip');

export const initEscrow = async (
    // privateKeyByteArray: string,
    // initializerTokenAccountPubkeyString: string,
    // amountXTokensToSendToEscrow: number,
    // receiverAccountPubkeyString: string,
    // playerAAccountPubkeyString: string, // this account should already have the desired lamports
    // playerBAccountPubkeyString: string, // this account should already have the desired lamports
    // initializerReceivingTokenAccountPubkeyString: string,
    // expectedAmount: number,
    // escrowProgramIdString: string) => {
    ) => {
    const expectedAmount = 0.5;
    const initializerTokenAccountPubkey = new PublicKey("CGiSu9eXwivVvPs6ebTHab12UfiP2RUdS2C8QaBNjViE");
    
    // const XTokenMintAccountPubkey = new PublicKey((await connection.getParsedAccountInfo(initializerXTokenAccountPubkey, 'singleGossip')).value!.data.parsed.info.mint);
    const privateKeyByteArray = "148,146,219,199,221,68,202,155,116,252,249,101,254,219,95,196,225,179,134,207,183,36,90,79,196,214,133,232,210,206,128,139,167,119,33,207,159,135,135,62,33,160,186,11,198,28,200,69,207,33,40,72,139,253,195,255,200,201,160,119,198,67,223,39";
    const privateKeyDecoded = privateKeyByteArray.split(',').map(s => parseInt(s));
    const initializerAccount = new Account(privateKeyDecoded);

    const playerAAccountPubkey  = new PublicKey("4vxyp9auWavnRrVmHyUpjyYXNJK8KTtpGSr9KmohZxGH");
    const playerBAccountPubkey  = new PublicKey("5LntGETLcCX4h7BrqLhoRv7s6dDK1HppDY8in8XxuXTZ");
    const receiverAccountPubkey  = new PublicKey("CGiSu9eXwivVvPs6ebTHab12UfiP2RUdS2C8QaBNjViE");

    // const tempTokenAccount = new Account();
    // const createTempTokenAccountIx = SystemProgram.createAccount({
    //     programId: TOKEN_PROGRAM_ID,
    //     space: AccountLayout.span,
    //     lamports: await connection.getMinimumBalanceForRentExemption(AccountLayout.span, 'singleGossip'),
    //     fromPubkey: initializerAccount.publicKey,
    //     newAccountPubkey: tempTokenAccount.publicKey
    // });
    // const initTempAccountIx = Token.createInitAccountInstruction(TOKEN_PROGRAM_ID, XTokenMintAccountPubkey, tempTokenAccount.publicKey, initializerAccount.publicKey);
    // const transferXTokensToTempAccIx = Token
    //     .createTransferInstruction(TOKEN_PROGRAM_ID, initializerXTokenAccountPubkey, tempTokenAccount.publicKey, initializerAccount.publicKey, [], amountXTokensToSendToEscrow);
    
    const escrowAccount = new Account();
    const escrowProgramId = new PublicKey("B78rZxBkyhoCi9fcsEbGCcpgqt7QcMJ9JDXfmvqkYdeV");
    // const escrowProgramId = new PublicKey(escrowProgramIdString);

    const createEscrowAccountIx = SystemProgram.createAccount({
        space: ESCROW_ACCOUNT_DATA_LAYOUT.span,
        lamports: await connection.getMinimumBalanceForRentExemption(ESCROW_ACCOUNT_DATA_LAYOUT.span, 'singleGossip'),
        fromPubkey: initializerAccount.publicKey,
        newAccountPubkey: escrowAccount.publicKey,
        programId: escrowProgramId
    });

    // const initEscrowIx = new TransactionInstruction({
    //     programId: escrowProgramId,
    //     keys: [
    //         { pubkey: initializerAccount.publicKey, isSigner: true, isWritable: false },
    //         { pubkey: tempTokenAccount.publicKey, isSigner: false, isWritable: true },
    //         { pubkey: new PublicKey(initializerReceivingTokenAccountPubkeyString), isSigner: false, isWritable: false },
    //         { pubkey: escrowAccount.publicKey, isSigner: false, isWritable: true },
    //         { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
    //         { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    //     ],
    //     data: Buffer.from(Uint8Array.of(0, ...new BN(expectedAmount).toArray("le", 8)))
    // })

    const initEscrowIx = new TransactionInstruction({
        programId: escrowProgramId,
        keys: [
            { pubkey: initializerAccount.publicKey, isSigner: true, isWritable: false },
            { pubkey: playerAAccountPubkey, isSigner: false, isWritable: true },
            { pubkey: playerBAccountPubkey, isSigner: false, isWritable: false },
            { pubkey: receiverAccountPubkey, isSigner: false, isWritable: false },
            { pubkey: escrowAccount.publicKey, isSigner: false, isWritable: true },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
        ],
        data: Buffer.from(Uint8Array.of(0, ...new BN(expectedAmount).toArray("le", 8)))
    })
    // const tx = new Transaction()
    //     .add(createTempTokenAccountIx, initTempAccountIx, transferXTokensToTempAccIx, createEscrowAccountIx, initEscrowIx);
    const tx = new Transaction()
        .add(createEscrowAccountIx, initEscrowIx);
    await connection.sendTransaction(tx, [initializerAccount, escrowAccount], {skipPreflight: false, preflightCommitment: 'singleGossip'});

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const encodedEscrowState = (await connection.getAccountInfo(escrowAccount.publicKey, 'singleGossip'))!.data;
    const decodedEscrowState = ESCROW_ACCOUNT_DATA_LAYOUT.decode(encodedEscrowState) as EscrowLayout;
    return {
        escrowAccountPubkey: escrowAccount.publicKey.toBase58(),
        isInitialized: !!decodedEscrowState.isInitialized,
        initializerAccountPubkey: new PublicKey(decodedEscrowState.initializerPubkey).toBase58(),
        XTokenTempAccountPubkey: new PublicKey(decodedEscrowState.initializerTempTokenAccountPubkey).toBase58(),
        initializerYTokenAccount: new PublicKey(decodedEscrowState.initializerReceivingTokenAccountPubkey).toBase58(),
        expectedAmount: new BN(decodedEscrowState.expectedAmount, 10, "le").toNumber()
    };
}
