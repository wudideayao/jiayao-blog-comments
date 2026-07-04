import imaplib, sys
try:
    m = imaplib.IMAP4_SSL('imap.gmail.com', 993)
    m.login('wudideayao@gmail.com', 'lcvd vghu aoxe fyma')
    print('IMAP LOGIN OK')
    m.select('INBOX')
    print('INBOX selected')
    m.logout()
    print('DONE')
except Exception as e:
    print(f'ERROR: {e}')
    sys.exit(1)
