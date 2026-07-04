"""
博客留言 API - Flask 后端
- 接收联系表单提交
- 通过 Gmail SMTP 发送通知邮件
- 提供留言板评论列表
"""

import os
import sqlite3
import smtplib
import email.utils
from datetime import datetime
from pathlib import Path
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from flask import Flask, request, jsonify, g
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ========== 配置 ==========
BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "messages.db"

# Gmail SMTP 配置（通过环境变量设置）
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.environ.get("GMAIL_USER", "")       # 你的 Gmail 地址
SMTP_PASS = os.environ.get("GMAIL_APP_PASSWORD", "")  # Gmail 应用专用密码
NOTIFY_EMAIL = os.environ.get("NOTIFY_EMAIL", SMTP_USER)  # 接收通知的邮箱

# ========== 数据库 ==========
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(str(DB_PATH))
        g.db.row_factory = sqlite3.Row
        g.db.execute("""CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            content TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            is_public INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now', '+8 hours'))
        )""")
        g.db.commit()
    return g.db

@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()

# ========== 邮件发送 ==========
def send_notification(name, email, content):
    """通过 Gmail SMTP 发送新留言通知"""
    if not SMTP_USER or not SMTP_PASS:
        print("[邮件] 未配置 Gmail 账号，跳过邮件发送")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = email.utils.formataddr(("博客留言系统", SMTP_USER))
        msg["To"] = NOTIFY_EMAIL
        msg["Subject"] = f"💬 博客新留言 - {name}"

        now = datetime.now().strftime("%Y-%m-%d %H:%M")

        text = f"""博客收到了新的留言！

来自：{name} ({email})
时间：{now}
内容：
{content}
---
你可以直接回复此邮件与对方联系。
"""

        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, 'Noto Sans SC', sans-serif; background: #f5f0e6; padding: 20px;">
<div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
<div style="font-size: 36px; margin-bottom: 16px;">💬</div>
<h2 style="margin: 0 0 8px; color: #3d3229;">博客新留言</h2>
<p style="color: #8a7d6b; margin: 0 0 24px; font-size: 14px;">{now}</p>

<div style="background: #f9f6f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
<p style="margin: 0 0 4px; color: #3d3229;"><strong>{name}</strong> <span style="color: #8a7d6b; font-size: 13px;">&lt;{email}&gt;</span></p>
<p style="margin: 0; color: #5a4f42; line-height: 1.6; white-space: pre-wrap;">{content}</p>
</div>

<p style="color: #8a7d6b; font-size: 13px;">💡 你可以直接回复此邮件与对方联系。</p>
</div>
</body>
</html>"""

        part1 = MIMEText(text, "plain", "utf-8")
        part2 = MIMEText(html, "html", "utf-8")
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(SMTP_USER, [NOTIFY_EMAIL], msg.as_string())
        server.quit()

        print(f"[邮件] 已发送通知给 {NOTIFY_EMAIL}")
        return True
    except Exception as e:
        print(f"[邮件] 发送失败: {e}")
        return False

# ========== API ==========

@app.route("/api/message", methods=["POST", "OPTIONS"])
def submit_message():
    """提交新留言"""
    if request.method == "OPTIONS":
        return jsonify({"ok": True})

    data = request.get_json(silent=True) or request.form.to_dict()
    if not data:
        return jsonify({"error": "请提供留言信息"}), 400

    name = (data.get("name") or "").strip()
    email_addr = (data.get("email") or "").strip()
    content = (data.get("message") or data.get("content") or "").strip()

    if not name:
        return jsonify({"error": "请填写名字"}), 400
    if not email_addr:
        return jsonify({"error": "请填写邮箱"}), 400
    if not content:
        return jsonify({"error": "请填写留言内容"}), 400
    if len(content) > 5000:
        return jsonify({"error": "留言内容不能超过 5000 字"}), 400

    # 存入数据库
    db = get_db()
    cursor = db.execute(
        "INSERT INTO messages (name, email, content, status, is_public) VALUES (?, ?, ?, 'pending', 0)",
        (name, email_addr, content)
    )
    db.commit()
    msg_id = cursor.lastrowid

    # 异步发送邮件通知
    send_notification(name, email_addr, content)

    return jsonify({
        "ok": True,
        "id": msg_id,
        "message": "感谢你的留言！我会尽快回复 🙌"
    })


@app.route("/api/messages", methods=["GET"])
def list_messages():
    """获取已公开的留言"""
    db = get_db()
    rows = db.execute(
        "SELECT id, name, content, created_at FROM messages WHERE is_public = 1 ORDER BY created_at DESC LIMIT 50"
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/messages", methods=["GET"])
def admin_list_messages():
    """管理后台 - 查看所有留言（需要密钥）"""
    admin_key = request.args.get("key", "")
    expected_key = os.environ.get("ADMIN_KEY", "jiayao-admin")
    if admin_key != expected_key:
        return jsonify({"error": "未授权"}), 403

    status = request.args.get("status", "")  # pending / approved / all
    db = get_db()
    if status and status != "all":
        rows = db.execute(
            "SELECT * FROM messages WHERE status = ? ORDER BY created_at DESC",
            (status,)
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT * FROM messages ORDER BY created_at DESC"
        ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/messages/<int:msg_id>/approve", methods=["POST"])
def approve_message(msg_id):
    """管理后台 - 批准留言公开显示"""
    admin_key = request.args.get("key", "")
    expected_key = os.environ.get("ADMIN_KEY", "jiayao-admin")
    if admin_key != expected_key:
        return jsonify({"error": "未授权"}), 403

    db = get_db()
    db.execute("UPDATE messages SET status = 'approved', is_public = 1 WHERE id = ?", (msg_id,))
    db.commit()
    return jsonify({"ok": True})


@app.route("/api/admin/messages/<int:msg_id>/delete", methods=["POST"])
def delete_message(msg_id):
    """管理后台 - 删除留言"""
    admin_key = request.args.get("key", "")
    expected_key = os.environ.get("ADMIN_KEY", "jiayao-admin")
    if admin_key != expected_key:
        return jsonify({"error": "未授权"}), 403

    db = get_db()
    db.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
    db.commit()
    return jsonify({"ok": True})


@app.route("/api/health", methods=["GET"])
def health():
    """健康检查"""
    return jsonify({
        "status": "ok",
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "gmail_configured": bool(SMTP_USER and SMTP_PASS)
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
