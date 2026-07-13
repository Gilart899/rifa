/* ==========================================
   RIFA GILSIGNS
   script.js
========================================== */

let numerosSelecionados = [];

/* Apenas para testes.
   Depois será substituído pelo Firebase. */
let numerosReservados = [
    "005",
    "027",
    "125",
    "301",
    "728"
];

let slideAtual = 0;

/* ==========================================
   INICIAR SISTEMA
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    carregarConfiguracoes();

    iniciarCarrossel();

    configurarEventos();

});/* ==========================================
   CARREGAR CONFIGURAÇÕES
========================================== */

function carregarConfiguracoes(){

    document.title = CONFIG.titulo;

    document.getElementById("beneficiada").textContent =
        CONFIG.beneficiada;

    document.getElementById("premio").textContent =
        CONFIG.premio;

    document.getElementById("valor").textContent =
        CONFIG.moeda + " " +
        CONFIG.valorNumero.toFixed(2);

    document.getElementById("data").textContent =
        CONFIG.dataSorteio;

    document.getElementById("resultado").textContent =
        CONFIG.resultado;

    document.getElementById("pix").textContent =
        CONFIG.pixChave;

}/* ==========================================
   CONFIGURAR EVENTOS
========================================== */

function configurarEventos(){

    document
    .getElementById("btnVerificar")
    .addEventListener("click", verificarNumero);

    document
    .getElementById("btnSorte")
    .addEventListener("click", numeroDaSorte);

    document
    .getElementById("btnAdicionar")
    .addEventListener("click", adicionarNumero);

    document
    .getElementById("copiarPix")
    .addEventListener("click", copiarPix);

    document
    .getElementById("btnReservar")
    .addEventListener("click", reservar);

    document
    .getElementById("btnWhatsapp")
    .addEventListener("click", enviarWhatsApp);

}
