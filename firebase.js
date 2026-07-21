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

/* ==========================================
   INICIAR FIREBASE
========================================== */

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

const reservasRef = db.ref(CONFIG.caminhoReservas);

/* ==========================================
   LISTA DE NÚMEROS RESERVADOS
========================================== */

let numerosReservados = [];

/* ==========================================
   CARREGAR RESERVAS
========================================== */

reservasRef.on("value", (snapshot)=>{

    numerosReservados = [];

    snapshot.forEach((item)=>{

        const dados = item.val();

        if(dados.numero !== undefined){

            numerosReservados.push(

                dados.numero.toString().padStart(3,"0")

            );

        }

    });

    if(typeof atualizarEstatisticas === "function"){

        atualizarEstatisticas();

    }

});

/* ==========================================
   RESERVAR NÚMERO
========================================== */

function salvarReserva(dados){

    return reservasRef.push(dados);

}

/* ==========================================
   CONFIRMAR PAGAMENTO
========================================== */

function confirmarPagamento(id){

    return reservasRef.child(id).update({

        status:"pago"

    });

}

/* ==========================================
   CANCELAR RESERVA
========================================== */

function excluirReserva(id){

    return reservasRef.child(id).remove();

}

/* ==========================================
   BUSCAR RESERVAS
========================================== */

function buscarReservas(callback){

    reservasRef.once("value",(snapshot)=>{

        callback(snapshot);

    });

}

console.log("Firebase conectado com sucesso.");
