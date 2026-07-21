/* ==========================================
   RIFA GILSIGNS
   script.js
========================================== */

let numerosSelecionados = [];
let slideAtual = 0;

/* ==========================================
   INICIAR
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    carregarConfiguracoes();
    iniciarCarrossel();
    iniciarEventos();
    receberNumeroDaCartela();

});

/* ==========================================
   RECEBER NÚMERO DAS CARTELAS
========================================== */

function receberNumeroDaCartela(){

    const numero = localStorage.getItem("numeroSelecionado");

    if(numero){

        const campo = document.getElementById("numeroEscolhido");

        if(campo){

            campo.value = numero;

        }

        localStorage.removeItem("numeroSelecionado");

    }

}

/* ==========================================
   CONFIGURAÇÕES
========================================== */

function carregarConfiguracoes(){

    document.title = CONFIG.titulo;

    if(document.getElementById("beneficiada"))
        document.getElementById("beneficiada").textContent =
        CONFIG.beneficiada;

    if(document.getElementById("premio"))
        document.getElementById("premio").textContent =
        CONFIG.premio;

    if(document.getElementById("valorNumero"))
        document.getElementById("valorNumero").textContent =
        CONFIG.moeda + " " + CONFIG.valorNumero.toFixed(2);

    if(document.getElementById("dataSorteio"))
        document.getElementById("dataSorteio").textContent =
        CONFIG.dataSorteio;

    if(document.getElementById("resultadoSorteio"))
        document.getElementById("resultadoSorteio").textContent =
        CONFIG.resultado;

    if(document.getElementById("pix"))
        document.getElementById("pix").textContent =
        CONFIG.pixChave;

}

/* ==========================================
   EVENTOS
========================================== */

function iniciarEventos(){

    adicionarEvento("btnSorte", numeroDaSorte);

    adicionarEvento("btnVerificar", verificarNumero);

    adicionarEvento("btnAdicionar", adicionarNumero);

    adicionarEvento("btnReservar", reservarNumeros);

    adicionarEvento("btnWhatsapp", enviarWhatsapp);

    adicionarEvento("copiarPix", copiarPix);

    adicionarEvento("btnFecharModal", fecharModal);

}

/* ==========================================
   ADICIONAR EVENTO
========================================== */

function adicionarEvento(id, funcao){

    const elemento = document.getElementById(id);

    if(elemento){

        elemento.addEventListener("click", funcao);

    }

}

/* ==========================================
   CARROSSEL
========================================== */

function iniciarCarrossel(){

    const slides = document.querySelectorAll(".slide");

    const indicadores =
    document.querySelectorAll(".indicador");

    if(slides.length === 0) return;

    setInterval(()=>{

        slides[slideAtual].classList.remove("ativo");

        if(indicadores.length){

            indicadores[slideAtual].classList.remove("ativo");

        }

        slideAtual++;

        if(slideAtual >= slides.length){

            slideAtual = 0;

        }

        slides[slideAtual].classList.add("ativo");

        if(indicadores.length){

            indicadores[slideAtual].classList.add("ativo");

        }

    },4000);

}

/* ==========================================
   NÚMERO DA SORTE
========================================== */

function numeroDaSorte(){

    const numero =
    Math.floor(Math.random()*1000);

    document.getElementById("numeroEscolhido").value =
    numero.toString().padStart(3,"0");

}
