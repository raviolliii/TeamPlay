//==============================================================
// firebase.js
//
// Defines wrappers for firebase functions to read,
// write, and listen to changes in the database
//==============================================================


//==============================================================
// Firebase Setup
//==============================================================


//config variables
let fbConfig = {
    apiKey: "AIzaSyBDd7bm48uwmG3-bryRQOitJm4D6WduvOg",
    authDomain: "teamplay-12f75.firebaseapp.com",
    databaseURL: "https://teamplay-12f75.firebaseio.com",
    projectId: "teamplay-12f75",
    storageBucket: "teamplay-12f75.appspot.com",
    messagingSenderId: "194743848047"
};

firebase.initializeApp(fbConfig);

//write song data to database at party name
function writePartyData(party, data) {
    firebase.database().ref(party).update(data);
}

//read party data
function getPartyData(party, callback) {
    if (!party) {
        callback(null);
        return;
    }
    firebase.database().ref(party).once("value", function(snapshot) {
        callback(snapshot.val());
    });
}

//connect to a party (set event listener for song udpates)
function connectParty(party, listener) {
    firebase.database().ref(party).on("value", listener);
}

//disconnect from a party (remove db listener)
function disconnectParty(party) {
    firebase.database().ref(party).off();
}

