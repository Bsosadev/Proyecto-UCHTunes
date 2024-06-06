// Inicializar Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDmB65kQZWIYDJIE72_BEITkRkOMJvaHdE",
    authDomain: "uchtunes.firebaseapp.com",
    projectId: "uchtunes",
    storageBucket: "uchtunes.appspot.com",
    messagingSenderId: "219698326645",
    appId: "1:219698326645:web:a1112a6989647961891c3c",
    measurementId: "G-89K5NYKS61"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a la base de datos y al almacenamiento
var db = firebase.database();
var storage = firebase.storage();