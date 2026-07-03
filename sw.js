/**
 * 王佳垚博客 - Service Worker
 * 提供基本的离线缓存支持
 */

const CACHE_NAME = 'blog-v1';
const PRECACHE_URLS = [
    '/',
    '/blog/',
    '/css/style.css',
    '/blog/css/blog.css',
    '/js/main.js',
    '/blog/js/blog.js',
    '/manifest.json'
];

// 安装时预缓存关键资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(PRECACHE_URLS);
        }).then(() => self.skipWaiting())
    );
});

// 激活时清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names => {
            return Promise.all(
                names.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 网络优先，缓存回退
self.addEventListener('fetch', event => {
    // 仅缓存 GET 请求
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // 缓存成功响应
                if (response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                // 离线时从缓存读取
                return caches.match(event.request).then(cached => {
                    return cached || new Response('离线模式', { status: 503 });
                });
            })
    );
});
