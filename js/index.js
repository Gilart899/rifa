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
 * 🔒 RESERVA POR 24 HORAS
 *
 * Antes estava em 40 minutos.
 * Agora o número permanece reservado
 * durante 24 horas aguardando a confirmação
 * manual do pagamento.
 */

const TEMPO_RESERVA =
  24 * 60 * 60 * 1000;


/* =========================================================
   🎯 ELEMENTOS DA PÁGINA
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

const enviarComprovante =
  document.getElementById(
    'enviarComprovante'
  );

const limparSelecao =
  document.getElementById(
    'limparSelecao'
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

  return Number(
    valor || 0
  ).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  );

}


/* =========================================================
   🟢 MOSTRAR STATUS
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
   🧹 LIMPAR STATUS DO NÚMERO
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
      '🛒 COMPRAR NÚMERO';

    reservarNumero.classList.remove(
      'confirmar-participacao',
      'reservado'
    );

    delete reservarNumero.dataset.numero;

  }

}


/* =========================================================
   ⏱️ VERIFICAR SE RESERVA EXPIROU
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

  return (
    Date.now() >= expiraEm
  );

}


/* =========================================================
   🔎 VERIFICAR SE NÚMERO ESTÁ OCUPADO
========================================================= */

function numeroEstaOcupado(dados) {

  if (!dados) {
    return false;
  }

  /*
   * Reserva vencida volta a ficar disponível.
   */

  if (
    String(
      dados.status || ''
    ).toLowerCase() ===
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
   🧾 ESCONDER DETALHES DA CONFIRMAÇÃO
========================================================= */

function esconderDetalhesConfirmacao() {

  const cartao =
    document.querySelector(
      '.reserva-inline'
    );

  if (!cartao) {
    return;
  }

  /*
   * O cartão inteiro continua reservado
   * para aparecer somente quando o usuário
   * clicar em "CONFIRMAR PARTICIPAÇÃO".
   *
   * Aqui escondemos os detalhes internos.
   */

  const elementos =
    cartao.querySelectorAll(
      '#reservaNumeros, #reservaTotal, #reservaData, #reservaHora, #limparSelecao, #copiarPixReserva, #pixMsgReserva, #nomeReserva, #telefoneReserva, #reservarReserva, #enviarComprovante, #comprovanteSelecionado, #nomeComprovante, #msgReserva'
    );

  elementos.forEach(
    elemento => {

      elemento.style.display =
        'none';

    }
  );

}


/* =========================================================
   🧾 MOSTRAR DETALHES DA CONFIRMAÇÃO
========================================================= */

function mostrarDetalhesConfirmacao() {

  const cartao =
    document.querySelector(
      '.reserva-inline'
    );

  if (!cartao) {
    return;
  }

  const elementos =
    cartao.querySelectorAll(
      '#reservaNumeros, #reservaTotal, #reservaData, #reservaHora, #limparSelecao, #copiarPixReserva, #pixMsgReserva, #nomeReserva, #telefoneReserva, #reservarReserva, #enviarComprovante, #comprovanteSelecionado, #nomeComprovante, #msgReserva'
    );

  elementos.forEach(
    elemento => {

      elemento.style.display =
        '';

    }
  );

  /*
   * O botão interno antigo de confirmação
   * não deve mais aparecer.
   */

  if (reservarReserva) {

    reservarReserva.style.display =
      'none';

  }

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
      numerosFormatados.join(
        ', '
      );

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

    /*
     * IMPORTANTE:
     * o cartão NÃO abre sozinho.
     *
     * Primeiro aparece somente o botão
     * de confirmação.
     */

    cartao.style.display =
      'block';

    esconderDetalhesConfirmacao();

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

  mostrarStatus(
    `🟢 NÚMERO ${numero} DISPONÍVEL`,
    'disponivel'
  );

  /*
   * Só agora o botão para iniciar a
   * participação fica disponível.
   */

  if (reservarNumero) {

    reservarNumero.style.display =
      'flex';

    reservarNumero.hidden =
      false;

    reservarNumero.disabled =
      false;

    reservarNumero.textContent =
      `🛒 COMPRAR ${numero}`;

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
    `🔴 NÚMERO ${numero} NÃO DISPONÍVEL`,
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
    `⚠️ ${mensagem}`,
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
      await get(
        numeroRef
      );

    if (!snapshot.exists()) {

      mostrarConfirmacao(
        [numero],
        obterDataHora()
      );

      mostrarDisponivel(
        numero
      );

      return;

    }

    const dados =
      snapshot.val();

    if (
      dados.status === 'reservado' &&
      reservaExpirou(dados)
    ) {

      mostrarConfirmacao(
        [numero],
        obterDataHora()
      );

      mostrarDisponivel(
        numero
      );

      return;

    }

    if (
      numeroEstaOcupado(dados)
    ) {

      mostrarIndisponivel(
        numero
      );

      return;

    }

    mostrarConfirmacao(
      [numero],
      obterDataHora()
    );

    mostrarDisponivel(
      numero
    );

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
   🔢 DIGITAÇÃO DO NÚMERO
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
   🔒 RESERVAR NÚMERO NO FIREBASE
========================================================= */

async function reservarNumeroFirebase(
  numero
) {

  if (!db) {

    throw new Error(
      'Firebase não está conectado.'
    );

  }

  const numeroRef =
    ref(
      db,
      `rifa/numeros/${numero}`
    );

  const dataHora =
    obterDataHora();

  /*
   * 🔒 24 HORAS
   */

  const expiraEm =
    Date.now() +
    TEMPO_RESERVA;

  const resultado =
    await runTransaction(
      numeroRef,
      atual => {

        /*
         * Número ainda não existe.
         */

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

        /*
         * Reserva antiga expirou.
         */

        if (
          atual.status === 'reservado' &&
          reservaExpirou(atual)
        ) {

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

        /*
         * Número já está ocupado.
         */

        if (
          numeroEstaOcupado(atual)
        ) {

          return;

        }

        /*
         * Reserva normal.
         */

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

  if (
    !resultado.committed
  ) {

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
   🛒 COMPRAR / CONFIRMAR PARTICIPAÇÃO
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
            '⚠️ Erro ao salvar compra:',
            erro
          );

        }

        /*
         * Depois de reservar:
         *
         * - o cartão continua aberto;
         * - os detalhes aparecem;
         * - o botão interno de confirmação
         *   permanece escondido;
         * - a pessoa pode preencher nome,
         *   WhatsApp, copiar PIX e enviar
         *   o comprovante.
         */

        mostrarDetalhesConfirmacao();

        mostrarStatus(
          `🔒 NÚMERO ${numero} RESERVADO POR 24 HORAS`,
          'disponivel'
        );

        reservarNumero.textContent =
          `✅ ${numero} RESERVADO`;

        reservarNumero.classList.remove(
          'confirmar-participacao'
        );

        reservarNumero.classList.add(
          'reservado'
        );

        /*
         * O botão que abriu a participação
         * não deve mais permitir nova reserva.
         */

        reservarNumero.disabled =
          true;

      } catch (erro) {

        console.error(
          '❌ Erro ao reservar número:',
          erro
        );

        mostrarErro(
          erro.message ||
          'Não foi possível reservar o número.'
        );

        reservarNumero.disabled =
          false;

        reservarNumero.textContent =
          `🛒 COMPRAR ${numero}`;

      }

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

      /*
       * Limpa somente a seleção atual.
       * Não apaga nome, telefone ou
       * configurações do sistema.
       */

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
          '⚠️ Não foi possível limpar o armazenamento local.',
          erro
        );

      }

      if (reservaNumeros) {

        reservaNumeros.textContent =
          '';

      }

      if (reservaTotal) {

        reservaTotal.textContent =
          '';

      }

      if (reservaData) {

        reservaData.textContent =
          '—';

      }

      if (reservaHora) {

        reservaHora.textContent =
          '—';

      }

      if (numeroDireto) {

        numeroDireto.value =
          '';

      }

      limparNumeroStatus();

      /*
       * Esconde novamente o cartão.
       */

      const cartao =
        document.querySelector(
          '.reserva-inline'
        );

      if (cartao) {

        cartao.style.display =
          'none';

      }

      /*
       * Volta para a área de escolha
       * dos números.
       */

      const escolha =
        document.getElementById(
          'escolherNumeros'
        ) ||
        document.querySelector(
          '#escolherNumeros'
        ) ||
        document.querySelector(
          '.choose'
        );

      if (escolha) {

        escolha.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

      } else if (numeroDireto) {

        numeroDireto.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

      }

    }
  );

}


/* =========================================================
   🛡️ PREPARAÇÃO INICIAL DO CARTÃO
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    esconderDetalhesConfirmacao();

    const cartao =
      document.querySelector(
        '.reserva-inline'
      );

    /*
     * O cartão começa escondido.
     * Ele só aparece quando um número
     * é escolhido/verificado.
     */

    if (cartao) {

      cartao.style.display =
        'none';

    }

  }
);

