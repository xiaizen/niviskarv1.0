import re

def clean_text(text):
    # Remove unwanted elements
    text = re.sub(r'\s+', ' ', text)  # Multiple spaces to single space
    text = re.sub(r'\[[0-9]+\]', '', text)  # Remove citations like [1]
    text = re.sub(r'http\S+', '', text)  # Remove URLs
    text = re.sub(r'[^\x00-\x7F]+', ' ', text)  # Remove non-ASCII characters
    text = re.sub(r'Read Full Story.*$', '', text, flags=re.MULTILINE)  # Remove "Read Full Story" sections
    
    # Remove common boilerplate text
    text = re.sub(r'Originally published.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'This article was.*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'Learn more about.*$', '', text, flags=re.MULTILINE)
    
    # Clean up navigation artifacts
    text = re.sub(r'Previous|Next|keyboard_arrow.*', '', text)
    text = re.sub(r'Topics: .*?\n', '\n', text)
    
    # Remove extra whitespace and normalize line endings
    text = re.sub(r'\n\s*\n', '\n\n', text)
    text = text.strip()
    
    # Only keep paragraphs with substantial content (more than 100 characters)
    paragraphs = text.split('\n\n')
    substantial_paragraphs = [p for p in paragraphs if len(p.strip()) > 100]
    
    return '\n\n'.join(substantial_paragraphs)
