/* ==========================================
   CARTELA GILSIGNS
========================================== */

const parametros = new URLSearchParams(window.location.search);

const inicio = parseInt(parametros.get("inicio")) || 0;
const fim = inicio + 99;

document.getElementById("tituloCartela").innerHTML =
`Cartela ${inicio.toString().padStart(3,"0")} • ${fim.toString().padStart(3,"0")}`;

const grade = document.getElementById("gradeNumeros");

/* Cria os 100 botões */

for(let i=inicio;i<=fim;i++){

    const numero=i.toString().padStart(3,"0");

    const botao=document.createElement("button");

    botao.id="num"+numero;

    botao.innerHTML=numero;

    botao.className="numeroLivre";

    botao.onclick=()=>selecionarNumero(numero);

    grade.appendChild(botao);

}

/* Atualiza em tempo real */

reservasRef.on("value",(snapshot)=>{

    document.querySelectorAll(".gradeNumeros button")
    .forEach(botao=>{

        botao.className="numeroLivre";

    });

    snapshot.forEach(item=>{

        const dados=item.val();

        const numero=dados.numero.toString().padStart(3,"0");

        const botao=document.getElementById("num"+numero);

        if(!botao) return;

        if(dados.status==="reservado"){

            botao.className="numeroReservado";

        }

        if(dados.status==="pago"){

            botao.className="numeroPago";

        }

    });

});

/* Escolher número */

function selecionarNumero(numero){

    const botao=document.getElementById("num"+numero);

    if(botao.classList.contains("numeroPago")){

        alert("Número já vendido.");

        return;

    }

    if(botao.classList.contains("numeroReservado")){

        alert("Número reservado.");

        return;

    }

    localStorage.setItem("numeroEscolhido",numero);

    window.location="index.html";

}
