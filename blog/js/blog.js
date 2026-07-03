/**
 * 博客页面脚本
 * 包含：文章列表渲染、分类筛选、详情页展示、主题切换
 */

;(function () {
    'use strict';

    // 判断当前是否为详情页
    const isDetailPage = window.location.pathname.includes('/article/') || 
                         window.location.search.includes('article=');

    /* ============================================
       主题切换
       ============================================ */
    class BlogTheme {
        constructor() {
            this.btn = document.getElementById('blogThemeToggle');
            this.theme = localStorage.getItem('blog-theme') || 
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            this.apply(this.theme);
            if (this.btn) {
                this.btn.addEventListener('click', () => this.toggle());
            }
        }

        apply(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('blog-theme', theme);
        }

        toggle() {
            const next = this.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.classList.add('theme-transitioning');
            this.apply(next);
            setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 300);
        }
    }

    /* ============================================
       文章数据加载
       ============================================ */
    async function loadArticles() {
        try {
            const res = await fetch('/blog/data/articles.json');
            if (!res.ok) throw new Error('加载失败');
            return await res.json();
        } catch (err) {
            console.error('文章加载失败:', err);
            return [];
        }
    }

    /* ============================================
       文章列表页
       ============================================ */
    class BlogList {
        constructor() {
            this.container = document.getElementById('articlesContainer');
            this.filters = document.getElementById('blogFilters');
            this.searchInput = document.getElementById('searchInput');
            this.allArticles = [];
            this.activeFilter = '全部';
            this.searchQuery = '';
            this.init();
        }

        async init() {
            this.allArticles = await loadArticles();
            this.renderFilters();
            this.render(this.getFiltered());
            this.bindSearch();
        }

        bindSearch() {
            if (!this.searchInput) return;
            this.searchInput.addEventListener('input', () => {
                this.searchQuery = this.searchInput.value.trim().toLowerCase();
                this.render(this.getFiltered());
            });
        }

        getFiltered() {
            let articles = this.allArticles;
            if (this.activeFilter !== '全部') {
                articles = articles.filter(a => a.category === this.activeFilter);
            }
            if (this.searchQuery) {
                articles = articles.filter(a =>
                    a.title.toLowerCase().includes(this.searchQuery) ||
                    a.summary.toLowerCase().includes(this.searchQuery) ||
                    a.tags.some(t => t.toLowerCase().includes(this.searchQuery))
                );
            }
            return articles;
        }

        renderFilters() {
            const categories = ['全部', ...new Set(this.allArticles.map(a => a.category))];
            this.filters.innerHTML = categories.map(cat => 
                `<button class="filter-btn${cat === this.activeFilter ? ' active' : ''}" data-filter="${cat}">${cat}</button>`
            ).join('');

            this.filters.addEventListener('click', (e) => {
                const btn = e.target.closest('.filter-btn');
                if (!btn) return;
                this.activeFilter = btn.dataset.filter;
                this.filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.render(this.getFiltered());
            });
        }

        render(articles) {
            if (articles.length === 0) {
                this.container.innerHTML = `
                    <div class="no-articles">
                        <i class="fas fa-inbox"></i>
                        <p>暂无文章</p>
                    </div>`;
                return;
            }

            this.container.innerHTML = articles.map(a => `
                <a href="/blog/?article=${a.id}" class="article-card">
                    <div class="article-meta">
                        <span class="article-date">${a.date}</span>
                        <span class="article-category">${a.category}</span>
                    </div>
                    <h2 class="article-title">${a.title}</h2>
                    <p class="article-summary">${a.summary}</p>
                    <div class="article-tags">
                        ${a.tags.map(t => `<span class="article-tag">#${t}</span>`).join('')}
                    </div>
                </a>
            `).join('');
        }
    }

    /* ============================================
       文章详情页
       ============================================ */
    class ArticleDetail {
        constructor() {
            // 从 URL 获取文章 ID
            const params = new URLSearchParams(window.location.search);
            this.articleId = params.get('article');
            if (!this.articleId) return;
            this.container = document.getElementById('articleDetail');
            this.init();
        }

        async init() {
            const articles = await loadArticles();
            const article = articles.find(a => a.id === this.articleId);

            if (!article) {
                this.container.innerHTML = `
                    <div class="no-articles" style="padding: 6rem 0;">
                        <i class="fas fa-search"></i>
                        <p>文章未找到</p>
                        <a href="/blog/" style="color: var(--color-accent-1); font-size: 0.875rem;">返回文章列表</a>
                    </div>`;
                return;
            }

            // 更新页面标题
            document.title = `${article.title} — 王佳垚的博客`;

            this.render(article);
        }

        render(article) {
            this.container.innerHTML = `
                <a href="/blog/" class="article-detail-back">
                    <i class="fas fa-arrow-left"></i> 返回文章列表
                </a>
                <div class="article-detail-inner">
                    <div class="article-detail-header">
                        <h1 class="article-detail-title">${article.title}</h1>
                        <div class="article-detail-meta">
                            <span>${article.date}</span>
                            <span>·</span>
                            <span>${article.category}</span>
                            <span>·</span>
                            <span>${article.tags.map(t => `#${t}`).join(' ')}</span>
                        </div>
                    </div>
                    <div class="article-detail-body">
                        ${this.renderMarkdown(article.content)}
                    </div>
                    <div class="article-detail-footer">
                        王佳垚 — ${article.date}
                    </div>
                </div>
            `;

            // 显示 Giscus 评论
            this.loadComments(article);
        }

        loadComments(article) {
            const section = document.getElementById('commentsSection');
            if (!section) return;
            section.style.display = '';

            // 如果 Giscus 已加载，更新配置
            const giscus = document.querySelector('.giscus');
            if (!giscus) return;

            // 清除旧评论
            giscus.innerHTML = '';

            // 使用 Giscus 的 data-term 传递文章 ID
            const script = document.createElement('script');
            script.src = 'https://giscus.app/client.js';
            script.setAttribute('data-repo', 'wudideayao/jiayao-blog-comments');
            script.setAttribute('data-repo-id', 'R_kgDOS6bpuA');
            script.setAttribute('data-category', 'Announcements');
            script.setAttribute('data-category-id', 'DIC_kwDOS6bpuM4C_I5q');
            script.setAttribute('data-mapping', 'specific');
            script.setAttribute('data-term', article.id);
            script.setAttribute('data-strict', '0');
            script.setAttribute('data-reactions-enabled', '1');
            script.setAttribute('data-emit-metadata', '0');
            script.setAttribute('data-input-position', 'top');
            script.setAttribute('data-theme', 'preferred_color_scheme');
            script.setAttribute('data-lang', 'zh-CN');
            script.setAttribute('data-loading', 'lazy');
            script.crossOrigin = 'anonymous';
            script.async = true;
            giscus.appendChild(script);
        }

        renderMarkdown(md) {
            // 简易 Markdown 渲染
            let html = md
                // 标题
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                // 引用
                .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
                // 无序列表
                .replace(/^- (.+)$/gm, '<li>$1</li>')
                // 有序列表
                .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
                // 分割线
                /^---$/gm.test(md) && (html = html.replace(/^---$/gm, '<hr>'))
                // 加粗
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                // 斜体
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                // 行内代码
                .replace(/`(.+?)`/g, '<code>$1</code>')
                // 段落
                .replace(/\n\n/g, '</p><p>')
                .replace(/^(?!<[hblipc]|<blockquote|<hr)/gm, '<p>')
                .replace(/^<p><p>/gm, '<p>');

            // 将连续的 <li> 包裹到 <ul> 中
            html = html.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>');

            // 合并连续的 <blockquote>
            html = html.replace(/(<blockquote>.*?<\/blockquote>\n?)+/g, (match) => {
                const content = match.replace(/<\/blockquote>\n?<blockquote>/g, '\n');
                return content;
            });

            return `<p>${html}</p>`;
        }
    }

    /* ============================================
       导航栏滚动效果
       ============================================ */
    class BlogNav {
        constructor() {
            this.nav = document.querySelector('.blog-nav');
            if (!this.nav) return;
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    this.nav.classList.add('scrolled');
                } else {
                    this.nav.classList.remove('scrolled');
                }
            }, { passive: true });
        }
    }

    /* ============================================
       初始化
       ============================================ */
    function init() {
        new BlogTheme();
        new BlogNav();

        if (isDetailPage) {
            new ArticleDetail();
        } else {
            new BlogList();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
