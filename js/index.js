import { CONFIG } from './config.js';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getDatabase, ref, get, runTransaction } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js';

let db = null;

try {
  if (CONFIG?.firebaseConfig?.apiKey) {
    const app = initializeApp(CONFIG.firebaseConfig);
    db = getDatabase(app);
    console.log('✅ Firebase conectado.');
  }
} catch (erro) {
  console.error('❌ Erro ao iniciar Firebase:', erro);
}

const VALOR_NUMERO = Number(CONFIG?.valorNumero || 10);
const WHATSAPP = '5579999145044';
const TEMPO_RESERVA = 24 * 60 * 60 * 1000;

const abrirCartelas = document.getElementById('abrirCartelas');
const sugerir = document.getElementById('sugerir');
const numeroDireto = document.getElementById('numeroDireto');
const verificarNumeroBotao = document.getElementById('verificarNumero');
const numeroStatus = document.getElementById('numeroStatus');
const reservarNumero = document.getElementById('reservarNumero');
const reservaNumeros = document.getElementById('reservaNumeros');
const reservaTotal = document.getElementById('reservaTotal');
const reservaData = document.getElementById('reservaData');
const reservaHora = document.getElementById('reservaHora');
const copiarPixReserva = document.getElementById('copiarPixReserva');
const pixMsgReserva = document.getElementById('pixMsgReserva');
const nomeReserva = document.getElementById('nomeReserva');
const telefoneReserva = document.getElementById('telefoneReserva');
const reservarReserva = document.getElementById('reservarReserva');
const msgReserva = document.getElementById('msgReserva');
const mostrarDadosCompra = document.getElementById('mostrarDadosCompra');
const dadosCompraOcultos = document.getElementById('dadosCompraOcultos');
const limparSelecao = document.getElementById('limparSelecao');
const enviarComprovante = document.getElementById('enviarComprovante');
const comprovanteSelecionado = document.getElementById('comprovanteSelecionado');
const nomeComprovante = document.getElementById('nomeComprovante');
const revelarNumeroSorte = document.getElementById('revelarNumeroSorte');
const numeroSorteResultado = document.getElementById('numeroSorteResultado');

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

function formatarNumero(valor) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero < 0 || numero > 999) {
    return null;
  }

  return String(numero).padStart(3, '0');
}

