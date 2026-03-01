import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import json

# Load dataset
df = pd.read_csv("synthetic_financial_data.csv")

X = df[["income_to_cost", "asset_ratio", "dependency_ratio"]]
y = df["eligible"]

# Train test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train logistic regression
model = LogisticRegression()
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("\nModel Evaluation:\n")
print(classification_report(y_test, y_pred))

# Extract weights
weights = model.coef_[0]
bias = model.intercept_[0]

print("\nWeights:", weights)
print("Bias:", bias)

# Save weights for ZK use
model_data = {
    "weights": weights.tolist(),
    "bias": float(bias),
    "scale": 1000
}

with open("model_weights.json", "w") as f:
    json.dump(model_data, f, indent=4)

print("\nModel weights saved to model_weights.json")
