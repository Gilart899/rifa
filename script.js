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
/* ==========================================
   VERIFICAR DISPONIBILIDADE
========================================== */

function verificarNumero(){

    let numero = document.getElementById("numeroEscolhido").value.trim();

    if(numero === ""){

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
            "Número indisponível",
            "O número " + numero + " já foi reservado.",
            "❌"
        );

        return;
    }

    abrirModal(
        "Número disponível",
        "O número " + numero + " está livre.",
        "✅"
    );

}

/* ==========================================
   ADICIONAR À CARTELA
========================================== */

function adicionarNumero(){

    let numero = document.getElementById("numeroEscolhido").value.trim();

    if(numero === ""){

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

    document.getElementById("numeroEscolhido").value = "";

}

/* ==========================================
   CARTELA
========================================== */

function atualizarCartela(){

    const area = document.getElementById("numerosSelecionados");

    if(!area) return;

    if(numerosSelecionados.length === 0){

        area.innerHTML =
        "<p>Você ainda não escolheu nenhum número.</p>";

        return;

    }

    area.innerHTML = "";

    numerosSelecionados.forEach(numero=>{

        area.innerHTML +=
        `<div class="numeroEscolhido">${numero}</div>`;

    });

}

/* ==========================================
   RESERVAR NÚMEROS
========================================== */

function reservarNumeros(){

    const nome =
    document.getElementById("nome").value.trim();

    const telefone =
    document.getElementById("telefone").value.trim();

    const cidade =
    document.getElementById("cidade").value.trim();

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
            "📱"
        );

        return;

    }

    if(numerosSelecionados.length === 0){

        abrirModal(
            "Atenção",
            "Escolha pelo menos um número.",
            "🎟️"
        );

        return;

    }

    numerosSelecionados.forEach(numero=>{

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
        "PIX copiado",
        "A chave PIX foi copiada com sucesso.",
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
            "📱"
        );

        return;

    }

    let mensagem =
`🎟️ ${CONFIG.titulo}

👤 Nome: ${nome}

📱 WhatsApp: ${telefone}

🏙️ Cidade: ${cidade}

🎟️ Números:
${numerosSelecionados.join(", ")}

💰 Valor:
${CONFIG.moeda} ${(numerosSelecionados.length * CONFIG.valorNumero).toFixed(2)}

💳 PIX:
${CONFIG.pixChave}

Obrigado pela participação!`;

    const link =
`https://wa.me/55${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;

    window.open(link,"_blank");

}

/* ==========================================
   PROGRESSO DA RIFA
========================================== */

function atualizarProgresso(){

    const vendidos = numerosReservados.length;

    const percentual =
    (vendidos / CONFIG.quantidadeNumeros) * 100;

    const barra =
    document.getElementById("barraProgresso");

    if(barra){

        barra.style.width =
        percentual + "%";

    }

    const texto =
    document.getElementById("textoProgresso");

    if(texto){

        texto.innerHTML =
        vendidos +
        " de " +
        CONFIG.quantidadeNumeros +
        " números reservados (" +
        percentual.toFixed(1) +
        "%)";

    }

}

/* ==========================================
   MODAL
========================================== */

function abrirModal(titulo,mensagem,icone){

    const modal =
    document.getElementById("modal");

    if(!modal){

        alert(titulo + "\n\n" + mensagem);

        return;

    }

    document.getElementById("iconeModal").textContent =
    icone;

    document.getElementById("tituloModal").textContent =
    titulo;

    document.getElementById("textoModal").textContent =
    mensagem;

    modal.style.display = "flex";

}

function fecharModal(){

    const modal =
    document.getElementById("modal");

    if(modal){

        modal.style.display = "none";

    }

       }
/* ==========================================
   ATUALIZAR ESTATÍSTICAS
========================================== */

function atualizarEstatisticas(){

    const reservados = numerosReservados.length;

    const disponiveis =
    CONFIG.quantidadeNumeros - reservados;

    const percentual =
    ((reservados / CONFIG.quantidadeNumeros) * 100).toFixed(1);

    const totalReservados =
    document.getElementById("totalReservados");

    if(totalReservados){
        totalReservados.textContent = reservados;
    }

    const totalDisponiveis =
    document.getElementById("totalDisponiveis");

    if(totalDisponiveis){
        totalDisponiveis.textContent = disponiveis;
    }

    const percentualHTML =
    document.getElementById("percentual");

    if(percentualHTML){
        percentualHTML.textContent = percentual + "%";
    }

    atualizarProgresso();

}

/* ==========================================
   UTILITÁRIOS
========================================== */

function formatarNumero(numero){

    return Number(numero)
        .toString()
        .padStart(3,"0");

}

function limparFormulario(){

    document.getElementById("nome").value = "";

    document.getElementById("telefone").value = "";

    document.getElementById("cidade").value = "";

    const obs =
    document.getElementById("observacao");

    if(obs){

        obs.value = "";

    }

}

function limparCartela(){

    numerosSelecionados = [];

    atualizarCartela();

}

/* ==========================================
   FECHAR MODAL CLICANDO FORA
========================================== */

window.addEventListener("click",(e)=>{

    const modal =
    document.getElementById("modal");

    if(modal && e.target === modal){

        fecharModal();

    }

});

/* ==========================================
   TECLA ENTER
========================================== */

const campoNumero =
document.getElementById("numeroEscolhido");

if(campoNumero){

    campoNumero.addEventListener("keypress",(e)=>{

        if(e.key === "Enter"){

            adicionarNumero();

        }

    });

}

console.log("======================================");
console.log("RIFA GILSIGNS");
console.log("Script carregado com sucesso.");
console.log("======================================");
