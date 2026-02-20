# Elden Ring Quest Tracker

An interactive, web-based quest tracker for **Elden Ring** and the **Shadow of the Erdtree** DLC. 

🌍 **Live Site:** [https://ekinertac.github.io/elden-ring-quest-guide/](https://ekinertac.github.io/elden-ring-quest-guide/)

## Features
* **Complete Quest Steps:** Detailed, chronological quest steps grouped by location for both the base game and DLC.
* **Progress Tracking:** Check off tasks as you go. Your progress is automatically saved to your browser's local storage so you can pick up where you left off.
* **Progress Bars:** Visual indicators of your overall completion percentage and region-specific completion.
* **Thematic UI:** Clean, responsive, and dark-themed UI inspired by the Lands Between.

## How it Works
The quest data is generated from detailed text guides (`guide.txt` and `guide-dlc.txt`). A Node.js script (`parser.js`) parses these text files and compiles them into a structured JSON format (`data.js`) which powers the frontend Vanilla JS application.

## Local Development
1. Clone the repository
2. Start a local server (e.g., using Python):
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.

If you make modifications to the raw text guides, you can regenerate the quest data:
```bash
node parser.js
```