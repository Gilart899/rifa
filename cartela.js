/* ==========================================
   CARTELA
========================================== */

const parametros = new URLSearchParams(window.location.search);

const inicio = parseInt(parametros.get("inicio")) || 0;

const fim = inicio + 99;

document.getElementById("tituloCartela").innerHTML =
`${inicio.toString().padStart(3,"0")} até ${fim.toString().padStart(3,"0")}`;

const grade = document.getElementById("gradeNumeros");

for(let i=inicio;i<=fim;i++){

    const numero=i.toString().padStart(3,"0");

    const botao=document.createElement("button");

    botao.innerHTML=numero;

    botao.className="numeroLivre";

    botao.onclick=()=>{

        localStorage.setItem("numeroEscolhido",numero);

        window.location="index.html";

    };

    grade.appendChild(botao);

}
