import json
import os

def save_training_pair(article_text, summary, filename):
    pair = {
        "input": article_text.strip(),
        "output": summary.strip()
    }
    os.makedirs("data/fine_tune", exist_ok=True)
    with open(os.path.join("data", "fine_tune", filename), "w", encoding="utf-8") as f:
        json.dump(pair, f)
