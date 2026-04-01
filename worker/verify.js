require("dotenv").config();
const snarkjs = require("snarkjs");
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const verificationKey = JSON.parse(
  fs.readFileSync("./verification_key.json", "utf-8")
);

const POLL_INTERVAL = 10000;
const MAX_RETRIES = 3;

let isProcessing = false;

function log(level, message, meta = null) {
  const timestamp = new Date().toISOString();
  if (meta) {
    console.log(`[${timestamp}] [${level}] ${message}`, meta);
  } else {
    console.log(`[${timestamp}] [${level}] ${message}`);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPendingWithRetry(retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { data, error } = await supabase
      .from("applications")
      .select("*")
      .eq("status", "pending")
      .limit(5);

    if (!error) return data;

    log("ERROR", `DB fetch failed (attempt ${attempt})`, error);

    if (attempt < retries) {
      await sleep(2000 * attempt);
    }
  }

  throw new Error("Failed to fetch pending applications after retries.");
}

async function updateApplication(id, updateData) {
  const { error } = await supabase
    .from("applications")
    .update(updateData)
    .eq("id", id);

  if (error) {
    log("ERROR", `Failed updating application ${id}`, error);
  }
}

function safeParse(value) {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch (err) {
    log("ERROR", "JSON parse error", err);
    return null;
  }
}

async function verifyPending() {
  if (isProcessing) {
    log("INFO", "Previous cycle still running, skipping...");
    return;
  }

  isProcessing = true;

  try {
    log("INFO", "Checking for pending applications...");

    const applications = await fetchPendingWithRetry();

    if (!applications || applications.length === 0) {
      log("INFO", "No pending applications.");
      return;
    }

    for (const app of applications) {
      log("INFO", `Verifying application ${app.id}`);

      const proof = safeParse(app.proof);
      const publicSignals = safeParse(app.public_signals);

      if (!proof || !publicSignals) {
        log("ERROR", `Invalid proof format for ${app.id}`);
        await updateApplication(app.id, {
          status: "invalid",
          eligibility: false,
          verified: false,
          audit_required: true,
        });
        continue;
      }

      const start = Date.now();

      let isValid = false;

      try {
        isValid = await snarkjs.groth16.verify(
          verificationKey,
          publicSignals,
          proof
        );
      } catch (err) {
        log("ERROR", `Verification error for ${app.id}`, err);
        await updateApplication(app.id, {
          status: "audit",
          verified: false,
          audit_required: true,
        });
        continue;
      }

      const duration = Date.now() - start;

      log("INFO", `Verification result for ${app.id}: ${isValid} (${duration} ms)`);

      await updateApplication(app.id, {
        status: isValid ? "verified" : "invalid",
        eligibility: isValid ? publicSignals[0] === "1" : false,
        verified: isValid,
        audit_required: false,
      });

      log("INFO", `Updated application ${app.id}`);
    }
  } catch (err) {
    log("CRITICAL", "Verification cycle crashed", err);
  } finally {
    isProcessing = false;
  }
}

verifyPending();
setInterval(verifyPending, POLL_INTERVAL);

process.on("SIGINT", () => {
  log("INFO", "Worker shutting down...");
  process.exit();
});

log("INFO", "Verification worker started.");