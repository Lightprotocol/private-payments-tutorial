import * as anchor from "@coral-xyz/anchor";
import {
  airdropSol,
  confirmConfig,
  LOOK_UP_TABLE,
  TestRelayer,
  User,
    Provider,
} from "@lightprotocol/zk.js";

import {
  PublicKey,
  Keypair,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";

process.env.ANCHOR_WALLET = process.env.HOME + "/.config/solana/id.json";
process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
const provider = anchor.AnchorProvider.local(
  "http://127.0.0.1:8899",
  confirmConfig
);

const log = console.log;

const main = async () => {
  const logBalance = async (prefix: String, pubKey: PublicKey) => {
    let walletBalance = await provider.connection.getBalance(pubKey);
    console.log(`${prefix} Address: ${pubKey}, Balance: ${walletBalance / LAMPORTS_PER_SOL} SOL`);
  }

  const solSender = anchor.web3.Keypair.generate();
  const solRecipient = anchor.web3.Keypair.generate();

  await airdropSol({
    provider,
    lamports: 2 * LAMPORTS_PER_SOL,
    recipientPublicKey: solSender.publicKey,
  });

  await logBalance("Sender's", solSender.publicKey);
  await logBalance("Recipient's", solRecipient.publicKey);

  const relayerKeypair = Keypair.generate();
  const testRelayer = new TestRelayer(
      relayerKeypair.publicKey,
      LOOK_UP_TABLE,
      relayerKeypair.publicKey,
      new anchor.BN(100000),
      new anchor.BN(100000),
      relayerKeypair
  );

  const lightProvider = await Provider.init({
    wallet: solSender,
    relayer: testRelayer,
  });

  log("Initializing user...");
  const lightSender = await User.init({ provider: lightProvider });

  log("Performing shield operation...");
  await lightSender.shield({
    publicAmountSol: "1",
    token: "SOL",
  });

  log("Getting user balance...");
  log(await lightSender.getBalance());

  log("Initializing light provider for recipient...");
  const lightProviderRecipient = await Provider.init({
    wallet: solRecipient,
    relayer: testRelayer,
  });

  log("Initializing light recipient...");
  const lightRecipient: User = await User.init({
    provider: lightProviderRecipient,
  });

  log("Executing transfer...");
  const response = await lightSender.transfer({
    amountSol: "0.25",
    token: "SOL",
    recipient: lightRecipient.account.getPublicKey(),
  });

  // We can check the transaction that gets executed on-chain and won't
  // see any movement of tokens, whereas the recipient's private balance changed!

  log("Retrieving tx hash...");
  log(response.txHash);
  log("Retrieving UTXO inbox...");
  log(await lightRecipient.getUtxoInbox());

  await lightRecipient.mergeAllUtxos(new PublicKey(0));

  log("Recipient light balance: ");
  log(await lightRecipient.getBalance());

  await lightRecipient.unshield({
    token: "SOL",
    publicAmountSol: "0.24",
    recipient: solRecipient.publicKey,
  });


  await logBalance("Sender's", solSender.publicKey);
  await logBalance("Recipient's", solRecipient.publicKey);
};

log("Executing program...");
main()
  .then(() => {
    log("Execution complete.");
  })
  .catch((e) => {
    console.trace(e);
  })
  .finally(() => {
    log("Program execution ended.");
    process.exit(0);
  });
