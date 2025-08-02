from scraper import fetch_open_edu_articles
from cleaner import clean_text
from summarizer import summarize_text
from evaluator import evaluate_summary
from trainer import save_training_pair

import os
import time

def run_pipeline():
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/summaries", exist_ok=True)

    cycle = 1  # Counter to track cycles

    while True:
        print(f"\n🔁 Starting Self-Learning Cycle #{cycle}...")

        print("🔍 Scanning open education sites...")
        articles = fetch_open_edu_articles(limit=3)

        for i, article_path in enumerate(articles):
            with open(article_path, "r", encoding="utf-8") as f:
                raw = f.read()

            cleaned = clean_text(raw)
            summary = summarize_text(cleaned)
            score = evaluate_summary(summary)

            if score >= 2:
                summary_path = os.path.join("data", "summaries", f"summary_cycle{cycle}_{i+1}.txt")
                with open(summary_path, "w", encoding="utf-8") as f:
                    f.write(summary)

                save_training_pair(cleaned, summary, f"pair_cycle{cycle}_{i+1}.json")
                print(f"✅ Processed {article_path}. Summary saved.")
            else:
                print(f"❌ {article_path} summary low quality (score={score})")

        print(f"✅ Cycle #{cycle} completed. Sleeping for 5 minutes before next cycle...")
        cycle += 1
        time.sleep(300)  # Sleep for 5 minutes (300 seconds)

if __name__ == "__main__":
    run_pipeline()
