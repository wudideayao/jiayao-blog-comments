"""
Download Google Fonts to local server
Run on the server to download and host fonts locally
"""
import os, re, urllib.request, urllib.error, time

FONTS_DIR = "/var/www/jiayao-space/fonts"

FONT_FAMILIES = [
    ("Inter", "/css?family=Inter:wght@300;400;500;600;700&display=swap"),
    ("Space+Grotesk", "/css2?family=Space+Grotesk:wght@400;500;700&display=swap"),
    ("Noto+Sans+SC", "/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap"),
    ("Noto+Serif+SC", "/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap"),
]

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}")

def download_fonts():
    os.makedirs(FONTS_DIR, exist_ok=True)
    combined_css = []
    
    for name, path in FONT_FAMILIES:
        url = f"https://fonts.googleapis.com{path}"
        safe_name = name.replace("+", "-").lower()
        font_dir = os.path.join(FONTS_DIR, safe_name)
        os.makedirs(font_dir, exist_ok=True)
        
        log(f"Fetching CSS for {name}...")
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            css = urllib.request.urlopen(req, timeout=30).read().decode("utf-8")
        except Exception as e:
            log(f"  ERROR fetching CSS: {e}")
            continue
        
        # Extract font URLs
        urls = re.findall(r'url\(([^)]+)\)', css)
        log(f"  Found {len(urls)} font files to download")
        
        downloaded = 0
        for font_url in urls:
            filename = os.path.basename(font_url.split("?")[0])
            local_path = os.path.join(font_dir, filename)
            
            if os.path.exists(local_path) and os.path.getsize(local_path) > 1000:
                log(f"  ✓ Already exists: {filename}")
            else:
                try:
                    log(f"  ↓ Downloading: {filename}")
                    urllib.request.urlretrieve(font_url, local_path)
                    downloaded += 1
                    time.sleep(0.5)
                except Exception as e:
                    log(f"  ✗ Failed: {filename} - {e}")
        
        # Replace URLs in CSS to local paths
        def replace_url(m):
            fu = m.group(1)
            fn = fu.split("/")[-1].split("?")[0]
            return f"url(/fonts/{safe_name}/{fn})"
        
        local_css = re.sub(r'url\(([^)]+)\)', replace_url, css)
        combined_css.append(f"/* {name} */\n{local_css}")
        log(f"  ✓ {name} done ({downloaded} new downloads)")
    
    # Write combined CSS
    css_path = os.path.join(FONTS_DIR, "fonts.css")
    with open(css_path, "w") as f:
        f.write("\n\n".join(combined_css))
    log(f"\n✓ Combined CSS written to {css_path}")
    log(f"✓ Total fonts downloaded")

download_fonts()
