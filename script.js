// ==========================================
// RIFA GILFEST v2.0
// script.js - Parte 1
// ==========================================

import {
    db,
    ref,
    set,
    get,
    child,
    onValue
} from "./firebase.js";

// =============================
// ELEMENTOS DA PÁGINA
// =============================

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

const btnCopiarPix = document.getElementById("btnCopiarPix");
const chavePix = document.getElementById("chavePix");

// =============================
// VARIÁVEIS
// =============================

let reservas = {};
const TOTAL_NUMEROS = 1000;

// =============================
// STATUS
// =============================

function atualizarStatus(titulo, texto, cor) {

    status.innerHTML = `
        <div style="
            width:50px;
            height:50px;
            border-radius:50%;
            background:${cor};
            display:flex;
            align-items:center;
            justify-content:center;
            color:#fff;
            margin:auto auto 15px;
            font-size:22px;">
            <i class="fa-solid fa-circle-info"></i>
        </div>

        <h3 style="text-align:center">${titulo}</h3>

        <p style="text-align:center;margin-top:10px;">
            ${texto}
        </p>
    `;

}

// =============================
// BARRA DE PROGRESSO
// =============================

function atualizarBarra() {

    const vendidos = Object.keys(reservas).length;

    const porcentagem =
        (vendidos / TOTAL_NUMEROS) * 100;

    barra.style.width = porcentagem + "%";

    textoBarra.innerHTML =
        `${vendidos} de ${TOTAL_NUMEROS} números reservados`;

}

// =============================
// LÊ FIREBASE
// =============================

const reservasRef = ref(db, "reservas");

onValue(reservasRef, (snapshot) => {

    reservas = snapshot.val() || {};

    atualizarBarra();

});

// =============================
// MENSAGEM INICIAL
// =============================

atualizarStatus(

    "Bem-vindo!",

    "Escolha um número para participar da rifa.",

    "#3b82f6"

);

// ==========================================
// RIFA GILFEST v2.0
// script.js - Parte 2
// ==========================================

// =============================
// VERIFICAR DISPONIBILIDADE
// =============================

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
            "Informe um número válido.",
            "#ef4444"
        );

        return;
    }

    numero = numero.toString().padStart(3, "0");

    numeroInput.value = numero;

    if (reservas[numero]) {

        atualizarStatus(
            "❌ Número Reservado",
            `O número ${numero} já foi reservado.`,
            "#ef4444"
        );

    } else {

        atualizarStatus(
            "✅ Número Disponível",
            `O número ${numero} está disponível para reserva.`,
            "#22c55e"
        );

    }

}

// =============================
// NÚMERO DA SORTE
// =============================

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
            "Rifa Encerrada",
            "Todos os números foram reservados.",
            "#ef4444"
        );

        return;

    }

   // ==========================================
// RIFA GILFEST v2.0
// script.js - Parte 3
// Reserva do Número
// ==========================================

async function reservarNumero() {

    let numero = numeroInput.value.trim();

    const nome = nomeInput.value.trim();
    const telefone = telefoneInput.value.trim();
    const cidade = cidadeInput.value.trim();

    if (!numero || !nome || !telefone || !cidade) {

        atualizarStatus(
            "Campos obrigatórios",
            "Preencha todos os campos para continuar.",
            "#f59e0b"
        );

        return;
    }

    numero = parseInt(numero);

    if (isNaN(numero) || numero < 0 || numero > 999) {

        atualizarStatus(
            "Número inválido",
            "Digite um número entre 000 e 999.",
            "#ef4444"
        );

        return;
    }

    numero = numero.toString().padStart(3, "0");

    // Verifica novamente se o número ainda está livre
    const reservaRef = ref(db, "reservas/" + numero);

    const snapshot = await get(reservaRef);

    if (snapshot.exists()) {

        atualizarStatus(
            "Número já reservado",
            "Escolha outro número.",
            "#ef4444"
        );

        return;
    }

    // Salva a reserva
    await set(reservaRef, {

        numero: numero,
        nome: nome,
        telefone: telefone,
        cidade: cidade,
        status: "Aguardando pagamento",
        dataReserva: new Date().toLocaleString("pt-BR")

    });

    atualizarStatus(
        "Reserva realizada!",
        "Seu número foi reservado com sucesso.",
        "#22c55e"
    );

    // Mensagem do WhatsApp
    const mensagem =
`
