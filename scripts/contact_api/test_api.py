"""Quick test for contact API"""
import urllib.request, json

# Test health
r = urllib.request.urlopen("http://127.0.0.1:5001/api/health")
print("Health:", r.status, r.read().decode())

# Test POST
data = json.dumps({"name": "测试", "email": "test@test.com", "message": "这是一条测试留言"}).encode()
req = urllib.request.Request(
    "http://127.0.0.1:5001/api/message",
    data=data,
    headers={"Content-Type": "application/json"}
)
try:
    r = urllib.request.urlopen(req)
    print("POST:", r.status, r.read().decode())
except urllib.error.HTTPError as e:
    print("POST Error:", e.code, e.read().decode())

# Test GET messages
r = urllib.request.urlopen("http://127.0.0.1:5001/api/messages")
print("GET messages:", r.status, r.read().decode())
