import * as light from '@lightprotocol/zk.js'
import * as anchor from "@coral-xyz/anchor";
import { Account, airdropSol, confirmConfig, LOOK_UP_TABLE, TestRelayer, User } from '@lightprotocol/zk.js';
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

    const testRelayer = await new TestRelayer(
        solanaWallet.publicKey,
        LOOK_UP_TABLE,
        solanaWallet.publicKey,
        new anchor.BN(100_000)
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

    const lightProviderRecipient = await light.Provider.init({
        wallet: testRecipientKeypair,
        relayer: testRelayer
    });

    const testRecipient: User = await light.User.init({ provider: lightProviderRecipient });

    // Execute the transfer
    const response = await user.transfer({
        amountSol: '0.25',
        token: 'SOL',
        recipient: testRecipient.account.getPublicKey()
    });

    // We can check the transaction that gets executed on-chain and won't
    // see any movement of tokens, whereas the recipient's private balance changed!
    console.log(response.txHash)
    console.log((await testRecipient.getUtxoInbox()))
    process.exit()
}

main()