// ==========================
// GilSigns - Sistema de Rifa
// Etapa 3
// ==========================

const quantidadeNumeros = 1000;

const numerosContainer = document.getElementById("numeros");

let numeroSelecionado = null;

// Simulação local.
// Depois será substituída pelo Firebase.
const numerosReservados = {};

function verificarNumero(){

    const numero = document
        .getElementById("numeroEscolhido")
        .value
        .padStart(3,"0");

    if(numero === ""){
        alert("Digite um número de 1 a 999.");
        return;
    }

    if(numerosReservados[numero]){

        document.getElementById("statusNumero").innerHTML =
        "🔴 Número " + numero + " indisponível.";

        numeroSelecionado = null;

    }else{

        document.getElementById("statusNumero").innerHTML =
        "🟢 Número " + numero + " disponível.";

        numeroSelecionado = numero;

    }

}

function numeroDaSorte(){

    let numero;

    do{

        numero =
        Math.floor(Math.random()*1000)
        .toString()
        .padStart(3,"0");

    }while(numerosReservados[numero]);

    document.getElementById("numeroEscolhido").value = numero;

    verificarNumero();

}

function reservarNumero(){

    if(numeroSelecionado==null){

        alert("Primeiro escolha um número.");

        return;

    }

    const nome =
    document.getElementById("nome").value;

    const telefone =
    document.getElementById("telefone").value;

    const cidade =
    document.getElementById("cidade").value;

    if(nome=="" || telefone=="" || cidade==""){

        alert("Preencha todos os campos.");

        return;

    }

    numerosReservados[numeroSelecionado]={

        nome,
        telefone,
        cidade

    };

    alert("Reserva realizada com sucesso!\nNúmero: "+numeroSelecionado);

}
