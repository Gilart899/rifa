// =====================================
// RIFA GILFEST v2.0
// Parte 1
// =====================================

import {
    db,
    ref,
    set,
    get,
    child,
    onValue
} from "./firebase.js";

// ==========================
// Elementos da página
// ==========================

const numeroInput = document.getElementById("numero");
const nomeInput = document.getElementById("nome");
const telefoneInput = document.getElementById("telefone");
const cidadeInput = document.getElementById("cidade");

const btnConsultar = document.getElementById("btnConsultar");
const btnSorte = document.getElementById("btnSorte");
const btnReservar = document.getElementById("btnReservar");

const status = document.getElementById("status");

const barra = document.getElementById("barraProgresso");
const textoBarra = document.getElementById("textoProgresso");

// ==========================
// Dados carregados do Firebase
// ==========================

let reservas = {};

// ==========================
// Atualiza barra de progresso
// ==========================

function atualizarBarra() {

    const vendidos = Object.keys(reservas).length;

    const porcentagem = (vendidos / 1000) * 100;

    barra.style.width = porcentagem + "%";

    textoBarra.innerHTML =
        `${vendidos} de 1000 números reservados`;

}

// ==========================
// Escuta alterações em tempo real
// ==========================

const reservasRef = ref(db, "reservas");

onValue(reservasRef, (snapshot) => {

    reservas = snapshot.val() || {};

    atualizarBarra();

});

// ==========================
// Atualiza painel de status
// ==========================

function atualizarStatus(titulo, texto, cor) {

    status.innerHTML = `

        <div class="icone-status"
             style="background:${cor};
                    width:45px;
                    height:45px;
                    border-radius:50%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    color:#fff;
                    margin-bottom:10px;">

            <i class="fa-solid fa-circle-info"></i>

        </div>

        <h3>${titulo}</h3>

        <p>${texto}</p>

    `;

}
// Inicializa

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

// Exporta para o script.js

export {

    db,

    ref,

    set,

    get,

    child,

    update,

    remove,

    onValue

};

// =====================================
// Verificar Disponibilidade
// =====================================

function verificarNumero() {

    let numero = numeroInput.value.trim();

    if (numero === "") {

        atualizarStatus(
            "Atenção",
            "Digite um número entre 000 e 999.",
            "#f59e0b"
        );

        return;

    }

    numero = parseInt(numero);

    if (isNaN(numero) || numero < 0 || numero > 999) {

        atualizarStatus(
            "Número inválido",
            "Escolha um número entre 000 e 999.",
            "#ef4444"
        );

        return;

    }

    numero = numero.toString().padStart(3, "0");

    numeroInput.value = numero;

    if (reservas[numero]) {

        atualizarStatus(
            "Número indisponível",
            `O número ${numero} já foi reservado.`,
            "#ef4444"
        );

    } else {

        atualizarStatus(
            "Número disponível",
            `O número ${numero} está livre para reserva.`,
            "#22c55e"
        );

    }

}

// =====================================
// Número da Sorte
// =====================================

function gerarNumeroDaSorte() {

    let numero;
    let tentativas = 0;

    do {

        numero = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");

        tentativas++;

    } while (reservas[numero] && tentativas < 1000);

    if (tentativas >= 1000) {

        atualizarStatus(
            "Rifa encerrada",
            "Todos os números já foram reservados.",
            "#ef4444"
        );

        return;

    }

    numeroInput.value = numero;

    verificarNumero();

}

// =====================================
// Eventos
// =====================================

btnConsultar.addEventListener("click", verificarNumero);

btnSorte.addEventListener("click", gerarNumeroDaSorte);
