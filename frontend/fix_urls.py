import os
import re

filepath = r'd:\Desktop\5-Day AI Agents\livora\frontend\src\App.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

if 'const API_BASE' not in content:
    content = content.replace('function App() {', "const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';\n\nfunction App() {")

content = re.sub(r"'http://localhost:8000/([^']+)'", r"`${API_BASE}/\1`", content)
content = re.sub(r'"http://localhost:8000/([^"]+)"', r"`${API_BASE}/\1`", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced successfully!")
