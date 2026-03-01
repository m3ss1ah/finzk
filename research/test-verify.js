const snarkjs = require("snarkjs");
const fs = require("fs");

// Load verification key
const verificationKey = JSON.parse(
  fs.readFileSync("./lib/zk/verification_key.json", "utf-8")
);

// Load proof sample
const sample = JSON.parse(
  fs.readFileSync("./proof_sample.json", "utf-8")
);

(async () => {
  console.log("Starting verification...");
  const start = Date.now();

  const result = await snarkjs.groth16.verify(
    verificationKey,
    sample.publicSignals,
    sample.proof
  );

  console.log("Result:", result);
  console.log("Time:", Date.now() - start, "ms");
})();