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
    os.makedirs("data/fine_tune", exist_ok=True)  # <- fine_tune dir

    cycle = 1
    while True:
        print(f"\n🔁 Starting Self-Learning Cycle #{cycle}...")

        print("🔍 Scanning open education sites...")
        articles = fetch_open_edu_articles(limit=10)

        if not articles:
            print("⚠️ No articles found in this cycle.")
        else:
            for i, article_path in enumerate(articles):
                with open(article_path, "r", encoding="utf-8") as f:
                    raw = f.read()

                cleaned = clean_text(raw)
                summary = summarize_text(cleaned)
                score = evaluate_summary(summary)

                print(f"📝 Summary Preview (score={score}): {summary[:300]}...")

                # Save summary regardless of score for testing
                summary_path = os.path.join("data/summaries", f"summary_{cycle}_{i+1}.txt")
                with open(summary_path, "w", encoding="utf-8") as f:
                    f.write(summary)

                save_training_pair(cleaned, summary, f"pair_{cycle}_{i+1}.json")
                print(f"✅ Processed {article_path}. Summary and fine-tune pair saved.")

        print(f"✅ Cycle #{cycle} completed. Sleeping for 4 minutes before next cycle...\n")
        cycle += 1
        time.sleep(240)  # Sleep for 4 minutes

if __name__ == "__main__":
    run_pipeline()
