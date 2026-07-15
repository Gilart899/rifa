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

reservasRef.on("value", (snapshot) => {

    numerosReservados = [];

    snapshot.forEach((item) => {

        const dados = item.val();

        numerosReservados.push(
            dados.numero.toString().padStart(3, "0")
        );

    });

    atualizarEstatisticas();

});

/* ==========================================
   ESTATÍSTICAS
========================================== */

function atualizarEstatisticas() {

    const reservados = numerosReservados.length;

    const disponiveis = 1000 - reservados;

    const percentual = ((reservados / 1000) * 100).toFixed(1);

    const totalReservados = document.getElementById("totalReservados");
    if (totalReservados) totalReservados.innerHTML = reservados;

    const totalDisponiveis = document.getElementById("totalDisponiveis");
    if (totalDisponiveis) totalDisponiveis.innerHTML = disponiveis;

    const percentualHTML = document.getElementById("percentual");
    if (percentualHTML) percentualHTML.innerHTML = percentual + "%";

    const texto = document.getElementById("textoProgresso");
    if (texto)
        texto.innerHTML = reservados + " de 1000 números reservados";

    const barra = document.getElementById("barraProgresso");
    if (barra)
        barra.style.width = percentual + "%";

}

/* ==========================================
   CONFIRMAR PAGAMENTO
========================================== */

function confirmarPagamento(id){

    reservasRef.child(id).update({

        status:"pago"

    });

}

/* ==========================================
   EXCLUIR RESERVA
========================================== */

function excluirReserva(id){

    reservasRef.child(id).remove();

}
