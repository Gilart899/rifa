/* ==========================================
   CARTELAS DA RIFA GILSIGNS
========================================== */

let cartelaAtual = 0;

/* ==========================================
CRIAR MENU DAS CARTELAS
========================================== */

function criarMenuCartelas(){

    const menu = document.getElementById("menuCartelas");

    for(let i=0;i<10;i++){

        const botao = document.createElement("button");

        botao.innerHTML =
        `${i*100} - ${(i*100)+99}`;

        botao.onclick = ()=>{

            abrirCartela(i);

        };

        menu.appendChild(botao);

    }

}

/* ==========================================
ABRIR CARTELA
========================================== */

function abrirCartela(numeroCartela){

    cartelaAtual = numeroCartela;

    gerarNumeros();

}
/* ==========================================
   GERAR NÚMEROS DA CARTELA
========================================== */

function gerarNumeros(){

    const grade = document.getElementById("gradeNumeros");

    grade.innerHTML = "";

    const inicio = cartelaAtual * 100;

    const fim = inicio + 99;

    for(let i=inicio; i<=fim; i++){

        const numero = i.toString().padStart(3,"0");

        const botao = document.createElement("button");

        botao.innerHTML = numero;

        /* Verifica se o número está reservado */

        if(numerosReservados.includes(numero)){

            botao.classList.add("numeroReservado");

            botao.disabled = true;

        }else{

            botao.classList.add("numeroLivre");

            botao.onclick = ()=>{

                selecionarNumero(numero);

            };

        }

        grade.appendChild(botao);

    }

}

/* ==========================================
   SELECIONAR NÚMERO
========================================== */

function selecionarNumero(numero){

    localStorage.setItem("numeroSelecionado", numero);

    window.location.href = "index.html";

}/* ==========================================
   INICIAR
========================================== */

document.addEventListener("DOMContentLoaded", ()=>{

    criarMenuCartelas();

    abrirCartela(0);

});
