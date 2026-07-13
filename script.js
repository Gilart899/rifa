/* ==========================================
   Rifa GilSigns
   script.js
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    carregarConfiguracoes();

});

/* ==========================================
   CARREGAR CONFIGURAÇÕES
========================================== */

function carregarConfiguracoes() {

    document.title = CONFIG.titulo;

    document.getElementById("beneficiada").textContent = CONFIG.beneficiada;

    document.getElementById("premio").textContent = CONFIG.premio;

    document.getElementById("valor").textContent =
        CONFIG.moeda + " " + CONFIG.valorNumero.toFixed(2);

    document.getElementById("data").textContent =
        CONFIG.dataSorteio;

    document.getElementById("resultado").textContent =
        CONFIG.resultado;

    document.getElementById("pix").textContent =
        CONFIG.pixChave;

}
/* ==========================================
   CARROSSEL DE IMAGENS
========================================== */

let slideAtual = 0;

function iniciarCarrossel() {

    const slides = document.querySelectorAll(".slide");

    const indicadores = document.querySelectorAll(".indicador");

    if(slides.length === 0) return;

    setInterval(() => {

        slides[slideAtual].classList.remove("ativo");
        indicadores[slideAtual].classList.remove("ativo");

        slideAtual++;

        if(slideAtual >= slides.length){

            slideAtual = 0;

        }

        slides[slideAtual].classList.add("ativo");
        indicadores[slideAtual].classList.add("ativo");

    },4000);

}

iniciarCarrossel();
