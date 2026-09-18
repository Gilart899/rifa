import {
  auth,
  firebaseConfigured
} from './firebase.js';

import {
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

import {
  getFunctions,
  httpsCallable
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js';


/* =========================================================
   ELEMENTOS
========================================================= */

const numeroInput =
  document.getElementById('numeroRifa');

const liberarBtn =
  document.getElementById('liberar');

const mensagem =
  document.getElementById('mensagem');

const areaRaspadinha =
  document.getElementById('areaRaspadinha');

const resultado =
  document.getElementById('resultado');

const canvas =
  document.getElementById('scratchCanvas');


/* =========================================================
   FIREBASE FUNCTIONS
========================================================= */

let functions = null;

let criarJogada = null;

let revelarJogada = null;


if (firebaseConfigured) {

  functions =
    getFunctions(
      undefined,
      'southamerica-east1'
    );


  criarJogada =
    httpsCallable(
      functions,
      'criarJogadaRaspadinha'
    );


  revelarJogada =
    httpsCallable(
      functions,
      'revelarJogadaRaspadinha'
    );

}


/* =========================================================
   ESTADO
========================================================= */

let jogadaAtualId =
  null;

let resultadoRevelado =
  false;

let raspadinhaCriada =
  false;


/* =========================================================
   NORMALIZAR NÚMERO
========================================================= */

function normalizarNumero(valor) {

  const texto =
    String(valor || '')
      .replace(/\D/g, '')
      .slice(0, 3);


  if (!texto) {
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


  return String(
    numero
  ).padStart(
    3,
    '0'
  );

}


/* =========================================================
   MENSAGEM
========================================================= */

function mostrarMensagem(
  texto,
  tipo = 'normal'
) {

  if (!mensagem) {
    return;
  }


  mensagem.textContent =
    texto;


  mensagem.style.color =
    tipo === 'erro'
      ? '#ff7676'
      : tipo === 'sucesso'
        ? '#61e294'
        : 'rgba(255,255,255,.8)';

}


/* =========================================================
   BOTÃO
========================================================= */

function definirEstadoBotao(
  disabled,
  texto
) {

  if (!liberarBtn) {
    return;
  }


  liberarBtn.disabled =
    disabled;


  liberarBtn.textContent =
    texto;

}


/* =========================================================
   INPUT
========================================================= */

if (numeroInput) {

  numeroInput.addEventListener(
    'input',
    () => {

      numeroInput.value =
        numeroInput.value
          .replace(/\D/g, '')
          .slice(0, 3);

    }
  );

}


/* =========================================================
   ENTER
========================================================= */

if (numeroInput) {

  numeroInput.addEventListener(
    'keydown',
    event => {

      if (
        event.key ===
        'Enter'
      ) {

        event.preventDefault();


        if (liberarBtn) {
          liberarBtn.click();
        }

      }

    }
  );

}


/* =========================================================
   BOTÃO LIBERAR
========================================================= */

if (liberarBtn) {

  liberarBtn.addEventListener(
    'click',
    liberarJogada
  );

}


/* =========================================================
   AUTENTICAÇÃO
========================================================= */

async function garantirAutenticacao() {

  if (!auth) {

    throw new Error(
      'Não foi possível iniciar a autenticação.'
    );

  }


  if (!auth.currentUser) {

    await signInAnonymously(
      auth
    );

  }


  if (!auth.currentUser) {

    throw new Error(
      'Não foi possível autenticar esta sessão.'
    );

  }


  return auth.currentUser;

}


/* =========================================================
   LIBERAR JOGADA
========================================================= */

async function liberarJogada() {

  const numero =
    normalizarNumero(
      numeroInput?.value
    );


  /* =======================================================
     VALIDAR NÚMERO
  ======================================================= */

  if (!numero) {

    mostrarMensagem(
      'Digite um número válido entre 000 e 999.',
      'erro'
    );


    numeroInput?.focus();


    return;

  }


  /* =======================================================
     FIREBASE
  ======================================================= */

  if (!firebaseConfigured) {

    mostrarMensagem(
      'O Firebase ainda não está configurado.',
      'erro'
    );


    return;

  }


  if (!criarJogada) {

    mostrarMensagem(
      'A função da raspadinha não está disponível.',
      'erro'
    );


    return;

  }


  /* =======================================================
     BOTÃO
  ======================================================= */

  definirEstadoBotao(
    true,
    'VERIFICANDO...'
  );


  try {

    /* =====================================================
       AUTENTICAR
       ===================================================== */

    await garantirAutenticacao();


    /* =====================================================
       CHAMAR SERVIDOR
       ===================================================== */

    const resposta =
      await criarJogada({

        numeroRifa:
          numero

      });


    const dados =
      resposta?.data || {};


    /* =====================================================
       VERIFICAR ID
       ===================================================== */

    if (!dados.jogadaId) {

      throw new Error(
        'O servidor não retornou o ID da jogada.'
      );

    }


    jogadaAtualId =
      String(
        dados.jogadaId
      );


    resultadoRevelado =
      false;


    raspadinhaCriada =
      false;


    /* =====================================================
       MOSTRAR ÁREA
       ===================================================== */

    if (areaRaspadinha) {

      areaRaspadinha.classList.remove(
        'hidden'
      );

    }


    /* =====================================================
       ESCONDER RESULTADO
       ===================================================== */

    if (resultado) {

      resultado.textContent =
        'BOA SORTE!';

    }


    /* =====================================================
       CRIAR RASPADINHA
       ===================================================== */

    criarRaspadinha();


    /* =====================================================
       MENSAGEM
       ===================================================== */

    if (
      dados.novaJogada === false
    ) {

      mostrarMensagem(
        '✅ Esta jogada já estava liberada para este número.',
        'sucesso'
      );

    } else {

      mostrarMensagem(
        '✅ Número pago confirmado. Sua jogada foi liberada!',
        'sucesso'
      );

    }


    /* =====================================================
       ROLAR ATÉ A RASPADINHA
       ===================================================== */

    areaRaspadinha?.scrollIntoView({

      behavior:
        'smooth',

      block:
        'center'

    });


  } catch (error) {

    console.error(
      'Erro ao liberar raspadinha:',
      error
    );


    let texto =
      'Não foi possível liberar a jogada.';


    const codigo =
      error?.code || '';


    if (
      codigo ===
      'functions/failed-precondition'
    ) {

      texto =
        error?.message ||
        '⚠️ O pagamento deste número ainda não foi confirmado.';

    }


    else if (
      codigo ===
      'functions/unauthenticated'
    ) {

      texto =
        'É necessário autenticar para liberar a jogada.';

    }


    else if (
      codigo ===
      'functions/permission-denied'
    ) {

      texto =
        '⛔ Este número pertence a outro participante.';

    }


    else if (
      codigo ===
      'functions/not-found'
    ) {

      texto =
        'Número não encontrado na rifa.';

    }


    else if (
      codigo ===
      'functions/resource-exhausted'
    ) {

      texto =
        '⚠️ Os prêmios disponíveis da raspadinha acabaram.';

    }


    else if (
      error?.message
    ) {

      texto =
        error.message;

    }


    mostrarMensagem(
      texto,
      'erro'
    );


  } finally {

    definirEstadoBotao(
      false,
      'LIBERAR JOGADA'
    );

  }

}


/* =========================================================
   CRIAR RASPADINHA
========================================================= */

function criarRaspadinha() {

  if (!canvas) {
    return;
  }


  if (!jogadaAtualId) {
    return;
  }


  raspadinhaCriada =
    true;


  resultadoRevelado =
    false;


  canvas.style.pointerEvents =
    'auto';


  const card =
    canvas.parentElement;


  if (!card) {
    return;
  }


  const largura =
    Math.max(
      1,
      card.clientWidth
    );


  const altura =
    Math.max(
      1,
      card.clientHeight
    );


  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );


  canvas.width =
    Math.floor(
      largura * dpr
    );


  canvas.height =
    Math.floor(
      altura * dpr
    );


  canvas.style.width =
    `${largura}px`;


  canvas.style.height =
    `${altura}px`;


  const ctx =
    canvas.getContext(
      '2d'
    );


  if (!ctx) {
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
     COBERTURA
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
    '#d9d9d9'
  );


  gradiente.addColorStop(
    0.5,
    '#a9a9a9'
  );


  gradiente.addColorStop(
    1,
    '#e7e7e7'
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


  /* =======================================================
     TEXTO
  ======================================================= */

  ctx.fillStyle =
    '#555';


  ctx.textAlign =
    'center';


  ctx.textBaseline =
    'middle';


  ctx.font =
    '900 22px Arial';


  ctx.fillText(
    'RASPE AQUI',
    largura / 2,
    altura / 2 - 10
  );


  ctx.font =
    '700 12px Arial';


  ctx.fillText(
    '🍀 DESCUBRA SUA SORTE 🍀',
    largura / 2,
    altura / 2 + 20
  );


  /* =======================================================
     MODO APAGAR
  ======================================================= */

  ctx.globalCompositeOperation =
    'destination-out';


  let raspando =
    false;


  let ultimoX =
    null;


  let ultimoY =
    null;


  let ultimoTeste =
    0;


  let revelando =
    false;


  /* =======================================================
     OBTER PONTO
  ======================================================= */

  function ponto(event) {

    const rect =
      canvas.getBoundingClientRect();


    let clientX;

    let clientY;


    if (
      event.touches &&
      event.touches.length
    ) {

      clientX =
        event.touches[0].clientX;


      clientY =
        event.touches[0].clientY;

    }


    else if (
      event.changedTouches &&
      event.changedTouches.length
    ) {

      clientX =
        event.changedTouches[0].clientX;


      clientY =
        event.changedTouches[0].clientY;

    }


    else {

      clientX =
        event.clientX;


      clientY =
        event.clientY;

    }


    return {

      x:
        clientX - rect.left,

      y:
        clientY - rect.top

    };

  }


  /* =======================================================
     RASPAR
  ======================================================= */

  function raspar(event) {

    if (
      !raspando ||
      resultadoRevelado
    ) {

      return;

    }


    event.preventDefault();


    const p =
      ponto(event);


    ctx.lineCap =
      'round';


    ctx.lineJoin =
      'round';


    ctx.lineWidth =
      48;


    ctx.beginPath();


    if (
      ultimoX !== null &&
      ultimoY !== null
    ) {

      ctx.moveTo(
        ultimoX,
        ultimoY
      );

    } else {

      ctx.moveTo(
        p.x,
        p.y
      );

    }


    ctx.lineTo(
      p.x,
      p.y
    );


    ctx.stroke();


    ultimoX =
      p.x;


    ultimoY =
      p.y;


    const agora =
      Date.now();


    if (
      agora - ultimoTeste >
      180
    ) {

      ultimoTeste =
        agora;


      verificarRevelacao();

    }

  }


  /* =======================================================
     COMEÇAR
  ======================================================= */

  function iniciar(event) {

    if (resultadoRevelado) {
      return;
    }


    raspando =
      true;


    ultimoX =
      null;


    ultimoY =
      null;


    raspar(event);

  }


  /* =======================================================
     PARAR
  ======================================================= */

  function parar() {

    raspando =
      false;


    ultimoX =
      null;


    ultimoY =
      null;

  }


  /* =======================================================
     MOUSE
  ======================================================= */

  canvas.onmousedown =
    iniciar;


  canvas.onmousemove =
    raspar;


  canvas.onmouseup =
    parar;


  canvas.onmouseleave =
    parar;


  /* =======================================================
     TOUCH
  ======================================================= */

  canvas.ontouchstart =
    iniciar;


  canvas.ontouchmove =
    raspar;


  canvas.ontouchend =
    parar;


  canvas.ontouchcancel =
    parar;


  /* =======================================================
     VERIFICAR REVELAÇÃO
  ======================================================= */

  function verificarRevelacao() {

    if (
      revelando ||
      resultadoRevelado ||
      !jogadaAtualId
    ) {

      return;

    }


    const pixels =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      ).data;


    let transparentes =
      0;


    let total =
      0;


    /*
     * Amostragem para não pesar
     * no celular.
     */

    const passoX =
      Math.max(
        1,
        Math.floor(
          canvas.width / 120
        )
      );


    const passoY =
      Math.max(
        1,
        Math.floor(
          canvas.height / 120
        )
      );


    for (
      let y = 0;
      y < canvas.height;
      y += passoY
    ) {

      for (
        let x = 0;
        x < canvas.width;
        x += passoX
      ) {

        const indice =
          (
            y *
            canvas.width +
            x
          ) *
          4 +
          3;


        total++;


        if (
          pixels[indice] < 30
        ) {

          transparentes++;

        }

      }

    }


    if (!total) {
      return;
    }


    const percentual =
      transparentes /
      total;


    /*
     * Quando aproximadamente 65%
     * da cobertura for removida,
     * consulta o servidor.
     */

    if (
      percentual >= 0.65
    ) {

      revelarResultado();

    }

  }


  /* =======================================================
     REVELAR RESULTADO
  ======================================================= */

  async function revelarResultado() {

    if (
      revelando ||
      resultadoRevelado ||
      !jogadaAtualId
    ) {

      return;

    }


    revelando =
      true;


    mostrarMensagem(
      '🔎 Consultando o resultado da sua jogada...',
      'normal'
    );


    try {

      await garantirAutenticacao();


      if (!revelarJogada) {

        throw new Error(
          'A função de revelação não está disponível.'
        );

      }


      const resposta =
        await revelarJogada({

          jogadaId:
            jogadaAtualId

        });


      const dados =
        resposta?.data || {};


      if (
        !dados.ok ||
        !dados.resultado
      ) {

        throw new Error(
          'O servidor não retornou um resultado válido.'
        );

      }


      /* ===================================================
         RESULTADO REAL
      =================================================== */

      resultadoRevelado =
        true;


      if (resultado) {

        resultado.textContent =
          dados.resultado.nome ||
          'PRÊMIO';

      }


      /* ===================================================
         IMAGEM DO PRÊMIO
      =================================================== */

      if (
        dados.resultado.imagem &&
        resultado
      ) {

        const imagem =
          document.createElement(
            'img'
          );


        imagem.src =
          dados.resultado.imagem;


        imagem.alt =
          dados.resultado.nome ||
          'Prêmio';


        imagem.style.display =
          'block';


        imagem.style.maxWidth =
          '140px';


        imagem.style.width =
          '100%';


        imagem.style.height =
          'auto';


        imagem.style.margin =
          '12px auto';


        imagem.style.borderRadius =
          '12px';


        resultado.appendChild(
          imagem
        );

      }


      /* ===================================================
         LIMPAR COBERTURA
      =================================================== */

      ctx.clearRect(
        0,
        0,
        largura,
        altura
      );


      canvas.style.pointerEvents =
        'none';


      mostrarMensagem(
        '🎉 Raspadinha revelada!',
        'sucesso'
      );


    } catch (error) {

      console.error(
        'Erro ao revelar raspadinha:',
        error
      );


      let texto =
        'Não foi possível revelar o resultado.';


      if (
        error?.code ===
        'functions/permission-denied'
      ) {

        texto =
          '⛔ Esta jogada não pertence a esta sessão.';

      }


      else if (
        error?.code ===
        'functions/not-found'
      ) {

        texto =
          'Jogada não encontrada.';

      }


      else if (
        error?.code ===
        'functions/failed-precondition'
      ) {

        texto =
          error.message ||
          'Esta jogada ainda não pode ser revelada.';

      }


      else if (
        error?.code ===
        'functions/resource-exhausted'
      ) {

        texto =
          '⚠️ Os prêmios disponíveis da raspadinha acabaram.';

      }


      else if (
        error?.message
      ) {

        texto =
          error.message;

      }


      mostrarMensagem(
        texto,
        'erro'
      );

    } finally {

      revelando =
        false;

    }

  }

}


/* =========================================================
   AVISO INICIAL
========================================================= */

if (!firebaseConfigured) {

  mostrarMensagem(
    'Firebase ainda não configurado.',
    'erro'
  );

      }
