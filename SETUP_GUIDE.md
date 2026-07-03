# 博客部署与配置指南

## 📋 目录

1. [阿里云服务器部署](#1-阿里云服务器部署)
2. [启用 Giscus 评论系统](#2-启用-giscus-评论系统)
3. [写新文章](#3-写新文章)
4. [日常维护](#4-日常维护)

---

## 1. 启用 Giscus 评论系统

Giscus 是一个基于 GitHub Discussions 的评论系统，免费且无广告。

### 步骤一：启用 Discussions

1. 打开仓库：https://github.com/wudideayao/jiayao-blog-comments
2. 点击顶部导航栏的 **Settings**（齿轮图标）
3. 向下滚动到 **Features** 区域
4. 勾选 **Discussions** ✅
5. 回到仓库主页，顶部会出现 **Discussions** 标签

### 步骤二：创建分类

1. 点击仓库顶部的 **Discussions** 标签
2. 点击 **Category** 下拉菜单 → **Edit**（或直接新建一个）
3. 确保有一个 **Announcements** 或 **General** 分类
   - 建议创建一个名为 **Blog Comments** 的分类（Announcements 格式）

### 步骤三：获取配置参数

1. 打开 https://giscus.app/zh-CN
2. 在 **语言** 处选择 **简体中文**
3. 在 **仓库** 输入框填入：`wudideayao/jiayao-blog-comments`
4. 页面会自动检测仓库
5. 在 **页面 ↔ Discussion 映射** 选择 **特定文章 ID**
6. 在 **Discussion 分类** 选择你刚才创建的 **Blog Comments**（或 **Announcements**）
7. 下方 **特性** 勾选：
   - ☑ **启用反应**
   - ☑ **输入位置在上方**
8. 在 **主题** 选择 **跟随系统偏好**

### 步骤四：已配置完毕

Giscus 已配置完成，相关参数已更新到 `blog/js/blog.js` 中：

- `data-repo-id`: `R_kgDOS6bpuA`
- `data-category-id`: `DIC_kwDOS6bpuM4C_I5q`

### 步骤五：创建 Discussion

你需要在仓库 Discussions 中为每篇文章创建一个 Discussion，标题必须包含文章 ID：

| 文章 | Discussion 标题 |
|------|----------------|
| 你好，世界 | `📝 你好，世界 — hello-world` |
| 跑步教会我的三件事 | `🏃 跑步教会我的三件事 — running-and-life` |
| 音乐是我生活里的背景色 | `🎵 音乐是我生活里的背景色 — music-in-my-life` |
| 游戏里的另一个世界 | `🎮 游戏里的另一个世界 — game-world` |
| 日常生活中的美 | `🌅 日常生活中的美 — beauty-in-daily` |
| 二十多岁的一些思考 | `💭 二十多岁的一些思考 — thinking-about-life` |

### 步骤六：提交并推送

```bash
git add .
git commit -m "feat: 配置 Giscus 评论系统"
git push
```

---

## 2. 阿里云服务器部署

### 准备工作

- 一台阿里云服务器（已开通）
- SSH 远程连接工具（Windows 用 PowerShell 或 PuTTY）
- 一个域名（可选，也可以用 IP 访问）

### 方式 A：一键部署脚本（推荐）

在本地 PowerShell 执行以下命令，自动完成部署：

```powershell
# 1. 将博客文件打包上传到服务器
# 先压缩本地文件
Compress-Archive -Path "E:\博客\*" -DestinationPath "$env:TEMP\blog.zip" -Force

# 2. 上传到阿里云服务器（替换 <服务器IP> 为你的服务器公网 IP）
scp "$env:TEMP\blog.zip" root@<服务器IP>:/root/
scp "E:\博客\scripts\deploy.sh" root@<服务器IP>:/root/

# 3. SSH 登录服务器并执行部署
ssh root@<服务器IP> "bash /root/deploy.sh"
```

首次执行前，需要在服务器上创建部署脚本。

### 方式 B：手动配置 Nginx（详细步骤）

#### 步骤一：登录服务器

```bash
ssh root@<你的服务器IP>
```

#### 步骤二：安装 Nginx

**Ubuntu / Debian：**
```bash
apt update
apt install nginx -y
```

**CentOS / Alibaba Cloud Linux：**
```bash
yum install nginx -y
# 或
dnf install nginx -y
```

#### 步骤三：配置 Nginx

创建配置文件 `/etc/nginx/conf.d/blog.conf`：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    root /var/www/blog;
    index index.html;

    # 主站
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 博客页面
    location /blog/ {
        try_files $uri $uri/ /blog/index.html;
    }

    # 静态资源缓存
    location ~* \.(css|js|svg|png|jpg|jpeg|ico)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/javascript image/svg+xml;
    gzip_min_length 1000;
}
```

#### 步骤四：部署博客文件

```bash
# 创建网站目录
mkdir -p /var/www/blog

# 从 GitHub 拉取代码（首次）
cd /var/www/blog
git clone https://github.com/wudideayao/jiayao-blog-comments.git .
# 或从本地上传文件后解压
cd /var/www/blog
unzip /root/blog.zip -d /var/www/blog
```

#### 步骤五：启动 Nginx

```bash
# 测试配置是否正确
nginx -t

# 启动/重启 Nginx
systemctl restart nginx
systemctl enable nginx
```

#### 步骤六：配置域名（可选）

1. 在阿里云 DNS 控制台添加 **A 记录**，指向服务器 IP
2. 申请 SSL 证书（推荐使用 Let's Encrypt）：

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx -y    # Ubuntu
yum install certbot python3-certbot-nginx -y    # CentOS

# 申请证书
certbot --nginx -d 你的域名.com

# 自动续期
certbot renew --dry-run
```

#### 步骤七：配置防火墙

```bash
# 开放 80 和 443 端口
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# 如果使用 iptables
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

> **注意**：还需要在阿里云控制台的**安全组**中开放 80（HTTP）和 443（HTTPS）端口。

### 方式 C：自动化部署（GitHub + 服务器 Webhook）

每次 `git push` 后自动部署到服务器：

1. 在服务器上创建部署脚本 `/root/deploy-blog.sh`：

```bash
#!/bin/bash
cd /var/www/blog
git pull origin main
systemctl reload nginx
```

2. 设置定时同步（简单方式）：

```bash
chmod +x /root/deploy-blog.sh
echo "*/5 * * * * root /root/deploy-blog.sh" >> /etc/crontab
```

3. 或配置 GitHub Webhook（高级方式），在服务器上监听 push 事件自动部署。
`````
<userPrompt>
Provide the fully rewritten file, incorporating the suggested code change. You must produce the complete file.
</userPrompt>
