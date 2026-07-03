#!/bin/bash
# 下载风景图到服务器本地
mkdir -p /var/www/jiayao-space/images/scenery
cd /var/www/jiayao-space/images/scenery

IDS=(
  "1506905925346-21bda4d32df4"
  "1464822759023-fed622ff2c3b"
  "1519681393784-d120267933ba"
  "1454496522488-7a8e488e8606"
  "1501785888045-af8a1e1a0c3d"
  "1447752875215-b2761acb3c5d"
  "1433086966358-54859d0ed716"
  "1441974231531-c6227db76b6e"
  "1507525428034-b723cf961d3e"
  "1476514525535-07fb3b4ae5f1"
  "1518837695492-b8e38fceb76d"
  "1504384308090-c894fdcc538d"
  "1469476497762-c4effa0f43f8"
  "1455212694391-f2213464b2de"
  "1504639725590-34d0984388bd"
  "1497366216548-37526070297c"
  "1510797215324-5b2e5c1c2b3d"
  "1503794519827-1e64c3c72355"
  "1518099077520-94d0bdc5d36b"
  "1457282361193-76b2e2a44c1a"
)

for id in "${IDS[@]}"; do
  echo -n "Downloading $id ... "
  code=$(curl -sL -o "${id}.jpg" -w "%{http_code}" "https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80")
  echo "$code"
done

echo "=== Done ==="
ls -la | wc -l
