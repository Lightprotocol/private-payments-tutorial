import * as light from "@lightprotocol/zk.js";
import * as anchor from "@coral-xyz/anchor";
import {
  airdropSol,
  confirmConfig,
  LOOK_UP_TABLE,
  TestRelayer,
  User,
} from "@lightprotocol/zk.js";
const SOLANA_PORT = process.env.SOLANA_PORT || "8899";
process.env.ANCHOR_WALLET = process.env.HOME + "/.config/solana/id.json";
process.env.ANCHOR_PROVIDER_URL = `http://127.0.0.1:${SOLANA_PORT}`;
const provider = anchor.AnchorProvider.local(
  `http://127.0.0.1:${SOLANA_PORT}`,
  confirmConfig
);

const log = console.log;

const main = async () => {
  log("initializing Solana wallet...");
  const solanaWallet = anchor.web3.Keypair.generate(); // Replace this with your user's Solana wallet

  log("requesting airdrop...");
  await airdropSol({
    provider,
    amount: 2e9,
    recipientPublicKey: solanaWallet.publicKey,
  });

  log("setting-up test relayer...");
  const testRelayer = await new TestRelayer(
    solanaWallet.publicKey,
    LOOK_UP_TABLE,
    solanaWallet.publicKey,
    new anchor.BN(100_000)
  );

  log("initializing light provider...");
  const lightProvider = await light.Provider.init({
    wallet: solanaWallet,
    relayer: testRelayer,
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
    provider,
    amount: 2e9,
    recipientPublicKey: testRecipientKeypair.publicKey,
  });

  log("initializing light provider recipient...");
  const lightProviderRecipient = await light.Provider.init({
    wallet: testRecipientKeypair,
    relayer: testRelayer,
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
