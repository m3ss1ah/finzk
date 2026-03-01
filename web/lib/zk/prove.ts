export async function generateProof(inputs: {
  x1: number;
  x2: number;
  x3: number;
}) {
  // Dynamic import to avoid SSR issues
  const snarkjs: any = await import("snarkjs");

  const wasmPath = "/zk/circuit.wasm";
  const zkeyPath = "/zk/circuit_final.zkey";

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    inputs,
    wasmPath,
    zkeyPath
  );

  return {
    proof,
    publicSignals,
    eligible: publicSignals[0] === "1",
  };
}