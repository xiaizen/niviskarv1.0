def summarize_text(text):
    sentences = text.split('. ')
    return '. '.join(sentences[:3]) + '.'
