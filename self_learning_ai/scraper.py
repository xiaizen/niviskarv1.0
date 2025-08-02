import requests
from bs4 import BeautifulSoup
import os
import PyPDF2
from urllib.parse import urljoin, urlparse
import io

ALLOWED_DOMAINS = ["ocw.mit.edu", "open.umn.edu", "oercommons.org"]
ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.html']

def is_valid_domain(url):
    return any(domain in url for domain in ALLOWED_DOMAINS)

def is_valid_file(url):
    return any(url.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS)

def extract_pdf_text(pdf_content):
    try:
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"❌ Error extracting PDF text: {e}")
        return None

def fetch_open_edu_articles(limit=3):
    urls = [
        "https://ocw.mit.edu/courses/find-by-topic/",
        "https://open.umn.edu/opentextbooks/subjects/computer-science-information-systems",
        "https://www.oercommons.org/courses/subjects/computer-science"
    ]
    saved = []
    
    for base_url in urls:
        try:
            print(f"🔍 Scanning {base_url}")
            res = requests.get(base_url, timeout=10)
            soup = BeautifulSoup(res.text, "html.parser")
            
            # Find all links
            links = soup.find_all("a", href=True)
            count = 0
            
            for a in links:
                if count >= limit:
                    break
                    
                href = a["href"]
                full_url = urljoin(base_url, href)
                
                if not is_valid_domain(full_url):
                    continue
                    
                try:
                    # Check if it's a PDF link
                    if full_url.lower().endswith('.pdf'):
                        print(f"📥 Downloading PDF: {full_url}")
                        pdf_response = requests.get(full_url, timeout=20)
                        if pdf_response.status_code == 200:
                            content = extract_pdf_text(pdf_response.content)
                            if content:
                                file_name = os.path.basename(urlparse(full_url).path)
                                if not file_name:
                                    file_name = f"article_{len(saved)+1}.txt"
                                path = os.path.join("data", "raw", file_name.replace('.pdf', '.txt'))
                                with open(path, "w", encoding="utf-8") as f:
                                    f.write(content)
                                saved.append(path)
                                count += 1
                                print(f"✅ Saved PDF content to {path}")
                    
                    # If not PDF, try to get HTML content
                    else:
                        page_response = requests.get(full_url, timeout=10)
                        if page_response.status_code == 200:
                            soup = BeautifulSoup(page_response.text, "html.parser")
                            
                            # Remove unwanted elements
                            for element in soup.find_all(['script', 'style', 'nav', 'header', 'footer']):
                                element.decompose()
                            
                            content = soup.get_text(separator=" ", strip=True)
                            
                            if len(content) > 500:  # Only save if content is substantial
                                path = os.path.join("data", "raw", f"article_{len(saved)+1}.txt")
                                with open(path, "w", encoding="utf-8") as f:
                                    f.write(content)
                                saved.append(path)
                                count += 1
                                print(f"✅ Saved HTML content to {path}")
                
                except Exception as e:
                    print(f"❌ Error processing {full_url}: {str(e)}")
                    continue
                    
        except Exception as e:
            print(f"❌ Error fetching {base_url}: {str(e)}")
            continue
            
    return saved

if __name__ == "__main__":
    # Test the scraper
    articles = fetch_open_edu_articles(limit=3)
    print(f"\n📚 Total articles saved: {len(articles)}")
    for article in articles:
        print(f"- {article}")
