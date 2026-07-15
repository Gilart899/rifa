/* ==========================================
   RIFA GILSIGNS
   script.js
========================================== */

let numerosSelecionados = [];

/* Apenas para testes.
   Depois será substituído pelo Firebase. */
/* ==========================================
   SALVAR RESERVA
========================================== */

function salvarReserva(dados){

    const novaReserva = reservasRef.push();

    novaReserva.set(dados);

}

let slideAtual = 0;

/* ==========================================
   INICIAR SISTEMA
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    carregarConfiguracoes();

    iniciarCarrossel();

    configurarEventos();

   const numeroSalvo = localStorage.getItem("numeroEscolhido");

if(numeroSalvo){

    document.getElementById("numeroEscolhido").value = numeroSalvo;

    localStorage.removeItem("numeroEscolhido");

}
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

function reservar(){

    const nome =
    document.getElementById("nome").value.trim();

    const telefone =
    document.getElementById("telefone").value.trim();

    const cidade =
    document.getElementById("cidade").value.trim();

    if(nome===""){

        mostrarMensagem(
        "Informe seu nome.",
        "aviso"
        );

        return;

    }

    if(numerosSelecionados.length===0){

        mostrarMensagem(
        "Escolha pelo menos um número.",
        "aviso"
        );

        return;

    }

    numerosSelecionados.forEach(numero=>{

        salvarReserva({

            numero:numero,

            nome:nome,

            telefone:telefone,

            cidade:cidade,

            status:"reservado",

            data:new Date().toISOString()

        });

    });

    mostrarMensagem(

    "Reserva enviada com sucesso!",

    "sucesso"

    );

       }
/* ===========================
MODAL
=========================== */

function abrirModal(titulo, texto, icone){

    document.getElementById("tituloModal").innerHTML = titulo;

    document.getElementById("textoModal").innerHTML = texto;

    document.getElementById("iconeModal").innerHTML = icone;

    document.getElementById("modal").classList.remove("oculto");

}

function fecharModal(){

    document.getElementById("modal").classList.add("oculto");

}

document
.getElementById("btnFecharModal")
.addEventListener("click", fecharModal);
