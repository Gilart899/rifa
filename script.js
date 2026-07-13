// ==========================
// GilSigns - Sistema de Rifa
// Etapa 3
// ==========================

const quantidadeNumeros = 1000;

const numerosContainer = document.getElementById("numeros");

let numeroSelecionado = null;

// Simulação local.
// Depois será substituída pelo Firebase.
// Simulação de números já reservados
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

const numeroInput = document.getElementById("numero");
const status = document.getElementById("status");

document.getElementById("btnConsultar").addEventListener("click", verificarNumero);

function verificarNumero() {

    let numero = numeroInput.value.trim();

    if (numero === "") {
        atualizarStatus("⚠️ Digite um número.", "#ff9800");
        return;
    }

    numero = numero.padStart(3, "0");

    numeroInput.value = numero;

    if (numerosReservados.includes(numero)) {

        atualizarStatus(
            `❌ O número ${numero} já foi reservado.`,
            "#e53935"
        );

    } else {

        atualizarStatus(
            `✅ O número ${numero} está disponível!`,
            "#22c55e"
        );

    }

}

function atualizarStatus(texto, cor) {

    status.innerHTML = `
        <div class="icone-status" style="background:${cor}">
            <i class="fa-solid fa-circle-info"></i>
        </div>

        <div>
            <h3>${texto}</h3>
        </div>
    `;
}
