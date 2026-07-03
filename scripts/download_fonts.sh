#!/bin/bash
cd /var/www/jiayao-space/css/webfonts
for f in fa-solid-900 fa-regular-400 fa-brands-400; do
  echo -n "Downloading $f ... "
  code=$(curl -sL -o "$f.woff2" -w "%{http_code}" "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/$f.woff2")
  echo "$code"
done
ls -la
