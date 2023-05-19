import * as light from '@lightprotocol/zk.js'
import * as anchor from "@coral-xyz/anchor";
import { airdropSol, confirmConfig, LOOK_UP_TABLE, TestRelayer } from '@lightprotocol/zk.js';
process.env.ANCHOR_WALLET = process.env.HOME + "/.config/solana/id.json";
process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
const provider = anchor.AnchorProvider.local(
    "http://127.0.0.1:8899",
    confirmConfig,
  );
const main = async () => {
    // Replace this with your user's Solana wallet
    const solanaWallet = anchor.web3.Keypair.generate()

    await airdropSol({provider, amount: 2e9, recipientPublicKey: solanaWallet.publicKey});
    // await airdropSol({provider, amount: 2e9, recipientPublicKey: solanaWallet.publicKey});

    const testRelayer = await new TestRelayer(
        solanaWallet.publicKey,
        LOOK_UP_TABLE
      );
    const lightProvider = await light.Provider.init({
        wallet: solanaWallet,
        relayer: testRelayer
    });

    const user = await light.User.init({ provider: lightProvider });

    await user.shield({
        publicAmountSol: '1',
        token: 'SOL',
    });
    console.log(await user.getBalance());

    const testRecipientKeypair = anchor.web3.Keypair.generate();
    await airdropSol({provider, amount: 2e9, recipientPublicKey: testRecipientKeypair.publicKey});

    // Create a random recipient account
    const testRecipientProvider = await light.Provider.init({
        wallet: testRecipientKeypair,
    });
    const testRecipient = await light.User.init({ provider: testRecipientProvider });
    const testRecipientPublicKey = testRecipient.account.getPublicKey();
    
    
    // Execute the transfer
    const response = await user.transfer({
        amountSol: '1.25',
        token: 'SOL',
        recipient: testRecipientPublicKey,
    });
    
    // We can check the transaction that gets executed on-chain and won't
    // see any movement of tokens, whereas the recipient's private balance changed!
    console.log(response.txHash)
    console.log((await testRecipient.getBalance()))

}

main()