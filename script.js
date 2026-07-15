/* ==========================================
   RIFA GILSIGNS
   script.js
========================================== */

let numerosSelecionados = [];
let numerosReservados = [];

document.addEventListener("DOMContentLoaded", () => {

    carregarConfiguracoes();

    iniciarCarrossel();

    iniciarEventos();

});

/* ==========================================
   CONFIGURAÇÕES
========================================== */

function carregarConfiguracoes(){

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
   EVENTOS DOS BOTÕES
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

}/* ==========================================
   NÚMERO DA SORTE
========================================== */

function numeroDaSorte(){

    const numero = Math.floor(Math.random() * 1000);

    document.getElementById("numeroEscolhido").value =
        numero.toString().padStart(3,"0");

}

/* ==========================================
   VERIFICAR DISPONIBILIDADE
========================================== */

function verificarNumero(){

    let numero =
        document.getElementById("numeroEscolhido")
        .value.trim();

    if(numero===""){

        abrirModal(
            "Atenção",
            "Digite um número primeiro.",
            "⚠️"
        );

        return;

    }

    numero = numero.padStart(3,"0");

    if(numerosReservados.includes(numero)){

        abrirModal(
            "Número Indisponível",
            "O número "+numero+" já foi reservado.",
            "❌"
        );

        return;

    }

    abrirModal(
        "Número Disponível",
        "O número "+numero+" está livre.",
        "✅"
    );

}

/* ==========================================
   ADICIONAR À CARTELA
========================================== */

function adicionarNumero(){

    let numero =
        document.getElementById("numeroEscolhido")
        .value.trim();

    if(numero===""){

        abrirModal(
            "Atenção",
            "Digite um número.",
            "⚠️"
        );

        return;

    }

    numero = numero.padStart(3,"0");

    if(numerosReservados.includes(numero)){

        abrirModal(
            "Número Reservado",
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
   CARTELA
========================================== */

function atualizarCartela(){

    const area =
        document.getElementById("numerosSelecionados");

    if(numerosSelecionados.length===0){

        area.innerHTML="<p>Nenhum número escolhido.</p>";

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

    if(numerosSelecionados.length===0){

        abrirModal(
            "Atenção",
            "Escolha pelo menos um número.",
            "⚠️"
        );

        return;

    }

    numerosSelecionados.forEach(numero=>{

        if(!numerosReservados.includes(numero)){

            numerosReservados.push(numero);

        }

    });

    atualizarCartela();

    atualizarProgresso();

    abrirModal(
        "Reserva realizada!",
        "Seus números foram reservados com sucesso.",
        "🎉"
    );

}

/* ==========================================
   COPIAR PIX
========================================== */

function copiarPix(){

    navigator.clipboard.writeText(CONFIG.pixChave);

    abrirModal(
        "PIX copiado",
        "A chave PIX foi copiada para a área de transferência.",
        "💳"
    );

}

/* ==========================================
   ENVIAR WHATSAPP
========================================== */

function enviarWhatsapp(){

    const nome =
        document.getElementById("nome").value.trim();

    const telefone =
        document.getElementById("telefone").value.trim();

    const cidade =
        document.getElementById("cidade").value.trim();

    if(nome===""){

        abrirModal(
            "Atenção",
            "Informe seu nome.",
            "⚠️"
        );

        return;

    }

    if(telefone===""){

        abrirModal(
            "Atenção",
            "Informe seu WhatsApp.",
            "📱"
        );

        return;

    }

    if(numerosSelecionados.length===0){

        abrirModal(
            "Atenção",
            "Escolha pelo menos um número.",
            "🎟️"
        );

        return;

    }

    let mensagem =

`🎟️ Rifa Beneficente

👤 Nome: ${nome}

📱 WhatsApp: ${telefone}

🏙️ Cidade: ${cidade}

🎁 Prêmio:
${CONFIG.premio}

🎟️ Números:
${numerosSelecionados.join(", ")}

💳 PIX:
${CONFIG.pixChave}

Obrigado!`;

    const link =

`https://wa.me/55${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;

    window.open(link,"_blank");

}

/* ==========================================
   BARRA DE PROGRESSO
========================================== */

function atualizarProgresso(){

    const vendidos = numerosReservados.length;

    const porcentagem = (vendidos / 1000) * 100;

    document.getElementById("barraProgresso").style.width =
        porcentagem + "%";

    document.getElementById("textoProgresso").innerHTML =

`${vendidos} números reservados (${porcentagem.toFixed(1)}%)`;

}
