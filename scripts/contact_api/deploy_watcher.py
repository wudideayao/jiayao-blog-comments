import os
import stat

# reply_watcher.py content
content = r'''"""
Gmail IMAP 回复监听器
"""
import re, sqlite3, imaplib
import email as email_lib
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "messages.db"
ENV_PATH = BASE_DIR / ".env"
IMAP_SERVER = "imap.gmail.com"
IMAP_PORT = 993
CHECK_SUBJECT = "Re: \U0001f4ac 博客新留言"

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def load_env():
    cfg = {}
    if not ENV_PATH.exists():
        return cfg
    for line in ENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        cfg[k.strip()] = v.strip().strip("\"'")
    return cfg

def extract_msg_id(text):
    m = re.search(r"\u7559\u8a00ID[\uff1a:]\s*(\d+)", text)
    return int(m.group(1)) if m else None

def get_text(msg):
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            if ct == "text/plain":
                try:
                    return part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace")
                except:
                    continue
            elif ct == "text/html":
                try:
                    t = part.get_payload(decode=True).decode(part.get_content_charset() or "utf-8", errors="replace")
                    return re.sub(r"<[^>]+>", "", t).strip()
                except:
                    continue
    else:
        try:
            return msg.get_payload(decode=True).decode(msg.get_content_charset() or "utf-8", errors="replace")
        except:
            return ""
    return ""

def strip_quote(text):
    lines = text.split("\n")
    result = []
    for line in lines:
        s = line.strip()
        if s.startswith(">"):
            continue
        if any(x in s for x in ["---\u539f\u59cb\u90ae\u4ef6---", "--- Original ---"]):
            break
        if s == "---":
            break
        if any(s.startswith(p) for p in ["\u53d1\u4ef6\u4eba:", "From:", "\u53d1\u9001:", "Sent:", "\u6536\u4ef6\u4eba:", "To:", "Cc:", "\u4e3b\u9898:", "Subject:"]):
            continue
        if "\u7559\u8a00ID" in s and ":" in s and len(s) < 30:
            continue
        result.append(line)
    return "\n".join(result).strip()

def process_reply(mail, eid, subject, user):
    st, data = mail.fetch(eid, "(RFC822)")
    if st != "OK":
        return False
    msg = email_lib.message_from_bytes(data[0][1])
    body = get_text(msg)
    if not body:
        return False
    mid = extract_msg_id(body)
    if not mid:
        return False
    reply = strip_quote(body)
    if not reply:
        return False
    log(f"  matched msg_id={mid}: {reply[:40]}...")
    conn = sqlite3.connect(str(DB_PATH))
    try:
        exist = conn.execute("SELECT id FROM messages WHERE parent_id=? AND is_admin=1", (mid,)).fetchone()
        if exist:
            conn.close()
            mail.store(eid, "+FLAGS", "\\Seen")
            return True
        conn.execute("INSERT INTO messages (name,email,content,parent_id,is_admin,status,is_public) VALUES (?,?,?,?,1,'approved',1)",
                     ("\u738b\u4f73\u5c3a", user, reply, mid))
        conn.commit()
        log(f"  reply added for msg_id={mid}")
    except Exception as e:
        log(f"DB error: {e}")
    finally:
        conn.close()
    mail.store(eid, "+FLAGS", "\\Seen")
    return True

def check_replies():
    cfg = load_env()
    user = cfg.get("GMAIL_USER", "")
    pwd = cfg.get("GMAIL_APP_PASSWORD", "")
    if not user or not pwd:
        log("Gmail not configured")
        return
    log("Checking replies...")
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(user, pwd)
        mail.select("INBOX")
        st, ids = mail.search(None, f'(SUBJECT "{CHECK_SUBJECT}")')
        if st != "OK":
            mail.logout()
            return
        id_list = ids[0].split() if ids[0] else []
        log(f"Found {len(id_list)} matching emails")
        cnt = 0
        for eid in id_list:
            st2, hdr = mail.fetch(eid, "(BODY.PEEK[HEADER.FIELDS (SUBJECT)])")
            if st2 != "OK":
                continue
            subj = hdr[0][1].decode("utf-8", errors="replace").replace("Subject: ", "").strip()
            if process_reply(mail, eid, subj, user):
                cnt += 1
        mail.logout()
        log(f"Done, processed {cnt} replies")
    except Exception as e:
        log(f"IMAP error: {e}")

if __name__ == "__main__":
    check_replies()
'''

# check_replies.sh content
script = """#!/bin/bash
cd /var/www/jiayao-blog/api
python3 reply_watcher.py >> /var/log/jiayao-reply-watcher.log 2>&1
"""

# Write files
api_dir = "/var/www/jiayao-blog/api"
os.makedirs(api_dir, exist_ok=True)

with open(os.path.join(api_dir, "reply_watcher.py"), "w", encoding="utf-8") as f:
    f.write(content)

with open(os.path.join(api_dir, "check_replies.sh"), "w", encoding="utf-8") as f:
    f.write(script)
os.chmod(os.path.join(api_dir, "check_replies.sh"), stat.S_IRWXU | stat.S_IRGRP | stat.S_IXGRP | stat.S_IROTH | stat.S_IXOTH)

print("Files written successfully")
print("Script permissions:", oct(os.stat(os.path.join(api_dir, "check_replies.sh")).st_mode))
