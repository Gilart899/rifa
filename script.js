/* ==========================================
   RIFA GILSIGNS
   script.js
========================================== */

// Lista de números
let numerosSelecionados = [];
let numerosReservados = [];

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

        document.getElementById("numeroEscolhido").value = numero;

        localStorage.removeItem("numeroSelecionado");

    }

}

/* ==========================================
   CONFIGURAÇÕES
========================================== */

function carregarConfiguracoes(){

    document.title = CONFIG.titulo;

    document.getElementById("beneficiada").textContent = CONFIG.beneficiada;

    document.getElementById("premio").textContent = CONFIG.premio;

    document.getElementById("valorNumero").textContent =
CONFIG.moeda + " " + CONFIG.valorNumero.toFixed(2);

document.getElementById("dataSorteio").textContent =
CONFIG.dataSorteio;

document.getElementById("resultadoSorteio").textContent =
CONFIG.resultado;

    document.getElementById("pix").textContent =
        CONFIG.pixChave;

}

/* ==========================================
   EVENTOS
========================================== */

function iniciarEventos(){

    document.getElementById("btnSorte")
        .addEventListener("click", numeroDaSorte);

    document.getElementById("btnVerificar")
        .addEventListener("click", verificarNumero);

    document.getElementById("btnAdicionar")
        .addEventListener("click", adicionarNumero);

    document.getElementById("btnReservar")
        .addEventListener("click", reservarNumeros);

    document.getElementById("btnWhatsapp")
        .addEventListener("click", enviarWhatsapp);

    document.getElementById("copiarPix")
        .addEventListener("click", copiarPix);

    document.getElementById("btnFecharModal")
        .addEventListener("click", fecharModal);

}

/* ==========================================
   CARROSSEL
========================================== */

let slideAtual = 0;

function iniciarCarrossel(){

    const slides = document.querySelectorAll(".slide");

    const indicadores = document.querySelectorAll(".indicador");

    if(slides.length === 0) return;

    setInterval(()=>{

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

/* ==========================================
   NÚMERO DA SORTE
========================================== */

function numeroDaSorte(){

    const numero = Math.floor(Math.random()*1000);

    document.getElementById("numeroEscolhido").value =
        numero.toString().padStart(3,"0");

}/* ==========================================
   VERIFICAR DISPONIBILIDADE
========================================== */

function verificarNumero(){

    let numero = document.getElementById("numeroEscolhido").value.trim();

    if(numero === ""){

        abrirModal("Atenção","Digite um número primeiro.","⚠️");
        return;

    }

    numero = numero.padStart(3,"0");

    if(numerosReservados.includes(numero)){

        abrirModal(
            "Número indisponível",
            "O número "+numero+" já foi reservado.",
            "❌"
        );

        return;

    }

    abrirModal(
        "Número disponível",
        "O número "+numero+" está livre.",
        "✅"
    );

}

/* ==========================================
   ADICIONAR À CARTELA
========================================== */

function adicionarNumero(){

    let numero = document.getElementById("numeroEscolhido").value.trim();

    if(numero===""){

        abrirModal("Atenção","Digite um número.","⚠️");
        return;

    }

    numero = numero.padStart(3,"0");

    if(numerosReservados.includes(numero)){

        abrirModal(
            "Número reservado",
            "Escolha outro número.",
            "❌"
        );

        return;

    }

    if(numerosSelecionados.includes(numero)){

        abrirModal(
            "Aviso",
            "Esse número já está na sua cartela.",
            "ℹ️"
        );

        return;

    }

    numerosSelecionados.push(numero);

    atualizarCartela();

    document.getElementById("numeroEscolhido").value="";

}

/* ==========================================
   ATUALIZAR CARTELA
========================================== */

function atualizarCartela(){

    const area = document.getElementById("numerosSelecionados");

    if(numerosSelecionados.length===0){

        area.innerHTML="<p>Você ainda não escolheu nenhum número.</p>";
        return;

    }

    area.innerHTML="";

    numerosSelecionados.forEach(numero=>{

        area.innerHTML +=
        `<div class="numeroEscolhido">${numero}</div>`;

    });

}

/* ==========================================
   RESERVAR NÚMEROS
========================================== */

function reservarNumeros(){

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const cidade = document.getElementById("cidade").value.trim();

    if(nome === ""){
        abrirModal(
            "Atenção",
            "Informe seu nome.",
            "⚠️"
        );
        return;
    }

    if(telefone === ""){
        abrirModal(
            "Atenção",
            "Informe seu WhatsApp.",
            "⚠️"
        );
        return;
    }

    if(numerosSelecionados.length === 0){
        abrirModal(
            "Atenção",
            "Escolha pelo menos um número.",
            "⚠️"
        );
        return;
    }

    numerosSelecionados.forEach(numero => {

        reservasRef.push({

            numero: numero,
            nome: nome,
            telefone: telefone,
            cidade: cidade,
            status: "reservado",
            data: new Date().toISOString()

        });

    });

    numerosSelecionados = [];

    atualizarCartela();

    abrirModal(
    "Sucesso",
    "Reserva realizada com sucesso!",
    "🎉"
);

}
/* ==========================================
   COPIAR PIX
========================================== */

function copiarPix(){

    navigator.clipboard.writeText(CONFIG.pixChave);

    abrirModal(
        "PIX Copiado",
        "A chave PIX foi copiada com sucesso.",
        "💳"
    );

}

/* ==========================================
   ENVIAR WHATSAPP
========================================== */

function enviarWhatsapp(){

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const cidade = document.getElementById("cidade").value.trim();

    if(nome===""){

        abrirModal("Atenção","Informe seu nome.","⚠️");
        return;

    }

    if(telefone===""){

        abrirModal("Atenção","Informe seu WhatsApp.","📱");
        return;

    }

    let mensagem =
`🎟️ *${CONFIG.titulo}*

👤 Nome: ${nome}

📱 WhatsApp: ${telefone}

🏙️ Cidade: ${cidade}

🎟️ Números:
${numerosSelecionados.join(", ")}

💳 PIX:
${CONFIG.pixChave}

Obrigado pela participação!`;

    const url =
`https://wa.me/55${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;

    window.open(url,"_blank");

}



/* ==========================================
   MODAL
========================================== */

function abrirModal(titulo, mensagem, icone){

    const modal = document.getElementById("modal");

    document.getElementById("iconeModal").innerHTML = icone;
    document.getElementById("tituloModal").textContent = titulo;
    document.getElementById("textoModal").textContent = mensagem;

    modal.style.display = "flex";

}

function fecharModal(){

    const modal = document.getElementById("modal");

    if(modal){

        modal.style.display = "none";

    }

}
