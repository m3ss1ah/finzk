# ZK Scholarship Eligibility System - Developer Handover Guide

Welcome to the ZK Scholarship Eligibility System project. This document serves as a comprehensive developer manual for anyone inheriting or contributing to this codebase. It documents the entire system architecture, the technologies used, application data flow, and everything implemented to date.

## 1. Project Overview & Architecture

The system is a privacy-preserving scholarship eligibility platform. It utilizes Zero-Knowledge Machine Learning (ZKML) to allow students to prove their eligibility for a scholarship without ever revealing their raw financial data (e.g., income, assets) to the backend or college authorities.

### Core Philosophy:
*   **Privacy-First:** User financial data never leaves the browser in plaintext.
*   **Trustless Verification:** The system uses Groth16 zero-knowledge proofs (zk-SNARKs) to prove that the student ran a specific machine learning model on their local data and attained a passing score.
*   **Separation of Concerns:** Heavy cryptographic computations are shifted to the client (for proving) and an asynchronous worker (for verifying), keeping the main web server lightweight.

### High-Level Architecture
1.  **Frontend (Next.js):** Handles user interaction, Supabase authentication, local ML inference, and ZK Proof Generation in the browser via WebAssembly (WASM).
2.  **Database (Supabase):** Stores user applications, the ZK Proofs, public signals (like the final eligibility boolean), and verification statuses.
3.  **Verification Worker (Node.js):** A background service that polls the database for unverified applications, verifies the proofs using `snarkjs`, and updates the application result.

---

## 2. Application Data Flow

1.  **Student Input:** A student logs into the Next.js frontend and inputs their financial statistics (`income_to_cost`, `asset_ratio`, `dependency_ratio`).
2.  **Local ZK Proof Generation:** The Next.js frontend utilizes `snarkjs` and a compiled `.wasm` circuit (derived from Circom) to run the financial data through a pre-trained ML model hardcoded in the circuit. It generates a zero-knowledge proof (`proof`) and public outputs (`publicSignals`).
3.  **Submission:** The Next.js app submits ONLY the `proof` and `publicSignals` to the Supabase database. The raw financial inputs are discarded and never sent.
4.  **Pending State:** The application is marked as `status = "pending"` in the database.
5.  **Worker Verification:** The isolated Node.js worker polls Supabase, picks up the `pending` application, and runs `snarkjs.groth16.verify(...)` on the proof and public signals against a `verification_key.json`.
6.  **Final Status:** The worker updates the database application to `status = "verified"` (or `invalid`), and the student or admin can see the result.

---

## 3. Detailed Component Breakdown

### 3.1. Frontend (`web/`)
*   **Framework:** Next.js 16.1.6 (App Router), React 19.
*   **Styling & UI:** Tailwind CSS v4, Framer Motion for animations, Lucide React for icons.
*   **Auth & Backend SDK:** `@supabase/auth-helpers-nextjs`, `@supabase/ssr`, `@supabase/supabase-js`.
*   **Key Directories:**
    *   `app/`: Contains routes like `/admin`, `/auth`, `/dashboard`, `/student`.
    *   `components/`: Reusable React components (`layout/`, `ui/`).
    *   `lib/`: Core utilities. Contains Supabase client instantiation (`supabaseClient.ts`, `supabaseServer.ts`) and ZK logic.
    *   `lib/zk/prove.ts`: The crucial function `generateProof(...)` that dynamically imports `snarkjs` to bypass Server-Side Rendering (SSR) issues, and uses `circuit.wasm` and `circuit_final.zkey` to generate the Zero-Knowledge Proof in the browser.

### 3.2. Verification Worker (`worker/`)
*   **Environment:** Node.js standalone service.
*   **Dependencies:** `snarkjs`, `@supabase/supabase-js`, `dotenv`.
*   **Core Logic (`worker/verify.js`):**
    *   Runs a continuous polling interval (`POLL_INTERVAL = 10000` or 10s).
    *   Fetches applications where `status == "pending"`.
    *   Uses `snarkjs.groth16.verify` against `verification_key.json` to cryptographically verify if the proof is valid.
    *   Updates the Supabase `applications` table with `status` (`verified`, `invalid`, or `audit`), `eligibility` (boolean), and `verified` state.

