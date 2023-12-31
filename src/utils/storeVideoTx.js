import { ethers } from "ethers";
import { queryTransaction } from "./queryLibrary";

// Stores the root transaction and returns the transaction id
export const storeRoot = async (txId, irys, moovieTierNFTContract, signer) => {
  const tags = [
    { name: "Content-Type", value: "text/plain" },
    { name: "application-id", value: "Moovie" },
    { name: "moovies", value: txId },
  ];
  const tx = await irys.upload("", { tags });
  await moovieTierNFTContract.connect(signer).changeFeedTx(tx.id, tx.id);

  // localStorage.setItem("root-tx", tx.id);
  // localStorage.setItem("prev-tx", tx.id);

  return tx.id;
};

export const storeUpdate = async (
  txId,
  irys,
  node,
  moovieTierNFTContract,
  provider
) => {
  const signer = await provider.getSigner();
  try {
    // const rootTx = localStorage.getItem("root-tx");
    // const prevTx = localStorage.getItem("prev-tx");

    const rootTx = await moovieTierNFTContract.feedRootTx();
    const prevTx = await moovieTierNFTContract.feedPrevTx();

    const results = await queryTransaction(node, [prevTx], "text/plain");
    const moovies = results[0]["tags"][2]["value"] + ", " + txId;

    const tags = [
      { name: "Content-Type", value: "text/plain" },
      { name: "application-id", value: "Moovie" },
      { name: "moovies", value: moovies },
      { name: "root-tx", value: rootTx },
      { name: "prev-tx", value: prevTx },
    ];

    const tx = await irys.upload("", { tags });
    const result = await moovieTierNFTContract
      .connect(signer)
      .changeFeedTx(rootTx, tx.id);

    return tx.id;
  } catch (error) {
    console.log("Unable to find root. Creating a new root...");
    storeRoot(txId, irys, moovieTierNFTContract, signer);
  }
};

export const storeRootTier = async (
  txId,
  tierId,
  irys,
  moovieTierNFTContract,
  signer
) => {
  const tags = [
    { name: "Content-Type", value: "text/plain" },
    { name: "application-id", value: "Moovie" },
    { name: "moovies", value: txId },
  ];
  const tx = await irys.upload("", { tags });

  // Set root-tx and prev-tx in smart contract
  const result = await moovieTierNFTContract
    .connect(signer)
    .changeTransactionIds(tierId, tx.id, tx.id);

  return tx.id;
};

export const storeUpdateTier = async (
  txId,
  tierId,
  tier,
  irys,
  node,
  moovieTierNFTContract,
  provider
) => {
  const signer = await provider.getSigner();
  try {
    console.log("Store Update Tier: ", tier);
    console.log("Store Update Tier Id: ", tierId);

    // Get root-tx & prev-tx from smart contract
    let rootTx = tier.oldTransactionId;
    let prevTx = tier.newTransactionId;

    if (rootTx === "" && prevTx === "") {
      let transacId = storeRootTier(
        txId,
        tierId,
        irys,
        moovieTierNFTContract,
        signer
      );
      return transacId;
    } else {
      const results = await queryTransaction(node, [prevTx], "text/plain");
      const moovies = results[0]["tags"][2]["value"] + ", " + txId;
      const tags = [
        { name: "Content-Type", value: "text/plain" },
        { name: "application-id", value: "Moovie" },
        { name: "moovies", value: moovies },
        { name: "root-tx", value: rootTx },
        { name: "prev-tx", value: prevTx },
      ];
      const tx = await irys.upload("", { tags });
      await moovieTierNFTContract
        .connect(signer)
        .changeTransactionIds(tierId, tx.id, rootTx);

      return tx.id;
    }
  } catch (error) {
    console.log("Unable to find root. Creating a new root...");
    let transacId = storeRootTier(
      txId,
      tierId,
      irys,
      moovieTierNFTContract,
      signer
    );
    return transacId;
  }
};
