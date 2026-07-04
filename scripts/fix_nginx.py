"""Fix Nginx config - add blog API proxy"""
with open('/tmp/jiayao-blog-new.conf', 'r') as f:
    content = f.read()

new_block = '''

    # 博客留言 API
    location /blog/api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10;
        proxy_read_timeout 30;
    }
'''
content = content.replace(
    '# 博客列表（禁用缓存，确保内容实时更新）',
    '# 博客列表（禁用缓存，确保内容实时更新）' + new_block
)

with open('/tmp/jiayao-blog-new.conf', 'w') as f:
    f.write(content)
print('Done - config updated')
