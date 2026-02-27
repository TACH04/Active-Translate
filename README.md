# 📖 Active Translate (Language Reader)

Welcome to **Active Translate**! This application allows you to listen to audiobooks or any audio files while following along with a synchronized, translated transcript. It's designed to be simple, local, and private.

## ✨ Features

- **Local Processing**: Transcriptions and translations happen on your machine.
- **Synchronized Text**: Click any sentence in the transcript to jump to that part of the audio.
- **Easy Setup**: Designed to run with a single double-click on macOS.

---

## 🚀 Quick Start (Mac users)

1.  **Open the project folder** on your computer.
2.  **Double-click** the file named `Start Active Translate.command`.
    - *Note: The first time you run this, it will download necessary AI models and dependencies. This may take a few minutes!*
3.  **Wait** for the window to say **"✅ App is running!"**.
4.  **Open your browser** (Chrome, Safari, etc.) and go to:
    👉 **[http://localhost:5173](http://localhost:5173)**

---

## 📂 How to add your own books

1. Open the app in your browser.
2. Use the **Upload** button to pick an `.mp3` or `.m4b` file from your computer.
3. The app will start transcribing and translating. You'll see a progress bar.
4. Once finished, the book will appear in your **Library**.

---

## 🛠 Prerequisites (For Developers)

If you are setting this up from scratch or on a new machine, ensure you have:
- **Python 3.10+**
- **Node.js 18+**
- **Git** (for updates)

The `run.sh` script handles creating the virtual environment (`.venv`) and installing dependencies automatically.

---

## 🛑 Stopping the App

To stop the application, go back to the terminal window that opened and press **Control + C**, or simply close the window.

---

## 📝 License

Private use. Created with ❤️ for Dad.
