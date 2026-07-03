/**
 * 王佳垚 - 个人博客主脚本
 * 包含：打字机效果、滚动动画、导航交互、表单处理
 */

;(function () {
    'use strict';

    /* ============================================
       打字机效果
       ============================================ */
    class TypeWriter {
        constructor(element, texts, speed = 80, deleteSpeed = 40, pauseTime = 2000) {
            this.element = element;
            this.texts = texts;
            this.speed = speed;
            this.deleteSpeed = deleteSpeed;
            this.pauseTime = pauseTime;
            this.textIndex = 0;
            this.charIndex = 0;
            this.isDeleting = false;
            this.type();
        }

        type() {
            const currentText = this.texts[this.textIndex];

            if (this.isDeleting) {
                this.element.textContent = currentText.substring(0, this.charIndex - 1);
                this.charIndex--;
            } else {
                this.element.textContent = currentText.substring(0, this.charIndex + 1);
                this.charIndex++;
            }

            let timeout = this.isDeleting ? this.deleteSpeed : this.speed;

            if (!this.isDeleting && this.charIndex === currentText.length) {
                timeout = this.pauseTime;
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.textIndex = (this.textIndex + 1) % this.texts.length;
                timeout = 500;
            }

            setTimeout(() => this.type(), timeout);
        }
    }

    /* ============================================
       滚动动画 (Intersection Observer)
       ============================================ */
    class ScrollAnimator {
        constructor() {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const delay = entry.target.dataset.delay || 0;
                            setTimeout(() => {
                                entry.target.classList.add('visible');
                            }, parseInt(delay));
                        }
                    });
                },
                {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px',
                }
            );

            document.querySelectorAll('.animate-on-scroll').forEach((el) => {
                this.observer.observe(el);
            });
        }
    }

    /* ============================================
       导航栏控制
       ============================================ */
    class Navigation {
        constructor() {
            this.navbar = document.getElementById('navbar');
            this.navToggle = document.getElementById('navToggle');
            this.navMenu = document.querySelector('.nav-menu');
            this.navLinks = document.querySelectorAll('.nav-link');
            this.lastScroll = 0;

            this.bindEvents();
        }

        bindEvents() {
            // 滚动时添加背景
            window.addEventListener('scroll', () => this.onScroll());

            // 移动端菜单切换
            this.navToggle.addEventListener('click', () => this.toggleMenu());

            // 点击导航链接关闭菜单
            this.navLinks.forEach((link) => {
                link.addEventListener('click', () => {
                    this.navMenu.classList.remove('active');
                    this.navToggle.classList.remove('active');
                });
            });
        }

        onScroll() {
            const currentScroll = window.scrollY;

            if (currentScroll > 50) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }

            this.lastScroll = currentScroll;
        }

        toggleMenu() {
            this.navMenu.classList.toggle('active');
            this.navToggle.classList.toggle('active');
        }
    }

    /* ============================================
       表单处理
       ============================================ */
    class ContactForm {
        constructor() {
            this.form = document.getElementById('contactForm');
            if (this.form) {
                this.form.addEventListener('submit', (e) => this.onSubmit(e));
            }
        }

        async onSubmit(e) {
            e.preventDefault();

            const name = this.form.querySelector('#name').value.trim();
            const email = this.form.querySelector('#email').value.trim();
            const message = this.form.querySelector('#message').value.trim();

            if (!name || !email || !message) {
                this.showToast('请填写所有字段 ✏️');
                return;
            }

            const btn = this.form.querySelector('.btn-submit');
            const origHTML = btn.innerHTML;
            btn.innerHTML = '<span>发送中...</span><i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            try {
                const res = await fetch(this.form.action, {
                    method: 'POST',
                    body: new FormData(this.form),
                    headers: { 'Accept': 'application/json' }
                });

                if (res.ok) {
                    this.showToast('感谢你的留言！我会尽快回复 🙌');
                    this.form.reset();
                } else {
                    const data = await res.json();
                    throw new Error(data.error || '发送失败');
                }
            } catch (err) {
                this.showToast('发送失败了，请稍后再试 😅');
                console.error('Formspree 提交失败:', err);
            } finally {
                btn.innerHTML = origHTML;
                btn.disabled = false;
            }
        }

        showToast(message) {
            // 移除已有 toast
            const existingToast = document.querySelector('.toast');
            if (existingToast) existingToast.remove();

            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            document.body.appendChild(toast);

            // 触发动画
            requestAnimationFrame(() => {
                toast.classList.add('show');
            });

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        }
    }

    /* ============================================
       平滑锚点滚动
       ============================================ */
    class SmoothScroll {
        constructor() {
            document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = anchor.getAttribute('href');
                    const target = document.querySelector(targetId);
                    if (target) {
                        const offset = 80;
                        const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth',
                        });
                    }
                });
            });
        }
    }

    /* ============================================
       音乐相片墙
       ============================================ */
    class MusicWall {
        constructor() {
            this.overlay = document.getElementById('musicWallOverlay');
            this.content = document.getElementById('musicWallContent');
            this.closeBtn = document.getElementById('musicWallClose');
            this.trigger = document.querySelector('.music-trigger');
            this.apiUrl = '/api/music/user/record?uid=12892918501&type=0';
            this.isOpen = false;
            this.cachedData = null;

            this.bindEvents();
        }

        bindEvents() {
            // 点击"听音乐"打开
            if (this.trigger) {
                this.trigger.addEventListener('click', () => this.open());
                this.trigger.style.cursor = 'pointer';
            }

            // 点击关闭按钮
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }

            // 点击背景关闭
            if (this.overlay) {
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay) this.close();
                });
            }

            // ESC 键关闭
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) this.close();
            });
        }

        open() {
            if (this.isOpen) return;
            this.isOpen = true;
            document.body.style.overflow = 'hidden';

            // 先显示再触发过渡
            this.overlay.classList.add('active');

            // 如有缓存数据直接渲染，否则重新加载
            if (this.cachedData && this.cachedData.length > 0) {
                this.render(this.cachedData);
            } else {
                this.loadData();
            }
        }

        async prefetch() {
            try {
                const response = await fetch(this.apiUrl);
                if (!response.ok) throw new Error('API 请求失败');
                const data = await response.json();
                if (data.code === 200) {
                    const records = data.allData || data.weekData || [];
                    this.cachedData = records;

                    // 预加载前 50 张封面图到浏览器缓存
                    const topList = records.slice(0, 50);
                    topList.forEach(record => {
                        const song = record.song;
                        if (song && song.al && song.al.picUrl) {
                            const img = new Image();
                            img.src = song.al.picUrl.replace('http://', 'https://') + '?param=300x300';
                        }
                    });
                }
            } catch (err) {
                // 预加载失败不打紧，用户点击时会再试
            }
        }

        close() {
            if (!this.isOpen) return;
            this.isOpen = false;
            document.body.style.overflow = '';
            this.overlay.classList.remove('active');
        }

        async loadData() {
            this.showLoading();
            try {
                const response = await fetch(this.apiUrl);
                if (!response.ok) throw new Error('API 请求失败');
                const data = await response.json();

                if (data.code !== 200) throw new Error(data.msg || '数据异常');

                const records = data.allData || data.weekData || [];
                if (records.length === 0) {
                    this.showEmpty();
                    return;
                }

                this.render(records);
            } catch (err) {
                console.error('加载音乐数据失败:', err);
                this.showError();
            }
        }

        render(records) {
            this.content.innerHTML = '';

            const grid = document.createElement('div');
            grid.className = 'music-wall-grid';
            this.content.appendChild(grid);

            // 取前 100 首听最多的
            const topList = records.slice(0, 100);

            // 先创建所有卡片，批量推入
            const items = [];
            topList.forEach((record, index) => {
                const song = record.song;
                if (!song || !song.al || !song.al.picUrl) return;

                const album = document.createElement('div');
                album.className = 'music-album';
                album.style.animationDelay = `${(index % 15) * 0.03}s`;

                // 封面图（使用懒加载）
                const imgUrl = song.al.picUrl.replace('http://', 'https://') + '?param=300x300';
                const img = lazyLoader.createImg(imgUrl, song.name || '专辑封面');

                // 悬停信息
                const info = document.createElement('div');
                info.className = 'music-album-info';

                const nameEl = document.createElement('div');
                nameEl.className = 'music-album-name';
                nameEl.textContent = song.name || '未知歌曲';

                const artistEl = document.createElement('div');
                artistEl.className = 'music-album-artist';
                artistEl.textContent = song.ar && song.ar[0] ? song.ar[0].name : '未知歌手';

                info.appendChild(nameEl);
                info.appendChild(artistEl);
                album.appendChild(img);
                album.appendChild(info);

                // 点击跳转网易云搜索
                album.addEventListener('click', () => {
                    const query = encodeURIComponent(song.name);
                    window.open(`https://music.163.com/#/search/m/?s=${query}`, '_blank');
                });

                items.push(album);
            });

            // 分批渐进插入 DOM，每帧 20 个，避免一次性渲染卡顿
            const batchSize = 20;
            let idx = 0;
            const appendBatch = () => {
                const fragment = document.createDocumentFragment();
                const end = Math.min(idx + batchSize, items.length);
                for (let i = idx; i < end; i++) {
                    fragment.appendChild(items[i]);
                }
                grid.appendChild(fragment);
                idx = end;
                if (idx < items.length) {
                    requestAnimationFrame(appendBatch);
                }
            };
            requestAnimationFrame(appendBatch);
        }

        showLoading() {
            this.content.innerHTML = `
                <div class="music-wall-loading">
                    <div class="loading-spinner"></div>
                    <span>加载音乐数据中...</span>
                </div>
            `;
        }

        showError() {
            this.content.innerHTML = `
                <div class="music-wall-error">
                    <div class="error-icon"><i class="fas fa-headphones"></i></div>
                    <p>音乐数据暂时加载失败了<br>稍后再试试吧</p>
                </div>
            `;
        }

        showEmpty() {
            this.content.innerHTML = `
                <div class="music-wall-empty">
                    <p>最近还没有听歌记录呢<br>去听点喜欢的歌吧 🎵</p>
                </div>
            `;
        }
    }

    /* ============================================
       游戏壁纸墙
       ============================================ */
    class GameWall {
        constructor() {
            this.overlay = document.getElementById('gameWallOverlay');
            this.content = document.getElementById('gameWallContent');
            this.closeBtn = document.getElementById('gameWallClose');
            this.trigger = document.querySelector('.game-trigger');
            this.isOpen = false;

            // 游戏壁纸数据
            this.games = [
                {
                    id: 'l4d2',
                    name: '求生之路 2',
                    icon: 'fa-skull',
                    subtitle: 'Left 4 Dead 2',
                    images: [
                        { url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/550/library_hero.jpg', label: '游戏主视觉', type: 'landscape' },
                        { url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/550/header.jpg', label: '游戏封面', type: 'landscape' },
                        { url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/550/library_600x900.jpg', label: '角色立绘', type: 'portrait' },
                    ]
                },
                {
                    id: 'delta',
                    name: '三角洲行动',
                    icon: 'fa-crosshairs',
                    subtitle: 'Delta Force',
                    images: [
                        { url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2507950/library_hero.jpg', label: '游戏主视觉', type: 'landscape' },
                        { url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2507950/header.jpg', label: '游戏封面', type: 'landscape' },
                        { url: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2507950/library_600x900.jpg', label: '角色立绘', type: 'portrait' },
                    ]
                },
                {
                    id: 'hok',
                    name: '王者荣耀',
                    icon: 'fa-crown',
                    subtitle: 'Honor of Kings',
                    images: [
                        { url: 'https://game.gtimg.cn/images/yxzj/img201606/skin/hero-info/131/131-bigskin-1.jpg', label: '李白 - 原画', type: 'portrait' },
                        { url: 'https://game.gtimg.cn/images/yxzj/img201606/skin/hero-info/193/193-bigskin-1.jpg', label: '铠 - 原画', type: 'portrait' },
                        { url: 'https://game.gtimg.cn/images/yxzj/img201606/skin/hero-info/141/141-bigskin-1.jpg', label: '貂蝉 - 原画', type: 'portrait' },
                        { url: 'https://game.gtimg.cn/images/yxzj/img201606/skin/hero-info/167/167-bigskin-1.jpg', label: '孙悟空 - 原画', type: 'portrait' },
                        { url: 'https://game.gtimg.cn/images/yxzj/img201606/skin/hero-info/190/190-bigskin-1.jpg', label: '诸葛亮 - 原画', type: 'portrait' },
                        { url: 'https://game.gtimg.cn/images/yxzj/img201606/skin/hero-info/106/106-bigskin-1.jpg', label: '小乔 - 原画', type: 'portrait' },
                        { url: 'https://game.gtimg.cn/images/yxzj/img201606/skin/hero-info/107/107-bigskin-1.jpg', label: '赵云 - 原画', type: 'portrait' },
                        { url: 'https://game.gtimg.cn/images/yxzj/img201606/skin/hero-info/169/169-bigskin-1.jpg', label: '后羿 - 原画', type: 'portrait' },
                        { url: 'https://game.gtimg.cn/images/yxzj/img201606/skin/hero-info/111/111-bigskin-1.jpg', label: '孙尚香 - 原画', type: 'portrait' },
                    ]
                }
            ];

            this.bindEvents();
        }

        prefetchImages() {
            this.games.forEach(game => {
                game.images.forEach(img => {
                    const preload = new Image();
                    preload.src = img.url;
                });
            });
        }

        bindEvents() {
            if (this.trigger) {
                this.trigger.addEventListener('click', () => this.open());
                this.trigger.style.cursor = 'pointer';
            }
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }
            if (this.overlay) {
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay) this.close();
                });
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) this.close();
            });
        }

        open() {
            if (this.isOpen) return;
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            this.overlay.classList.add('active');
            if (!this.rendered) {
                this.render();
                this.rendered = true;
            }
        }

        close() {
            if (!this.isOpen) return;
            this.isOpen = false;
            document.body.style.overflow = '';
            this.overlay.classList.remove('active');
        }

        render() {
            this.content.innerHTML = '';

            this.games.forEach((game, gi) => {
                const section = document.createElement('div');
                section.className = 'game-section';

                // 头部
                const header = document.createElement('div');
                header.className = 'game-section-header';

                const icon = document.createElement('div');
                icon.className = 'game-section-icon';
                icon.innerHTML = `<i class="fas ${game.icon}"></i>`;

                const title = document.createElement('h3');
                title.className = 'game-section-title';
                title.textContent = game.name;

                const subtitle = document.createElement('span');
                subtitle.className = 'game-section-subtitle';
                subtitle.textContent = game.subtitle;

                header.appendChild(icon);
                header.appendChild(title);
                header.appendChild(subtitle);

                // 图片行
                const row = document.createElement('div');
                row.className = 'game-images-row';

                game.images.forEach((img, ii) => {
                    const card = document.createElement('div');
                    card.className = `game-image-card ${img.type}`;
                    card.style.animationDelay = `${(ii * 0.08 + gi * 0.3)}s`;

                    const image = lazyLoader.createImg(img.url, img.label);

                    const info = document.createElement('div');
                    info.className = 'game-image-info';

                    const label = document.createElement('span');
                    label.className = 'game-image-label';
                    label.textContent = img.label;

                    info.appendChild(label);
                    card.appendChild(image);
                    card.appendChild(info);

                    // 点击放大查看
                    card.addEventListener('click', () => {
                        window.open(img.url, '_blank');
                    });

                    row.appendChild(card);
                });

                section.appendChild(header);
                section.appendChild(row);
                this.content.appendChild(section);
            });
        }
    }

    /* ============================================
       摄影画廊
       ============================================ */
    class BeautyWall {
        constructor() {
            this.overlay = document.getElementById('beautyWallOverlay');
            this.content = document.getElementById('beautyWallContent');
            this.closeBtn = document.getElementById('beautyWallClose');
            this.trigger = document.querySelector('.beauty-trigger');
            this.isOpen = false;
            this.rendered = false;

            this.photos = [
                // 经典风景大片 - 已验证可用的 Unsplash 图片
                { id: '1506905925346-21bda4d32df4', name: 'Dino Reichmuth', title: '雪山银河' },
                { id: '1464822759023-fed622ff2c3b', name: 'Kyler Polen', title: '雪峰巍峨' },
                { id: '1519681393784-d120267933ba', name: 'Silas Baisch', title: '星空雪山' },
                { id: '1454496522488-7a8e488e8606', name: 'Annie Spratt', title: '山间晨曦' },
                { id: '1501785888045-af8a1e1a0c3d', name: 'Luca Bravo', title: '山湖倒影' },
                { id: '1447752875215-b2761acb3c5d', name: 'Luca Bravo', title: '林间小径' },
                { id: '1433086966358-54859d0ed716', name: 'Adam Kool', title: '森林瀑布' },
                { id: '1441974231531-c6227db76b6e', name: 'Marek Piwnicki', title: '森林深处' },
                { id: '1507525428034-b723cf961d3e', name: 'Sean Oulashin', title: '海滨日落' },
                { id: '1476514525535-07fb3b4ae5f1', name: 'Christian Joudrey', title: '湖光山色' },
                { id: '1518837695492-b8e38fceb76d', name: 'Ricardo Gomez Angel', title: '海浪' },
                { id: '1504384308090-c894fdcc538d', name: 'Ryan Schroeder', title: '黄昏城市' },
                { id: '1469476497762-c4effa0f43f8', name: 'David Marcu', title: '瀑布水流' },
                { id: '1455212694391-f2213464b2de', name: 'Ilona Szabo', title: '雨后森林' },
                { id: '1504639725590-34d0984388bd', name: 'Parker Hilton', title: '星空' },
                { id: '1497366216548-37526070297c', name: 'Jorgen Hendriksen', title: '晨雾森林' },
                { id: '1510797215324-5b2e5c1c2b3d', name: 'Marek Piwnicki', title: '迷雾山林' },
                { id: '1503794519827-1e64c3c72355', name: 'Manuel Torres', title: '沙漠' },
                { id: '1518099077520-94d0bdc5d36b', name: 'Drew Graham', title: '秋叶之路' },
                { id: '1457282361193-76b2e2a44c1a', name: 'Xiaolong Wong', title: '茶园晨曦' },
            ];

            this.bindEvents();
        }

        prefetchImages() {
            this.photos.forEach(photo => {
                const img = new Image();
                img.src = `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=800&q=80`;
            });
        }

        bindEvents() {
            if (this.trigger) {
                this.trigger.addEventListener('click', () => this.open());
                this.trigger.style.cursor = 'pointer';
            }
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }
            if (this.overlay) {
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay) this.close();
                });
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) this.close();
            });
        }

        open() {
            if (this.isOpen) return;
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            this.overlay.classList.add('active');
            if (!this.rendered) {
                this.render();
                this.rendered = true;
            }
        }

        close() {
            if (!this.isOpen) return;
            this.isOpen = false;
            document.body.style.overflow = '';
            this.overlay.classList.remove('active');
        }

        render() {
            this.content.innerHTML = '';

            const grid = document.createElement('div');
            grid.className = 'beauty-grid';

            this.photos.forEach((photo, index) => {
                const card = document.createElement('div');
                card.className = 'beauty-card';
                card.style.animationDelay = `${(index % 12) * 0.05}s`;

                const imgUrl = `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&w=800&q=80`;
                const img = lazyLoader.createImg(imgUrl, photo.title);

                const info = document.createElement('div');
                info.className = 'beauty-card-info';

                const photographer = document.createElement('div');
                photographer.className = 'beauty-photographer';
                photographer.innerHTML = `<i class="fas fa-camera"></i>${photo.name}`;

                const title = document.createElement('div');
                title.className = 'beauty-title';
                title.textContent = photo.title;

                info.appendChild(photographer);
                info.appendChild(title);
                card.appendChild(img);
                card.appendChild(info);

                card.addEventListener('click', () => {
                    window.open(`https://unsplash.com/photos/${photo.id}`, '_blank');
                });

                grid.appendChild(card);
            });

            this.content.appendChild(grid);
        }
    }

    /* ============================================
       跑步装备
       ============================================ */
    class RunGear {
        constructor() {
            this.overlay = document.getElementById('runGearOverlay');
            this.content = document.getElementById('runGearContent');
            this.closeBtn = document.getElementById('runGearClose');
            this.trigger = document.querySelector('.run-trigger');
            this.isOpen = false;
            this.rendered = false;

            this.watches = [
                {
                    id: 'apple-s8',
                    brand: 'Apple',
                    name: 'Watch Series 8',
                    stripeClass: 'apple',
                    image: 'images/apple-s8.png',
                    specs: ['45mm 表盘', 'S8 芯片', '血氧监测', 'ECG 心电图', '车祸检测', '18h 续航'],
                    link: 'https://www.apple.com/apple-watch-series-8/',
                },
                {
                    id: 'huawei-gt5',
                    brand: 'HUAWEI',
                    name: 'WATCH GT 5',
                    stripeClass: 'huawei',
                    image: 'images/huawei-gt5.png',
                    specs: ['46mm 表盘', '玄玑感知系统', '14 天续航', 'GNSS 定位', '高尔夫模式', '5ATM 防水'],
                    link: 'https://consumer.huawei.com/cn/wearables/watch-gt5/',
                },
                {
                    id: 'vivo-gt2',
                    brand: 'vivo',
                    name: 'WATCH GT 2',
                    stripeClass: 'vivo',
                    image: 'images/vivo-gt2.png',
                    specs: ['1.43" AMOLED', '2400nits 亮度', '25 天续航', '心率监测', '血氧检测', '100+ 运动模式'],
                    link: 'https://www.vivo.com.cn/vivo/vivowatchgt2/',
                    badge: '现在使用',
                },
            ];

            this.bindEvents();
        }

        prefetchImages() {
            this.watches.forEach(w => {
                const img = new Image();
                img.src = w.image;
            });
        }

        bindEvents() {
            if (this.trigger) {
                this.trigger.addEventListener('click', () => this.open());
                this.trigger.style.cursor = 'pointer';
            }
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.close());
            }
            if (this.overlay) {
                this.overlay.addEventListener('click', (e) => {
                    if (e.target === this.overlay) this.close();
                });
            }
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) this.close();
            });
        }

        open() {
            if (this.isOpen) return;
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            this.overlay.classList.add('active');
            if (!this.rendered) {
                this.render();
                this.rendered = true;
            }
        }

        close() {
            if (!this.isOpen) return;
            this.isOpen = false;
            document.body.style.overflow = '';
            this.overlay.classList.remove('active');
        }

        render() {
            this.content.innerHTML = '';

            const grid = document.createElement('div');
            grid.className = 'run-gear-grid';

            this.watches.forEach((w) => {
                const card = document.createElement('div');
                card.className = 'run-watch-card';

                // 品牌色条
                const stripe = document.createElement('div');
                stripe.className = `run-watch-stripe ${w.stripeClass}`;

                // 产品图片区
                const visual = document.createElement('div');
                visual.className = 'run-watch-visual';

                const img = lazyLoader.createImg(w.image, `${w.brand} ${w.name}`, 'run-watch-img');
                visual.appendChild(img);

                // 徽章（现在使用等）
                if (w.badge) {
                    const badge = document.createElement('div');
                    badge.className = 'run-watch-badge';
                    badge.textContent = w.badge;
                    card.appendChild(badge);
                }

                // 信息区
                const info = document.createElement('div');
                info.className = 'run-watch-info';

                const brand = document.createElement('div');
                brand.className = 'run-watch-brand';
                brand.textContent = w.brand;

                const name = document.createElement('div');
                name.className = 'run-watch-name';
                name.textContent = w.name;

                // 规格
                const specs = document.createElement('div');
                specs.className = 'run-watch-specs';

                w.specs.forEach(s => {
                    const spec = document.createElement('span');
                    spec.className = 'run-watch-spec';
                    spec.innerHTML = `<i class="fas fa-circle"></i>${s}`;
                    specs.appendChild(spec);
                });

                // 链接
                const link = document.createElement('a');
                link.className = 'run-watch-link';
                link.href = w.link;
                link.target = '_blank';
                link.rel = 'noopener';
                link.innerHTML = '查看详情 <i class="fas fa-arrow-right"></i>';

                info.appendChild(brand);
                info.appendChild(name);
                info.appendChild(specs);
                info.appendChild(link);

                card.appendChild(stripe);
                card.appendChild(visual);
                card.appendChild(info);

                grid.appendChild(card);
            });

            this.content.appendChild(grid);
        }
    }

    /* ============================================
       主题切换（日/夜模式）
       ============================================ */
    class ThemeManager {
        constructor() {
            this.btn = document.getElementById('themeToggle');
            this.theme = localStorage.getItem('blog-theme') || this.getPreferredTheme();
            this.applyTheme(this.theme);
            this.bindEvents();
        }

        getPreferredTheme() {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('blog-theme', theme);
            this.theme = theme;
        }

        toggle() {
            const newTheme = this.theme === 'dark' ? 'light' : 'dark';
            // 添加短暂过渡类
            document.documentElement.classList.add('theme-transitioning');
            this.applyTheme(newTheme);
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transitioning');
            }, 300);
        }

        bindEvents() {
            if (this.btn) {
                this.btn.addEventListener('click', () => this.toggle());
            }
            // 监听系统主题变化
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('blog-theme')) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    /* ============================================
       图片懒加载 (IntersectionObserver)
       ============================================ */
    class LazyLoader {
        constructor() {
            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            const src = img.dataset.src;
                            if (src) {
                                img.src = src;
                                img.removeAttribute('data-src');
                            }
                            img.classList.add('lazy-loaded');
                            this.observer.unobserve(img);
                        }
                    });
                },
                {
                    rootMargin: '200px 0px',
                    threshold: 0.01,
                }
            );
        }

        observe(img) {
            this.observer.observe(img);
        }

        // 创建懒加载图片元素
        createImg(src, alt = '', className = '') {
            const img = document.createElement('img');
            img.dataset.src = src;
            img.alt = alt;
            if (className) img.className = className;
            // 使用低质量占位
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
            img.classList.add('lazy-img');
            // 加载失败时显示错误状态
            img.addEventListener('error', () => {
                img.classList.add('error');
                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext x="100" y="105" text-anchor="middle" fill="%23666" font-size="14"%3E加载失败%3C/text%3E%3C/svg%3E';
            }, { once: true });
            this.observe(img);
            return img;
        }
    }

    // 全局懒加载实例
    const lazyLoader = new LazyLoader();

    /* ============================================
       回到顶部按钮
       ============================================ */
    class BackToTop {
        constructor() {
            this.btn = document.getElementById('backToTop');
            if (!this.btn) return;
            this.ticking = false;

            window.addEventListener('scroll', () => {
                if (!this.ticking) {
                    requestAnimationFrame(() => {
                        if (window.scrollY > 500) {
                            this.btn.classList.add('visible');
                        } else {
                            this.btn.classList.remove('visible');
                        }
                        this.ticking = false;
                    });
                    this.ticking = true;
                }
            }, { passive: true });

            this.btn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    /* ============================================
       视差效果（轻柔版）
       ============================================ */
    class ParallaxEffect {
        constructor() {
            this.heroContent = document.querySelector('.hero-content');
            this.scrollTick = null;
            window.addEventListener('scroll', () => {
                if (!this.scrollTick) {
                    this.scrollTick = requestAnimationFrame(() => {
                        this.onScroll();
                        this.scrollTick = null;
                    });
                }
            }, { passive: true });
        }

        onScroll() {
            const scrollY = window.scrollY;
            const heroHeight = window.innerHeight;

            if (scrollY < heroHeight) {
                const opacity = 1 - scrollY / heroHeight;
                const translate = scrollY * 0.2;
                if (this.heroContent) {
                    this.heroContent.style.transform = `translateY(${translate}px)`;
                    this.heroContent.style.opacity = opacity;
                }
            }
        }
    }

    /* ============================================
       初始化
       ============================================ */
    let _musicWall, _gameWall, _beautyWall, _runGear;

    function init() {
        // 打字机效果
        const typingElement = document.getElementById('typingText');
        if (typingElement) {
            new TypeWriter(typingElement, [
                '热爱音乐，热爱跑步',
                '在代码与生活间寻找平衡',
                '欣赏世间一切美好的事物',
                '用心感受每一刻',
            ]);
        }

        // 滚动动画
        new ScrollAnimator();

        // 导航
        new Navigation();

        // 表单
        new ContactForm();

        // 平滑滚动
        new SmoothScroll();

        // 视差效果
        new ParallaxEffect();

        // 主题切换
        new ThemeManager();

        // 回到顶部
        new BackToTop();

        // 音乐相片墙
        _musicWall = new MusicWall();

        // 游戏壁纸墙
        _gameWall = new GameWall();

        // 摄影画廊
        _beautyWall = new BeautyWall();

        // 跑步装备
        _runGear = new RunGear();

        // 页面完全加载后后台预加载画廊资源
        if (document.readyState === 'complete') {
            startPreload();
        } else {
            window.addEventListener('load', startPreload);
        }
    }

    function startPreload() {
        if (_musicWall) _musicWall.prefetch();
        if (_gameWall) _gameWall.prefetchImages();
        if (_beautyWall) _beautyWall.prefetchImages();
        if (_runGear) _runGear.prefetchImages();

        // 注册 Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // SW 注册失败不影响主功能
            });
        }
    }

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
