import { WebIrys } from "@irys/sdk";
import getIrys from "./getIrys";

const gasslessFundAndUploadEVM = async (selectedFile, tags) => {
  // obtain the server's public key
  const pubKeyRes = await (await fetch("/api/publicKeyEVM")).json();
  const pubKey = Buffer.from(pubKeyRes.pubKey, "hex");
  // Create a provider - this mimics the behaviour of the injected provider, i.e metamask
  const provider = {
    // For EVM wallets
    getPublicKey: async () => {
      return pubKey;
    },
    getSigner: () => {
      return {
        getAddress: () => pubKey.toString(), // pubkey is address for TypedEthereumSigner
        _signTypedData: async (_domain, _types, message) => {
          const convertedMsg = Buffer.from(
            message["Transaction hash"]
          ).toString("hex");
          console.log("convertedMsg: ", convertedMsg);
          const res = await fetch("/api/signDataEVM", {
            method: "POST",
            body: JSON.stringify({ signatureData: convertedMsg }),
          });
          const { signature } = await res.json();
          const bSig = Buffer.from(signature, "hex");
          // Pad & convert so it's in the format the signer expects to have to convert from.
          const pad = Buffer.concat([
            Buffer.from([0]),
            Buffer.from(bSig),
          ]).toString("hex");
          return pad;
        },
      };
    },

    _ready: () => {},
  };
  console.log("Got provider=", provider);
  // You can delete the lazyFund route if you're prefunding all uploads
  // 2. then pass the size to the lazyFund API route
  const fundTx = await fetch("/api/lazyFundEVM", {
    method: "POST",
    body: selectedFile.size.toString(),
  });

  // Create a new WebIrys object using the provider created with server info.
  const url = process.env.PUBLIC_NODE || "";
  const token = process.env.PUBLIC_TOKEN || "";

  const wallet = { name: "ethersv5", provider: provider };
  const irys = new WebIrys({ url, token, wallet });

  const w3signer = await provider.getSigner();
  const address = (await w3signer.getAddress()).toLowerCase();
  await irys.ready();

  console.log("Uploading...");
  const tx = await irys.uploadFile(selectedFile, {
    tags,
  });
  console.log(`Uploaded successfully. https://gateway.irys.xyz/${tx.id}`);

  return tx.id;
};
