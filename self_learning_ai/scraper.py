import requests
from bs4 import BeautifulSoup
import os
import PyPDF2
from urllib.parse import urljoin, urlparse
import io

ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.html']

# List of Trusted Educational URLs
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

def extract_pdf_text(pdf_content):
    try:
        pdf_file = io.BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in pdf_reader.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"❌ Error extracting PDF text: {e}")
        return None

def fetch_open_edu_articles(urls=URLS, limit=3):
    saved = []

    for base_url in urls:
        if len(saved) >= limit:
            break

        try:
            print(f"🔍 Scanning {base_url}")
            res = requests.get(base_url, timeout=10)
            soup = BeautifulSoup(res.text, "html.parser")

            links = soup.find_all("a", href=True)
            count = 0

            for a in links:
                if len(saved) >= limit:
                    break

                href = a["href"]
                full_url = urljoin(base_url, href)

                if not any(full_url.lower().endswith(ext) for ext in ALLOWED_EXTENSIONS):
                    continue

                try:
                    if full_url.lower().endswith('.pdf'):
                        print(f"📥 Downloading PDF: {full_url}")
                        pdf_response = requests.get(full_url, timeout=20)
                        if pdf_response.status_code == 200:
                            content = extract_pdf_text(pdf_response.content)
                            if content:
                                file_name = os.path.basename(urlparse(full_url).path) or f"article_{len(saved)+1}.txt"
                                path = os.path.join("data/raw", file_name.replace('.pdf', '.txt'))
                                with open(path, "w", encoding="utf-8") as f:
                                    f.write(content)
                                saved.append(path)
                                print(f"✅ Saved PDF content to {path}")
                    else:
                        page_response = requests.get(full_url, timeout=10)
                        if page_response.status_code == 200:
                            inner_soup = BeautifulSoup(page_response.text, "html.parser")
                            for element in inner_soup.find_all(['script', 'style', 'nav', 'header', 'footer']):
                                element.decompose()
                            content = inner_soup.get_text(separator=" ", strip=True)
                            if len(content) > 500:
                                path = os.path.join("data/raw", f"article_{len(saved)+1}.txt")
                                with open(path, "w", encoding="utf-8") as f:
                                    f.write(content)
                                saved.append(path)
                                print(f"✅ Saved HTML content to {path}")

                except Exception as e:
                    print(f"❌ Error processing {full_url}: {str(e)}")
                    continue

        except Exception as e:
            print(f"❌ Error fetching {base_url}: {str(e)}")
            continue

    print(f"\n📚 Total articles saved: {len(saved)}")
    for path in saved:
        print(f"- {path}")

    return saved

if __name__ == "__main__":
    articles = fetch_open_edu_articles(limit=3)
