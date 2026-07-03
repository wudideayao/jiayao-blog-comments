# 批量创建 Giscus Discussion
# 使用方法：
#   1. 先运行 gh auth login -w -p https，在浏览器完成认证
#   2. 然后运行本脚本：.\scripts\create-discussions.ps1

$articles = @(
    @{ title = "📝 你好，世界 — hello-world"; body = "这是我的第一篇博客文章。" },
    @{ title = "🏃 跑步教会我的三件事 — running-and-life"; body = "跑步教会我的三件事。" },
    @{ title = "🎵 音乐是我生活里的背景色 — music-in-my-life"; body = "音乐是我生活的一部分。" },
    @{ title = "🎮 游戏里的另一个世界 — game-world"; body = "关于游戏的一些思考。" },
    @{ title = "🌅 日常生活中的美 — beauty-in-daily"; body = "美一直都在，只是我们太忙了。" },
    @{ title = "💭 二十多岁的一些思考 — thinking-about-life"; body = "关于生活、工作和未来的思考。" }
)

$repo = "wudideayao/jiayao-blog-comments"

foreach ($a in $articles) {
    Write-Host "正在创建: $($a.title)" -ForegroundColor Cyan
    gh api repos/$repo/discussions -f title="$($a.title)" -f body="$($a.body)" --jq '.html_url' 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ 创建成功" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 创建失败，请检查 gh 认证状态" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n🎉 全部创建完成！" -ForegroundColor Green
