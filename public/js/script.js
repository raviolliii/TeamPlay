//when spotify web sdk loads
window.onSpotifyWebPlaybackSDKReady = function() {

    //********************************************
    // Spotify Playback Initialization
    //********************************************

    //initialize Spotify Player with token
    const token = getURLParam("at");
    const player = new Spotify.Player({
        name: "Team Play",
        getOAuthToken: cb => { cb(token); }
    });

    //player event handling
    player.addListener("initialization_error", console.error);
    player.addListener("authentication_error", console.error);
    player.addListener("account_error", console.error);
    player.addListener("playback_error", console.error);
    player.addListener("not_ready", ({ device_id }) => {
        console.log("Device ID has gone offline", device_id);
    });
    player.addListener("ready", ({ device_id }) => {
        transferPlayback(token, device_id, setEventListeners);
    });
    player.addListener('player_state_changed', stateChangeHandler);

    //connect the player
    player.connect();
    
    //********************************************
    // Base Functions
    //********************************************

    //allows jQuery like selection
    function $(selector) {
        return document.querySelector(selector);
    }

    //gets URL params (for tokens)
    function getURLParam(param) {
        const url = new URL(window.location.href);
        return url.searchParams.get(param);
    }

    //updates progress bar using current state
    function updateProgress() {
        player.getCurrentState().then(state => {
            if (!state) {
                return;
            }
            let position = state.position;
            let duration = state.track_window.current_track.duration_ms;
            let width = Math.round(100 * position / duration);
            $(".progress-bar").style.width = width + "%";
        });
        setTimeout(updateProgress, 50);
    }

    //updates song title/artists using given data
    function updateSongInfo(data) {
        $(".cover").innerHTML = `<img src = "${data.imgSrc}"/>`;
        $(".song .name").innerHTML = data.name;
        $(".song .artist").innerHTML = data.artist;
        $(".splash").style.visibility = "hidden";
        $(".container").classList.remove("hidden");
        updateProgress();
    }

    //********************************************
    // Spotify Playback Functions
    //********************************************

    //transfer main playback to given device id (Team Play)
    function transferPlayback(token, device, callback) {
        const url = "https://api.spotify.com/v1/me/player";
        fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                device_ids: [device],
                play: true
            })
        }).then(callback).catch(console.error);
    }

    //handles playback state changes
    //gets song data (name, artists, etc.) and updates UI
    function stateChangeHandler({ position, duration, track_window: { current_track } }) {
        updateSongInfo({
            imgSrc: current_track.album.images[0].url,
            name: current_track.name,
            artist: current_track.artists.map(e => e.name).join(", "),
            position: position,
            duration: duration
        });
    }

    //toggles playback and playback icon
    function togglePlay() {
        player.togglePlay().catch(console.error);
        $(".media.play .icon").classList.toggle("fa-play");
        $(".media.play .icon").classList.toggle("fa-pause");
    }

    //seeks position in song using given mousemove event e
    function seek(e) {
        player.getCurrentState().then(state => {
            if (!state) {
                return;
            }
            let x = e.pageX - $(".progress").getBoundingClientRect().left;
            let duration = state.track_window.current_track.duration_ms;
            let position = (x / $(".progress").offsetWidth) * duration;
            player.seek(parseInt(position)).catch(console.error);
        });
    }

    //initializes event handlers for playback controls
    function setEventListeners() {
        document.body.addEventListener("keydown", function(e) {
            if (e.keyCode === 32) {
                togglePlay();
            }
        });
        $(".media.play").addEventListener("click", togglePlay);
        $(".media.prev").addEventListener("click", function() {
            player.previousTrack();
        });
        $(".media.next").addEventListener("click", function() {
            player.nextTrack();
        });
        $(".progress").addEventListener("click", seek);
    }

};

