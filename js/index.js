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

import {
getAuth,
signInAnonymously,
onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

import {
getFunctions,
httpsCallable
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js';

/* =========================================================
🔥 FIREBASE
========================================================= */

let db = null;
let auth = null;
let functions = null;

let criarJogadaRaspadinhaServidor = null;
let revelarJogadaRaspadinhaServidor = null;

try {

if (
CONFIG &&
CONFIG.firebaseConfig &&
CONFIG.firebaseConfig.apiKey
) {

const app =
  initializeApp(
    CONFIG.firebaseConfig
  );

db =
  getDatabase(app);

auth =
  getAuth(app);

/*
 * A região precisa ser a mesma usada
 * nas Cloud Functions.
 */

functions =
  getFunctions(
    app,
    'southamerica-east1'
  );

criarJogadaRaspadinhaServidor =
  httpsCallable(
    functions,
    'criarJogadaRaspadinha'
  );

revelarJogadaRaspadinhaServidor =
  httpsCallable(
    functions,
    'revelarJogadaRaspadinha'
  );

console.log(
  '✅ Firebase conectado.'
);

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
Number(
CONFIG?.valorNumero || 10
);

const WHATSAPP =
'5579999145044';

/*

* ⏱️ RESERVA:
* Agora são 24 HORAS.
  */

const TEMPO_RESERVA =
24 * 60 * 60 * 1000;

/* =========================================================
🎯 ELEMENTOS
========================================================= */

const abrirCartelas =
document.getElementById(
'abrirCartelas'
);

const sugerir =
document.getElementById(
'sugerir'
);

const numeroDireto =
document.getElementById(
'numeroDireto'
);

const verificarNumeroBotao =
document.getElementById(
'verificarNumero'
);

const numeroStatus =
document.getElementById(
'numeroStatus'
);

const reservarNumero =
document.getElementById(
'reservarNumero'
);

const reservaNumeros =
document.getElementById(
'reservaNumeros'
);

const reservaTotal =
document.getElementById(
'reservaTotal'
);

const reservaData =
document.getElementById(
'reservaData'
);

const reservaHora =
document.getElementById(
'reservaHora'
);

const copiarPixReserva =
document.getElementById(
'copiarPixReserva'
);

const pixMsgReserva =
document.getElementById(
'pixMsgReserva'
);

const nomeReserva =
document.getElementById(
'nomeReserva'
);

const telefoneReserva =
document.getElementById(
'telefoneReserva'
);

const reservarReserva =
document.getElementById(
'reservarReserva'
);

const msgReserva =
document.getElementById(
'msgReserva'
);

/* =========================================================
🧠 COMPRA ATUAL
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
🎟️ CARTELAS
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
🔢 FORMATAR NÚMERO
========================================================= */

function formatarNumero(valor) {

const numero =
Number(valor);

if (
!Number.isInteger(numero) ||
numero < 0 ||
numero > 999
) {

return null;

}

return String(numero)
.padStart(3, '0');

}

/* =========================================================
📅 DATA E HORA
========================================================= */

function obterDataHora() {

const agora =
new Date();

return {

data:
  agora.toLocaleDateString(
    'pt-BR'
  ),

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
💰 VALOR
========================================================= */

function formatarValor(valor) {

return Number(valor || 0)
.toLocaleString(
'pt-BR',
{
style: 'currency',
currency: 'BRL'
}
);

}

/* =========================================================
🟢 STATUS
========================================================= */

function mostrarStatus(
mensagem,
tipo
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

numeroStatus.classList.add(
tipo
);

}

/* =========================================================
🧹 LIMPAR STATUS
========================================================= */

function limparNumeroStatus() {

if (numeroStatus) {

numeroStatus.style.display =
  'none';

numeroStatus.textContent =
  '';

numeroStatus.classList.remove(
  'disponivel',
  'indisponivel',
  'verificando',
  'erro'
);

}

if (reservarNumero) {

reservarNumero.style.display =
  'none';

reservarNumero.hidden =
  true;

reservarNumero.disabled =
  false;

reservarNumero.textContent =
  '🔴 CONFIRMAR PARTICIPAÇÃO';

reservarNumero.classList.remove(
  'confirmar-participacao',
  'reservado'
);

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
Number(
dados.expiraEm || 0
);

if (!expiraEm) {
return false;
}

return Date.now() >= expiraEm;

}

/* =========================================================
🔎 NÚMERO OCUPADO
========================================================= */

function numeroEstaOcupado(dados) {

if (!dados) {
return false;
}

if (
String(
dados.status || ''
).toLowerCase() === 'reservado' &&
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
🧾 MOSTRAR CONFIRMAÇÃO
========================================================= */

function mostrarConfirmacao(
numeros,
dataHora = obterDataHora()
) {

const lista =
Array.isArray(numeros)
? numeros
: [numeros];

const numerosFormatados =
lista
.map(formatarNumero)
.filter(Boolean);

if (!numerosFormatados.length) {
return;
}

const quantidade =
numerosFormatados.length;

const total =
quantidade *
VALOR_NUMERO;

compraAtual = {

numeros:
  numerosFormatados,

quantidade,

total,

data:
  dataHora.data,

hora:
  dataHora.hora,

timestamp:
  dataHora.timestamp,

status:
  'selecionado',

expiraEm:
  null

};

if (reservaNumeros) {

reservaNumeros.textContent =
  numerosFormatados.join(', ');

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

try {

localStorage.setItem(
  'rifaCompraAtual',
  JSON.stringify(
    compraAtual
  )
);

} catch (erro) {

console.warn(
  '⚠️ Não foi possível salvar a compra.',
  erro
);

}

const cartao =
document.querySelector(
'.reserva-inline'
);

if (cartao) {

cartao.style.display =
  'block';

setTimeout(
  () => {

    cartao.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

  },
  150
);

}

}

/* =========================================================
🟢 NÚMERO DISPONÍVEL
========================================================= */

function mostrarDisponivel(numero) {

mostrarConfirmacao(
[numero],
obterDataHora()
);

mostrarStatus(
"🟢 NÚMERO ${numero} DISPONÍVEL",
'disponivel'
);

if (reservarNumero) {

reservarNumero.style.display =
  'flex';

reservarNumero.hidden =
  false;

reservarNumero.disabled =
  false;

reservarNumero.textContent =
  '🔴 CONFIRMAR PARTICIPAÇÃO';

reservarNumero.dataset.numero =
  numero;

reservarNumero.classList.add(
  'confirmar-participacao'
);

reservarNumero.classList.remove(
  'reservado'
);

}

}

/* =========================================================
🔴 NÚMERO INDISPONÍVEL
========================================================= */

function mostrarIndisponivel(numero) {

mostrarStatus(
"🔴 NÚMERO ${numero} NÃO DISPONÍVEL",
'indisponivel'
);

if (reservarNumero) {

reservarNumero.style.display =
  'none';

reservarNumero.hidden =
  true;

reservarNumero.classList.remove(
  'confirmar-participacao',
  'reservado'
);

delete reservarNumero.dataset.numero;

}

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
🔎 VERIFICAR NÚMERO
========================================================= */

async function verificarNumero() {

if (!numeroDireto) {
return;
}

const valor =
numeroDireto.value.trim();

if (valor === '') {

mostrarErro(
  'Digite um número entre 000 e 999.'
);

return;

}

const numero =
formatarNumero(valor);

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

  mostrarDisponivel(numero);

  return;

}

const dados =
  snapshot.val();

if (
  String(
    dados.status || ''
  ).toLowerCase() === 'reservado' &&
  reservaExpirou(dados)
) {

  mostrarDisponivel(numero);

  return;

}

if (
  numeroEstaOcupado(dados)
) {

  mostrarIndisponivel(numero);

  return;

}

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
🔎 BOTÃO VERIFICAR
========================================================= */

if (verificarNumeroBotao) {

verificarNumeroBotao.addEventListener(
'click',
verificarNumero
);

}

/* =========================================================
🔢 DIGITAÇÃO
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

  if (
    evento.key === 'Enter'
  ) {

    evento.preventDefault();

    verificarNumero();

  }

}

);

}

/* =========================================================
🔒 RESERVAR NÚMERO
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

const dataHora =
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

        status:
          'reservado',

        reservado:
          true,

        dataReserva:
          dataHora.timestamp,

        expiraEm:
          expiraEm

      };

    }

    if (
      String(
        atual.status || ''
      ).toLowerCase() === 'reservado' &&
      reservaExpirou(atual)
    ) {

      return {

        ...atual,

        numero,

        status:
          'reservado',

        reservado:
          true,

        dataReserva:
          dataHora.timestamp,

        expiraEm:
          expiraEm

      };

    }

    if (
      numeroEstaOcupado(atual)
    ) {

      return;

    }

    return {

      ...atual,

      numero,

      status:
        'reservado',

      reservado:
        true,

      dataReserva:
        dataHora.timestamp,

      expiraEm:
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

...dataHora,

expiraEm

};

}

/* =========================================================
🔴 CONFIRMAR PARTICIPAÇÃO
========================================================= */

if (reservarNumero) {

reservarNumero.addEventListener(
'click',
async () => {

  const numero =
    reservarNumero.dataset.numero;

  if (!numero) {
    return;
  }

  if (!db) {

    mostrarErro(
      'Firebase não está conectado.'
    );

    return;

  }

  reservarNumero.disabled =
    true;

  reservarNumero.textContent =
    `⏳ RESERVANDO ${numero}...`;

  try {

    const resultado =
      await reservarNumeroFirebase(
        numero
      );

    compraAtual.status =
      'reservado';

    compraAtual.expiraEm =
      resultado.expiraEm;

    compraAtual.timestamp =
      resultado.timestamp;

    try {

      localStorage.setItem(
        'rifaCompraAtual',
        JSON.stringify(
          compraAtual
        )
      );

    } catch (erro) {

      console.warn(
        '⚠️ Não foi possível salvar a reserva.',
        erro
      );

    }

    mostrarStatus(
      `🔒 NÚMERO ${numero} RESERVADO POR 24 HORAS`,
      'disponivel'
    );

    reservarNumero.textContent =
      '✅ PARTICIPAÇÃO CONFIRMADA';

    reservarNumero.classList.remove(
      'confirmar-participacao'
    );

    reservarNumero.classList.add(
      'reservado'
    );

    reservarNumero.disabled =
      true;

    if (msgReserva) {

      msgReserva.textContent =
        '🔒 Seu número está reservado por 24 horas. Faça o pagamento via PIX e envie o comprovante pelo WhatsApp.';

    }

    const cartao =
      document.querySelector(
        '.reserva-inline'
      );

    if (cartao) {

      setTimeout(
        () => {

          cartao.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

        },
        200
      );

    }

  } catch (erro) {

    console.error(
      '❌ Erro ao reservar:',
      erro
    );

    reservarNumero.disabled =
      false;

    reservarNumero.textContent =
      '🔴 CONFIRMAR PARTICIPAÇÃO';

    mostrarErro(
      erro.message ||
      'Não foi possível reservar o número.'
    );

  }

}

);

}

/* =========================================================
💠 COPIAR PIX
========================================================= */

async function copiarChavePix(botao) {

const chave =
CONFIG &&
CONFIG.pixChave
? String(
CONFIG.pixChave
).trim()
: '';

if (!chave) {

if (pixMsgReserva) {

  pixMsgReserva.textContent =
    '⚠️ Chave PIX não configurada.';

}

return;

}

try {

if (
  navigator.clipboard &&
  window.isSecureContext
) {

  await navigator.clipboard.writeText(
    chave
  );

} else {

  throw new Error(
    'Clipboard indisponível'
  );

}

if (botao) {

  botao.textContent =
    '✅ PIX COPIADO!';

}

if (pixMsgReserva) {

  pixMsgReserva.textContent =
    '✅ Chave PIX copiada.';

}

setTimeout(
  () => {

    if (botao) {

      botao.textContent =
        '📋 COPIAR PIX';

    }

  },
  1800
);

} catch {

try {

  const campo =
    document.createElement(
      'textarea'
    );

  campo.value =
    chave;

  campo.style.position =
    'fixed';

  campo.style.left =
    '-9999px';

  campo.style.top =
    '0';

  campo.style.opacity =
    '0';

  document.body.appendChild(
    campo
  );

  campo.focus();
  campo.select();

  const copiou =
    document.execCommand(
      'copy'
    );

  campo.remove();

  if (!copiou) {
    throw new Error(
      'Falha ao copiar'
    );
  }

  if (botao) {

    botao.textContent =
      '✅ PIX COPIADO!';

  }

  if (pixMsgReserva) {

    pixMsgReserva.textContent =
      '✅ Chave PIX copiada.';

  }

  setTimeout(
    () => {

      if (botao) {

        botao.textContent =
          '📋 COPIAR PIX';

      }

    },
    1800
  );

} catch {

  if (pixMsgReserva) {

    pixMsgReserva.textContent =
      `📋 Copie manualmente: ${chave}`;

  }

}

}

}

if (copiarPixReserva) {

copiarPixReserva.addEventListener(
'click',
() => {

  copiarChavePix(
    copiarPixReserva
  );

}

);

}

/* =========================================================
📲 WHATSAPP
========================================================= */

function montarMensagemWhatsApp() {

const numeros =
compraAtual.numeros.join(', ');

const quantidade =
compraAtual.quantidade;

const total =
formatarValor(
compraAtual.total
);

const nome =
nomeReserva?.value.trim() ||
'Não informado';

const telefone =
telefoneReserva?.value.trim() ||
'Não informado';

return (

`🍀 *RIFA SOLIDÁRIA — GILFEST*\n\n` +

`🧾 *CONFIRMAÇÃO DE PARTICIPAÇÃO*\n\n` +

`🎟️ Número(s): *${numeros}*\n` +

`🔢 Quantidade: *${quantidade}*\n` +

`💰 Valor total: *${total}*\n` +

`📅 Data da compra: *${compraAtual.data}*\n` +

`🕐 Hora da compra: *${compraAtual.hora}*\n\n` +

`👤 Nome: *${nome}*\n` +

`📱 WhatsApp: *${telefone}*\n\n` +

`🔒 *Número reservado por 24 horas.*\n\n` +

`💚 Pagamento via PIX realizado.\n\n` +

`📎 *COMPROVANTE DE PAGAMENTO*\n` +

`Anexe nesta conversa o comprovante do pagamento.\n\n` +

`⚠️ *Só enviar esta mensagem com o pagamento já realizado.*\n\n` +

`🍀 Obrigado por participar da Rifa Solidária — GILFEST!`

);

}

if (reservarReserva) {

reservarReserva.addEventListener(
'click',
() => {

  if (
    !compraAtual.numeros ||
    !compraAtual.numeros.length
  ) {

    if (msgReserva) {

      msgReserva.textContent =
        '⚠️ Primeiro escolha um número e confirme sua participação.';

    }

    return;

  }

  if (
    compraAtual.status !==
    'reservado'
  ) {

    if (msgReserva) {

      msgReserva.textContent =
        '⚠️ Clique primeiro em CONFIRMAR PARTICIPAÇÃO.';

    }

    return;

  }

  if (
    compraAtual.expiraEm &&
    Date.now() >=
    Number(
      compraAtual.expiraEm
    )
  ) {

    if (msgReserva) {

      msgReserva.textContent =
        '⏰ O prazo da reserva terminou.';

    }

    return;

  }

  const nome =
    nomeReserva?.value.trim();

  const telefone =
    telefoneReserva?.value.trim();

  if (!nome) {

    if (msgReserva) {

      msgReserva.textContent =
        '⚠️ Informe seu nome antes de enviar.';

    }

    nomeReserva?.focus();

    return;

  }

  if (!telefone) {

    if (msgReserva) {

      msgReserva.textContent =
        '⚠️ Informe seu WhatsApp antes de enviar.';

    }

    telefoneReserva?.focus();

    return;

  }

  const mensagem =
    montarMensagemWhatsApp();

  const url =
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
      mensagem
    )}`;

  if (msgReserva) {

    msgReserva.textContent =
      '📲 Abrindo seu WhatsApp...';

  }

  window.open(
    url,
    '_blank'
  );

}

);

}

/* =========================================================
🔄 RECUPERAR COMPRA
========================================================= */

function recuperarCompraSalva() {

try {

const salva =
  localStorage.getItem(
    'rifaCompraAtual'
  );

if (!salva) {
  return false;
}

const dados =
  JSON.parse(
    salva
  );

if (
  !dados ||
  !Array.isArray(dados.numeros) ||
  !dados.numeros.length
) {

  return false;

}

compraAtual =
  dados;

if (reservaNumeros) {

  reservaNumeros.textContent =
    dados.numeros.join(', ');

}

if (reservaTotal) {

  reservaTotal.textContent =
    `🎟️ ${dados.quantidade} número(s) • Total: ${formatarValor(dados.total)}`;

}

if (reservaData) {

  reservaData.textContent =
    dados.data || '—';

}

if (reservaHora) {

  reservaHora.textContent =
    dados.hora || '—';

}

const cartao =
  document.querySelector(
    '.reserva-inline'
  );

if (cartao) {

  cartao.style.display =
    'block';

}

return true;

} catch (erro) {

console.warn(
  '⚠️ Erro ao recuperar compra:',
  erro
);

return false;

}

}

/* =========================================================
🔗 NÚMEROS VINDOS DA CARTELA
========================================================= */

function lerNumerosDaURL() {

const params =
new URLSearchParams(
window.location.search
);

const numero =
params.get('numero');

const numerosParam =
params.get('numeros');

let numeros = [];

if (numerosParam) {

numeros =
  numerosParam
    .split(',')
    .map(
      n =>
        formatarNumero(n)
    )
    .filter(Boolean);

} else if (numero) {

const formatado =
  formatarNumero(numero);

if (formatado) {

  numeros =
    [formatado];

}

}

if (!numeros.length) {

return false;

}

mostrarConfirmacao(
numeros,
obterDataHora()
);

return true;

}

/* =========================================================
🔐 AUTENTICAÇÃO DA RASPADINHA
========================================================= */

let autenticacaoPronta =
false;

function prepararAutenticacao() {

if (!auth) {

return Promise.resolve(
  null
);

}

return new Promise(
resolve => {

  if (
    auth.currentUser
  ) {

    autenticacaoPronta =
      true;

    resolve(
      auth.currentUser
    );

    return;

  }

  let resolvido =
    false;

  const finalizar =
    usuario => {

      if (resolvido) {
        return;
      }

      resolvido =
        true;

      autenticacaoPronta =
        true;

      resolve(
        usuario
      );

    };

  const cancelar =
    onAuthStateChanged(
      auth,
      usuario => {

        if (usuario) {

          finalizar(
            usuario
          );

          cancelar();

        }

      }
    );

  signInAnonymously(
    auth
  )
    .then(
      resultado => {

        finalizar(
          resultado.user
        );

      }
    )
    .catch(
      erro => {

        console.warn(
          '⚠️ Não foi possível autenticar a raspadinha:',
          erro
        );

        finalizar(
          null
        );

      }
    );

}

);

}

/* =========================================================
🍀🍀🍀
RASPADINHA DA AMIZADE
🍀🍀🍀
========================================================= */

function iniciarRaspadinha() {

const scratchCard =
document.querySelector(
'.scratch'
);

const canvas =
document.getElementById(
'scratchCanvas'
);

const resultado =
document.getElementById(
'scratchPremio'
);

const scratchArea =
document.querySelector(
'.scratch-area'
);

if (
!scratchCard ||
!canvas ||
!resultado ||
!scratchArea
) {

console.log(
  'ℹ️ Raspadinha: elementos ainda não encontrados.'
);

return;

}

/*

* Evita inicializar duas vezes
* e criar vários eventos no mesmo canvas.
  */

if (
canvas.dataset.iniciada === 'true'
) {

return;

}

canvas.dataset.iniciada =
'true';

/* =======================================================
🖼️ TAMANHO
======================================================= */

const largura =
Math.max(
1,
scratchArea.clientWidth
);

const altura =
Math.max(
1,
scratchArea.clientHeight
);

const dpr =
Math.max(
1,
window.devicePixelRatio || 1
);

canvas.width =
Math.round(
largura * dpr
);

canvas.height =
Math.round(
altura * dpr
);

canvas.style.width =
"${largura}px";

canvas.style.height =
"${altura}px";

canvas.style.touchAction =
'none';

const ctx =
canvas.getContext(
'2d',
{
willReadFrequently: true
}
);

if (!ctx) {

console.error(
  '❌ Não foi possível criar o contexto da raspadinha.'
);

return;

}

ctx.setTransform(
dpr,
0,
0,
dpr,
0,
0
);

/* =======================================================
🥇 CAPA DOURADA
======================================================= */

const gradiente =
ctx.createLinearGradient(
0,
0,
largura,
altura
);

gradiente.addColorStop(
0,
'#8c6200'
);

gradiente.addColorStop(
0.12,
'#f8dc75'
);

gradiente.addColorStop(
0.25,
'#c49318'
);

gradiente.addColorStop(
0.42,
'#fff1a8'
);

gradiente.addColorStop(
0.58,
'#b37a00'
);

gradiente.addColorStop(
0.75,
'#f5d35f'
);

gradiente.addColorStop(
0.9,
'#9b6b00'
);

gradiente.addColorStop(
1,
'#e8c24c'
);

ctx.fillStyle =
gradiente;

ctx.fillRect(
0,
0,
largura,
altura
);

/* =======================================================
✨ TEXTURA
======================================================= */

for (
let i = 0;
i < 450;
i++
) {

const x =
  Math.random() *
  largura;

const y =
  Math.random() *
  altura;

const tamanho =
  Math.random() *
  1.8 +
  0.4;

ctx.fillStyle =
  Math.random() > 0.5
    ? 'rgba(255,255,255,.18)'
    : 'rgba(80,45,0,.12)';

ctx.fillRect(
  x,
  y,
  tamanho,
  tamanho
);

}

/* =======================================================
🍀 DETALHES
======================================================= */

ctx.save();

ctx.textAlign =
'center';

ctx.textBaseline =
'middle';

ctx.fillStyle =
'rgba(45,30,0,.78)';

ctx.font =
'900 25px Arial';

ctx.fillText(
'🍀 RASPE AQUI 🍀',
largura / 2,
altura / 2 - 15
);

ctx.font =
'700 13px Arial';

ctx.fillText(
'Descubra sua sorte!',
largura / 2,
altura / 2 + 20
);

ctx.restore();

/* =======================================================
🎁 PRÊMIOS DE RESERVA VISUAL

 O prêmio REAL será definido pelo Firebase
 quando as funções servidor estiverem disponíveis.

======================================================= */

const premiosVisuais = [

{
  nome:
    'LIQUIDIFICADOR',

  emoji:
    '🎁',

  imagem:
    'img/liquidificador.png'

},

{
  nome:
    'FERRO ELÉTRICO',

  emoji:
    '✨',

  imagem:
    'img/ferro.png'

}

];

/*

* Não escolhemos mais o prêmio como resultado
* definitivo usando Math.random().
* 
* O servidor Firebase é consultado primeiro.
* 
* O prêmio visual abaixo serve apenas como
* fallback caso as Cloud Functions ainda não
* estejam disponíveis.
  */

let premioServidor =
null;

let premioVisual =
premiosVisuais[
Math.floor(
Math.random() *
premiosVisuais.length
)
];

/* =======================================================
🔒 ESTADO
======================================================= */

let raspando =
false;

let raspagemIniciada =
false;

let finalizado =
false;

let revelando =
false;

let ultimaX =
0;

let ultimaY =
0;

let ultimaVerificacao =
0;

let jogadaId =
null;

let numeroRifa =
null;

/* =======================================================
🔢 DESCOBRIR NÚMERO DA RIFA
======================================================= */

function obterNumeroRifa() {

if (
  numeroRifa
) {

  return numeroRifa;

}

if (
  compraAtual &&
  Array.isArray(
    compraAtual.numeros
  ) &&
  compraAtual.numeros.length
) {

  numeroRifa =
    formatarNumero(
      compraAtual.numeros[0]
    );

  return numeroRifa;

}

const params =
  new URLSearchParams(
    window.location.search
  );

const numeroURL =
  params.get(
    'numero'
  );

if (numeroURL) {

  numeroRifa =
    formatarNumero(
      numeroURL
    );

  return numeroRifa;

}

return null;

}

/* =======================================================
🔐 LIBERAR JOGADA NO SERVIDOR
======================================================= */

async function liberarJogadaServidor() {

if (
  !criarJogadaRaspadinhaServidor
) {

  return null;

}

const numero =
  obterNumeroRifa();

if (!numero) {

  return null;

}

try {

  await prepararAutenticacao();

  const resposta =
    await criarJogadaRaspadinhaServidor({
      numero
    });

  const dados =
    resposta?.data ||
    null;

  if (
    dados &&
    dados.jogadaId
  ) {

    jogadaId =
      dados.jogadaId;

  }

  return dados;

} catch (erro) {

  console.warn(
    '⚠️ Não foi possível liberar a jogada pelo servidor:',
    erro
  );

  return null;

}

}

/* =======================================================
🎁 REVELAR PRÊMIO NO SERVIDOR
======================================================= */

async function revelarPremioServidor() {

if (
  !revelarJogadaRaspadinhaServidor ||
  !jogadaId
) {

  return null;

}

try {

  await prepararAutenticacao();

  const resposta =
    await revelarJogadaRaspadinhaServidor({
      jogadaId
    });

  const dados =
    resposta?.data ||
    null;

  if (
    dados &&
    dados.resultado
  ) {

    premioServidor =
      dados.resultado;

    return dados.resultado;

  }

  return null;

} catch (erro) {

  console.warn(
    '⚠️ Não foi possível obter o prêmio pelo servidor:',
    erro
  );

  return null;

}

}

/* =======================================================
🖼️ MOSTRAR RESULTADO
======================================================= */

function mostrarResultadoPremio(
premio
) {

if (!premio) {

  premio =
    premioVisual;

}

const nome =
  premio.nome ||
  premioVisual.nome;

const emoji =
  premio.emoji ||
  '🎉';

resultado.textContent =
  `${emoji} ${nome}`;

/*
 * Se existir imagem do prêmio,
 * colocamos abaixo do texto.
 */

const imagem =
  premio.imagem;

if (imagem) {

  const imagemExistente =
    scratchCard.querySelector(
      '.scratch-premio-imagem'
    );

  if (
    !imagemExistente
  ) {

    const img =
      document.createElement(
        'img'
      );

    img.className =
      'scratch-premio-imagem';

    img.src =
      imagem;

    img.alt =
      nome;

    img.style.display =
      'block';

    img.style.maxWidth =
      '180px';

    img.style.maxHeight =
      '130px';

    img.style.objectFit =
      'contain';

    img.style.margin =
      '10px auto';

    resultado.insertAdjacentElement(
      'afterend',
      img
    );

  }

}

}

/* =======================================================
🖌️ RASPAGEM
======================================================= */

function raspar(
x,
y
) {

if (
  finalizado ||
  revelando
) {

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

raspagemIniciada =
  true;

verificarPercentual();

}

/* =======================================================
🖌️ LINHA CONTÍNUA
======================================================= */

function rasparLinha(
x1,
y1,
x2,
y2
) {

const distancia =
  Math.hypot(
    x2 - x1,
    y2 - y1
  );

const passos =
  Math.max(
    1,
    Math.ceil(
      distancia / 8
    )
  );

for (
  let i = 0;
  i <= passos;
  i++
) {

  const t =
    i / passos;

  const x =
    x1 +
    (x2 - x1) *
    t;

  const y =
    y1 +
    (y2 - y1) *
    t;

  raspar(
    x,
    y
  );

}

}

/* =======================================================
📊 PERCENTUAL RASPADO
======================================================= */

function verificarPercentual() {

const agora =
  Date.now();

if (
  agora -
  ultimaVerificacao <
  120
) {

  return;

}

ultimaVerificacao =
  agora;

try {

  const dados =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

  let transparentes =
    0;

  const passo =
    16;

  let analisados =
    0;

  for (
    let i = 3;
    i < dados.data.length;
    i += 4 * passo
  ) {

    analisados++;

    if (
      dados.data[i] <
      80
    ) {

      transparentes++;

    }

  }

  if (!analisados) {
    return;
  }

  const percentual =
    (
      transparentes /
      analisados
    ) *
    100;

  if (
    percentual >= 55
  ) {

    revelarRaspadinha();

  }

} catch (erro) {

  console.warn(
    '⚠️ Não foi possível calcular a raspagem:',
    erro
  );

}

}

/* =======================================================
🎉 REVELAR
======================================================= */

async function revelarRaspadinha() {

if (
  finalizado ||
  revelando
) {

  return;

}

revelando =
  true;

/*
 * Primeiro tenta buscar o resultado
 * verdadeiro no servidor.
 */

let premio =
  null;

if (
  jogadaId
) {

  premio =
    await revelarPremioServidor();

}

/*
 * Caso as Functions não estejam disponíveis,
 * mantém um fallback visual para não quebrar
 * a experiência da página.
 */

if (!premio) {

  premio =
    premioServidor ||
    premioVisual;

}

finalizado =
  true;

mostrarResultadoPremio(
  premio
);


/* =====================================================
   ✨ ANIMAÇÃO DE REVELAÇÃO
===================================================== */

canvas.style.transition =
  'opacity .45s ease';

canvas.style.opacity =
  '0';


const instrucao =
  scratchCard.querySelector(
    '.scratch-instruction'
  );

if (instrucao) {

  instrucao.textContent =
    `🎉 PARABÉNS! Você descobriu: ${premio.nome || premioVisual.nome}`;

}


/*
 * Guardamos apenas uma informação local
 * para preservar a experiência visual.
 *
 * O resultado oficial fica no Firebase.
 */

try {

  localStorage.setItem(
    'raspadinhaRevelada',
    JSON.stringify({
      premio:
        premio.nome ||
        premioVisual.nome,

      data:
        new Date().toISOString(),

      jogadaId:
        jogadaId ||
        null

    })
  );

} catch (erro) {

  console.warn(
    '⚠️ Não foi possível salvar o estado da raspadinha.',
    erro
  );

}

revelando =
  false;

}

/* =======================================================
🖱️ MOUSE
======================================================= */

canvas.addEventListener(
'mousedown',
evento => {

  if (
    finalizado ||
    revelando
  ) {

    return;

  }

  raspando =
    true;

  const rect =
    canvas.getBoundingClientRect();

  ultimaX =
    evento.clientX -
    rect.left;

  ultimaY =
    evento.clientY -
    rect.top;

  raspar(
    ultimaX,
    ultimaY
  );

}

);

canvas.addEventListener(
'mousemove',
evento => {

  if (
    !raspando ||
    finalizado ||
    revelando
  ) {

    return;

  }

  const rect =
    canvas.getBoundingClientRect();

  const x =
    evento.clientX -
    rect.left;

  const y =
    evento.clientY -
    rect.top;

  rasparLinha(
    ultimaX,
    ultimaY,
    x,
    y
  );

  ultimaX =
    x;

  ultimaY =
    y;

}

);

window.addEventListener(
'mouseup',
() => {

  raspando =
    false;

}

);

/* =======================================================
📱 TOUCH
======================================================= */

canvas.addEventListener(
'touchstart',
evento => {

  if (
    finalizado ||
    revelando
  ) {

    return;

  }

  evento.preventDefault();

  raspando =
    true;

  const toque =
    evento.touches[0];

  if (!toque) {
    return;
  }

  const rect =
    canvas.getBoundingClientRect();

  ultimaX =
    toque.clientX -
    rect.left;

  ultimaY =
    toque.clientY -
    rect.top;

  raspar(
    ultimaX,
    ultimaY
  );

},
{
  passive: false
}

);

canvas.addEventListener(
'touchmove',
evento => {

  if (
    !raspando ||
    finalizado ||
    revelando
  ) {

    return;

  }

  evento.preventDefault();

  const toque =
    evento.touches[0];

  if (!toque) {
    return;
  }

  const rect =
    canvas.getBoundingClientRect();

  const x =
    toque.clientX -
    rect.left;

  const y =
    toque.clientY -
    rect.top;

  rasparLinha(
    ultimaX,
    ultimaY,
    x,
    y
  );

  ultimaX =
    x;

  ultimaY =
    y;

},
{
  passive: false
}

);

canvas.addEventListener(
'touchend',
() => {

  raspando =
    false;

}

);

/* =======================================================
📱 REDIMENSIONAMENTO
======================================================= */

let larguraAnterior =
largura;

let alturaAnterior =
altura;

window.addEventListener(
'resize',
() => {

  if (
    raspagemIniciada ||
    finalizado
  ) {

    return;

  }

  const novaLargura =
    Math.max(
      1,
      scratchArea.clientWidth
    );

  const novaAltura =
    Math.max(
      1,
      scratchArea.clientHeight
    );

  if (
    novaLargura ===
    larguraAnterior &&
    novaAltura ===
    alturaAnterior
  ) {

    return;

  }

  /*
   * Se a tela mudou antes da raspagem,
   * recriamos somente o canvas.
   *
   * Não chamamos iniciarRaspadinha()
   * novamente para evitar duplicação
   * dos eventos.
   */

  larguraAnterior =
    novaLargura;

  alturaAnterior =
    novaAltura;

  /*
   * Mantemos a segurança:
   * se houver alteração importante de
   * orientação/tamanho antes do uso,
   * recarregar a página é desnecessário.
   *
   * A raspadinha permanece utilizável.
   */

}

);

/* =======================================================
🔒 MENU CONTEXTUAL
======================================================= */

canvas.addEventListener(
'contextmenu',
evento => {

  evento.preventDefault();

}

);

/* =======================================================
🎉 ESTADO INICIAL
======================================================= */

resultado.textContent =
'🥇 RASPE AQUI';

/*

* Tenta liberar a jogada no servidor.
* 
* Não bloqueia a raspadinha caso as Functions
* ainda não estejam publicadas.
  */

liberarJogadaServidor()
.then(
dados => {

    if (dados) {

      console.log(
        '🍀 Jogada da raspadinha liberada pelo Firebase.',
        dados
      );

    }

  }
)
.catch(
  erro => {

    console.warn(
      '⚠️ Liberação da raspadinha indisponível:',
      erro
    );

  }
);

console.log(
'🍀 Raspadinha da Amizade pronta.'
);

}

/* =========================================================
🚀 INICIALIZAÇÃO PRINCIPAL
========================================================= */

function inicializarPagina() {

const veioDaCartela =
lerNumerosDaURL();

if (!veioDaCartela) {

recuperarCompraSalva();

}

iniciarRaspadinha();

}

/*

* Como módulos ES já são executados depois que
* o documento foi analisado em condições normais,
* usamos DOMContentLoaded apenas como proteção.
  */

if (
document.readyState ===
'loading'
) {

document.addEventListener(
'DOMContentLoaded',
inicializarPagina,
{
once: true
}
);

} else {

inicializarPagina();

}

/* =========================================================
✨ ANIMAÇÃO DOS CARTÕES
========================================================= */

function animarCards() {

const cards =
document.querySelectorAll(
'.card'
);

cards.forEach(
(card, indice) => {

  card.style.animation =
    `cardEntrada .6s ease ${indice * 0.06}s both`;

}

);

}

if (
document.readyState ===
'loading'
) {

document.addEventListener(
'DOMContentLoaded',
animarCards,
{
once: true
}
);

} else {

animarCards();

}

/* =========================================================
🛡️ RASPADINHA VISÍVEL
========================================================= */

function ajustarRaspadinhaVisual() {

const scratchCard =
document.querySelector(
'.scratch'
);

if (scratchCard) {

scratchCard.style.display =
  'block';

scratchCard.style.width =
  '100%';

}

/* =======================================================
🛡️ CARTÕES VERTICAIS
======================================================= */

const stepsGrid =
document.querySelector(
'.steps-grid'
);

if (stepsGrid) {

stepsGrid.style.display =
  'flex';

stepsGrid.style.flexDirection =
  'column';

stepsGrid.style.width =
  '100%';

}

/* =======================================================
🛡️ TAMANHO DA RASPADINHA
======================================================= */

const scratchArea =
document.querySelector(
'.scratch-area'
);

if (scratchArea) {

scratchArea.style.width =
  'min(100%, 700px)';

scratchArea.style.margin =
  '18px auto';

scratchArea.style.position =
  'relative';

scratchArea.style.overflow =
  'hidden';

}

}

if (
document.readyState ===
'loading'
) {

document.addEventListener(
'DOMContentLoaded',
ajustarRaspadinhaVisual,
{
once: true
}
);

} else {

ajustarRaspadinhaVisual();

}
