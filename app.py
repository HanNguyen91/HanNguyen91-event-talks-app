from flask import Flask, jsonify, render_template, request
import urllib.request
import xml.etree.ElementTree as ET
import re
import os
import json
from datetime import datetime

app = Flask(__name__)

CACHE_FILE = os.path.join(os.path.dirname(__file__), 'releases_cache.json')
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        # Fetch the feed XML
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        # Parse XML
        root = ET.fromstring(xml_data)
        
        # Atom Namespace
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        all_items = []
        
        for entry in root.findall('atom:entry', namespace):
            title = entry.find('atom:title', namespace)
            date_str = title.text if title is not None else ''
            
            updated = entry.find('atom:updated', namespace)
            updated_str = updated.text if updated is not None else ''
            
            link_elem = entry.find('atom:link', namespace)
            link_href = link_elem.get('href') if link_elem is not None else ''
            
            content_elem = entry.find('atom:content', namespace)
            content_html = content_elem.text if content_elem is not None else ''
            
            # Parse individual h3 headers in content
            chunks = re.split(r'<h3>', content_html, flags=re.IGNORECASE)
            
            # If there's text before the first <h3> (rare but possible)
            if chunks[0].strip():
                # Strip paragraphs or html tags to see if there is actual text
                text_only = re.sub('<[^<]+?>', '', chunks[0]).strip()
                if text_only:
                    all_items.append({
                        'date': date_str,
                        'updated': updated_str,
                        'category': 'Announcement',
                        'content': chunks[0].strip(),
                        'link': link_href
                    })
                    
            for chunk in chunks[1:]:
                if '</h3>' in chunk:
                    category, body = chunk.split('</h3>', 1)
                    category = category.strip()
                    body = body.strip()
                    all_items.append({
                        'date': date_str,
                        'updated': updated_str,
                        'category': category,
                        'content': body,
                        'link': link_href
                    })
                else:
                    all_items.append({
                        'date': date_str,
                        'updated': updated_str,
                        'category': 'Update',
                        'content': chunk.strip(),
                        'link': link_href
                    })
                    
        # Save to local cache
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(all_items, f, ensure_ascii=False, indent=2)
            
        return all_items, None
    except Exception as e:
        # Fallback to cache if available
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                    all_items = json.load(f)
                return all_items, f"Failed to fetch live feed: {str(e)}. Displaying cached data."
            except Exception as cache_err:
                return [], f"Failed to fetch live feed: {str(e)}. Failed to load cache: {str(cache_err)}"
        return [], f"Error fetching feed: {str(e)}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    refresh = request.args.get('refresh', 'false').lower() == 'true'
    
    if refresh or not os.path.exists(CACHE_FILE):
        releases, err = fetch_and_parse_feed()
    else:
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                releases = json.load(f)
            err = None
        except Exception as e:
            releases, err = fetch_and_parse_feed()
            
    return jsonify({
        'releases': releases,
        'error': err,
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
