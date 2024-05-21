import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js'

const app = createApp({
    data() {
        return {
            settings: {
                per_load: 10,
                actions: {
                    show: false,
                    active_previous: false,
                    active_next: false
                },
                total_posts: 0
            },
            search: {
                input: '',
                url: ''
            },
            items: {
                posts: [],
                first_post:  '',
                last_post:  '',
                previous: false,
                next: false
            },
            filter: {
              type: 'keyword',
              nsfw: 'off',
              time: 'all',
              sort: 'relevance'
            },
            menu: {
              active: false,
              visible: false
            },
            history: {
                show: false,
                text: 'Off',
                recent_keyword: [],
                recent_group: [],
            }
        }
    },
    mounted() {
        this.menuVisibility();
    },
    methods: {
        // fetch
        getPostsHandler(url) {
            const vm = this;

            fetch(url)
                .then(function (response) {
                    if (response.ok) {
                        return response.json();
                    }
                    return Promise.reject(response);
                }).then(function (data) {
                    vm.createPostHandler(data.data.children);
                    vm.items.previous = false;
                    vm.items.next = false;
                    // set history
                    let historyType = '';
                    (vm.filter.type === 'group') ? historyType = vm.history.recent_group : historyType = vm.history.recent_keyword;
                    vm.historyHandler(historyType, vm.search.input);

                }).catch(function (error) {
                    alert(error);
                });
        },

        // create post
        createPostHandler(data) {
            this.settings.actions.active_previous = false;
            this.settings.actions.active_next = false;

            data.forEach((post, index) => {
                const postData = post.data;
                const thumb = this.verifyThumbnail(postData);
                let card = {};

                if ( (index+1) === 1 ) {
                    this.items.first_post = postData.name;

                    if ( this.settings.total_posts > this.settings.per_load ) {
                        this.settings.actions.active_previous = true;
                    }
                }

                if ( thumb === '' ) {
                    card.thumbnail = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 150'%3E%3Cpath fill='%23black' d='M0 0h150v150H0z'/%3E%3Ctext x='50%25' y='50%25' fill='%23fff' font-family='Arial, Helvetica, sans-serif' font-size='14px' text-anchor='middle'%3ENO-PREVIEW%3C/text%3E%3C/svg%3E";
                } else if ( thumb === 'NSFW' ) {
                    let adult = '';
                    if ( this.adultBadge(postData) ) {
                        adult = ' (18+)';
                    }
                    card.thumbnail = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 150'%3E%3Cpath fill='%23b00000' d='M0 0h150v150H0z'/%3E%3Ctext x='50%25' y='50%25' fill='%23fff' font-family='Arial, Helvetica, sans-serif' font-size='14px' text-anchor='middle'%3ENSFW"+adult+"%3C/text%3E%3C/svg%3E";
                } else {
                    card.thumbnail = thumb;
                }
                card.title = postData.title;
                card.name = postData.name;
                card.subreddit = postData.subreddit;
                card.domain = postData.domain;
                card.contains = postData.post_hint;
                card.cta = this.postType(postData);
                card.adult = this.adultBadge(postData);
                card.active = false;
                this.items.posts.push(card);

                if ( (index+1) === this.settings.per_load ) {
                    this.items.last_post = postData.name;
                    this.settings.actions.active_next = true;
                }
            });
        },

        // history
        historyHandler(array, search) {
            let isAlreadyAdded = false;
            const newURL = `${this.search.url}&after=${this.items.first_post}`;
            array.map(p => {
                if ( p.search === search ) {
                    isAlreadyAdded = true;
                    p.url = newURL;
                }
            });
            if ( !isAlreadyAdded ) {
                array.push({
                    search: search,
                    url: newURL
                });
            }
        },

        // search query
        searchQuery(inputID, type, historyURL) {
            const vm = this;
            type !== undefined ? vm.filter.type = type : null;
            vm.menuVisibility();

            if ( vm.search.input !== '' ) {
                vm.items.posts = [];
                let search_url;
                let str = vm.search.input;
                vm.settings.total_posts = vm.settings.per_load;
                vm.settings.actions.show = true;

                if ( inputID !== '' ) {
                    vm.search.input = inputID;
                    str = inputID;
                }

                str = str.replace(/\s+/g, '+');
                let src = `https://api.reddit.com/search.json?q=${str}&`;
                if ( vm.filter.type === 'group' ) {
                    src = `https://api.reddit.com/r/${str}.json?`;
                }

                search_url = `${src}include_over_18=${vm.filter.nsfw}&limit=${vm.settings.per_load}&sort=${vm.filter.sort}&t=${vm.filter.time}`;
                if ( historyURL !== undefined && historyURL !== '' ) {
                    search_url = historyURL;
                }

                vm.search.url = search_url;
                vm.getPostsHandler(search_url);
                return;
            }
            alert('Empty search query.');
        },

        // thumbnail
        verifyThumbnail(thumb) {
            if ( typeof thumb.thumbnail !== undefined ) {
                let image = thumb.thumbnail;

                if ( this.isValidUrl(image) ) {
                    let encoded = image.replaceAll('&amp;', '&');
                    return encoded;
                } else if ( image === 'nsfw' ) {
                    return 'NSFW';
                } else {
                    return '';
                }
            }
        },

        // check valid url
        isValidUrl(urlString) {
            var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
                '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
            return !!urlPattern.test(urlString);
        },

        // post type
        postType(post) {
            if ( typeof post.is_gallery !== undefined && post.is_gallery ) {
                return `<a href="${post.url}" target="_blank" class="gallery">Gallery</a>`;
            } else if ( typeof post.is_video !== undefined && post.is_video ) {
                if ( post.media !== null ) {
                    if ( typeof post.media.reddit_video !== undefined && post.media.reddit_video !== null) {
                        let cta = '';
                        let duration = '';
                        if ( typeof post.media.reddit_video.duration !== undefined && post.media.reddit_video.duration!== null ) {
                            function padTo2Digits(num) {
                                return num.toString().padStart(2, '0');
                            }
                            const total_video_duration = post.media.reddit_video.duration;
                            const minutes = Math.floor(total_video_duration / 60);
                            const seconds = total_video_duration % 60;
                            duration = `${padTo2Digits(minutes)}:${padTo2Digits(seconds)}`;
                        }
                        const video_path = post.media.reddit_video.fallback_url;
                        cta = `<a href="${window.location.href}player.html?mp4=${video_path}" target="_blank" class="video">${duration}</a>`;
                        if ( post.media.reddit_video.has_audio && (typeof post.media.reddit_video.hls_url !== undefined && post.media.reddit_video.hls_url !== '') ) {
                            const hls_path = post.media.reddit_video.hls_url;
                            cta += ` <a href="${window.location.href}player.html?m3u8=${hls_path}" target="_blank" class="video">HSL - ${duration}</a>`;
                        }
                        return cta;
                    }
                }
            } else {
                return `<a href="https://www.reddit.com/gallery/${post.id}" target="_blank" class="post">Post</a>`;
            }
        },

        // 18+ badge
        adultBadge(post) {
            if ( post.over_18 ) {
                return '18+';
            }
            return;
        },

        // load more
        loadPosts(type) {
            let update_url = '';
            this.items.posts = [];

            if ( type === 'previous' ) {
                this.items.previous = true;
                this.settings.total_posts = (this.settings.total_posts - this.settings.per_load);
                update_url = `${this.search.url}&before=${this.items.first_post}`;
            } else if ( type === 'next' ) {
                this.items.next = true;
                this.settings.total_posts = (this.settings.total_posts + this.settings.per_load);
                update_url = `${this.search.url}&after=${this.items.last_post}`;
            }

            if ( update_url !== '' ) {
                this.getPostsHandler(update_url);
            }
        },

        // filter
        filterBy(value, mode) {
            mode === 'type' ? this.filter.type = value : null;
            mode === 'sort' ? this.filter.sort = value : null;
            mode === 'nsfw' ? this.filter.nsfw = value : null;
            mode === 'time' ? this.filter.time = value : null;
            this.searchQuery(this.search.input);
        },

        // toggle history
        toggleHistory() {
            if ( this.history.show ) {
                this.history.text = 'Off';
                this.history.show = false;
            } else {
                this.history.text = 'On';
                this.history.show = true;
            }
        },

        // buttons actions
        buttonActions(index) {
            this.items.posts[index].active = true;
        },

        // menu
        toggleMenu() {
            this.menu.active = !this.menu.active
        },

        // menu visibility
        menuVisibility() {
            if ( window.innerWidth < 960 ) {
                this.menu.visible = true;
                this.menu.active = false;
            } else {
                this.menu.visible = false;
                this.menu.active = true;
            }
        }
    }
});
app.mount('#app');
