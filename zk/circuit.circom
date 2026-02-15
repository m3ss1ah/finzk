pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

template Eligibility() {

    // Private inputs
    signal input x1;
    signal input x2;
    signal input x3;

    // Public output
    signal output eligible;

    // ===== MODEL PARAMETERS =====
    var w1 = -13708;
    var w2 = -5881;
    var w3 = 11039;
    var bias = 7474;

    // ===== Compute Score =====
    signal score;

    score <== w1 * x1 + w2 * x2 + w3 * x3 + bias;

    // ===== Check score > 0 =====
    component lt = LessThan(252);

    // Check: 0 < score
    lt.in[0] <== 0;
    lt.in[1] <== score;

    eligible <== lt.out;
}

component main = Eligibility();
