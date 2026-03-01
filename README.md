# ZK Scholarship Eligibility System

A privacy-preserving scholarship eligibility platform using Zero-Knowledge Machine Learning (ZKML).

## Architecture Overview

This system separates responsibilities into three layers:

### 1. Frontend (Next.js - deployed on Vercel)
- User authentication (Supabase Auth)
- Student dashboard
- Local ML inference
- Local zero-knowledge proof generation
- Submission of zk-proof to database

### 2. Database (Supabase)
- Stores applications
- Stores zk-proofs
- Stores eligibility results
- Tracks verification status

### 3. Verification Worker (Node.js Service)
- Runs independently from frontend
- Polls pending applications
- Verifies zk-proofs using Groth16 (snarkjs)
- Updates verification status in database

This separation ensures:
- No heavy cryptographic computation in frontend server
- No private financial data transmitted
- Asynchronous verification
- Scalable background processing

---

## Privacy Model

Student financial data:
- Never leaves the browser
- Used locally for ML inference
- Used locally to generate zk-proof
- Only proof + public signals are stored

College authorities:
- Verify proof correctness
- Never access raw financial data

---

## Folder Structure

web/ → Next.js frontend
worker/ → Verification engine
research/ → ML training + circuit generation (non-production)


---

## Running Locally

### Frontend

cd web
npm install
npm run dev


### Verification Worker

cd worker
npm install
node verify.js


---

## Deployment Strategy

Frontend → Vercel  
Database → Supabase  
Worker → Railway / Render / VPS  

---

## Status

- ML model trained and quantized
- Circuit implemented in Circom 2.0
- Groth16 trusted setup completed
- zk-proof pipeline tested end-to-end
- Background verification worker implemented
- System architecture production-ready