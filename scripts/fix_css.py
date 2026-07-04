import re
with open('blog/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_start = '.article-detail{max-width:720px;margin:0 auto;padding:7rem 2rem 6rem}'
idx = content.find(old_start)
if idx == -1:
    print("Old CSS not found")
    exit(1)

# Find the end of the footer CSS
footer_end = content.find('}.detail-footer', idx)
if footer_end == -1:
    footer_end = content.find('.detail-footer', idx)
# Find the closing brace after the last detail-* class
end_search = content.find('.detail-footer{margin-top:2rem;padding-top:1.5rem;border-top:1px solid rgba(0,0,0,0.06);text-align:right;font-size:0.875rem;color:#999}')
if end_search > 0:
    replace_end = end_search + len('.detail-footer{margin-top:2rem;padding-top:1.5rem;border-top:1px solid rgba(0,0,0,0.06);text-align:right;font-size:0.875rem;color:#999}')
else:
    print("Footer CSS not found")
    exit(1)

new_css = '.article-detail{max-width:740px;margin:0 auto;padding:7rem 2rem 6rem;position:relative}.article-detail::before{content:\"\";position:fixed;inset:0;background:linear-gradient(180deg,#f0f0f0,#e8e8e8);z-index:-1}.detail-inner{background:#fff;border:1px solid #e0e0e0;border-radius:4px;padding:3.5rem 3.5rem 3rem;box-shadow:0 2px 4px rgba(0,0,0,0.02),0 8px 20px rgba(0,0,0,0.04);position:relative}.detail-inner::before{content:\"\";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#2563eb,#4f46e5,#6366f1);border-radius:4px 4px 0 0}.detail-back{display:inline-flex;align-items:center;gap:0.4rem;font-size:0.875rem;color:#6e6e73;text-decoration:none;margin-bottom:1.5rem;transition:color .2s}.detail-back:hover{color:#2563eb}.detail-title{font-family:\'Space Grotesk\',sans-serif;font-size:clamp(1.6rem,3.5vw,2.5rem);font-weight:700;margin:0 0 0.75rem;line-height:1.35;letter-spacing:-0.01em;color:#1d1d1f}.detail-meta{display:flex;align-items:center;gap:0.75rem;font-size:0.8125rem;color:#999;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid #eee}.detail-body{font-size:1rem;line-height:2;color:#333}.detail-body h2{font-family:\'Space Grotesk\',sans-serif;font-size:1.35rem;font-weight:600;margin:2.5rem 0 1rem;padding-bottom:0.4rem;border-bottom:1px solid #eee;color:#1d1d1f}.detail-body h3{font-family:\'Space Grotesk\',sans-serif;font-size:1.1rem;font-weight:600;margin:2rem 0 0.75rem;color:#1d1d1f}.detail-body p{margin:0 0 1rem;text-indent:2em;line-height:2}.detail-body p:first-of-type{margin-top:0}.detail-body blockquote{margin:1.5rem 0;padding:1rem 1.5rem;border-left:3px solid #2563eb;background:#f8f9fa;border-radius:0 4px 4px 0;color:#555;font-style:italic;position:relative}.detail-body blockquote::before{content:\"\\201C\";font-size:2.5rem;color:#2563eb;opacity:0.15;position:absolute;top:-0.3rem;left:0.3rem;font-family:Georgia,serif;line-height:1}.detail-body blockquote p{margin:0;text-indent:0}.detail-body ul,.detail-body ol{margin:0 0 1rem;padding-left:2rem}.detail-body li{margin-bottom:0.3rem;line-height:1.8}.detail-body hr{margin:2rem 0;border:none;border-top:1px dashed #ddd}.detail-body strong{font-weight:600;color:#1d1d1f}.detail-body code{font-size:0.8125rem;background:#f5f5f7;padding:0.1rem 0.4rem;border-radius:3px;font-family:\'SF Mono\',\'Cascadia Code\',monospace}.detail-footer{margin-top:2rem;padding-top:1.5rem;border-top:1px solid #eee;text-align:right;font-size:0.8125rem;color:#999;font-family:\'Space Grotesk\',sans-serif}'

content = content[:idx] + new_css + content[replace_end:]

with open('blog/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS updated successfully")
