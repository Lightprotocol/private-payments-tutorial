import * as light from "@lightprotocol/zk.js";
import * as anchor from "@coral-xyz/anchor";
import {
  ADMIN_AUTH_KEYPAIR,
  airdropSol,
  AUTHORITY_ONE,
  confirmConfig,
  TestRelayer,
  User,
} from "@lightprotocol/zk.js";

process.env.ANCHOR_WALLET = process.env.HOME + "/.config/solana/id.json";
process.env.ANCHOR_PROVIDER_URL = "http://127.0.0.1:8899";
const provider = anchor.AnchorProvider.local(
  "http://127.0.0.1:8899",
  confirmConfig
);

const log = console.log;

const main = async () => {
  log("initializing Solana wallet...");
  const solanaWallet = anchor.web3.Keypair.generate(); // Replace this with your user's Solana wallet

  log("requesting airdrop...");
  await airdropSol({
    connection: provider.connection,
    lamports: 2e9,
    recipientPublicKey: solanaWallet.publicKey,
  });

  log("setting-up test relayer...");
  const testRelayer = new TestRelayer({
    relayerPubkey: solanaWallet.publicKey,
    relayerRecipientSol: solanaWallet.publicKey,
    relayerFee: new anchor.BN(100_000),
    payer: solanaWallet,
  });

  log("initializing light provider...");
  const lightProvider = await light.Provider.init({
    wallet: solanaWallet,
    connection: provider.connection,
    relayer: testRelayer,
    confirmConfig,
  });

  log("initializing user...");
  const user = await light.User.init({ provider: lightProvider });

  log("performing shield operation...");
  await user.shield({
    publicAmountSol: "1",
    token: "SOL",
  });

  log("getting user balance...");
  log(await user.getBalance());

  log("generating test recipient keypair...");
  const testRecipientKeypair = anchor.web3.Keypair.generate();

  log("requesting airdprop...");
  await airdropSol({
    connection: provider.connection,
    lamports: 2e9,
    recipientPublicKey: testRecipientKeypair.publicKey,
  });

  log("initializing light provider recipient...");
  const lightProviderRecipient = await light.Provider.init({
    wallet: testRecipientKeypair,
    connection: provider.connection,
    relayer: testRelayer,
    confirmConfig,
  });

  log("initializing light user recipient...");
  const testRecipient: User = await light.User.init({
    provider: lightProviderRecipient,
  });

  log("executing transfer...");
  const response = await user.transfer({
    amountSol: "0.25",
    token: "SOL",
    recipient: testRecipient.account.getPublicKey(),
  });

  // We can check the transaction that gets executed on-chain and won't
  // see any movement of tokens, whereas the recipient's private balance changed!

  log("getting tx hash...");
  log(response.txHash);
  log("getting UTXO inbox...");
  log(await testRecipient.getUtxoInbox());
};

log("running program...");
main()
  .then(() => {
    log("running complete.");
  })
  .catch((e) => {
    console.trace(e);
  })
  .finally(() => {
    log("exiting program.");
    process.exit(0);
  });
