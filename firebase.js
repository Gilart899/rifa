/* ==========================================
   FIREBASE - RIFA GILSIGNS
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

let numerosReservados = [];

/* ==========================================
CARREGAR RESERVAS
========================================== */

reservasRef.on("value", (snapshot)=>{

    numerosReservados=[];

    snapshot.forEach((item)=>{

        const dados=item.val();

        numerosReservados.push(

            dados.numero.toString().padStart(3,"0")

        );

    });

    function atualizarEstatisticas(){

    const reservados = numerosReservados.length;

    const disponiveis = 1000 - reservados;

    const percentual = ((reservados/1000)*100).toFixed(1);

    document.getElementById("totalReservados").innerHTML = reservados;

    document.getElementById("totalDisponiveis").innerHTML = disponiveis;

    document.getElementById("percentual").innerHTML = percentual + "%";

    document.getElementById("textoProgresso").innerHTML =
    reservados + " de 1000 números reservados";

    document.getElementById("barraProgresso").style.width =
    percentual + "%";

}
/* ==========================================
ESTATÍSTICAS
========================================== */

function atualizarEstatisticas(){

    const vendidos=numerosReservados.length;

    const disponiveis=

    CONFIG.quantidadeNumeros-vendidos;

    document.getElementById("totalVendidos").innerHTML=

    vendidos;

    document.getElementById("totalDisponiveis").innerHTML=

    disponiveis;

}
