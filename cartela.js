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
