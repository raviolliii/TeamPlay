//==============================================================
// script.js
//
// Main javascript file, loads and initializes the 
// Spotify Web SDK, attaching listeners to control and 
// update playback
//==============================================================


//when spotify web sdk loads
window.onSpotifyWebPlaybackSDKReady = function() {

    const clientId = "87cf352cff9c4531874906ec651fd8d6";
    //const redirectUri = "https://team--play.herokuapp.com/";
    const redirectUri = "http://localhost:8080/";
    const scopes = "streaming user-modify-playback-state user-read-birthdate user-read-email user-read-private user-read-currently-playing";
    const party = window.location.pathname.slice(1) || null;
    $(".party").innerText = party || "Private";
    var device = "";
    var admin = true;


    //==============================================================
    // Spotify Authentication
    //==============================================================


    if (!getUrlHash() && !getCookies()) {
        let url = "https://accounts.spotify.com/authorize?";
        let client = `client_id=${clientId}&`;
        let res = `response_type=token&`;
        let red = `redirect_uri=${redirectUri}&`;
        let scope = `scope=${scopes}`;
        let state = party ? `&state=${party}` : "";
        window.location.href = url + client + res + red + scope + state;
    }
    else if (getUrlHash()) {
        let {access_token, expires_in, state} = getUrlHash();
        document.cookie = `token=${access_token}; max-age=${expires_in}`
        window.location.href = window.location.origin + (state ? `/${state}` : "");
    }


    //==============================================================
    // Spotify Playback Initialization
    //==============================================================


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
    player.addListener("not_ready", console.error);
    player.addListener("ready", readyHandler);
    player.addListener('player_state_changed', stateChangeHandler);

    //connect the player
    player.connect();


    //==============================================================
    // Spotify Playback Functions
    //==============================================================


    setInterval(function() {
        player.getCurrentState()
            .then(state => {
                if (!state) {
                    return;
                }
                let {position, duration, paused} = state;
                updateProgress(position, duration);
            })
            .catch(console.error);
    }, 1000);

    //playback ready listener
    function readyHandler({ device_id }) {
        device = device_id;
        getPartyData(party, function(data) {
            setEventListeners();
            if (data) {
                admin = false;
                connectParty(party, function(snapshot) {
                    if (!admin && snapshot.val()) {
                        let {name, position} = snapshot.val();
                        if (name === $(".name").innerText) {
                            player.seek(position).catch(console.error);
                            return;
                        }
                        playSong(token, device, snapshot.val());
                    }
                });
                return;
            }
            transferPlayback(token, device_id);
        });
    }

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
    function stateChangeHandler({ position, duration, track_window: { current_track, next_tracks } }) {
        let data = {
            uri: current_track.uri,
            imgUrl: current_track.album.images[0].url,
            name: current_track.name,
            artists: current_track.artists.map(e => e.name).join(", "),
            position: position,
            duration: duration,
            nextTrack: next_tracks[0] ? next_tracks[0].name : ""
        };
        updateSongInfo(data);

        //write update to firebase db if admin
        if (party && admin) {
            writePartyData(party, data);
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
