#!/bin/bash
# 博客一键部署脚本
# 在服务器上执行：bash /root/deploy.sh

set -e

BLOG_DIR="/var/www/blog"
NGINX_CONF="/etc/nginx/conf.d/blog.conf"

echo "🚀 开始部署博客..."

# 1. 安装 Nginx（如果未安装）
if ! command -v nginx &>/dev/null; then
    echo "📦 安装 Nginx..."
    if [ -f /etc/debian_version ]; then
        apt update && apt install nginx -y
    elif [ -f /etc/redhat-release ]; then
        yum install nginx -y
    else
        echo "❌ 不支持的 Linux 发行版"
        exit 1
    fi
fi

# 2. 创建网站目录
echo "📁 创建网站目录..."
mkdir -p $BLOG_DIR

# 3. 解压上传的文件
if [ -f /root/blog.zip ]; then
    echo "📦 解压文件..."
    unzip -o /root/blog.zip -d $BLOG_DIR
    rm -f /root/blog.zip
else
    echo "⚠️ 未找到 blog.zip，尝试从 GitHub 拉取..."
    if [ -d "$BLOG_DIR/.git" ]; then
        cd $BLOG_DIR && git pull origin main
    else
        cd $BLOG_DIR && git clone https://github.com/wudideayao/jiayao-blog-comments.git .
    fi
fi

# 4. 配置 Nginx
echo "🔧 配置 Nginx..."
cat > $NGINX_CONF << 'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/blog;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /blog/ {
        try_files $uri $uri/ /blog/index.html;
    }

    location ~* \.(css|js|svg|png|jpg|jpeg|ico)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/javascript image/svg+xml;
    gzip_min_length 1000;
}
EOF

# 5. 设置权限
chown -R www-data:www-data $BLOG_DIR 2>/dev/null || chown -R nginx:nginx $BLOG_DIR 2>/dev/null || true

# 6. 启动 Nginx
echo "✅ 启动 Nginx..."
nginx -t && systemctl restart nginx && systemctl enable nginx

# 7. 配置防火墙
echo "🛡️ 配置防火墙..."
if command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-service=http --add-service=https 2>/dev/null || true
    firewall-cmd --reload 2>/dev/null || true
fi

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "🎉 部署完成！"
echo "📎 访问地址: http://$SERVER_IP"
echo ""
echo "下一步："
echo "  1. 配置域名: 修改 /etc/nginx/conf.d/blog.conf 中的 server_name"
echo "  2. 配置 HTTPS: certbot --nginx -d 你的域名.com"
echo "  3. 阿里云安全组: 开放 80 和 443 端口"
