/**
 * 博客页面 - 精简版
 */
(function() {
  // 检查是否要显示文章详情
  var params = new URLSearchParams(window.location.search);
  var articleId = params.get('article');

  if (articleId) {
    showArticle(articleId);
  } else {
    showList();
  }

  function showList() {
    var articles = window.__BLOG_ARTICLES__ || [];
    var container = document.getElementById('articlesContainer');
    var filtersEl = document.getElementById('blogFilters');

    if (!container) return;

    // 生成分类筛选
    var categories = ['全部'];
    articles.forEach(function(a) {
      if (categories.indexOf(a.category) === -1) categories.push(a.category);
    });

    var activeCat = '全部';

    function renderList() {
      var filtered = articles.filter(function(a) {
        return activeCat === '全部' || a.category === activeCat;
      });
      if (filtered.length === 0) {
        container.innerHTML = '<div class="no-articles" style="text-align:center;padding:4rem 0;color:#999"><i class="fas fa-inbox" style="font-size:2.5rem;margin-bottom:1rem;opacity:0.5"></i><p>暂无文章</p></div>';
        return;
      }
      container.innerHTML = filtered.map(function(a) {
        var tags = (a.tags || []).map(function(t) {
          return '<span class="article-tag" style="font-size:0.6875rem;color:#999;padding:0.15rem 0.5rem;border:1px solid var(--color-border,#e5e5e5);border-radius:999px">#' + t + '</span>';
        }).join('');
        return '<a href="/blog/?article=' + a.id + '" class="article-card" style="display:block;padding:var(--space-xl,2rem) var(--space-2xl,3rem);background:var(--color-bg-card,#fff);border:1px solid var(--color-border,#e5e5e5);border-radius:var(--radius-md,12px);text-decoration:none;color:inherit;transition:all 0.3s;cursor:pointer;position:relative;overflow:hidden;margin-bottom:1rem">' +
          '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.75rem;font-size:0.75rem">' +
          '<span style="color:#999">' + a.date + '</span>' +
          '<span style="padding:0.15rem 0.6rem;background:var(--color-bg-tertiary,#f5f5f7);border-radius:999px;color:var(--color-accent-1,#2563eb);font-weight:500;font-size:0.6875rem">' + a.category + '</span></div>' +
          '<h2 style="font-family:var(--font-display,\'Space Grotesk\');font-size:1.25rem;font-weight:600;margin:0 0 0.5rem;line-height:1.4;color:var(--color-text-primary,#1d1d1f)">' + a.title + '</h2>' +
          '<p style="font-size:0.9375rem;color:var(--color-text-secondary,#6e6e73);line-height:1.7;margin:0">' + a.summary + '</p>' +
          '<div style="display:flex;gap:0.4rem;margin-top:0.75rem;flex-wrap:wrap">' + tags + '</div></a>';
      }).join('');
    }

    // 筛选按钮
    if (filtersEl) {
      filtersEl.innerHTML = categories.map(function(c) {
        return '<button class="filter-btn" data-cat="' + c + '" style="padding:0.4rem 1rem;font-size:0.8125rem;font-weight:500;border:1px solid var(--color-border,#e5e5e5);border-radius:999px;background:transparent;color:var(--color-text-secondary,#6e6e73);cursor:pointer;transition:all 0.3s;font-family:inherit;' + (c === activeCat ? 'background:#1d1d1f;color:#fff;border-color:#1d1d1f' : '') + '">' + c + '</button>';
      }).join('');
      filtersEl.addEventListener('click', function(e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;
        activeCat = btn.getAttribute('data-cat');
        filtersEl.querySelectorAll('.filter-btn').forEach(function(b) {
          b.style.background = 'transparent';
          b.style.color = '';
          b.style.borderColor = '';
        });
        btn.style.background = '#1d1d1f';
        btn.style.color = '#fff';
        btn.style.borderColor = '#1d1d1f';
        renderList();
      });
    }

    renderList();
  }

  function showArticle(id) {
    var articles = window.__BLOG_ARTICLES__ || [];
    var article = null;
    for (var i = 0; i < articles.length; i++) {
      if (articles[i].id === id) { article = articles[i]; break; }
    }

    var container = document.getElementById('articleDetail');
    var listSection = document.getElementById('blogMain');
    var commentsSection = document.getElementById('commentsSection');

    if (listSection) listSection.style.display = 'none';
    if (container) container.style.display = '';
    if (commentsSection) commentsSection.style.display = '';

    if (!article) {
      if (container) {
        container.innerHTML = '<div style="text-align:center;padding:4rem 0;color:#999"><p>文章未找到</p><a href="/blog/" style="color:#2563eb;font-size:0.875rem">返回文章列表</a></div>';
      }
      return;
    }

    document.title = article.title + ' — 王佳垚的博客';

    // 简易 MD 渲染
    var bodyHtml = article.content
      .replace(/^### (.+)$/gm, '<h3 style="font-family:var(--font-display);font-size:1.2rem;font-weight:600;margin:2rem 0 0.75rem">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="font-family:var(--font-display);font-size:1.5rem;font-weight:600;margin:2.5rem 0 1rem;padding-bottom:0.5rem;border-bottom:2px solid var(--color-border,#e5e5e5)">$1</h2>')
      .replace(/^> (.+)$/gm, '<blockquote style="margin:1.5rem 0;padding:1.25rem 1.5rem;border-left:3px solid var(--color-accent-1,#2563eb);background:var(--color-bg-tertiary,#f5f5f7);border-radius:0 8px 8px 0;color:var(--color-text-secondary,#6e6e73);font-style:italic"><p style="margin:0;text-indent:0">$1</p></blockquote>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code style="font-size:0.875rem;background:var(--color-bg-tertiary,#f5f5f7);padding:0.15rem 0.4rem;border-radius:4px">$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p style="margin:0 0 1.25rem;text-indent:2em">')
      .replace(/---/g, '<hr style="margin:2.5rem 0;border:none;border-top:2px dashed var(--color-border,#e5e5e5)">');
    bodyHtml = '<p style="margin:0 0 1.25rem;text-indent:2em">' + bodyHtml + '</p>';
    bodyHtml = bodyHtml.replace(/<p[^>]*><\/p>/g, '');

    if (container) {
      container.innerHTML =
        '<a href="/blog/" style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.875rem;color:var(--color-text-secondary,#6e6e73);text-decoration:none;margin-bottom:1.5rem" href="/blog/"><i class="fas fa-arrow-left"></i> 返回文章列表</a>' +
        '<div class="article-detail-inner" style="background:var(--color-bg-card,#fff);border:1px solid var(--color-border,#e5e5e5);border-radius:20px;padding:var(--space-3xl,4rem);box-shadow:0 10px 25px rgba(0,0,0,0.06);position:relative">' +
        '<div style="margin-bottom:var(--space-2xl,3rem);padding-bottom:var(--space-xl,2rem);border-bottom:1px solid var(--color-border,#e5e5e5)">' +
        '<h1 style="font-family:var(--font-display,\'Space Grotesk\');font-size:clamp(1.8rem,4vw,2.8rem);font-weight:700;line-height:1.3;margin:0 0 1rem;letter-spacing:-0.02em">' + article.title + '</h1>' +
        '<div style="display:flex;align-items:center;gap:1rem;font-size:0.875rem;color:var(--color-text-secondary,#6e6e73);flex-wrap:wrap">' +
        '<span>' + article.date + '</span><span>·</span><span>' + article.category + '</span></div></div>' +
        '<div class="article-detail-body" style="font-size:1.0625rem;line-height:2;color:var(--color-text-primary,#1d1d1f)">' + bodyHtml + '</div>' +
        '<div style="margin-top:var(--space-2xl,3rem);padding-top:var(--space-xl,2rem);border-top:1px solid var(--color-border,#e5e5e5);text-align:right;font-family:var(--font-display);font-size:0.875rem;color:#999">王佳垚 — ' + article.date + '</div></div>';
    }

    // 尝试加载 Giscus
    var giscus = document.querySelector('.giscus');
    if (giscus) {
      var s = document.createElement('script');
      s.src = 'https://giscus.app/client.js';
      s.setAttribute('data-repo', 'wudideayao/jiayao-blog-comments');
      s.setAttribute('data-repo-id', 'R_kgDOS6bpuA');
      s.setAttribute('data-category', 'Announcements');
      s.setAttribute('data-category-id', 'DIC_kwDOS6bpuM4C_I5q');
      s.setAttribute('data-mapping', 'specific');
      s.setAttribute('data-term', article.id);
      s.setAttribute('data-strict', '0');
      s.setAttribute('data-reactions-enabled', '1');
      s.setAttribute('data-input-position', 'top');
      s.setAttribute('data-theme', 'preferred_color_scheme');
      s.setAttribute('data-lang', 'zh-CN');
      s.setAttribute('data-loading', 'lazy');
      s.crossOrigin = 'anonymous';
      s.async = true;
      giscus.appendChild(s);
    }
  }
})();
