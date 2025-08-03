from scraper import fetch_open_edu_articles
from cleaner import clean_text
from summarizer import summarize_text
from evaluator import evaluate_summary
from trainer import save_training_pair

import os
import time

# Extended Trusted Educational URLs (20+ Links)
URLS = [
    "https://ocw.mit.edu/courses/find-by-topic/",
    "https://open.umn.edu/opentextbooks/subjects/computer-science-information-systems",
    "https://www.oercommons.org/courses/subjects/computer-science",
    "https://pressbooks.ulib.csuohio.edu/understanding-literacy-in-our-lives/",
    "https://guides.library.miami.edu/stemwriting",
    "https://digital.library.unt.edu/ark:/67531/metadc1610667/",
    "https://spacegrant.carthage.edu/live/files/5570-next-step-workshop-example-statements-of-purpose",
    "https://wac.colostate.edu/books/writingspaces/",
    "https://ocw.tufts.edu/Content/28/lecturenotes/273381",
    "https://oer.galileo.usg.edu/compsci-textbooks/",
    "https://learn.saylor.org/course/cs101",
    "https://engineering.purdue.edu/Engr/Resources/Engineering-Projects-in-Community-Service-EPICS",
    "https://global.oup.com/education/secondary/subjects/computing/",
    "https://cs50.harvard.edu/x/",
    "https://www.coursera.org/learn/python",
    "https://er.educause.edu/online-books",
    "https://www.edx.org/course/cs50s-introduction-to-computer-science",
    "https://www.futurelearn.com/subjects/it-and-computer-science-courses",
    "https://github.com/ossu/computer-science",
    "https://www.khanacademy.org/computing/computer-science",
]

def run_pipeline():
    os.makedirs("data/raw", exist_ok=True)
    os.makedirs("data/summaries", exist_ok=True)
    os.makedirs("data/fine_tune", exist_ok=True)

    cycle = 1
    while True:
        print(f"\n🔁 Starting Self-Learning Cycle #{cycle}...")

        print("🔍 Scanning trusted open education sites...")
        articles = fetch_open_edu_articles(URLS, limit=10)

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
