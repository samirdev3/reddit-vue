import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js'

const app = createApp({
    data() {
        return {
            player: {
                video: {
                    mp4: '',
                    m3u8: ''
                },
                html: ''
            },

        }
    },
    mounted() {
        if ( this.readPermalink() ) {
            this.player.html = this.playerHTML(this.player.video.m3u8, this.player.video.mp4);
            setTimeout(() => {
                this.playVideo();
            }, 1000);
        }
    },
    methods: {
        // permalink
        readPermalink() {
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            const mp4 = urlParams.get('mp4');
            const m3u8 = urlParams.get('m3u8');

            if ( typeof mp4 !== undefined && mp4 !== null ) {
                this.player.video.mp4 = mp4;
                return true;
            }

            if ( typeof m3u8 !== undefined && m3u8 !== null ) {
                this.player.video.m3u8 = m3u8;
                return true;
            }

            return false;
        },

        // player
        playVideo() {
            let player = videojs('player', {
                autoplay: 'muted'
            });
        },

        // player html
        playerHTML( m3u8, mp4 ) {
            return `<video id="player" class="video-js vjs-fluid vjs-default-skin" controls preload="auto"><source src="${m3u8}" type="application/x-mpegURL"><source src="${mp4}" type="video/mp4"></video>`;
        }
    }
});
app.mount('#app');
