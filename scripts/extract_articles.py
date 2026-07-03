import re, html
files = ['hello-world', 'deploy-journey', 'laptop-guide']
for f in files:
    with open(f'/var/www/jiayao-blog/blog/{f}/index.html') as fp:
        content = fp.read()
    title_m = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.DOTALL)
    title = title_m.group(1) if title_m else f
    date_m = re.search(r'(\d{4}年\d{1,2}月\d{1,2}日)', content)
    date_str = date_m.group(1) if date_m else ''
    desc_m = re.search(r'name="description" content="(.*?)"', content)
    desc = desc_m.group(1) if desc_m else ''
    body_m = re.search(r'class="post-content"[^>]*>(.*?)</div>', content, re.DOTALL)
    body = ''
    if body_m:
        body_html = body_m.group(1)
        body = re.sub(r'<[^>]+>', '', body_html)
        body = html.unescape(body).strip()
    print(f'=== {f} ===')
    print(title)
    print(date_str)
    print(desc)
    print(body)
    print('===END===')
