/* ==========================================
PAINEL ADMINISTRATIVO
========================================== */

const corpoTabela =
document.querySelector("#tabelaReservas tbody");

reservasRef.on("value",(snapshot)=>{

    corpoTabela.innerHTML="";

    let reservados=0;
    let pagos=0;

    snapshot.forEach(item=>{

        const id=item.key;

        const dados=item.val();

        if(dados.status==="reservado") reservados++;

        if(dados.status==="pago") pagos++;

        corpoTabela.innerHTML+=`

<tr>

<td>${dados.numero}</td>

<td>${dados.nome}</td>

<td>${dados.telefone}</td>

<td>${dados.status}</td>

<td>

<button onclick="confirmarPagamento('${id}')">

✅ Pago

</button>

<button onclick="excluirReserva('${id}')">

🗑 Excluir

</button>

</td>

</tr>

`;

    });

    document.getElementById("adminReservados").innerHTML=reservados;

    document.getElementById("adminPagos").innerHTML=pagos;

    document.getElementById("adminDisponiveis").innerHTML=
    1000-(reservados+pagos);

});
