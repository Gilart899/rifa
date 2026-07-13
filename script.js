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
}

/* ==========================================
   COPIAR PIX
========================================== */

const btnPix = document.getElementById("copiarPix");

if(btnPix){

    btnPix.addEventListener("click",()=>{

        navigator.clipboard.writeText(CONFIG.pixChave);

        alert("✅ Chave PIX copiada.");

    });


  /* ==========================================
   NÚMERO DA SORTE
========================================== */

const btnSorte = document.getElementById("btnSorte");

if(btnSorte){

    btnSorte.addEventListener("click",()=>{

        const numero = Math.floor(Math.random()*1000);

        document.getElementById("numeroEscolhido").value =
        numero.toString().padStart(3,"0");

    });

  /* ==========================================
   FORMATAÇÃO DO NÚMERO
========================================== */

const campoNumero = document.getElementById("numeroEscolhido");

if(campoNumero){

campoNumero.addEventListener("input",()=>{

let valor = campoNumero.value.replace(/\D/g,"");

if(valor>999){

valor="999";

}

campoNumero.value = valor;

  /* ==========================================
   LISTA DE NÚMEROS SELECIONADOS
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

  /* ==========================================
VERIFICAR DISPONIBILIDADE
========================================== */

const btnVerificar = document.getElementById("btnVerificar");

if(btnVerificar){

btnVerificar.addEventListener("click", verificarNumero);

}

function verificarNumero(){

let numero = document
.getElementById("numeroEscolhido")
.value
.trim();

if(numero===""){

alert("Digite um número.");

return;

}

numero = numero.padStart(3,"0");

if(numerosReservados.includes(numero)){

alert("❌ O número "+numero+" já foi reservado.");

return;

}

alert("✅ Número "+numero+" disponível!");


  /* ==========================================
ADICIONAR À CARTELA
========================================== */

const btnAdicionar =
document.getElementById("btnAdicionar");

if(btnAdicionar){

btnAdicionar.addEventListener("click", adicionarNumero);

}

function adicionarNumero(){

let numero =
document.getElementById("numeroEscolhido")
.value
.trim();

if(numero===""){

alert("Digite um número.");

return;

}

numero = numero.padStart(3,"0");

if(numerosReservados.includes(numero)){

alert("Número indisponível.");

return;

}

if(numerosSelecionados.includes(numero)){

alert("Esse número já está na sua cartela.");

return;

}

numerosSelecionados.push(numero);

mostrarCartela();

document.getElementById("numeroEscolhido").value="";

  /* ==========================================
MOSTRAR CARTELA
========================================== */

function mostrarCartela(){

const area =
document.getElementById("numerosSelecionados");

if(numerosSelecionados.length===0){

area.innerHTML="Nenhum número escolhido.";

return;

}

area.innerHTML="";

numerosSelecionados.forEach(numero=>{

area.innerHTML+=`

<div class="numeroEscolhido">

${numero}

</div>

/* ==========================================
RESERVAR
========================================== */

const btnReservar =
document.getElementById("btnReservar");

if(btnReservar){

btnReservar.addEventListener("click",()=>{

if(numerosSelecionados.length===0){

alert("Escolha pelo menos um número.");

return;

}

alert(

"Reserva criada com sucesso!\n\n"

+"Números: "

+numerosSelecionados.join(", ")

);

});

}

`;

});

}

}
}
];

});

}

}
}

/* ==========================================
   ENVIAR PARA WHATSAPP
========================================== */

const btnWhatsapp =
document.getElementById("btnWhatsapp");

if(btnWhatsapp){

    btnWhatsapp.addEventListener("click", enviarWhatsApp);

}

function enviarWhatsApp(){

    const nome =
    document.getElementById("nome").value.trim();

    const telefone =
    document.getElementById("telefone").value.trim();

    const cidade =
    document.getElementById("cidade").value.trim();

    if(nome===""){

        alert("Informe seu nome.");

        return;

    }

    if(telefone===""){

        alert("Informe seu WhatsApp.");

        return;

    }

    if(numerosSelecionados.length===0){

        alert("Escolha pelo menos um número.");

        return;

    }

    let mensagem =

`🎟️ *Rifa Beneficente*

👤 Nome: ${nome}

📱 WhatsApp: ${telefone}

🏙️ Cidade: ${cidade}

🎁 Prêmio:
${CONFIG.premio}

🎟️ Números escolhidos:

${numerosSelecionados.join(", ")}

💳 Aguardo confirmação da reserva.

Obrigado!`;

    const url =
`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url,"_blank");

}