function formatarValor(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function obterDataHora() {
  const agora = new Date();

  return {
    data: agora.toLocaleDateString('pt-BR'),
    hora: agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    timestamp: agora.toISOString()
  };
}

function salvarCompra() {
  try {
    localStorage.setItem(
      'rifaCompraAtual',
      JSON.stringify(compraAtual)
    );
  } catch (erro) {
    console.warn(erro);
  }
}

function prepararCompra(numeros, dataHora = obterDataHora()) {
  const lista = (Array.isArray(numeros) ? numeros : [numeros])
    .map(formatarNumero)
    .filter(Boolean);

  if (!lista.length) {
    return false;
  }

  const numerosUnicos = [...new Set(lista)];

  compraAtual = {
    numeros: numerosUnicos,
    quantidade: numerosUnicos.length,
    total: numerosUnicos.length * VALOR_NUMERO,
    data: dataHora.data,
    hora: dataHora.hora,
    timestamp: dataHora.timestamp,
    status: 'selecionado',
    expiraEm: null
  };

  if (reservaNumeros) {
    reservaNumeros.textContent = compraAtual.numeros.join(', ');
  }

  if (reservaTotal) {
    reservaTotal.textContent =
      `🎟️ ${compraAtual.quantidade} número(s) • Total: ${formatarValor(compraAtual.total)}`;
  }

  if (reservaData) {
    reservaData.textContent = compraAtual.data;
  }

  if (reservaHora) {
    reservaHora.textContent = compraAtual.hora;
  }

  salvarCompra();

  return true;
}

function mostrarCartaoConfirmacao() {
  const cartao = document.querySelector('.reserva-inline');

  if (!cartao) {
    return;
  }

  cartao.hidden = false;
  cartao.style.display = 'block';

  if (mostrarDadosCompra) {
    mostrarDadosCompra.hidden = false;
    mostrarDadosCompra.style.display = 'block';
  }

  if (dadosCompraOcultos) {
    dadosCompraOcultos.hidden = true;
    dadosCompraOcultos.style.display = 'none';
  }

  setTimeout(() => {
    cartao.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, 100);
}

function mostrarDetalhesCompra() {
  if (!compraAtual.numeros.length) {
    if (msgReserva) {
      msgReserva.textContent =
        '⚠️ Primeiro escolha um número.';
    }

    return;
  }

  const cartao = document.querySelector('.reserva-inline');

  if (cartao) {
    cartao.hidden = false;
    cartao.style.display = 'block';
  }

  if (mostrarDadosCompra) {
    mostrarDadosCompra.hidden = true;
    mostrarDadosCompra.style.display = 'none';
  }

  if (dadosCompraOcultos) {
    dadosCompraOcultos.hidden = false;
    dadosCompraOcultos.style.display = 'block';
  }

  if (msgReserva) {
    msgReserva.textContent = '';
  }
}

function mostrarStatus(mensagem, tipo) {
  if (!numeroStatus) {
    return;
  }

  numeroStatus.style.display = 'block';
  numeroStatus.style.background = 'transparent';
  numeroStatus.style.border = '0';
  numeroStatus.style.boxShadow = 'none';
  numeroStatus.style.padding = '8px 0';
  numeroStatus.style.margin = '8px 0 0';
  numeroStatus.style.fontWeight = '800';
  numeroStatus.style.textAlign = 'center';

  numeroStatus.textContent = mensagem;

  numeroStatus.classList.remove(
    'disponivel',
    'indisponivel',
    'verificando',
    'erro'
  );

  numeroStatus.classList.add(tipo);

  numeroStatus.style.color =
    tipo === 'disponivel'
      ? '#16803a'
      : tipo === 'indisponivel' || tipo === 'erro'
        ? '#b42318'
        : '#6b5a00';
}

function limparNumeroStatus() {
  if (numeroStatus) {
    numeroStatus.style.display = 'none';
    numeroStatus.textContent = '';

    numeroStatus.classList.remove(
      'disponivel',
      'indisponivel',
      'verificando',
      'erro'
    );
  }

  if (reservarNumero) {
    reservarNumero.style.display = 'none';
    reservarNumero.hidden = true;
    reservarNumero.disabled = false;
    reservarNumero.textContent = '🔴 CONFIRMAR PARTICIPAÇÃO';

    reservarNumero.classList.remove(
      'confirmar-participacao',
      'reservado'
    );

    delete reservarNumero.dataset.numero;
  }
}

function reservaExpirou(dados) {
  const expiraEm = Number(dados?.expiraEm || 0);

  return !!expiraEm && Date.now() >= expiraEm;
}

function numeroEstaOcupado(dados) {
  if (!dados) {
    return false;
  }

  if (
    String(dados.status || '').toLowerCase() === 'reservado' &&
    reservaExpirou(dados)
  ) {
    return false;
  }

  const status = String(
    dados.status || dados.situacao || ''
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

function mostrarDisponivel(numero) {
  prepararCompra([numero]);

  mostrarStatus(
    `🟢 NÚMERO ${numero} DISPONÍVEL`,
    'disponivel'
  );

  if (reservarNumero) {
    reservarNumero.style.display = 'flex';
    reservarNumero.hidden = false;
    reservarNumero.disabled = false;

    reservarNumero.textContent =
      '🔴 CONFIRMAR PARTICIPAÇÃO';

    reservarNumero.dataset.numero = numero;

    reservarNumero.classList.add(
      'confirmar-participacao'
    );

    reservarNumero.classList.remove('reservado');
  }

  mostrarCartaoConfirmacao();
}

function mostrarIndisponivel(numero) {
  mostrarStatus(
    `🔴 NÚMERO ${numero} NÃO DISPONÍVEL`,
    'indisponivel'
  );

  if (reservarNumero) {
    reservarNumero.style.display = 'none';
    reservarNumero.hidden = true;

    delete reservarNumero.dataset.numero;
  }
}

function mostrarErro(mensagem) {
  mostrarStatus(
    `⚠️ ${mensagem}`,
    'erro'
  );
}

async function verificarNumero() {
  if (!numeroDireto) {
    return;
  }

  const valor = numeroDireto.value.trim();
  const numero = formatarNumero(valor);

  if (!numero) {
    mostrarErro(
      'Digite um número entre 000 e 999.'
    );

    return;
  }

  numeroDireto.value = numero;

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
    const snapshot = await get(
      ref(db, `rifa/numeros/${numero}`)
    );

    if (!snapshot.exists()) {
      mostrarDisponivel(numero);
      return;
    }

    const dados = snapshot.val();

    if (
      dados.status === 'reservado' &&
      reservaExpirou(dados)
    ) {
      mostrarDisponivel(numero);
      return;
    }

    if (numeroEstaOcupado(dados)) {
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

async function reservarNumeroFirebase(numero) {
  if (!db) {
    throw new Error(
      'Firebase não está conectado.'
    );
  }

  const numeroRef = ref(
    db,
    `rifa/numeros/${numero}`
  );

  const dataHora = obterDataHora();

  const expiraEm =
    Date.now() + TEMPO_RESERVA;

  const resultado = await runTransaction(
    numeroRef,
    atual => {

      if (atual === null) {
        return {
          numero,
          status: 'reservado',
          reservado: true,
          dataReserva: dataHora.timestamp,
          expiraEm
        };
      }

      if (
        atual.status === 'reservado' &&
        reservaExpirou(atual)
      ) {
        return {
          numero,
          status: 'reservado',
          reservado: true,
          dataReserva: dataHora.timestamp,
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
        dataReserva: dataHora.timestamp,
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

async function confirmarReservaAntesDoEnvio() {
  if (!compraAtual.numeros.length) {
    throw new Error(
      'Escolha um número primeiro.'
    );
  }

  if (compraAtual.status === 'reservado') {
    return true;
  }

  if (!db) {
    return false;
  }

  const resultados = [];

  for (
    const numero of compraAtual.numeros
  ) {
    resultados.push(
      await reservarNumeroFirebase(numero)
    );
  }

  compraAtual.status = 'reservado';

  compraAtual.expiraEm = Math.min(
    ...resultados.map(
      resultado => resultado.expiraEm
    )
  );

  salvarCompra();

  return true;
}

function montarMensagemWhatsApp() {
  const numeros =
    compraAtual.numeros.join(', ');

  const nome =
    nomeReserva?.value.trim() ||
    'Não informado';

  const telefone =
    telefoneReserva?.value.trim() ||
    'Não informado';

  return `🍀 *RIFA SOLIDÁRIA — GILFEST*

🧾 *CONFIRMAÇÃO DE PARTICIPAÇÃO*

🎟️ Número(s): *${numeros}*
🔢 Quantidade: *${compraAtual.quantidade}*
💰 Valor total: *${formatarValor(compraAtual.total)}*
📅 Data da compra: *${compraAtual.data}*
🕐 Hora da compra: *${compraAtual.hora}*

👤 Nome: *${nome}*
📱 WhatsApp: *${telefone}*

🔒 *Número reservado por 24 horas.*

💚 Pagamento via PIX realizado.

📎 *COMPROVANTE DE PAGAMENTO*
Anexe o comprovante nesta conversa.

🍀 Obrigado por participar da Rifa Solidária — GILFEST!`;
}

async function enviarParaWhatsApp() {
  if (!compraAtual.numeros.length) {
    if (msgReserva) {
      msgReserva.textContent =
        '⚠️ Escolha um número primeiro.';
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

  try {
    await confirmarReservaAntesDoEnvio();

    if (msgReserva) {
      msgReserva.textContent =
        '📲 Abrindo seu WhatsApp...';
    }

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
        montarMensagemWhatsApp()
      )}`,
      '_blank'
    );

  } catch (erro) {
    console.error(erro);

    if (msgReserva) {
      msgReserva.textContent =
        `⚠️ ${
          erro.message ||
          'Não foi possível reservar o número.'
        }`;
    }
  }
}

if (abrirCartelas) {
  abrirCartelas.addEventListener(
    'click',
    () => {
      window.location.href =
        'cartela.html';
    }
  );
}

if (sugerir) {
  sugerir.addEventListener(
    'click',
    () => {
      window.location.href =
        'cartela.html?sugerir=1';
    }
  );
}

if (verificarNumeroBotao) {
  verificarNumeroBotao.addEventListener(
    'click',
    verificarNumero
  );
}

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

if (reservarNumero) {
  reservarNumero.addEventListener(
    'click',
    mostrarDetalhesCompra
  );
}

if (mostrarDadosCompra) {
  mostrarDadosCompra.addEventListener(
    'click',
    mostrarDetalhesCompra
  );
}

if (reservarReserva) {
  reservarReserva.addEventListener(
    'click',
    enviarParaWhatsApp
  );
}

async function copiarChavePix(botao) {

  const chave =
    String(CONFIG?.pixChave || '').trim();

  if (!chave) {

    if (pixMsgReserva) {
      pixMsgReserva.textContent =
        '⚠️ Chave PIX não configurada.';
    }

    return;
  }

  try {

    await navigator.clipboard.writeText(
      chave
    );

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

if (copiarPixReserva) {
  copiarPixReserva.addEventListener(
    'click',
    () =>
      copiarChavePix(
        copiarPixReserva
      )
  );
}

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
      } catch {}

      if (reservaNumeros) {
        reservaNumeros.textContent =
          'Nenhum número selecionado';
      }

      if (reservaTotal) {
        reservaTotal.textContent =
          'Total: R$ 0,00';
      }

      if (reservaData) {
        reservaData.textContent = '—';
      }

      if (reservaHora) {
        reservaHora.textContent = '—';
      }

      if (dadosCompraOcultos) {
        dadosCompraOcultos.hidden = true;
        dadosCompraOcultos.style.display =
          'none';
      }

      if (mostrarDadosCompra) {
        mostrarDadosCompra.hidden = false;
        mostrarDadosCompra.style.display =
          'block';
      }

      if (numeroDireto) {
        numeroDireto.value = '';
      }

      limparNumeroStatus();

      if (msgReserva) {
        msgReserva.textContent = '';
      }

      if (comprovanteSelecionado) {
        comprovanteSelecionado.hidden = true;
      }

      if (nomeComprovante) {
        nomeComprovante.textContent = '—';
      }
    }
  );
}

if (enviarComprovante) {

  enviarComprovante.addEventListener(
    'click',
    () => {

      const input =
        document.createElement('input');

      input.type = 'file';
      input.accept =
        'image/*,.pdf';

      input.addEventListener(
        'change',
        () => {

          const arquivo =
            input.files?.[0];

          if (!arquivo) {
            return;
          }

          if (nomeComprovante) {
            nomeComprovante.textContent =
              arquivo.name;
          }

          if (comprovanteSelecionado) {
            comprovanteSelecionado.hidden =
              false;
          }

          if (msgReserva) {
            msgReserva.textContent =
              '📎 Comprovante selecionado. Agora envie pelo WhatsApp.';
          }

          window.open(
            `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
              montarMensagemWhatsApp()
            )}`,
            '_blank'
          );
        }
      );

      input.click();
    }
  );
}

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
      JSON.parse(salva);

    if (
      !dados?.numeros?.length
    ) {
      return false;
    }

    compraAtual = dados;

    prepararCompra(
      dados.numeros,
      {
        data:
          dados.data ||
          obterDataHora().data,

        hora:
          dados.hora ||
          obterDataHora().hora,

        timestamp:
          dados.timestamp ||
          obterDataHora().timestamp
      }
    );

    compraAtual = {
      ...dados
    };

    mostrarCartaoConfirmacao();

    return true;

  } catch (erro) {

    console.warn(
      '⚠️ Erro ao recuperar compra:',
      erro
    );

    return false;
  }
}

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
        .map(formatarNumero)
        .filter(Boolean);

  } else if (numero) {

    const n =
      formatarNumero(numero);

    if (n) {
      numeros = [n];
    }
  }

  if (!numeros.length) {
    return false;
  }

  prepararCompra(numeros);

  mostrarCartaoConfirmacao();

  return true;
}

function recuperarSelecaoCartela() {

  try {

    const salva =
      localStorage.getItem(
        'rifaSelecionados'
      );

    if (!salva) {
      return false;
    }

    const numeros =
      JSON.parse(salva);

    if (
      !Array.isArray(numeros) ||
      !numeros.length
    ) {
      return false;
    }

    prepararCompra(numeros);

    mostrarCartaoConfirmacao();

    localStorage.removeItem(
      'rifaSelecionados'
    );

    return true;

  } catch (erro) {

    console.warn(
      '⚠️ Erro ao recuperar seleção:',
      erro
    );

    return false;
  }
}

/* =========================================================
   🎲 RASPADINHA DA AMIZADE — CARTÃO DOURADO
========================================================= */

function iniciarRaspadinha() {

  const scratchCard =
    document.querySelector('.scratch');

  const canvas =
    document.getElementById(
      'scratchCanvas'
    );

  const resultado =
    document.getElementById(
      'scratchPremio'
    );

  const subtexto =
    document.getElementById(
      'scratchSubtexto'
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
    return;
  }

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
    largura * dpr;

  canvas.height =
    altura * dpr;

  canvas.style.width =
    `${largura}px`;

  canvas.style.height =
    `${altura}px`;

  const ctx =
    canvas.getContext(
      '2d',
      {
        willReadFrequently: true
      }
    );

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  const gradiente =
    ctx.createLinearGradient(
      0,
      0,
      largura,
      altura
    );

  gradiente.addColorStop(
    0,
    '#8a5a00'
  );

  gradiente.addColorStop(
    0.14,
    '#f7d774'
  );

  gradiente.addColorStop(
    0.28,
    '#c58a13'
  );

  gradiente.addColorStop(
    0.46,
    '#ffe9a3'
  );

  gradiente.addColorStop(
    0.62,
    '#d19a22'
  );

  gradiente.addColorStop(
    0.82,
    '#fff0ad'
  );

  gradiente.addColorStop(
    1,
    '#9b6505'
  );

  ctx.fillStyle =
    gradiente;

  ctx.fillRect(
    0,
    0,
    largura,
    altura
  );

  for (
    let i = 0;
    i < 700;
    i++
  ) {

    const x =
      Math.random() *
      largura;

    const y =
      Math.random() *
      altura;

    const tamanho =
      Math.random() * 2 +
      0.5;

    ctx.fillStyle =
      Math.random() > 0.5
        ? 'rgba(255,255,255,.30)'
        : 'rgba(91,55,0,.16)';

    ctx.fillRect(
      x,
      y,
      tamanho,
      tamanho
    );
  }

  ctx.save();

  ctx.fillStyle =
    'rgba(30,30,30,.72)';

  ctx.textAlign =
    'center';

  ctx.textBaseline =
    'middle';

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

  /*
    🎲 DADO ANIMADO
    Substitui o antigo trenzinho.
  */

  let dado =
    scratchArea.querySelector(
      '.scratch-dado-animado'
    );

  if (!dado) {

    dado =
      document.createElement(
        'div'
      );

    dado.className =
      'scratch-dado-animado';

    dado.textContent =
      '🎲';

    dado.setAttribute(
      'aria-hidden',
      'true'
    );

    Object.assign(
      dado.style,
      {
        position: 'absolute',
        left: '4%',
        top: '8%',
        zIndex: '3',
        pointerEvents: 'none',
        fontSize: '32px',
        lineHeight: '1',
        filter:
          'drop-shadow(0 2px 2px rgba(80,50,0,.45))',
        animation:
          'scratchDadoZigueZague 5s ease-in-out infinite'
      }
    );

    scratchArea.appendChild(
      dado
    );
  }

  if (
    !document.getElementById(
      'scratchDadoStyle'
    )
  ) {

    const estilo =
      document.createElement(
        'style'
      );

    estilo.id =
      'scratchDadoStyle';

    estilo.textContent = `
      @keyframes scratchDadoZigueZague {
        0% {
          transform:
            translate(0,0)
            rotate(-8deg);
        }

        20% {
          transform:
            translate(18%,14px)
            rotate(12deg);
        }

        40% {
          transform:
            translate(38%,-8px)
            rotate(-10deg);
        }

        60% {
          transform:
            translate(58%,16px)
            rotate(12deg);
        }

        80% {
          transform:
            translate(78%,-6px)
            rotate(-8deg);
        }

        100% {
          transform:
            translate(100%,12px)
            rotate(10deg);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .scratch-dado-animado {
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(
      estilo
    );
  }

  /*
    Não colocar "RASPE AQUI" no resultado.
    O texto "RASPE AQUI" fica somente no canvas.
  */

  resultado.textContent = '';

  if (subtexto) {
    subtexto.textContent = '';
  }

  let raspando = false;
  let finalizado = false;
  let raspagemIniciada = false;

  let ultimaX = 0;
  let ultimaY = 0;

  let ultimaVerificacao = 0;

  function pagoConfirmado() {

    if (
      compraAtual.status === 'pago' ||
      compraAtual.status === 'confirmado' ||
      compraAtual.pagamento === 'confirmado'
    ) {
      return true;
    }

    return false;
  }

  function mostrarBloqueio() {

    resultado.textContent =
      '🔒';

    if (subtexto) {

      subtexto.textContent =
        'A raspadinha será liberada após o pagamento ser confirmado.';
    }
  }

  function verificarPercentual() {

    const agora =
      Date.now();

    if (
      agora - ultimaVerificacao <
      120
    ) {
      return;
    }

    ultimaVerificacao =
      agora;

    const dados =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

    let transparentes = 0;
    let analisados = 0;

    const passo = 16;

    for (
      let i = 3;
      i < dados.data.length;
      i += 4 * passo
    ) {

      analisados++;

      if (
        dados.data[i] < 80
      ) {
        transparentes++;
      }
    }

    if (!analisados) {
      return;
    }

    const percentual =
      (transparentes / analisados) *
      100;

    if (
      percentual >= 55
    ) {
      revelarRaspadinha();
    }
  }

  function raspar(x, y) {

    if (finalizado) {
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

      raspar(
        x1 + (x2 - x1) * t,
        y1 + (y2 - y1) * t
      );
    }
  }

  function revelarRaspadinha() {

    if (finalizado) {
      return;
    }

    finalizado =
      true;

    if (dado) {
      dado.style.display =
        'none';
    }

    if (!pagoConfirmado()) {

      mostrarBloqueio();

    } else {

      resultado.textContent =
        '🎉 RASPADINHA LIBERADA!';

      if (subtexto) {

        subtexto.textContent =
          'O resultado será definido pelo sistema após a confirmação do pagamento.';
      }
    }

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
        pagoConfirmado()
          ? '🎉 Raspadinha liberada.'
          : '🔒 Aguarde a confirmação do pagamento.';
    }
  }

  canvas.addEventListener(
    'mousedown',
    evento => {

      if (finalizado) {
        return;
      }

      raspando = true;

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

      if (!raspando) {
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

      ultimaX = x;
      ultimaY = y;
    }
  );

  window.addEventListener(
    'mouseup',
    () => {
      raspando = false;
    }
  );

  canvas.addEventListener(
    'touchstart',
    evento => {

      if (finalizado) {
        return;
      }

      evento.preventDefault();

      raspando = true;

      const toque =
        evento.touches[0];

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

      if (!raspando) {
        return;
      }

      evento.preventDefault();

      const toque =
        evento.touches[0];

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

      ultimaX = x;
      ultimaY = y;
    },
    {
      passive: false
    }
  );

  canvas.addEventListener(
    'touchend',
    () => {
      raspando = false;
    }
  );

  canvas.addEventListener(
    'contextmenu',
    evento => {
      evento.preventDefault();
    }
  );

  window.addEventListener(
    'resize',
    () => {

      if (!raspagemIniciada) {
        iniciarRaspadinha();
      }
    }
  );
}

/* =========================================================
   🍀 NÚMERO DA SORTE
========================================================= */

async function revelarNumeroDaSorte() {

  if (!numeroSorteResultado) {
    return;
  }

  /*
    O número da sorte NÃO será mais escolhido
    entre os números comprados.
  */

  if (!compraAtual.numeros.length) {

    numeroSorteResultado.textContent =
      '🎟️ Escolha primeiro um número para revelar seu número da sorte.';

    return;
  }

  /*
    Primeiro bloqueamos os números que o participante
    já comprou.
  */

  const numerosProibidos =
    new Set(
      compraAtual.numeros
        .map(formatarNumero)
        .filter(Boolean)
    );

  /*
    Tentamos também ler do Firebase os números
    que eventualmente já estejam cadastrados como
    premiados ou "Raspe de novo".

    Isso deixa o código preparado para a estrutura
    definitiva dos prêmios.
  */

  if (db) {

    try {

      const snapshot =
        await get(
          ref(
            db,
            'rifa/raspadinha/premios'
          )
        );

      if (snapshot.exists()) {

        const premios =
          snapshot.val();

        Object.values(premios || {})
          .forEach(premio => {

            if (!premio) {
              return;
            }

            /*
              Estruturas possíveis:
              numeros: ["001","002"]
              numerosPremiados: [...]
              numero: "001"
            */

            const listas = [
              premio.numeros,
              premio.numerosPremiados,
              premio.numerosPremio,
              premio.numerosPremiados
            ];

            listas.forEach(lista => {

              if (Array.isArray(lista)) {

                lista.forEach(numero => {

                  const formatado =
                    formatarNumero(numero);

                  if (formatado) {
                    numerosProibidos.add(
                      formatado
                    );
                  }
                });
              }

              if (
                lista &&
                typeof lista === 'object' &&
                !Array.isArray(lista)
              ) {

                Object.keys(lista).forEach(
                  numero => {

                    const formatado =
                      formatarNumero(numero);

                    if (formatado) {
                      numerosProibidos.add(
                        formatado
                      );
                    }
                  }
                );
              }
            });

            if (premio.numero !== undefined) {

              const numero =
                formatarNumero(
                  premio.numero
                );

              if (numero) {
                numerosProibidos.add(
                  numero
                );
              }
            }

            if (
              Array.isArray(
                premio.raspeDeNovo
              )
            ) {

              premio.raspeDeNovo.forEach(
                numero => {

                  const formatado =
                    formatarNumero(numero);

                  if (formatado) {
                    numerosProibidos.add(
                      formatado
                    );
                  }
                }
              );
            }
          });
      }

    } catch (erro) {

      console.warn(
        '⚠️ Não foi possível consultar os números premiados:',
        erro
      );
    }
  }

  /*
    Procura um número aleatório entre 000 e 999
    que não esteja proibido.
  */

  const disponiveis = [];

  for (
    let i = 0;
    i <= 999;
    i++
  ) {

    const numero =
      String(i).padStart(3, '0');

    if (
      !numerosProibidos.has(numero)
    ) {
      disponiveis.push(numero);
    }
  }

  if (!disponiveis.length) {

    numeroSorteResultado.textContent =
      '⚠️ Não há números disponíveis para gerar o número da sorte.';

    return;
  }

  const indice =
    Math.floor(
      Math.random() *
      disponiveis.length
    );

  const numeroSorte =
    disponiveis[indice];

  numeroSorteResultado.textContent =
    `🍀 Seu número da sorte é: ${numeroSorte}`;
}

if (revelarNumeroSorte) {

  revelarNumeroSorte.addEventListener(
    'click',
    revelarNumeroDaSorte
  );
}

/* =========================================================
   🚀 INICIALIZAÇÃO
========================================================= */

function inicializar() {

  const veioDaCartela =
    lerNumerosDaURL();

  if (!veioDaCartela) {
    recuperarSelecaoCartela();
  }

  if (
    !veioDaCartela &&
    !compraAtual.numeros.length
  ) {
    recuperarCompraSalva();
  }

  iniciarRaspadinha();
}

if (
  document.readyState ===
  'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    inicializar,
    {
      once: true
    }
  );

} else {

  inicializar();
}

/* =========================================================
   🎨 AJUSTES VISUAIS
========================================================= */

const scratchCardVisivel =
  document.querySelector(
    '.scratch'
  );

if (scratchCardVisivel) {

  scratchCardVisivel.style.display =
    'block';

  scratchCardVisivel.style.width =
    '100%';
}

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

const scratchAreaGlobal =
  document.querySelector(
    '.scratch-area'
  );

if (scratchAreaGlobal) {

  scratchAreaGlobal.style.width =
    'min(100%, 700px)';

  scratchAreaGlobal.style.margin =
    '18px auto';

  scratchAreaGlobal.style.position =
    'relative';

  scratchAreaGlobal.style.overflow =
    'hidden';
  }
