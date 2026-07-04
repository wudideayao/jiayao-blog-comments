#!/usr/bin/env python3
"""将文章详情页改为传统信纸风格"""
import re

with open('E:/博客/blog/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. 页面背景 - 暖黄
html = html.replace(
    '.article-detail::before{content:"";position:fixed;inset:0;background:linear-gradient(180deg,#f0f0f0,#e8e8e8);z-index:-1}.detail-inner{background:#fff;border:1px solid #e0e0e0;border-radius:4px;padding:3.5rem 3.5rem 3rem;box-shadow:0 2px 4px rgba(0,0,0,0.02),0 8px 20px rgba(0,0,0,0.04);position:relative}.detail-inner::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#2563eb,#4f46e5,#6366f1);border-radius:4px 4px 0 0}',
    '.article-detail::before{content:"";position:fixed;inset:0;background:linear-gradient(180deg,#e0d5c5,#d5c8b8);z-index:-1}.detail-inner{background:#f5f0e6;border:1px solid #d0c4b4;border-radius:2px;padding:3.5rem;box-shadow:0 2px 8px rgba(0,0,0,0.06);position:relative;background-image:repeating-linear-gradient(transparent,transparent 1.8em,rgba(180,165,145,0.2) 1.8em,rgba(180,165,145,0.2) 1.85em)}.detail-inner::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:#c8b8a0}'
)

# 2. 标题居中、配色暖棕
html = html.replace(
    '.detail-title{font-family:"Space Grotesk",sans-serif;font-size:clamp(1.6rem,3.5vw,2.5rem);font-weight:700;margin:0 0 0.75rem;line-height:1.35;letter-spacing:-0.01em;color:#1d1d1f}',
    '.detail-title{font-family:"Noto Serif SC","Noto Sans SC",serif;font-size:clamp(1.5rem,3vw,2.2rem);font-weight:700;margin:0 0 0.5rem;line-height:1.4;letter-spacing:0.05em;color:#3d3229;text-align:center}'
)

# 3. 元数据居中、虚线
html = html.replace(
    '.detail-meta{display:flex;align-items:center;gap:0.75rem;font-size:0.8125rem;color:#999;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid #eee}',
    '.detail-meta{display:flex;align-items:center;justify-content:center;gap:0.75rem;font-size:0.8125rem;color:#8b7d6b;margin-bottom:2rem;padding-bottom:1rem;border-bottom:1px dashed #d0c4b4}'
)

# 4. 正文
html = html.replace(
    '.detail-body{font-size:1rem;line-height:2;color:#333}',
    '.detail-body{font-size:1rem;line-height:2;color:#3d3229;font-family:"Noto Serif SC","Noto Sans SC",serif}'
)

# 5. 小标题
html = html.replace(
    '.detail-body h2{font-family:"Space Grotesk",sans-serif;font-size:1.35rem;font-weight:600;margin:2.5rem 0 1rem;padding-bottom:0.4rem;border-bottom:1px solid #eee;color:#1d1d1f}',
    '.detail-body h2{font-size:1.3rem;font-weight:700;margin:2rem 0 1rem;color:#3d3229;text-align:center;font-family:"Noto Serif SC","Noto Sans SC",serif;border-bottom:none}'
)
html = html.replace(
    '.detail-body h3{font-family:"Space Grotesk",sans-serif;font-size:1.1rem;font-weight:600;margin:2rem 0 0.75rem;color:#1d1d1f}',
    '.detail-body h3{font-family:"Noto Serif SC","Noto Sans SC",serif;font-size:1.05rem;font-weight:600;margin:1.8rem 0 0.75rem;color:#3d3229}'
)

# 6. 段落
html = html.replace(
    '.detail-body p{margin:0 0 1rem;text-indent:2em;line-height:2}.detail-body p:first-of-type{margin-top:0}',
    '.detail-body p{margin:0 0 0;text-indent:2em;line-height:2;min-height:2em}'
)

# 7. 引用块
html = html.replace(
    '.detail-body blockquote{margin:1.5rem 0;padding:1rem 1.5rem;border-left:3px solid #2563eb;background:#f8f9fa;border-radius:0 4px 4px 0;color:#555;font-style:italic;position:relative}.detail-body blockquote::before{content:"C";font-size:2.5rem;color:#2563eb;opacity:0.15;position:absolute;top:-0.3rem;left:0.3rem;font-family:Georgia,serif;line-height:1}',
    '.detail-body blockquote{margin:1.5rem 0;padding:0.8rem 1.5rem;border-left:2px solid #b8a898;background:rgba(200,184,160,0.15);border-radius:0;color:#6b5d4d;font-style:italic;position:relative;font-size:0.95rem}.detail-body blockquote::before{content:"\201C";font-size:2.2rem;color:#b8a898;opacity:0.4;position:absolute;top:-0.2rem;left:0.3rem;font-family:Georgia,serif;line-height:1}'
)

# 8. 返回按钮、分割线、代码、页脚
html = html.replace(
    '.detail-back{display:inline-flex;align-items:center;gap:0.4rem;font-size:0.875rem;color:#6e6e73;text-decoration:none;margin-bottom:1.5rem;transition:color .2s}.detail-back:hover{color:#2563eb}',
    '.detail-back{display:inline-flex;align-items:center;gap:0.4rem;font-size:0.875rem;color:#8b7d6b;text-decoration:none;margin-bottom:1.5rem;transition:color .2s}.detail-back:hover{color:#3d3229}'
)
html = html.replace(
    '.detail-body blockquote p{margin:0;text-indent:0}.detail-body ul,.detail-body ol{margin:0 0 1rem;padding-left:2rem}.detail-body li{margin-bottom:0.3rem;line-height:1.8}.detail-body hr{margin:2rem 0;border:none;border-top:1px dashed #ddd}.detail-body strong{font-weight:600;color:#1d1d1f}',
    '.detail-body blockquote p{margin:0;text-indent:0}.detail-body ul,.detail-body ol{margin:0 0 0;padding-left:2.5rem}.detail-body li{margin-bottom:0;line-height:2}.detail-body hr{margin:2rem 0;border:none;border-top:1px dashed #d0c4b4}.detail-body strong{font-weight:700;color:#3d3229}'
)
html = html.replace(
    '.detail-body code{font-size:0.8125rem;background:#f5f5f7;padding:0.1rem 0.4rem;border-radius:3px;font-family:"SF Mono","Cascadia Code",monospace}.detail-footer{margin-top:2rem;padding-top:1.5rem;border-top:1px solid #eee;text-align:right;font-size:0.8125rem;color:#999;font-family:"Space Grotesk",sans-serif}',
    '.detail-body code{font-size:0.8125rem;background:rgba(200,184,160,0.2);padding:0.1rem 0.4rem;border-radius:2px;font-family:"SF Mono","Cascadia Code",monospace;color:#3d3229}.detail-footer{margin-top:1.5rem;padding-top:1rem;border-top:1px dashed #d0c4b4;text-align:center;font-size:0.8125rem;color:#8b7d6b;font-family:"Noto Serif SC","Noto Sans SC",serif}'
)

# 添加 Noto Serif SC 字体引用
html = html.replace(
    '<link rel="stylesheet" href="/css/style.css">',
    '<link rel="stylesheet" href="/css/style.css"><link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">'
)

with open('E:/博客/blog/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('✅ 信纸风格已应用')
