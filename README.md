# Google BigQuery Release Notes Aggregator & X (Twitter) Composer

A premium, interactive dark-themed dashboard built with Python Flask and vanilla client-side web technologies (HTML, CSS, JS) that tracks, searches, and shares release updates from the Google Cloud BigQuery RSS feed.

---

## 🚀 Key Features

*   **Atom XML Ingestion**: Fetches Google Cloud's BigQuery release notes feed directly on the backend, bypassing CORS constraints.
*   **Granular Update Splitting**: Splits aggregated daily updates (grouped by Google) using `<h3>` header demarcations into distinct, searchable category cards (*Features*, *Fixes*, *Announcements*, etc.).
*   **Metrics Dashboard**: Live counter statistics showing total parsed releases and counts of new features, fixes, and general announcements.
*   **Real-time Filters & Search**: Instant, regex-supported search matches against title, content, date, and category, paired with sorting toggles (Newest vs. Oldest).
*   **In-App X (Twitter) Composer & Preview**:
    *   Allows users to edit the post text before sharing.
    *   Features a live-typing preview simulating a dark-themed post on X.
    *   Provides character boundary warnings (orange at 250 characters, red at 280 characters).
    *   Incorporates a mock media card for `cloud.google.com`.
*   **One-Click Copy**: Copies cleanly formatted templates (date, details, category, and source reference link) to the clipboard.
*   **Robust Local Cache**: Saves payloads to a local cache file to enable instant load times and serve as a fallback during network drops.

---

## 📁 Project Directory
*   [app.py](file:///C:/Users/Admin/agy-cli-projects/bigquery-release-notes/app.py) — Python Flask backend proxy and RSS parser.
*   [templates/index.html](file:///C:/Users/Admin/agy-cli-projects/bigquery-release-notes/templates/index.html) — Main HTML5 structure.
*   [static/css/styles.css](file:///C:/Users/Admin/agy-cli-projects/bigquery-release-notes/static/css/styles.css) — Custom theme styling and modal transitions.
*   [static/js/app.js](file:///C:/Users/Admin/agy-cli-projects/bigquery-release-notes/static/js/app.js) — Client controller (state, updates, filter pipeline, modal events).
*   [.gitignore](file:///C:/Users/Admin/agy-cli-projects/bigquery-release-notes/.gitignore) — Ignored directories and temporary local caches.

---

## 🛠️ Setup & Running

### 1. Prerequisites
Ensure you have Python 3.x and pip installed.

### 2. Install Dependencies
Navigate to the project directory and install Flask:
```powershell
python -m pip install flask
```

### 3. Run the Development Server
Execute the Flask script:
```powershell
python app.py
```
By default, the server runs on port 5000. Open your web browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🛡️ License
This project is open-source and free for developers to use and adapt. Built with vanilla technologies.
