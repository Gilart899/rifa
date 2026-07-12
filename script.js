// ==========================
// GilSigns - Sistema de Rifa
// Etapa 3
// ==========================

const quantidadeNumeros = 1000;

const numerosContainer = document.getElementById("numeros");

let numeroSelecionado = null;

function criarNumeros() {

    numerosContainer.innerHTML = "";

    for (let i = 1; i <= quantidadeNumeros; i++) {

        const numero = document.createElement("div");

        numero.classList.add("numero");

        numero.textContent = i.toString().padStart(3, "0");
        numero.onclick = () => selecionarNumero(numero, i);

        numerosContainer.appendChild(numero);
    }

}

function selecionarNumero(elemento, numero) {

    if (elemento.classList.contains("vendido")) return;

    document.querySelectorAll(".numero").forEach(item => {
        item.classList.remove("selecionado");
    });

    elemento.classList.add("selecionado");

    numeroSelecionado = numero;

}

function reservarNumero() {

    const nome = document.getElementById("nome").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const cidade = document.getElementById("cidade").value.trim();

    if (numeroSelecionado == null) {
        alert("Escolha um número.");
        return;
    }

    if (nome === "" || telefone === "" || cidade === "") {
        alert("Preencha todos os campos.");
        return;
    }

    const elemento = document.querySelectorAll(".numero")[numeroSelecionado - 1];

    elemento.classList.remove("selecionado");
    elemento.classList.add("reservado");

    alert(
        "Reserva realizada com sucesso!\n\n" +
        "Número: " + numeroSelecionado.toString().padStart(3, "0") +
        "\nNome: " + nome
    );

    document.getElementById("nome").value = "";
    document.getElementById("telefone").value = "";
    document.getElementById("cidade").value = "";

    numeroSelecionado = null;

}

criarNumeros();
