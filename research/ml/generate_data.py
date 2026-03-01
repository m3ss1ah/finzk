import numpy as np
import pandas as pd

def generate_dataset(n=5000, random_state=42):
    np.random.seed(random_state)

    # 1️⃣ Generate raw financial variables

    # Income: log-normal distribution (realistic skew)
    family_income = np.random.lognormal(mean=12, sigma=0.5, size=n)

    # Cost of attendance: normal distribution
    cost_of_attendance = np.random.normal(loc=200000, scale=30000, size=n)
    cost_of_attendance = np.clip(cost_of_attendance, 100000, None)

    # Assets correlated with income
    liquid_assets = family_income * np.random.uniform(0.2, 0.5, size=n)

    # Family size
    family_size = np.random.randint(2, 8, size=n)

    # Dependents
    dependents = np.array([
        np.random.randint(0, fs) for fs in family_size
    ])

    # 2️⃣ Engineered features

    income_to_cost = family_income / cost_of_attendance
    asset_ratio = liquid_assets / cost_of_attendance
    dependency_ratio = dependents / family_size

    # 3️⃣ Simulated financial pressure score
    financial_pressure = (
        0.6 * income_to_cost +
        0.3 * asset_ratio -
        0.5 * dependency_ratio
    )

    # Bottom 40% are eligible
    threshold = np.percentile(financial_pressure, 40)
    eligible = (financial_pressure < threshold).astype(int)

    df = pd.DataFrame({
        "income_to_cost": income_to_cost,
        "asset_ratio": asset_ratio,
        "dependency_ratio": dependency_ratio,
        "eligible": eligible
    })

    return df


if __name__ == "__main__":
    df = generate_dataset()
    df.to_csv("synthetic_financial_data.csv", index=False)
    print("Dataset generated successfully.")
