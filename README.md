You are assisting in building a full-stack Zero-Knowledge Machine Learning (ZKML) web application.

PROJECT CONTEXT:

This project implements a privacy-preserving financial eligibility system where:

1. A logistic regression model was trained offline in Python.
2. The model was quantized to fixed-point integers.
3. A Circom 2.0 circuit was written to encode:
   score = w1*x1 + w2*x2 + w3*x3 + bias
   eligible = (score > 0)
4. Groth16 trusted setup was completed.
5. Proving key (circuit_final.zkey) and verification_key.json have been generated.
6. Manual proof generation and verification have been tested successfully via CLI.

Current folder structure includes:
- /ml → ML scripts and quantized model
- /zk → circuit, wasm, zkey, verification key
- build artifacts already generated

GOAL:

Build a multi-user web platform with:
- Student login
- Admin (college) login
- Browser-side proof generation
- Backend-side proof verification
- No raw financial data stored
- Only proof + public signals stored
- Role-based access control

STACK DECISION:
- Next.js (App Router)
- TypeScript
- Tailwind
- Supabase (Auth + PostgreSQL)
- Browser proof generation using snarkjs
- Backend verification using snarkjs in API routes
- Deployment target: Vercel

CRITICAL ARCHITECTURAL RULES:

1. Financial inputs MUST NEVER be sent to backend.
2. Witness and proof generation must happen in browser.
3. Backend only verifies proof using verification_key.json.
4. Proving key and wasm are frontend assets.
5. Trusted setup is already complete and must NOT be repeated at runtime.
6. ZK files must not be modified or regenerated unless circuit changes.
7. Scaling logic must not be changed.

DEVELOPMENT REQUIREMENTS:

- Keep code modular and production-ready.
- Add documentation comments for every major file.
- Keep a DEVELOPMENT_LOG.md and append summaries after major steps.
- When multiple architectural options exist, ask for clarification before proceeding.
- Never invent or modify ZK circuit logic.
- Ask before introducing major dependencies.
- Prefer clean abstractions over hacks.

WORKFLOW EXPECTATION:

Proceed in clear phases:
1. Project initialization
2. Supabase setup
3. Auth system
4. Role-based routing
5. ZK integration in frontend
6. Proof verification API
7. Dashboard implementation
8. Documentation

Always explain what you are generating and why.

If unsure, ask questions instead of assuming.
