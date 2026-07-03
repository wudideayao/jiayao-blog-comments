#!/bin/bash
cd /var/www/jiayao-space/images/scenery
for f in *.jpg; do
  s=$(stat -c%s "$f" 2>/dev/null)
  if [ -z "$s" ]; then s=$(wc -c < "$f" 2>/dev/null); fi
  if [ "$s" -gt 5000 ]; then
    echo "✅ $f ($((s/1024))KB)"
  else
    rm -f "$f"
    echo "❌ deleted $f (invalid)"
  fi
done
echo "=== remaining ==="
ls | wc -l
