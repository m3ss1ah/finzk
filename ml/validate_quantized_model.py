import pandas as pd
import numpy as np
import json

# Load dataset
df = pd.read_csv("synthetic_financial_data.csv")

X = df[["income_to_cost", "asset_ratio", "dependency_ratio"]].values

# Load float model
with open("model_weights.json", "r") as f:
    float_model = json.load(f)

w_float = np.array(float_model["weights"])
b_float = float_model["bias"]

# Load integer model
with open("zk_model.json", "r") as f:
    zk_model = json.load(f)

w_int = np.array(zk_model["weights"])
b_int = zk_model["bias"]
SCALE = zk_model["scale"]

# ---- Float predictions ----
float_scores = np.dot(X, w_float) + b_float
float_pred = (float_scores > 0).astype(int)

# ---- Integer predictions ----

# Scale features
X_int = np.round(X * SCALE).astype(int)

# Integer score
int_scores = np.dot(X_int, w_int) + b_int * SCALE

int_pred = (int_scores > 0).astype(int)

# Compare
matches = np.sum(float_pred == int_pred)
accuracy_match = matches / len(float_pred)

print("Prediction match accuracy:", accuracy_match)