### 3.3. ML & ZK Research (`research/`)
This folder is NOT deployed to production but contains the source of truth for the Machine Learning model and the ZK Circuit.

*   **Machine Learning (`research/ml/`):**
    *   Python scripts (`train_model.py`, `quantize_model.py`) that generate synthetic financial data, train a Logistic Regression model using `sklearn`, and extract weights.
    *   **Quantization:** Because ZK circuits only operate on integers (specifically, field elements), the float ML weights are scaled up (by a factor of 1000) and quantized into integers (`model_weights.json`).
*   **Zero Knowledge Circuit (`research/zk/`):**
    *   `circuit.circom`: The Circom 2.0 source code. It reads 3 private inputs (`x1, x2, x3`). It hardcodes the quantized weights from the ML model (`w1 = -13708`, `w2 = -5881`, `w3 = 11039`, `bias = 7474`).
    *   It calculates `score = w1 * x1 + w2 * x2 + w3 * x3 + bias`.
    *   It uses a `LessThan` comparator from `circomlib` to verify if the score is > 0, producing a boolean public output `eligible`.
    *   Contains the Power of Tau (`ptau`) files generated during the Groth16 trusted setup.

---

## 4. Technical Stack Summary

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16, React 19 |
| **Styling** | Tailwind CSS v4, Framer Motion |
| **Database & Auth** | Supabase |
| **Worker Environment** | Node.js |
| **ZK Framework** | snarkjs, Circom 2.0.0 |
| **Proof System** | Groth16 |
| **ML Training** | Python, pandas, scikit-learn |

---

## 5. Inferred Database Schema

Based on the worker code, the system relies on a Supabase `applications` table. The structure looks approximately like this:

**Table: `applications`**
*   `id` (UUID): Primary key.
*   `status` (String): `"pending"`, `"verified"`, `"invalid"`, `"audit"`.
*   `proof` (JSON/String): The ZK Groth16 proof object.
*   `public_signals` (JSON/String): the public signals array (e.g., `["1"]` for eligible).
*   `eligibility` (Boolean): Derived from the public signals after verification.
*   `verified` (Boolean): Set to `true` if verify succeeds.
*   `audit_required` (Boolean): Flag for failed verification logic or system crashes.

---

## 6. Development Workflow & Running Locally

### Prerequisites
*   Node.js (v18+)
*   Python (for ML research tools only)
*   A Supabase Project

### 6.1. Running the Next.js Frontend
1. Navigate to the frontend directory: `cd web`
2. Install dependencies: `npm install`
3. Create a `.env.local` file with Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the dev server: `npm run dev`

### 6.2. Running the Verification Worker
1. Navigate to the worker directory: `cd worker`
2. Install dependencies: `npm install`
3. Create a `.env` file with Supabase Service credentials (requires bypass permissions):
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
4. Start the polling worker: `node verify.js`

---

## 7. Current Project Status

*   **DONE:** ML model trained and quantized.
*   **DONE:** Circuit implemented in Circom 2.0.
*   **DONE:** Groth16 trusted setup completed.
*   **DONE:** zk-proof pipeline tested end-to-end (in-browser WASM).
*   **DONE:** Background verification worker implemented.
*   **DONE:** System architecture and separation of concerns is production-ready.

## 8. Deployment Strategy

*   **Frontend Request (web/):** Deploy to Vercel or any Next.js hosting provider. (Requires `.env.local`).
*   **Database:** Supabase Cloud.
*   **Verification Worker (worker/):** Deploy as a background service container (e.g., Railway, Render, Fly.io, or VPS). (Requires `.env`).

---

**End of Document**
