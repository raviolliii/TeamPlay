//when spotify web sdk loads
window.onSpotifyWebPlaybackSDKReady = function() {

    const clientId = "87cf352cff9c4531874906ec651fd8d6";
    const redirectUri = "https://team--play.herokuapp.com/";
    //const redirectUri = "http://localhost:8080/";
    const scopes = "streaming user-modify-playback-state user-read-birthdate user-read-email user-read-private user-read-currently-playing";
    const room = window.location.href.split("?room=")[1];
    var admin = true;

    //********************************************
    // Spotify Playback Initialization
    //********************************************

    if (!getUrlHash() && !getCookies()) {
        let url = "https://accounts.spotify.com/authorize?";
        let client = `client_id=${clientId}&`;
        let res = `response_type=token&`;
        let red = `redirect_uri=${redirectUri}&`;
        let scope = `scope=${scopes}`;
        window.location.href = url + client + res + red + scope;
    }
    else if (getUrlHash()) {
        let {access_token, expires_in} = getUrlHash();
        document.cookie = `token=${access_token}; max-age=${expires_in}`
        window.location.href = window.location.origin;
    }

    //********************************************
    // Firebase Setup
    //********************************************

    const fbConfig = {
        apiKey: "AIzaSyBDd7bm48uwmG3-bryRQOitJm4D6WduvOg",
        authDomain: "teamplay-12f75.firebaseapp.com",
        databaseURL: "https://teamplay-12f75.firebaseio.com",
        projectId: "teamplay-12f75",
        storageBucket: "teamplay-12f75.appspot.com",
        messagingSenderId: "194743848047"
    };

    firebase.initializeApp(fbConfig);

    //write song data to database at room name
    function writeRoomData(room, data) {
        firebase.database().ref(room).update(data);
    }

    //read room data
    function getRoomData(room, callback) {
        firebase.database().ref(room).once("value", function(snapshot) {
            callback(snapshot.val());
        });
    }

    getRoomData(room, function(data) {
        if (data) {
            admin = false;
        }

        firebase.database().ref(room).on("value", function(snapshot) {
            if (!admin && snapshot.val()) {
                updateSongInfo(snapshot.val());
            }
        });
    });

    //********************************************
    // Spotify Playback Initialization
    //********************************************

    //initialize Spotify Player with token
    const token = getCookies().token;
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
        if (room) {
            getRoomData(room, function(data) {
                if (data) {
                    playSong(token, device_id, data);
                }
            });
        }
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

    //parse cookies and return an object with the data
    function parseData(line, delim) {
        let data = line.split(delim)
            .reduce(function(acc, curr) {
                let key = curr.split("=")[0];
                let value = curr.split("=")[1];
                key ? acc[key] = value : null;
                return acc;
            }, {});
        return Object.keys(data).length ? data : null;
    }

    //gets cookies in object form
    function getCookies() {
        return parseData(document.cookie, "; ");
    }

    //gets URL hash in object form
    function getUrlHash() {
        return parseData(window.location.hash.slice(1), "&");
    }

    //********************************************
    // UI Functions
    //********************************************

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
        $(".cover").innerHTML = `<img src = "${data.imgUrl}"/>`;
        $(".song .name").innerHTML = data.name;
        $(".song .artist").innerHTML = data.artists;
        $(".splash").style.visibility = "hidden";
        $(".container").classList.remove("hidden");
        updateProgress();
    }

    //********************************************
    // Spotify Playback Functions
    //********************************************

    //play specific song
    function playSong(token, device, {uri, position}) {
        let url = "https://api.spotify.com/v1/me/player/play?device_id=" + device;
        fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                uris: [uri],
                position_ms: position
            })
        }).catch(console.error);
    }

    //transfer main playback to given device id (Team Play)
    function transferPlayback(token, device, callback) {
        let url = "https://api.spotify.com/v1/me/player";
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
        let data = {
            uri: current_track.uri,
            imgUrl: current_track.album.images[0].url,
            name: current_track.name,
            artists: current_track.artists.map(e => e.name).join(", "),
            position: position,
            duration: duration
        };
        updateSongInfo(data);
        if (room && admin) {
            writeRoomData(room, data);
        }
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
