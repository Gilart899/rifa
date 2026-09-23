import { CONFIG } from './config.js';

import {
initializeApp
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';

import {
getDatabase,
ref,
get,
runTransaction
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js';

/* =========================================================
🔥 FIREBASE
========================================================= */

let db = null;

try {

if (
CONFIG &&
CONFIG.firebaseConfig &&
CONFIG.firebaseConfig.apiKey
) {

const app =
  initializeApp(CONFIG.firebaseConfig);

db =
  getDatabase(app);

console.log('✅ Firebase conectado.');

} else {

console.warn(
  '⚠️ Firebase não configurado em config.js.'
);

}

} catch (erro) {

console.error(
'❌ Erro ao iniciar Firebase:',
erro
);

}

/* =========================================================
⚙️ CONFIGURAÇÕES
========================================================= */

const VALOR_NUMERO =
Number(CONFIG?.valorNumero || 10);

const WHATSAPP =
'5579999145044';

const TEMPO_RESERVA =
24 * 60 * 60 * 1000;

/* =========================================================
🎯 ELEMENTOS
========================================================= */

const abrirCartelas =
document.getElementById('abrirCartelas');

const sugerir =
document.getElementById('sugerir');

const escolherNumeros =
document.getElementById('escolherNumeros');

const numeroDireto =
document.getElementById('numeroDireto');

const verificarNumeroBotao =
document.getElementById('verificarNumero');

const numeroStatus =
document.getElementById('numeroStatus');

const reservarNumero =
document.getElementById('reservarNumero');

const cartaoConfirmacao =
document.getElementById('confirmarParticipacao');

const mostrarDadosCompra =
document.getElementById('mostrarDadosCompra');

const dadosCompraOcultos =
document.getElementById('dadosCompraOcultos');

const reservaNumeros =
document.getElementById('reservaNumeros');

const reservaTotal =
document.getElementById('reservaTotal');

const reservaData =
document.getElementById('reservaData');

const reservaHora =
document.getElementById('reservaHora');

const limparSelecao =
document.getElementById('limparSelecao');

const copiarPixReserva =
document.getElementById('copiarPixReserva');

const pixMsgReserva =
document.getElementById('pixMsgReserva');

const nomeReserva =
document.getElementById('nomeReserva');

const telefoneReserva =
document.getElementById('telefoneReserva');

const enviarComprovante =
document.getElementById('enviarComprovante');

const comprovanteSelecionado =
document.getElementById('comprovanteSelecionado');

const nomeComprovante =
document.getElementById('nomeComprovante');

const msgReserva =
document.getElementById('msgReserva');

const dataSorteioPublico =
document.getElementById('dataSorteioPublico');

const scratch =
document.getElementById('raspadinhaAmizade');

const scratchCanvas =
document.getElementById('scratchCanvas');

const scratchPremio =
document.getElementById('scratchPremio');

const scratchSubtexto =
document.getElementById('scratchSubtexto');

const scratchInstruction =
document.querySelector('.scratch-instruction');

const revelarNumeroSorte =
document.getElementById('revelarNumeroSorte');

const numeroSorteResultado =
document.getElementById('numeroSorteResultado');

/* =========================================================
🧠 ESTADO DA COMPRA
========================================================= */

let compraAtual = {

numeros: [],

quantidade: 0,

total: 0,

data: '',

hora: '',

timestamp: '',

status: 'selecionado',

expiraEm: null

};

/* =========================================================
🔢 FORMATAÇÃO DO NÚMERO
========================================================= */

function formatarNumero(valor) {

const texto =
String(valor ?? '').trim();

if (!/^\d{1,3}$/.test(texto)) {
return null;
}

const numero =
Number(texto);

if (
!Number.isInteger(numero) ||
numero < 0 ||
numero > 999
) {
return null;
}

return String(numero).padStart(3, '0');
}

/* =========================================================
🎟️ NORMALIZAR LISTA DE NÚMEROS
========================================================= */

function normalizarListaNumeros(lista) {

if (!Array.isArray(lista)) {
return [];
}

const resultado = [];

lista.forEach(valor => {

const numero =
  formatarNumero(valor);

if (
  numero &&
  !resultado.includes(numero)
) {
  resultado.push(numero);
}

});

return resultado.slice(0, 10);
}

/* =========================================================
💰 FORMATAÇÃO DO VALOR
========================================================= */

function formatarValor(valor) {

return Number(valor || 0).toLocaleString(
'pt-BR',
{
style: 'currency',
currency: 'BRL'
}
);

}

/* =========================================================
📅 DATA E HORA ATUAIS
========================================================= */

function obterDataHora() {

const agora =
new Date();

return {

data:
  agora.toLocaleDateString('pt-BR'),

hora:
  agora.toLocaleTimeString(
    'pt-BR',
    {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }
  ),

timestamp:
  agora.toISOString()

};

}

/* =========================================================
🟢 STATUS DO NÚMERO
========================================================= */

function mostrarStatus(
mensagem,
tipo = 'verificando'
) {

if (!numeroStatus) {
return;
}

numeroStatus.style.display =
'flex';

numeroStatus.textContent =
mensagem;

numeroStatus.classList.remove(
'disponivel',
'indisponivel',
'verificando',
'erro'
);

numeroStatus.classList.add(tipo);

}

/* =========================================================
⚠️ ERRO
========================================================= */

function mostrarErro(mensagem) {

mostrarStatus(
"⚠️ ${mensagem}",
'erro'
);

}

/* =========================================================
🧹 LIMPAR STATUS
========================================================= */

function limparNumeroStatus() {

if (numeroStatus) {

numeroStatus.textContent =
  '';

numeroStatus.style.display =
  'none';

numeroStatus.classList.remove(
  'disponivel',
  'indisponivel',
  'verificando',
  'erro'
);

}

if (reservarNumero) {

reservarNumero.hidden =
  true;

reservarNumero.style.display =
  'none';

reservarNumero.disabled =
  false;

reservarNumero.textContent =
  '🛒 COMPRAR NÚMERO';

delete reservarNumero.dataset.numero;

}

}

/* =========================================================
⏱️ RESERVA EXPIRADA
========================================================= */

function reservaExpirou(dados) {

if (!dados) {
return false;
}

const expiraEm =
Number(dados.expiraEm || 0);

if (!expiraEm) {
return false;
}

return Date.now() >= expiraEm;

}

/* =========================================================
🔒 NÚMERO OCUPADO
========================================================= */

function numeroEstaOcupado(dados) {

if (!dados) {
return false;
}

if (
String(dados.status || '').toLowerCase() ===
'reservado' &&
reservaExpirou(dados)
) {

return false;

}

const status =
String(
dados.status ||
dados.situacao ||
''
).toLowerCase();

return (

status === 'reservado' ||
status === 'vendido' ||
status === 'pago' ||
status === 'ocupado' ||
status === 'indisponivel' ||

dados.reservado === true ||
dados.vendido === true ||
dados.pago === true ||
dados.ocupado === true

);

}

/* =========================================================
💾 SALVAR COMPRA
========================================================= */

function salvarCompra() {

try {

localStorage.setItem(
  'rifaCompraAtual',
  JSON.stringify(compraAtual)
);

} catch (erro) {

console.warn(
  '⚠️ Não foi possível salvar a compra.',
  erro
);

}

}

/* =========================================================
💾 SALVAR SELEÇÃO
========================================================= */

function salvarSelecionados(numeros) {

try {

localStorage.setItem(
  'rifaSelecionados',
  JSON.stringify(numeros)
);

} catch (erro) {

console.warn(
  '⚠️ Não foi possível salvar a seleção.',
  erro
);

}

}

/* =========================================================
📋 LER SELEÇÃO DA CARTELA
========================================================= */

function lerSelecionados() {

try {

const salvo =
  localStorage.getItem(
    'rifaSelecionados'
  );

if (!salvo) {
  return [];
}

const lista =
  JSON.parse(salvo);

return normalizarListaNumeros(lista);

} catch (erro) {

console.warn(
  '⚠️ Erro ao ler números selecionados.',
  erro
);

return [];

}

}

/* =========================================================
🧾 PREENCHER CARTÃO DE CONFIRMAÇÃO
========================================================= */

function preencherCompra(
numeros,
dataHora = obterDataHora()
) {

const lista =
normalizarListaNumeros(numeros);

if (!lista.length) {
return false;
}

const quantidade =
lista.length;

const total =
quantidade * VALOR_NUMERO;

compraAtual = {

numeros: lista,

quantidade,

total,

data: dataHora.data,

hora: dataHora.hora,

timestamp: dataHora.timestamp,

status: 'selecionado',

expiraEm: null

};

salvarCompra();

if (reservaNumeros) {

reservaNumeros.textContent =
  lista.join(', ');

}

if (reservaTotal) {

reservaTotal.textContent =
  `🎟️ ${quantidade} número(s) • Total: ${formatarValor(total)}`;

}

if (reservaData) {

reservaData.textContent =
  dataHora.data;

}

if (reservaHora) {

reservaHora.textContent =
  dataHora.hora;

}

return true;

}

/* =========================================================
🧾 ABRIR CARTÃO DE CONFIRMAÇÃO
========================================================= */

function abrirCartaoConfirmacao() {

if (!cartaoConfirmacao) {
return;
}

cartaoConfirmacao.hidden =
false;

cartaoConfirmacao.style.display =
'block';

if (mostrarDadosCompra) {

mostrarDadosCompra.hidden =
  false;

mostrarDadosCompra.style.display =
  '';

}

if (dadosCompraOcultos) {

dadosCompraOcultos.hidden =
  true;

dadosCompraOcultos.style.display =
  'none';

}

setTimeout(() => {

cartaoConfirmacao.scrollIntoView({
  behavior: 'smooth',
  block: 'center'
});

}, 120);

}

/* =========================================================
🧾 MOSTRAR DADOS DA COMPRA
========================================================= */

function mostrarDetalhesCompra() {

if (!dadosCompraOcultos) {
return;
}

dadosCompraOcultos.hidden =
false;

dadosCompraOcultos.style.display =
'';

if (mostrarDadosCompra) {

mostrarDadosCompra.hidden =
  true;

mostrarDadosCompra.style.display =
  'none';

}

}

/* =========================================================
🛒 MOSTRAR BOTÃO COMPRAR
========================================================= */

function mostrarBotaoComprar(numero) {

if (!reservarNumero) {
return;
}

reservarNumero.hidden =
false;

reservarNumero.style.display =
'flex';

reservarNumero.disabled =
false;

reservarNumero.dataset.numero =
numero;

reservarNumero.textContent =
"🛒 COMPRAR ${numero}";

}

/* =========================================================
🔎 MOSTRAR NÚMERO DISPONÍVEL
========================================================= */

function mostrarDisponivel(numero) {

mostrarStatus(
"🟢 NÚMERO ${numero} DISPONÍVEL",
'disponivel'
);

mostrarBotaoComprar(numero);

}

/* =========================================================
🔴 MOSTRAR NÚMERO INDISPONÍVEL
========================================================= */

function mostrarIndisponivel(numero) {

mostrarStatus(
"🔴 NÚMERO ${numero} NÃO DISPONÍVEL",
'indisponivel'
);

if (reservarNumero) {

reservarNumero.hidden =
  true;

reservarNumero.style.display =
  'none';

delete reservarNumero.dataset.numero;

}

}

/* =========================================================
🔎 VERIFICAR NÚMERO
========================================================= */

async function verificarNumero() {

if (!numeroDireto) {
return;
}

const numero =
formatarNumero(
numeroDireto.value
);

if (!numero) {

mostrarErro(
  'Digite um número entre 000 e 999.'
);

return;

}

numeroDireto.value =
numero;

mostrarStatus(
'🔎 Verificando disponibilidade...',
'verificando'
);

if (!db) {

mostrarErro(
  'Firebase não está conectado. Verifique o config.js.'
);

return;

}

try {

const numeroRef =
  ref(
    db,
    `rifa/numeros/${numero}`
  );

const snapshot =
  await get(numeroRef);

if (!snapshot.exists()) {

  preencherCompra([numero]);

  abrirCartaoConfirmacao();

  mostrarDisponivel(numero);

  return;

}

const dados =
  snapshot.val();

if (
  String(dados.status || '').toLowerCase() ===
  'reservado' &&
  reservaExpirou(dados)
) {

  preencherCompra([numero]);

  abrirCartaoConfirmacao();

  mostrarDisponivel(numero);

  return;

}

if (numeroEstaOcupado(dados)) {

  mostrarIndisponivel(numero);

  return;

}

preencherCompra([numero]);

abrirCartaoConfirmacao();

mostrarDisponivel(numero);

} catch (erro) {

console.error(
  '❌ Erro ao verificar número:',
  erro
);

mostrarErro(
  'Não foi possível verificar o número.'
);

}

}

/* =========================================================
🔒 RESERVAR UM NÚMERO
========================================================= */

async function reservarNumeroFirebase(numero) {

if (!db) {

throw new Error(
  'Firebase não está conectado.'
);

}

const numeroRef =
ref(
db,
"rifa/numeros/${numero}"
);

const agora =
obterDataHora();

const expiraEm =
Date.now() +
TEMPO_RESERVA;

const resultado =
await runTransaction(
numeroRef,
atual => {

    if (atual === null) {

      return {

        numero,

        status: 'reservado',

        reservado: true,

        dataReserva:
          agora.timestamp,

        expiraEm

      };

    }

    if (
      String(atual.status || '').toLowerCase() ===
      'reservado' &&
      reservaExpirou(atual)
    ) {

      return {

        ...atual,

        numero,

        status: 'reservado',

        reservado: true,

        dataReserva:
          agora.timestamp,

        expiraEm

      };

    }

    if (numeroEstaOcupado(atual)) {

      return;

    }

    return {

      ...atual,

      numero,

      status: 'reservado',

      reservado: true,

      dataReserva:
        agora.timestamp,

      expiraEm

    };

  }
);

if (!resultado.committed) {

throw new Error(
  `O número ${numero} acabou de ser reservado por outra pessoa.`
);

}

return {
...agora,
expiraEm
};

}

/* =========================================================
🛒 CONFIRMAR PARTICIPAÇÃO / RESERVAR SELEÇÃO
========================================================= */

async function confirmarParticipacao() {

const numeros =
normalizarListaNumeros(
compraAtual.numeros
);

if (!numeros.length) {

const selecionados =
  lerSelecionados();

if (selecionados.length) {

  preencherCompra(
    selecionados
  );

}

}

const listaFinal =
normalizarListaNumeros(
compraAtual.numeros
);

if (!listaFinal.length) {

mostrarErro(
  'Escolha pelo menos um número antes de confirmar.'
);

return;

}

if (listaFinal.length > 10) {

mostrarErro(
  'Você pode selecionar no máximo 10 números.'
);

return;

}

if (!db) {

mostrarErro(
  'Firebase não está conectado.'
);

return;

}

if (mostrarDadosCompra) {

mostrarDadosCompra.disabled =
  true;

mostrarDadosCompra.textContent =
  '⏳ CONFIRMANDO PARTICIPAÇÃO...';

}

try {

const reservasRealizadas = [];

for (const numero of listaFinal) {

  const resultado =
    await reservarNumeroFirebase(
      numero
    );

  reservasRealizadas.push({
    numero,
    ...resultado
  });

}

const primeiro =
  reservasRealizadas[0];

compraAtual.status =
  'reservado';

compraAtual.expiraEm =
  Math.min(
    ...reservasRealizadas.map(
      item => item.expiraEm
    )
  );

compraAtual.timestamp =
  primeiro.timestamp;

salvarCompra();

salvarSelecionados(
  listaFinal
);

mostrarDetalhesCompra();

if (msgReserva) {

  msgReserva.textContent =
    `🔒 ${listaFinal.length} número(s) reservado(s) por 24 horas. Faça o pagamento via PIX e envie o comprovante.`;

}

if (numeroStatus) {

  mostrarStatus(
    `🔒 ${listaFinal.length} número(s) reservado(s) por 24 horas.`,
    'disponivel'
  );

}

if (reservarNumero) {

  reservarNumero.disabled =
    true;

  reservarNumero.textContent =
    listaFinal.length === 1
      ? `✅ ${listaFinal[0]} RESERVADO`
      : `✅ ${listaFinal.length} NÚMEROS RESERVADOS`;

}

} catch (erro) {

console.error(
  '❌ Erro ao confirmar participação:',
  erro
);

if (msgReserva) {

  msgReserva.textContent =
    `⚠️ ${erro.message || 'Não foi possível confirmar a participação.'}`;

}

mostrarErro(
  erro.message ||
  'Não foi possível reservar os números.'
);

} finally {

if (
  mostrarDadosCompra &&
  compraAtual.status !== 'reservado'
) {

  mostrarDadosCompra.disabled =
    false;

  mostrarDadosCompra.textContent =
    '🍀 🎟️ CONFIRMAR PARTICIPAÇÃO';

}

}

}

/* =========================================================
🛒 BOTÃO COMPRAR NÚMERO
========================================================= */

if (reservarNumero) {

reservarNumero.addEventListener(
'click',
() => {

  const numero =
    formatarNumero(
      reservarNumero.dataset.numero
    );

  if (!numero) {
    return;
  }

  preencherCompra([numero]);

  abrirCartaoConfirmacao();

}

);

}

/* =========================================================
🧾 BOTÃO CONFIRMAR PARTICIPAÇÃO
========================================================= */

if (mostrarDadosCompra) {

mostrarDadosCompra.addEventListener(
'click',
confirmarParticipacao
);

}

/* =========================================================
🎟️ ABRIR CARTELAS
========================================================= */

if (abrirCartelas) {

abrirCartelas.addEventListener(
'click',
() => {

  window.location.href =
    'cartela.html';

}

);

}

/* =========================================================
🍀 SUGERIR NÚMERO
========================================================= */

if (sugerir) {

sugerir.addEventListener(
'click',
() => {

  window.location.href =
    'cartela.html?sugerir=1';

}

);

}

/* =========================================================
🔎 BOTÃO VERIFICAR
========================================================= */

if (verificarNumeroBotao) {

verificarNumeroBotao.addEventListener(
'click',
verificarNumero
);

}

/* =========================================================
⌨️ DIGITAÇÃO
========================================================= */

if (numeroDireto) {

numeroDireto.addEventListener(
'input',
() => {

  numeroDireto.value =
    numeroDireto.value
      .replace(/\D/g, '')
      .slice(0, 3);

  limparNumeroStatus();

}

);

numeroDireto.addEventListener(
'keydown',
evento => {

  if (evento.key === 'Enter') {

    evento.preventDefault();

    verificarNumero();

  }

}

);

}

/* =========================================================
📋 COPIAR PIX
========================================================= */

if (copiarPixReserva) {

copiarPixReserva.addEventListener(
'click',
async () => {

  const pix =
    String(
      CONFIG?.pixChave ||
      CONFIG?.pix ||
      CONFIG?.pixKey ||
      ''
    ).trim();

  if (!pix) {

    if (pixMsgReserva) {

      pixMsgReserva.textContent =
        '⚠️ A chave PIX ainda não foi cadastrada.';

    }

    return;

  }

  try {

    await navigator.clipboard.writeText(
      pix
    );

    if (pixMsgReserva) {

      pixMsgReserva.textContent =
        '✅ Chave PIX copiada!';

    }

  } catch (erro) {

    if (pixMsgReserva) {

      pixMsgReserva.textContent =
        `📋 Chave PIX: ${pix}`;

    }

  }

}

);

}

/* =========================================================
📎 COMPROVANTE
========================================================= */

if (enviarComprovante) {

enviarComprovante.addEventListener(
'click',
() => {

  if (
    compraAtual.status !== 'reservado'
  ) {

    if (msgReserva) {

      msgReserva.textContent =
        '⚠️ Primeiro confirme sua participação para reservar o número.';

    }

    return;

  }

  const input =
    document.createElement('input');

  input.type =
    'file';

  input.accept =
    'image/*,.pdf';

  input.style.display =
    'none';

  document.body.appendChild(input);

  input.addEventListener(
    'change',
    () => {

      const arquivo =
        input.files?.[0];

      if (!arquivo) {

        input.remove();

        return;

      }

      if (comprovanteSelecionado) {

        comprovanteSelecionado.hidden =
          false;

      }

      if (nomeComprovante) {

        nomeComprovante.textContent =
          arquivo.name;

      }

      if (msgReserva) {

        msgReserva.textContent =
          '✅ Comprovante selecionado. Agora envie pelo WhatsApp para concluir o atendimento.';

      }

      const numeros =
        compraAtual.numeros.join(', ');

      const mensagem =
        [
          '🍀 RIFA SOLIDÁRIA — GILFEST',
          '',
          '📎 Envio de comprovante de pagamento',
          `🎟️ Número(s): ${numeros}`,
          `💰 Valor: ${formatarValor(compraAtual.total)}`,
          `👤 Nome: ${nomeReserva?.value || 'Não informado'}`,
          `📱 WhatsApp: ${telefoneReserva?.value || 'Não informado'}`,
          '',
          'Estou enviando o comprovante de pagamento.'
        ].join('\n');

      const url =
        `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem)}`;

      window.open(
        url,
        '_blank',
        'noopener,noreferrer'
      );

      input.remove();

    }
  );

  input.click();

}

);

}

/* =========================================================
🧹 LIMPAR SELEÇÃO
========================================================= */

if (limparSelecao) {

limparSelecao.addEventListener(
'click',
() => {

  compraAtual = {

    numeros: [],

    quantidade: 0,

    total: 0,

    data: '',

    hora: '',

    timestamp: '',

    status: 'selecionado',

    expiraEm: null

  };

  try {

    localStorage.removeItem(
      'rifaCompraAtual'
    );

    localStorage.removeItem(
      'rifaSelecionados'
    );

  } catch (erro) {

    console.warn(
      '⚠️ Erro ao limpar armazenamento.',
      erro
    );

  }

  if (reservaNumeros) {

    reservaNumeros.textContent =
      'Nenhum número selecionado';

  }

  if (reservaTotal) {

    reservaTotal.textContent =
      'Total: R$ 0,00';

  }

  if (reservaData) {

    reservaData.textContent =
      '—';

  }

  if (reservaHora) {

    reservaHora.textContent =
      '—';

  }

  if (nomeComprovante) {

    nomeComprovante.textContent =
      '—';

  }

  if (comprovanteSelecionado) {

    comprovanteSelecionado.hidden =
      true;

  }

  if (msgReserva) {

    msgReserva.textContent =
      '';

  }

  if (pixMsgReserva) {

    pixMsgReserva.textContent =
      '';

  }

  if (nomeReserva) {

    nomeReserva.value =
      '';

  }

  if (telefoneReserva) {

    telefoneReserva.value =
      '';

  }

  if (numeroDireto) {

    numeroDireto.value =
      '';

  }

  limparNumeroStatus();

  if (dadosCompraOcultos) {

    dadosCompraOcultos.hidden =
      true;

    dadosCompraOcultos.style.display =
      'none';

  }

  if (mostrarDadosCompra) {

    mostrarDadosCompra.hidden =
      false;

    mostrarDadosCompra.style.display =
      '';

    mostrarDadosCompra.disabled =
      false;

    mostrarDadosCompra.textContent =
      '🍀 🎟️ CONFIRMAR PARTICIPAÇÃO';

  }

  if (cartaoConfirmacao) {

    cartaoConfirmacao.hidden =
      true;

    cartaoConfirmacao.style.display =
      'none';

  }

  if (escolherNumeros) {

    escolherNumeros.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }

}

);

}

/* =========================================================
📦 RECUPERAR COMPRA SALVA
========================================================= */

function recuperarCompraSalva() {

let compraSalva = null;

try {

const salvo =
  localStorage.getItem(
    'rifaCompraAtual'
  );

if (salvo) {

  compraSalva =
    JSON.parse(salvo);

}

} catch (erro) {

console.warn(
  '⚠️ Não foi possível recuperar compra.',
  erro
);

}

if (
compraSalva &&
Array.isArray(compraSalva.numeros) &&
compraSalva.numeros.length
) {

compraAtual = {

  ...compraAtual,

  ...compraSalva,

  numeros:
    normalizarListaNumeros(
      compraSalva.numeros
    )

};

const dataHora = {

  data:
    compraAtual.data ||
    obterDataHora().data,

  hora:
    compraAtual.hora ||
    obterDataHora().hora,

  timestamp:
    compraAtual.timestamp ||
    obterDataHora().timestamp

};

preencherCompra(
  compraAtual.numeros,
  dataHora
);

compraAtual.status =
  compraSalva.status ||
  'selecionado';

compraAtual.expiraEm =
  compraSalva.expiraEm ||
  null;

salvarCompra();

abrirCartaoConfirmacao();

return true;

}

return false;

}

/* =========================================================
🎟️ RECUPERAR SELEÇÃO DA CARTELA
========================================================= */

function recuperarSelecaoDaCartela() {

const lista =
lerSelecionados();

if (!lista.length) {
return false;
}

const dataHora =
obterDataHora();

preencherCompra(
lista,
dataHora
);

abrirCartaoConfirmacao();

return true;

}

/* =========================================================
🔗 LER NÚMERO DA URL
========================================================= */

function lerNumerosDaURL() {

try {

const params =
  new URLSearchParams(
    window.location.search
  );

const numero =
  params.get('numero');

const numeros =
  params.get('numeros');

if (numeros) {

  const lista =
    normalizarListaNumeros(
      numeros.split(',')
    );

  if (lista.length) {

    preencherCompra(lista);

    abrirCartaoConfirmacao();

    return true;

  }

}

if (numero) {

  const formatado =
    formatarNumero(numero);

  if (formatado) {

    preencherCompra([formatado]);

    abrirCartaoConfirmacao();

    return true;

  }

}

} catch (erro) {

console.warn(
  '⚠️ Erro ao ler números da URL.',
  erro
);

}

return false;

}

/* =========================================================
📅 DATA DO SORTEIO
========================================================= */

async function carregarDataSorteio() {

if (!dataSorteioPublico || !db) {
return;
}

try {

const caminhos = [
  'rifa/config/dataSorteio',
  'rifa/configuracao/dataSorteio'
];

for (const caminho of caminhos) {

  const snapshot =
    await get(
      ref(db, caminho)
    );

  if (!snapshot.exists()) {
    continue;
  }

  const valor =
    snapshot.val();

  if (typeof valor === 'string') {

    dataSorteioPublico.textContent =
      valor;

    return;

  }

  if (
    valor &&
    typeof valor === 'object'
  ) {

    const data =
      valor.data ||
      valor.dataSorteio ||
      '';

    const hora =
      valor.hora ||
      valor.horaSorteio ||
      '';

    if (data || hora) {

      dataSorteioPublico.textContent =
        [data, hora]
          .filter(Boolean)
          .join(' às ');

      return;

    }

  }

}

} catch (erro) {

console.warn(
  '⚠️ Não foi possível carregar a data do sorteio.',
  erro
);

}

}

/* =========================================================
🍀 NÚMERO DA SORTE
========================================================= */

function mostrarNumeroDaSorte() {

if (!numeroSorteResultado) {
return;
}

const numeros =
normalizarListaNumeros(
compraAtual.numeros
);

if (!numeros.length) {

numeroSorteResultado.textContent =
  '🎟️ Primeiro escolha um número da rifa.';

return;

}

/*

* Não criamos um número aleatório.
* 
* O número da sorte é um dos números
* efetivamente escolhidos pelo participante.
* 
* A definição definitiva poderá ser vinculada
* ao registro da compra posteriormente.
  */

const numero =
numeros[0];

numeroSorteResultado.textContent =
"🍀 Seu número da sorte é ${numero}";

}

/* =========================================================
🍀 BOTÃO NÚMERO DA SORTE
========================================================= */

if (revelarNumeroSorte) {

revelarNumeroSorte.addEventListener(
'click',
mostrarNumeroDaSorte
);

}

/* =========================================================
🪙 RASPADINHA — VISUAL
========================================================= */

function iniciarRaspadinha() {

if (
!scratch ||
!scratchCanvas
) {
return;
}

const area =
scratchCanvas.parentElement;

if (!area) {
return;
}

const largura =
Math.max(
280,
area.clientWidth || 320
);

const altura =
Math.max(
180,
Math.round(largura * 0.58)
);

const escala =
window.devicePixelRatio || 1;

scratchCanvas.width =
Math.round(largura * escala);

scratchCanvas.height =
Math.round(altura * escala);

scratchCanvas.style.width =
"${largura}px";

scratchCanvas.style.height =
"${altura}px";

const ctx =
scratchCanvas.getContext('2d');

if (!ctx) {
return;
}

ctx.setTransform(
escala,
0,
0,
escala,
0,
0
);

/* -------------------------------------------------------
COBERTURA PRATEADA
------------------------------------------------------- */

const gradiente =
ctx.createLinearGradient(
0,
0,
largura,
altura
);

gradiente.addColorStop(
0,
'#8b8b8b'
);

gradiente.addColorStop(
0.22,
'#eeeeee'
);

gradiente.addColorStop(
0.45,
'#a8a8a8'
);

gradiente.addColorStop(
0.65,
'#f7f7f7'
);

gradiente.addColorStop(
0.82,
'#9a9a9a'
);

gradiente.addColorStop(
1,
'#dcdcdc'
);

ctx.globalCompositeOperation =
'source-over';

ctx.fillStyle =
gradiente;

ctx.fillRect(
0,
0,
largura,
altura
);

/* -------------------------------------------------------
TEXTURA
------------------------------------------------------- */

for (
let i = 0;
i < 900;
i++
) {

const x =
  Math.random() * largura;

const y =
  Math.random() * altura;

const tamanho =
  Math.random() * 2 + 0.4;

ctx.fillStyle =
  Math.random() > 0.5
    ? 'rgba(255,255,255,.25)'
    : 'rgba(0,0,0,.12)';

ctx.fillRect(
  x,
  y,
  tamanho,
  tamanho
);

}

/* -------------------------------------------------------
TEXTO RASPE AQUI
------------------------------------------------------- */

ctx.fillStyle =
'rgba(50,50,50,.78)';

ctx.textAlign =
'center';

ctx.textBaseline =
'middle';

ctx.font =
'900 25px Arial';

ctx.fillText(
'🍀 RASPE AQUI 🍀',
largura / 2,
altura / 2 - 10
);

ctx.font =
'600 13px Arial';

ctx.fillStyle =
'rgba(40,40,40,.7)';

ctx.fillText(
'Descubra sua sorte!',
largura / 2,
altura / 2 + 22
);

/* -------------------------------------------------------
RESULTADO INICIAL
------------------------------------------------------- */

if (scratchPremio) {

scratchPremio.textContent =
  '';

}

if (scratchSubtexto) {

scratchSubtexto.textContent =
  '';

}

/* -------------------------------------------------------
ESTADO
------------------------------------------------------- */

let raspando =
false;

let revelou =
false;

let ultimaPosicao =
null;

let areaRaspada =
0;

/* -------------------------------------------------------
RASPAGEM
------------------------------------------------------- */

function raspar(x, y) {

if (revelou) {
  return;
}

ctx.save();

ctx.globalCompositeOperation =
  'destination-out';

ctx.beginPath();

ctx.arc(
  x,
  y,
  24,
  0,
  Math.PI * 2
);

ctx.fill();

ctx.restore();

areaRaspada +=
  24 * 24 * Math.PI;

const areaTotal =
  largura * altura;

/*
 * Aproximadamente 45% raspado.
 */

if (
  areaRaspada >=
  areaTotal * 0.45
) {

  revelarRaspadinha();

}

}

/* -------------------------------------------------------
REVELAR
------------------------------------------------------- */

function revelarRaspadinha() {

if (revelou) {
  return;
}

revelou =
  true;

ctx.clearRect(
  0,
  0,
  largura,
  altura
);

/*
 * Não escolhemos prêmio aqui.
 *
 * O resultado verdadeiro deverá vir
 * do Firebase após confirmação do pagamento.
 */

if (scratchPremio) {

  scratchPremio.textContent =
    '🔒';

}

if (scratchSubtexto) {

  scratchSubtexto.textContent =
    'A raspadinha será liberada após a confirmação do pagamento.';

}

if (scratchInstruction) {

  scratchInstruction.textContent =
    '🍀 Pagamento aguardando confirmação.';

}

}

/* -------------------------------------------------------
MOUSE
------------------------------------------------------- */

scratchCanvas.addEventListener(
'pointerdown',
evento => {

  if (revelou) {
    return;
  }

  raspando =
    true;

  scratchCanvas.setPointerCapture?.(
    evento.pointerId
  );

  const rect =
    scratchCanvas.getBoundingClientRect();

  ultimaPosicao = {

    x:
      evento.clientX -
      rect.left,

    y:
      evento.clientY -
      rect.top

  };

  raspar(
    ultimaPosicao.x,
    ultimaPosicao.y
  );

}

);

scratchCanvas.addEventListener(
'pointermove',
evento => {

  if (
    !raspando ||
    revelou
  ) {
    return;
  }

  const rect =
    scratchCanvas.getBoundingClientRect();

  const x =
    evento.clientX -
    rect.left;

  const y =
    evento.clientY -
    rect.top;

  if (ultimaPosicao) {

    const distancia =
      Math.hypot(
        x - ultimaPosicao.x,
        y - ultimaPosicao.y
      );

    const passos =
      Math.max(
        1,
        Math.ceil(
          distancia / 10
        )
      );

    for (
      let i = 1;
      i <= passos;
      i++
    ) {

      const px =
        ultimaPosicao.x +
        (x - ultimaPosicao.x) *
        (i / passos);

      const py =
        ultimaPosicao.y +
        (y - ultimaPosicao.y) *
        (i / passos);

      raspar(px, py);

    }

  } else {

    raspar(x, y);

  }

  ultimaPosicao = {
    x,
    y
  };

}

);

scratchCanvas.addEventListener(
'pointerup',
() => {

  raspando =
    false;

  ultimaPosicao =
    null;

}

);

scratchCanvas.addEventListener(
'pointercancel',
() => {

  raspando =
    false;

  ultimaPosicao =
    null;

}

);

}

/* =========================================================
📱 AJUSTAR RASPADINHA AO REDIMENSIONAR
========================================================= */

let redimensionamentoRaspadinha;

window.addEventListener(
'resize',
() => {

clearTimeout(
  redimensionamentoRaspadinha
);

redimensionamentoRaspadinha =
  setTimeout(
    () => {

      iniciarRaspadinha();

    },
    250
  );

}
);

/* =========================================================
🚀 INICIALIZAÇÃO
========================================================= */

document.addEventListener(
'DOMContentLoaded',
async () => {

/*
 * O cartão começa escondido.
 */

if (cartaoConfirmacao) {

  cartaoConfirmacao.hidden =
    true;

  cartaoConfirmacao.style.display =
    'none';

}

if (dadosCompraOcultos) {

  dadosCompraOcultos.hidden =
    true;

  dadosCompraOcultos.style.display =
    'none';

}

/*
 * Tenta recuperar compra já confirmada.
 */

const recuperouCompra =
  recuperarCompraSalva();

/*
 * Se não houver compra salva,
 * tenta recuperar os números vindos da cartela.
 */

if (!recuperouCompra) {

  const recuperouCartela =
    recuperarSelecaoDaCartela();

  if (recuperouCartela) {

    try {

      localStorage.removeItem(
        'rifaSelecionados'
      );

    } catch (erro) {

      console.warn(
        '⚠️ Não foi possível limpar seleção temporária.',
        erro
      );

    }

  } else {

    lerNumerosDaURL();

  }

}

/*
 * Data do sorteio.
 */

await carregarDataSorteio();

/*
 * Raspadinha visual.
 */

iniciarRaspadinha();

console.log(
  '🍀 Rifa Solidária inicializada.'
);

}
);
