from flask import Flask, request, render_template_string, send_file
import os
import fitz  # PyMuPDF
from transformers import pipeline

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 10 MB

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

HTML_TEMPLATE = '''
<!doctype html>
<title>Academic PDF Summarizer</title>
<h2>Upload your academic PDF (max 10MB)</h2>
<form method=post enctype=multipart/form-data>
  <input type=file name=file><br><br>
  <input type=submit value=Upload>
</form>
{% if summary %}
<h3>Summary:</h3>
<pre>{{ summary }}</pre>
<a href="/download">Download Summary</a>
{% endif %}
'''

SUMMARY_PATH = "summary.txt"

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    summary = None
    if request.method == 'POST':
        file = request.files['file']
        if file and file.filename.endswith('.pdf'):
            path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(path)
            doc = fitz.open(path)
            full_text = ""
            for page in doc:
                full_text += page.get_text()
            doc.close()
            chunks = [full_text[i:i+1000] for i in range(0, len(full_text), 1000)]
            summarized = ''
            for chunk in chunks:
                if chunk.strip() == "":
                    continue
                try:
                    result = summarizer(chunk, max_length=150, min_length=40, do_sample=False)
                    summarized += result[0]['summary_text'] + '\n'
                except Exception as e:
                    print("Chunk skipped due to error:", e)
            with open(SUMMARY_PATH, 'w') as f:
                f.write(summarized)
            summary = summarized
    return render_template_string(HTML_TEMPLATE, summary=summary)

@app.route('/download')
def download_summary():
    return send_file(SUMMARY_PATH, as_attachment=True)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=7860)
