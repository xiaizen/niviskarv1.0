import os
import sys

def test_imports():
    print("Testing imports...")
    try:
        from scraper import fetch_open_edu_articles
        from cleaner import clean_text
        from summarizer import summarize_text
        from evaluator import evaluate_summary
        from trainer import save_training_pair
        print("✅ All modules imported successfully")
        return True
    except Exception as e:
        print(f"❌ Import error: {str(e)}")
        return False

def test_directory_structure():
    print("\nTesting directory structure...")
    required_dirs = [
        "data",
        "data/raw",
        "data/summaries",
        "data/fine_tune"
    ]
    
    for dir_path in required_dirs:
        full_path = os.path.join(os.path.dirname(__file__), dir_path)
        if not os.path.exists(full_path):
            os.makedirs(full_path)
            print(f"Created missing directory: {dir_path}")
        else:
            print(f"✅ Directory exists: {dir_path}")

def test_basic_functionality():
    print("\nTesting basic functionality...")
    
    from cleaner import clean_text
    from summarizer import summarize_text
    from evaluator import evaluate_summary
    from trainer import save_training_pair
    
    # Test cleaning
    test_text = "This is a test   text with [1] some formatting.  \n  And http://test.com links."
    cleaned = clean_text(test_text)
    print("Cleaned text:", cleaned)
    
    # Test summarizing
    test_long = "First sentence. Second sentence. Third sentence. Fourth sentence."
    summary = summarize_text(test_long)
    print("Summary:", summary)
    
    # Test evaluation
    score = evaluate_summary(summary)
    print(f"Evaluation score: {score}")
    
    # Test saving
    try:
        save_training_pair("test input", "test output", "test_pair.json")
        print("✅ Training pair saved successfully")
    except Exception as e:
        print(f"❌ Error saving training pair: {str(e)}")

if __name__ == "__main__":
    print("🧪 Starting system tests...")
    if test_imports():
        test_directory_structure()
        test_basic_functionality()
    print("\n✨ Tests completed")
