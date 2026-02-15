import json
import numpy as np

SCALE = 1000

# Load float weights
with open("model_weights.json", "r") as f:
    model = json.load(f)

weights = np.array(model["weights"])
bias = model["bias"]

# Quantize
weights_int = np.round(weights * SCALE).astype(int)
bias_int = int(round(bias * SCALE))

zk_model = {
    "weights": weights_int.tolist(),
    "bias": bias_int,
    "scale": SCALE
}

with open("zk_model.json", "w") as f:
    json.dump(zk_model, f, indent=4)

print("Quantized ZK-ready model saved to zk_model.json")
print("\nInteger Weights:", weights_int)
print("Integer Bias:", bias_int)
