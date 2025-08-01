# Setup script for Windows
Write-Host "🚧 Setting up environment..."

# Create Python virtual environment
python -m venv .venv
. .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip

# Install required packages
pip install beautifulsoup4 requests nltk

# Create directory structure
New-Item -ItemType Directory -Force -Path self_learning_ai\data\raw
New-Item -ItemType Directory -Force -Path self_learning_ai\data\summaries
New-Item -ItemType Directory -Force -Path self_learning_ai\data\fine_tune

Write-Host "📜 Creating Python files..."
