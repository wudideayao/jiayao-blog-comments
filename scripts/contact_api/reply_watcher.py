"""
Gmail IMAP 回复监听器
- 定期检查 Gmail 收件箱中是否有对通知邮件的回复
- 提取回复内容并存入数据库作为博主回复
- 建议通过 cron 每 3 分钟运行一次
"""

import os
import re
import sys
import sqlite3
import imaplib
import email as email_lib
from email.header import decode_header
from pathlib import Path
from datetime import datetime

# ========== 配置 ==========
BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "messages.db"

SMTP_USER = os.environ.get("GMAIL_USER", "")
SMTP_PASS = os.environ.get("GMAIL_APP_PASSWORD", "")
NOTIFY_EMAIL = os.environ.get("NOTIFY_EMAIL", SMTP_USER)

IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993
CHECK_SUBJECT_PREFIX = "Re: 💬 博客新留言"


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{ts}] {msg}")


def extract_msg_id(text):
    """从邮件正文中提取留言ID（格式：留言ID：123 或 留言ID:123）"""
    m = re.search(r'留言ID[：:]\s*(\d+)', text)
    return int(m.group(1)) if m else None


def decode_subject(subject):
    """解码邮件主题"""
    if not subject:
        return ""
    decoded_parts = decode_header(subject)
    result = []
    for part, charset in decoded_parts:
        if isinstance(part, bytes):
            try:
                result.append(part.decode(charset or 'utf-8', errors='replace'))
            except:
                result.append(part.decode('utf-8', errors='replace'))
        else:
            result.append(part)
    return ''.join(result)


def get_text_from_email(msg):
    """从邮件中提取纯文本内容"""
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == "text/plain":
                try:
                    payload = part.get_payload(decode=True)
                    charset = part.get_content_charset() or 'utf-8'
                    return payload.decode(charset, errors='replace')
                except:
                    continue
            elif part.get_content_type() == "text/html":
                # fallback to HTML if no plain text
                try:
                    payload = part.get_payload(decode=True)
                    charset = part.get_content_charset() or 'utf-8'
                    text = payload.decode(charset, errors='replace')
                    # strip HTML tags
                    text = re.sub(r'<[^>]+>', '', text)
                    text = re.sub(r'\s+', ' ', text).strip()
                    return text
                except:
                    continue
    else:
        try:
            payload = msg.get_payload(decode=True)
            charset = msg.get_content_charset() or 'utf-8'
            return payload.decode(charset, errors='replace')
        except:
            return ""
    return ""


def strip_reply_quote(text):
    """去掉回复邮件中的原始引用内容"""
    lines = text.split('\n')
    result = []
    for line in lines:
        # 跳过引用行
        if line.startswith('>') or line.startswith('> '):
            continue
        # 跳过常见的引用分隔
        if '---原始邮件---' in line or '--- Original ---' in line or '原始消息' in line:
            break
        if line.strip() == '---':
            break
        if line.startswith('发件人:') or line.startswith('From:') or line.startswith('发送时间:') or line.startswith('Sent:'):
            continue
        if line.startswith('收件人:') or line.startswith('To:') or line.startswith('Cc:'):
            continue
        if line.startswith('主题:') or line.startswith('Subject:'):
            continue
        if '留言ID' in line and ':' in line:
            # 跳过留言ID引用行本身
            if len(line.strip()) < 30:
                continue
        result.append(line)
    return '\n'.join(result).strip()


def process_reply(mail, email_id, subject):
    """处理一封回复邮件"""
    status, msg_data = mail.fetch(email_id, '(RFC822)')
    if status != 'OK':
        log(f"  无法获取邮件 {email_id}")
        return False

    raw_email = msg_data[0][1]
    msg = email_lib.message_from_bytes(raw_email)

    # 获取正文
    body = get_text_from_email(msg)
    if not body:
        log(f"  无法解析邮件正文 {email_id}")
        return False

    # 提取留言ID
    msg_id = extract_msg_id(body)
    if not msg_id:
        log(f"  未找到留言ID，跳过: {subject}")
        return False

    # 提取回复内容（去掉引用）
    reply_content = strip_reply_quote(body)
    if not reply_content:
        log(f"  回复内容为空，跳过: {subject}")
        return False

    log(f"  匹配到留言ID={msg_id}, 回复内容: {reply_content[:50]}...")

    # 存入数据库
    conn = sqlite3.connect(str(DB_PATH))
    try:
        # 检查是否已处理过（避免重复）
        existing = conn.execute(
            "SELECT id FROM messages WHERE parent_id=? AND is_admin=1", (msg_id,)
        ).fetchone()
        if existing:
            log(f"  留言ID={msg_id} 已有回复，跳过")
            conn.close()
            # 标记为已读
            mail.store(email_id, '+FLAGS', '\\Seen')
            return True

        conn.execute(
            "INSERT INTO messages (name, email, content, parent_id, is_admin, status, is_public) VALUES (?,?,?,?,1,'approved',1)",
            ("王佳垚", SMTP_USER, reply_content, msg_id)
        )
        conn.commit()
        log(f"  ✅ 回复已添加！留言ID={msg_id}")
    except Exception as e:
        log(f"  数据库错误: {e}")
    finally:
        conn.close()

    # 标记为已读
    mail.store(email_id, '+FLAGS', '\\Seen')
    return True


def check_replies():
    """主函数：检查 Gmail 收件箱中的回复"""
    if not SMTP_USER or not SMTP_PASS:
        log("[错误] Gmail 未配置，跳过检查")
        return

    log("开始检查邮件回复...")

    try:
        # 连接 IMAP
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(SMTP_USER, SMTP_PASS)
        mail.select('INBOX')

        # 搜索符合条件的回复邮件（未读或所有）
        search_criteria = f'(SUBJECT "{CHECK_SUBJECT_PREFIX}")'
        status, email_ids = mail.search(None, search_criteria)
        if status != 'OK':
            log("搜索邮件失败")
            mail.logout()
            return

        ids = email_ids[0].split() if email_ids[0] else []
        log(f"找到 {len(ids)} 封相关邮件")

        count = 0
        for eid in ids:
            # 获取主题
            status, data = mail.fetch(eid, '(BODY.PEEK[HEADER.FIELDS (SUBJECT)])')
            if status != 'OK':
                continue
            subject_raw = data[0][1].decode('utf-8', errors='replace')
            subject = decode_subject(subject_raw.replace('Subject: ', '').strip())

            if process_reply(mail, eid, subject):
                count += 1

        mail.logout()
        log(f"处理完毕，共处理 {count} 封回复")

    except Exception as e:
        log(f"[错误] IMAP 连接失败: {e}")


if __name__ == "__main__":
    check_replies()
