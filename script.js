// ==========================
// GilSigns - Sistema de Rifa
// ==========================

// Lista simulada de números já reservados
const numerosReservados = [
    "001",
    "007",
    "015",
    "100",
    "123",
    "250",
    "500",
    "777",
    "999"
];

// Elementos da página
const numeroInput = document.getElementById("numero");
const status = document.getElementById("status");
const btnConsultar = document.getElementById("btnConsultar");
const btnSorte = document.getElementById("btnSorte");

// ==========================
// Atualiza o painel de status
// ==========================
function atualizarStatus(titulo, mensagem, cor) {

    status.innerHTML = `
        <div class="icone-status" style="background:${cor}">
            <i class="fa-solid fa-circle-info"></i>
        </div>

        <div>
            <h3>${titulo}</h3>
            <p>${mensagem}</p>
        </div>
    `;
}

// ==========================
// Verifica disponibilidade
// ==========================
function verificarNumero() {

    let numero = numeroInput.value.trim();

    if (numero === "") {

        atualizarStatus(
            "Digite um número",
            "Informe um número entre 000 e 999.",
            "#ff9800"
        );

        return;
    }

    numero = numero.padStart(3, "0");

    numeroInput.value = numero;

    if (numerosReservados.includes(numero)) {

        atualizarStatus(
            "Número indisponível",
            `O número ${numero} já foi reservado.`,
            "#e53935"
        );

    } else {

        atualizarStatus(
            "Número disponível",
            `O número ${numero} está disponível para reserva.`,
            "#22c55e"
        );

    }

}

// ==========================
// Número da Sorte
// ==========================
function gerarNumeroDaSorte() {

    let numero;
    let tentativas = 0;

    do {

        numero = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");

        tentativas++;

    } while (
        numerosReservados.includes(numero) &&
        tentativas < 1000
    );

    numeroInput.value = numero;

    verificarNumero();

}

// ==========================
// Eventos
// ==========================

if (btnConsultar) {
    btnConsultar.addEventListener("click", verificarNumero);
}

if (btnSorte) {
    btnSorte.addEventListener("click", gerarNumeroDaSorte);
}

const btnReservar = document.getElementById("btnReservar");

if (btnReservar) {
    btnReservar.addEventListener("click", reservarNumero);
}

function reservarNumero() {

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const cidade = document.getElementById("cidade").value.trim();
    const numero = numeroInput.value.trim().padStart(3, "0");

    if (nome === "" || telefone === "" || cidade === "" || numero === "") {
        alert("Preencha todos os campos.");
        return;
    }

    if (numerosReservados.includes(numero)) {
        alert("Este número já foi reservado.");
        return;
    }

    const seuWhatsApp = "5579999145044";

    const mensagem =
`🎟️ *Nova Reserva de Rifa*

👤 Nome: ${nome}
📱 WhatsApp: ${telefone}
📍 Cidade: ${cidade}

🎲 Número escolhido: ${numero}`;

    const url = `https://wa.me/${seuWhatsApp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, "_blank");
}
