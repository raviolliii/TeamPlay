//==============================================================
// helpers.js
//
// Defines helper functions to parse data,
// update UI and handle user interaction
//==============================================================


//==============================================================
// Base Functions
//==============================================================


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


//==============================================================
// UI Functions
//==============================================================


//updates progress bar using given position/duration
function updateProgress(position, duration) {
    let width = Math.round(100 * position / duration);
    $(".progress-bar").style.width = width + "%";
}

//updates song title/artists using given data
function updateSongInfo(data) {
    $(".cover").innerHTML = `<img src = "${data.imgUrl}"/>`;
    $(".song .name").innerHTML = data.name;
    $(".song .artist").innerHTML = data.artists;
    $(".splash").style.visibility = "hidden";
    $(".container").classList.remove("hidden");
    $(".next-track").innerText = data.nextTrack ? `Next: ${data.nextTrack}` : "";
    updateProgress(data.position, data.duration);
}

//show modal
function showModal() {
    document.body.classList.add("modal-open");
    let bd = document.createElement("div");
    bd.classList.add("modal-backdrop", "fade", "show");
    document.body.appendChild(bd);
    $("#partyModal").setAttribute("style", "display: block");
    $("#partyModal").setAttribute("aria-hidden", "false");
    $("#partyModal").classList.add("in", "show");
    setTimeout(function() {
        $(".modal-content").classList.add("show");
    }, 10);
}

//close modal
function closeModal() {
    document.body.removeChild($(".modal-backdrop"));
    document.body.classList.remove("modal-open");
    $("#partyModal").setAttribute("style", "display: none");
    $("#partyModal").setAttribute("aria-hidden", "true");
    $("#partyModal").classList.remove("in", "show");
    $(".modal-content").classList.remove("show");
}

$(".party").addEventListener("click", showModal);
$("#partyModal").addEventListener("click", closeModal);

