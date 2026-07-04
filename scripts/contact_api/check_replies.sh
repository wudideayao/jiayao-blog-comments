#!/bin/bash
# 读取 .env 文件并设置环境变量
set -a
source /var/www/jiayao-blog/api/.env
set +a

cd /var/www/jiayao-blog/api
python3 reply_watcher.py >> /var/log/jiayao-reply-watcher.log 2>&1
