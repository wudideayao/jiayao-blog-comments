"""
博客留言 API - Flask 后端（完整版）
- 接收联系表单提交
- 通过 Gmail SMTP 发送通知邮件
- 提供留言板评论列表 + 回复
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

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "messages.db"

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.environ.get("GMAIL_USER", "")
SMTP_PASS = os.environ.get("GMAIL_APP_PASSWORD", "")
NOTIFY_EMAIL = os.environ.get("NOTIFY_EMAIL", SMTP_USER)


def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(str(DB_PATH))
        g.db.row_factory = sqlite3.Row
        g.db.execute("""CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            content TEXT NOT NULL,
            parent_id INTEGER DEFAULT NULL,
            is_admin INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            is_public INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now', '+8 hours'))
        )""")
        for col in ['parent_id', 'is_admin']:
            try:
                g.db.execute(f"ALTER TABLE messages ADD COLUMN {col} INTEGER DEFAULT NULL")
            except sqlite3.OperationalError:
                pass
        g.db.commit()
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()


def send_notification(name, email_addr, content, msg_id):
    if not SMTP_USER or not SMTP_PASS:
        app.logger.warning("[邮件] 未配置 Gmail 账号，跳过邮件发送")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = email.utils.formataddr(("博客留言系统", SMTP_USER))
        msg["To"] = NOTIFY_EMAIL
        msg["Subject"] = f"💬 博客新留言 - {name}"
        msg["Reply-To"] = SMTP_USER

        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        text = f"""博客收到了新的留言！

来自：{name} ({email_addr})
时间：{now}
留言ID：{msg_id}

内容：
{content}

---
💡 直接回复此邮件，你的回复将自动显示在留言板上。
（请保留「留言ID：{msg_id}」这行，用于匹配回复）
"""
        html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system,'Noto Sans SC',sans-serif; background:#f5f0e6; padding:20px;">
<div style="max-width:600px; margin:0 auto; background:#fff; border-radius:12px; padding:32px;">
<div style="font-size:36px; margin-bottom:16px;">💬</div>
<h2 style="margin:0 0 8px; color:#3d3229;">博客新留言</h2>
<p style="color:#8a7d6b; margin:0 0 24px; font-size:14px;">{now}</p>
<div style="background:#f9f6f0; border-radius:8px; padding:16px; margin-bottom:24px;">
<p style="margin:0 0 4px; color:#3d3229;"><strong>{name}</strong> <span style="color:#8a7d6b; font-size:13px;">&lt;{email_addr}&gt;</span></p>
<p style="margin:0; color:#5a4f42; line-height:1.6; white-space:pre-wrap;">{content}</p>
</div>
<p style="color:#8a7d6b; font-size:12px;">留言ID：{msg_id}</p>
<p style="color:#8a7d6b; font-size:13px;">💡 直接回复此邮件，你的回复将自动显示在留言板上。</p>
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
        app.logger.info(f"[邮件] 已发送通知 (留言ID={msg_id})")
        return True
    except Exception as e:
        app.logger.error(f"[邮件] 发送失败: {e}")
        return False


# ========== API ==========

@app.route("/api/message", methods=["POST", "OPTIONS"])
def submit_message():
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
    db = get_db()
    cursor = db.execute(
        "INSERT INTO messages (name, email, content, status, is_public) VALUES (?,?,?,'pending',0)",
        (name, email_addr, content)
    )
    db.commit()
    msg_id = cursor.lastrowid
    send_notification(name, email_addr, content, msg_id)
    return jsonify({"ok": True, "id": msg_id, "message": "感谢你的留言！我会尽快回复 🙌"})


@app.route("/api/messages", methods=["GET"])
def list_messages():
    db = get_db()
    rows = db.execute(
        "SELECT id, name, content, parent_id, is_admin, created_at FROM messages WHERE is_public=1 ORDER BY created_at DESC LIMIT 100"
    ).fetchall()
    msgs = [dict(r) for r in rows]
    top = [m for m in msgs if not m["parent_id"]]
    replies = [m for m in msgs if m["parent_id"]]
    for t in top:
        t["replies"] = [r for r in replies if r["parent_id"] == t["id"]]
    return jsonify(top)


@app.route("/api/admin/messages", methods=["GET"])
def admin_list_messages():
    key = request.args.get("key", "")
    if key != os.environ.get("ADMIN_KEY", "jiayao-admin"):
        return jsonify({"error": "未授权"}), 403
    status = request.args.get("status", "")
    db = get_db()
    if status and status != "all":
        rows = db.execute("SELECT * FROM messages WHERE status=? ORDER BY id DESC", (status,))
    else:
        rows = db.execute("SELECT * FROM messages ORDER BY id DESC")
    return jsonify([dict(r) for r in rows])


@app.route("/api/admin/messages/<int:msg_id>/approve", methods=["POST"])
def approve_message(msg_id):
    key = request.args.get("key", "")
    if key != os.environ.get("ADMIN_KEY", "jiayao-admin"):
        return jsonify({"error": "未授权"}), 403
    db = get_db()
    db.execute("UPDATE messages SET status='approved', is_public=1 WHERE id=?", (msg_id,))
    db.commit()
    return jsonify({"ok": True})


@app.route("/api/admin/messages/<int:msg_id>/delete", methods=["POST"])
def delete_message(msg_id):
    key = request.args.get("key", "")
    if key != os.environ.get("ADMIN_KEY", "jiayao-admin"):
        return jsonify({"error": "未授权"}), 403
    db = get_db()
    db.execute("DELETE FROM messages WHERE id=? OR parent_id=?", (msg_id, msg_id))
    db.commit()
    return jsonify({"ok": True})


@app.route("/api/admin/reply", methods=["POST"])
def add_admin_reply():
    key = request.args.get("key", "")
    if key != os.environ.get("ADMIN_KEY", "jiayao-admin"):
        return jsonify({"error": "未授权"}), 403
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "请提供回复内容"}), 400
    parent_id = data.get("parent_id")
    content = (data.get("content") or "").strip()
    if not parent_id or not content:
        return jsonify({"error": "请提供 parent_id 和 content"}), 400
    if len(content) > 5000:
        return jsonify({"error": "回复不能超过 5000 字"}), 400
    db = get_db()
    parent = db.execute("SELECT id FROM messages WHERE id=?", (parent_id,)).fetchone()
    if not parent:
        return jsonify({"error": "父留言不存在"}), 404
    db.execute(
        "INSERT INTO messages (name, email, content, parent_id, is_admin, status, is_public) VALUES (?,?,?,?,1,'approved',1)",
        ("王佳垚", SMTP_USER, content, parent_id)
    )
    db.commit()
    return jsonify({"ok": True, "message": "回复已添加"})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "gmail_configured": bool(SMTP_USER and SMTP_PASS)
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
