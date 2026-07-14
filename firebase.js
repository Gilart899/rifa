/* ==========================================
   FIREBASE
========================================== */

const firebaseConfig = {

    apiKey: "AIzaSyDFFi2nbKHYkBDgThN6MlCy-jw5Se7eYfg",

    authDomain: "rifa-1bc12.firebaseapp.com",

    databaseURL: "https://rifa-1bc12-default-rtdb.firebaseio.com",

    projectId: "rifa-1bc12",

    storageBucket: "rifa-1bc12.firebasestorage.app",

    messagingSenderId: "331108957670",

    appId: "1:331108957670:web:1875f8481555beddbb6a27"

};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

const reservasRef = db.ref("reservas");

/* ==========================================
   LISTA DE NÚMEROS RESERVADOS
========================================== */

let numerosReservados = [];

reservasRef.on("value", (snapshot) => {

    numerosReservados = [];

    snapshot.forEach((item) => {

        const reserva = item.val();

        if (reserva.numero) {
            numerosReservados.push(
                reserva.numero.toString().padStart(3, "0")
            );
        }

    });

    console.log("Números reservados:", numerosReservados);

});
