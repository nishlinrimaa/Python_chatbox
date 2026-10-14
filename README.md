# PyBuddy — Personal Python Chatbot

A beginner-friendly Python learning chatbot for VS Code. It uses Flask and a predefined knowledge base, so it works locally without an API key.

## Features
- Python Q&A for common beginner topics
- Chat history saved in your browser
- Python multiple-choice quiz with score and explanations
- Copy answers
- Dark/light theme toggle
- Learning progress tracker
- Quick-topic buttons
- Responsive dark-blue interface

## Requirements
- Python 3.10 or newer
- Visual Studio Code

## Run on Windows
1. Extract the ZIP file.
2. Open the extracted `python_chatbot_upgraded` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Create a virtual environment (recommended):

   ```powershell
   python -m venv .venv
   ```

5. Activate it:

   ```powershell
   .\.venv\Scripts\Activate.ps1
   ```

   If PowerShell blocks activation, you can skip activation and use `.venv\\Scripts\\python.exe` for the commands below.

6. Install dependencies:

   ```powershell
   python -m pip install -r requirements.txt
   ```

7. Start the chatbot:

   ```powershell
   python app.py
   ```

8. Open the local URL shown in the terminal, usually `http://127.0.0.1:5000`.

Keep the terminal running while you use the chatbot. Press `Ctrl+C` in the terminal to stop it.

## If `python` is not recognized
Try `py --version`, then use `py -m pip install -r requirements.txt` and `py app.py`. If neither command works, install Python from python.org and select **Add Python to PATH** during installation.

## How the answers work
This project matches the user's question to a predefined Python knowledge base. It is not a large language model and does not execute code. If no matching topic is found, it suggests supported topics. You can add more entries to `KNOWLEDGE` in `app.py`.

## Where history and progress are saved
Chat history, theme, and progress are stored in your browser's local storage on the current browser/device. Clearing browser data may remove them.
