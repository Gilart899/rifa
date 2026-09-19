// ============================================================
// RASPADINHA DA AMIZADE — GILFEST
// Versão definitiva
// Capa dourada + brilho + trevos animados
// Sistema de duas camadas para preservar a raspagem
// ============================================================

import {
  auth,
  firebaseConfigured
} from "./firebase.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";

import {
  signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ============================================================
// CONFIGURAÇÃO
// ============================================================

const REGIAO_FIREBASE = "southamerica-east1";


// ============================================================
// ELEMENTOS
// ============================================================

const campoNumero =
  document.getElementById("numeroRifa");

const botaoLiberar =
  document.getElementById("liberar");

const mensagem =
  document.getElementById("mensagem");

const areaRaspadinha =
  document.getElementById("areaRaspadinha");

const resultado =
  document.getElementById("resultado");

let canvas =
  document.getElementById("scratchCanvas");


// ============================================================
// ESTADO
// ============================================================

let jogadaIdAtual = null;
let numeroAtual = null;

let raspando = false;
let revelada = false;

let canvasCapa = null;
let canvasRaspagem = null;

let ctxCapa = null;
let ctxRaspagem = null;

let larguraCanvas = 0;
let alturaCanvas = 0;

let escalaCanvas = 1;

let animacao = null;

let posicaoBrilho = -300;

let ultimaVerificacao = 0;

let ultimoX = null;
let ultimoY = null;


// ============================================================
// FIREBASE
// ============================================================

let functions = null;
let criarJogada = null;
let revelarJogada = null;

if (firebaseConfigured) {
  functions =
    getFunctions(
      undefined,
      REGIAO_FIREBASE
    );

  criarJogada =
    httpsCallable(
      functions,
      "criarJogadaRaspadinha"
    );

  revelarJogada =
    httpsCallable(
      functions,
      "revelarJogadaRaspadinha"
    );
}


// ============================================================
// MENSAGEM
// ============================================================

function mostrarMensagem(
  texto,
  tipo = "normal"
) {
  if (!mensagem) return;

  mensagem.textContent = texto;

  mensagem.classList.remove(
    "erro",
    "sucesso",
    "normal"
  );

  mensagem.classList.add(tipo);
}


// ============================================================
// NORMALIZAR NÚMERO
// ============================================================

function normalizarNumero(valor) {
  const numero =
    String(valor || "").trim();

  if (!/^\d{1,3}$/.test(numero)) {
    return null;
  }

  const convertido =
    Number(numero);

  if (
    !Number.isInteger(convertido) ||
    convertido < 0 ||
    convertido > 999
  ) {
    return null;
  }

  return String(convertido)
    .padStart(3, "0");
}


// ============================================================
// AUTENTICAÇÃO
// ============================================================

async function garantirAutenticacao() {
  if (!firebaseConfigured) {
    throw new Error(
      "O Firebase ainda não está configurado."
    );
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const resultadoAuth =
    await signInAnonymously(auth);

  return resultadoAuth.user;
}


// ============================================================
// CRIAR SEGUNDA CAMADA
// ============================================================

function prepararCamadas() {
  if (!canvas) return;

  const antigo =
    canvas;

  const parent =
    antigo.parentElement;

  if (!parent) return;


  // ----------------------------------------------------------
  // Remove camadas antigas criadas por esta versão
  // ----------------------------------------------------------

  const antigas =
    parent.querySelectorAll(
      ".gilfest-canvas-capa, .gilfest-canvas-raspagem"
    );

  antigas.forEach(
    elemento => elemento.remove()
  );


  // ----------------------------------------------------------
  // Container
  // ----------------------------------------------------------

  const container =
    document.createElement("div");

  container.className =
    "gilfest-scratch-container";


  // ----------------------------------------------------------
  // Canvas da capa
  // ----------------------------------------------------------

  canvasCapa =
    document.createElement("canvas");

  canvasCapa.className =
    "gilfest-canvas-capa";


  // ----------------------------------------------------------
  // Canvas transparente de raspagem
  // ----------------------------------------------------------

  canvasRaspagem =
    document.createElement("canvas");

  canvasRaspagem.className =
    "gilfest-canvas-raspagem";


  // ----------------------------------------------------------
  // Usa o canvas original como referência
  // ----------------------------------------------------------

  canvas.style.display =
    "none";


  container.appendChild(
    canvasCapa
  );

  container.appendChild(
    canvasRaspagem
  );


  parent.appendChild(
    container
  );


  ctxCapa =
    canvasCapa.getContext(
      "2d"
    );

  ctxRaspagem =
    canvasRaspagem.getContext(
      "2d"
    );
}


// ============================================================
// AJUSTAR CANVAS
// ============================================================

function ajustarCanvas() {
  if (
    !canvasCapa ||
    !canvasRaspagem
  ) {
    return;
  }

  const largura =
    canvas.clientWidth ||
    320;

  const altura =
    canvas.clientHeight ||
    230;


  const rect =
    canvas.getBoundingClientRect();


  larguraCanvas =
    rect.width ||
    largura;

  alturaCanvas =
    rect.height ||
    altura;


  escalaCanvas =
    window.devicePixelRatio ||
    1;


  const larguraReal =
    Math.round(
      larguraCanvas *
      escalaCanvas
    );

  const alturaReal =
    Math.round(
      alturaCanvas *
      escalaCanvas
    );


  canvasCapa.width =
    larguraReal;

  canvasCapa.height =
    alturaReal;


  canvasRaspagem.width =
    larguraReal;

  canvasRaspagem.height =
    alturaReal;


  canvasCapa.style.width =
    `${larguraCanvas}px`;

  canvasCapa.style.height =
    `${alturaCanvas}px`;


  canvasRaspagem.style.width =
    `${larguraCanvas}px`;

  canvasRaspagem.style.height =
    `${alturaCanvas}px`;


  ctxCapa.setTransform(
    escalaCanvas,
    0,
    0,
    escalaCanvas,
    0,
    0
  );


  ctxRaspagem.setTransform(
    escalaCanvas,
    0,
    0,
    escalaCanvas,
    0,
    0
  );
}


// ============================================================
// FUNDO DOURADO
// ============================================================

function desenharFundoDourado() {
  const ctx =
    ctxCapa;

  const largura =
    larguraCanvas;

  const altura =
    alturaCanvas;


  ctx.clearRect(
    0,
    0,
    largura,
    altura
  );


  // ----------------------------------------------------------
  // Gradiente metálico
  // ----------------------------------------------------------

  const dourado =
    ctx.createLinearGradient(
      0,
      0,
      largura,
      altura
    );


  dourado.addColorStop(
    0,
    "#704200"
  );

  dourado.addColorStop(
    0.08,
    "#b87905"
  );

  dourado.addColorStop(
    0.18,
    "#f7cf57"
  );

  dourado.addColorStop(
    0.30,
    "#fff0a1"
  );

  dourado.addColorStop(
    0.42,
    "#c98a08"
  );

  dourado.addColorStop(
    0.55,
    "#f6cc4b"
  );

  dourado.addColorStop(
    0.70,
    "#9a5f00"
  );

  dourado.addColorStop(
    0.84,
    "#f5ca46"
  );

  dourado.addColorStop(
    1,
    "#6e4000"
  );


  ctx.fillStyle =
    dourado;

  ctx.fillRect(
    0,
    0,
    largura,
    altura
  );


  // ----------------------------------------------------------
  // Brilho radial
  // ----------------------------------------------------------

  const radial =
    ctx.createRadialGradient(
      largura * 0.5,
      altura * 0.45,
      10,
      largura * 0.5,
      altura * 0.45,
      Math.max(
        largura,
        altura
      ) * 0.8
    );


  radial.addColorStop(
    0,
    "rgba(255,255,220,0.30)"
  );

  radial.addColorStop(
    0.45,
    "rgba(255,220,100,0.12)"
  );

  radial.addColorStop(
    1,
    "rgba(70,35,0,0.30)"
  );


  ctx.fillStyle =
    radial;

  ctx.fillRect(
    0,
    0,
    largura,
    altura
  );


  // ----------------------------------------------------------
  // Textura metálica
  // ----------------------------------------------------------

  ctx.save();

  ctx.globalAlpha =
    0.10;


  for (
    let y = 0;
    y < altura;
    y += 4
  ) {
    ctx.fillStyle =
      y % 8 === 0
        ? "#fff3ae"
        : "#5c3500";


    ctx.fillRect(
      0,
      y,
      largura,
      1
    );
  }


  ctx.restore();
}


// ============================================================
// TREVO
// ============================================================

function desenharTrevo(
  ctx,
  x,
  y,
  tamanho,
  rotacao,
  opacidade
) {
  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.rotate(
    rotacao
  );

  ctx.globalAlpha =
    opacidade;


  const escala =
    tamanho / 40;

  ctx.scale(
    escala,
    escala
  );


  ctx.shadowColor =
    "rgba(255,255,255,0.60)";

  ctx.shadowBlur =
    5;


  const verde =
    ctx.createRadialGradient(
      -5,
      -5,
      1,
      0,
      0,
      25
    );


  verde.addColorStop(
    0,
    "#ecffd0"
  );

  verde.addColorStop(
    0.25,
    "#75cf46"
  );

  verde.addColorStop(
    0.60,
    "#29952f"
  );

  verde.addColorStop(
    1,
    "#0c5317"
  );


  ctx.fillStyle =
    verde;


  const folhas = [
    [0, -11],
    [11, 0],
    [0, 11],
    [-11, 0]
  ];


  folhas.forEach(
    ([fx, fy]) => {
      ctx.beginPath();

      ctx.arc(
        fx,
        fy,
        10,
        0,
        Math.PI * 2
      );

      ctx.fill();
    }
  );


  // Centro
  ctx.beginPath();

  ctx.arc(
    0,
    0,
    5,
    0,
    Math.PI * 2
  );

  ctx.fillStyle =
    "#1b6d1e";

  ctx.fill();


  // Cabinho
  ctx.beginPath();

  ctx.moveTo(
    2,
    5
  );

  ctx.quadraticCurveTo(
    6,
    18,
    2,
    27
  );

  ctx.strokeStyle =
    "#236a1e";

  ctx.lineWidth =
    3;

  ctx.lineCap =
    "round";

  ctx.stroke();


  ctx.restore();
}


// ============================================================
// TREVO ANIMADO
// ============================================================

const trevosAnimados = [
  {
    x: 0.12,
    y: 0.23,
    tamanho: 25,
    fase: 0.0,
    velocidade: 0.0009,
    opacidade: 0.40
  },

  {
    x: 0.84,
    y: 0.20,
    tamanho: 31,
    fase: 1.5,
    velocidade: 0.0011,
    opacidade: 0.45
  },

  {
    x: 0.16,
    y: 0.78,
    tamanho: 32,
    fase: 2.4,
    velocidade: 0.0008,
    opacidade: 0.32
  },

  {
    x: 0.83,
    y: 0.78,
    tamanho: 27,
    fase: 3.1,
    velocidade: 0.0010,
    opacidade: 0.38
  }
];


function desenharTrevosAnimados(tempo) {
  const ctx =
    ctxCapa;


  trevosAnimados.forEach(
    trevo => {
      const x =
        larguraCanvas *
        trevo.x;

      const yBase =
        alturaCanvas *
        trevo.y;


      const movimento =
        Math.sin(
          tempo *
          trevo.velocidade +
          trevo.fase
        ) * 8;


      const rotacao =
        Math.sin(
          tempo *
          trevo.velocidade *
          0.8 +
          trevo.fase
        ) * 0.18;


      desenharTrevo(
        ctx,
        x,
        yBase + movimento,
        trevo.tamanho,
        rotacao,
        trevo.opacidade
      );
    }
  );
}


// ============================================================
// TEXTO
// ============================================================

function desenharTexto() {
  const ctx =
    ctxCapa;

  const largura =
    larguraCanvas;

  const altura =
    alturaCanvas;


  ctx.save();

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";


  ctx.shadowColor =
    "rgba(70,35,0,0.80)";

  ctx.shadowBlur =
    5;

  ctx.shadowOffsetX =
    2;

  ctx.shadowOffsetY =
    3;


  // ----------------------------------------------------------
  // RASPE AQUI
  // ----------------------------------------------------------

  ctx.font =
    "900 30px Arial, sans-serif";


  ctx.fillStyle =
    "#fff4b4";

  ctx.strokeStyle =
    "#6b3d00";

  ctx.lineWidth =
    3;


  ctx.strokeText(
    "RASPE AQUI",
    largura / 2,
    altura / 2 - 18
  );


  ctx.fillText(
    "RASPE AQUI",
    largura / 2,
    altura / 2 - 18
  );


  // ----------------------------------------------------------
  // TEXTO SECUNDÁRIO
  // ----------------------------------------------------------

  ctx.font =
    "700 14px Arial, sans-serif";


  ctx.fillStyle =
    "#fff8d5";

  ctx.strokeStyle =
    "#754500";

  ctx.lineWidth =
    2;


  ctx.strokeText(
    "🍀 DESCUBRA SUA SORTE 🍀",
    largura / 2,
    altura / 2 + 21
  );


  ctx.fillText(
    "🍀 DESCUBRA SUA SORTE 🍀",
    largura / 2,
    altura / 2 + 21
  );


  ctx.restore();
}


// ============================================================
// BORDA
// ============================================================

function desenharBorda() {
  const ctx =
    ctxCapa;

  const largura =
    larguraCanvas;

  const altura =
    alturaCanvas;


  ctx.save();


  ctx.strokeStyle =
    "rgba(255,246,180,0.95)";

  ctx.lineWidth =
    3;


  ctx.strokeRect(
    2,
    2,
    largura - 4,
    altura - 4
  );


  ctx.strokeStyle =
    "rgba(80,45,0,0.80)";

  ctx.lineWidth =
    1;


  ctx.strokeRect(
    7,
    7,
    largura - 14,
    altura - 14
  );


  ctx.restore();
}


// ============================================================
// BRILHO
// ============================================================

function desenharBrilho() {
  const ctx =
    ctxCapa;

  const largura =
    larguraCanvas;

  const altura =
    alturaCanvas;


  const brilho =
    ctx.createLinearGradient(
      posicaoBrilho,
      0,
      posicaoBrilho + 120,
      0
    );


  brilho.addColorStop(
    0,
    "rgba(255,255,255,0)"
  );

  brilho.addColorStop(
    0.45,
    "rgba(255,255,255,0.15)"
  );

  brilho.addColorStop(
    0.50,
    "rgba(255,255,255,0.55)"
  );

  brilho.addColorStop(
    0.55,
    "rgba(255,255,255,0.15)"
  );

  brilho.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );


  ctx.save();

  ctx.globalCompositeOperation =
    "source-atop";

  ctx.fillStyle =
    brilho;

  ctx.fillRect(
    0,
    0,
    largura,
    altura
  );

  ctx.restore();


  posicaoBrilho +=
    2.5;


  if (
    posicaoBrilho >
    largura + 250
  ) {
    posicaoBrilho =
      -250;
  }
}


// ============================================================
// DESENHAR CAPA COMPLETA
// ============================================================

function desenharCapaCompleta(
  tempo
) {
  if (
    !ctxCapa ||
    revelada
  ) {
    return;
  }


  desenharFundoDourado();

  desenharTrevosAnimados(
    tempo
  );

  desenharTexto();

  desenharBorda();

  desenharBrilho();
}


// ============================================================
// ANIMAÇÃO
// ============================================================

function iniciarAnimacao() {
  if (animacao) {
    cancelAnimationFrame(
      animacao
    );
  }


  function quadro(tempo) {
    if (revelada) {
      return;
    }


    desenharCapaCompleta(
      tempo
    );


    animacao =
      requestAnimationFrame(
        quadro
      );
  }


  animacao =
    requestAnimationFrame(
      quadro
    );
}


// ============================================================
// PARAR ANIMAÇÃO
// ============================================================

function pararAnimacao() {
  if (animacao) {
    cancelAnimationFrame(
      animacao
    );

    animacao = null;
  }
}


// ============================================================
// LIMPAR CAMADA DE RASPAGEM
// ============================================================

function limparRaspagem() {
  if (!ctxRaspagem) return;

  ctxRaspagem.clearRect(
    0,
    0,
    larguraCanvas,
    alturaCanvas
  );
}


// ============================================================
// CONFIGURAR PINCEL
// ============================================================

function configurarPincel() {
  if (!ctxRaspagem) return;

  ctxRaspagem.globalCompositeOperation =
    "destination-out";

  ctxRaspagem.lineWidth =
    38;

  ctxRaspagem.lineCap =
    "round";

  ctxRaspagem.lineJoin =
    "round";
}


// ============================================================
// POSIÇÃO
// ============================================================

function obterPosicao(evento) {
  const alvo =
    canvasRaspagem;

  const rect =
    alvo.getBoundingClientRect();


  let clienteX = 0;
  let clienteY = 0;


  if (
    evento.touches &&
    evento.touches.length
  ) {
    clienteX =
      evento.touches[0].clientX;

    clienteY =
      evento.touches[0].clientY;

  } else if (
    evento.changedTouches &&
    evento.changedTouches.length
  ) {
    clienteX =
      evento.changedTouches[0].clientX;

    clienteY =
      evento.changedTouches[0].clientY;

  } else {
    clienteX =
      evento.clientX;

    clienteY =
      evento.clientY;
  }


  return {
    x:
      clienteX -
      rect.left,

    y:
      clienteY -
      rect.top
  };
}


// ============================================================
// INÍCIO DA RASPAGEM
// ============================================================

function iniciarRaspagem(
  evento
) {
  if (revelada) {
    return;
  }


  raspando = true;


  const posicao =
    obterPosicao(
      evento
    );


  ultimoX =
    posicao.x;

  ultimoY =
    posicao.y;


  raspar(
    evento
  );
}


// ============================================================
// RASPAGEM
// ============================================================

function raspar(evento) {
  if (
    !raspando ||
    revelada
  ) {
    return;
  }


  evento.preventDefault();


  const posicao =
    obterPosicao(
      evento
    );


  configurarPincel();


  ctxRaspagem.beginPath();


  if (
    ultimoX !== null &&
    ultimoY !== null
  ) {
    ctxRaspagem.moveTo(
      ultimoX,
      ultimoY
    );

  } else {
    ctxRaspagem.moveTo(
      posicao.x,
      posicao.y
    );
  }


  ctxRaspagem.lineTo(
    posicao.x,
    posicao.y
  );


  ctxRaspagem.stroke();


  ultimoX =
    posicao.x;

  ultimoY =
    posicao.y;


  verificarPercentual();
}


// ============================================================
// FIM DA RASPAGEM
// ============================================================

function pararRaspagem() {
  raspando = false;

  ultimoX = null;
  ultimoY = null;
}


// ============================================================
// VERIFICAR ÁREA RASPADA
// ============================================================

function verificarPercentual() {
  const agora =
    Date.now();


  if (
    agora -
      ultimaVerificacao <
    180
  ) {
    return;
  }


  ultimaVerificacao =
    agora;


  if (!ctxRaspagem) {
    return;
  }


  const largura =
    canvasRaspagem.width;

  const altura =
    canvasRaspagem.height;


  const imagem =
    ctxRaspagem.getImageData(
      0,
      0,
      largura,
      altura
    );


  const dados =
    imagem.data;


  let transparentes =
    0;

  let total =
    0;


  // Analisa amostras
  // para não sobrecarregar celulares

  const passo =
    18;


  for (
    let y = 0;
    y < altura;
    y += passo
  ) {
    for (
      let x = 0;
      x < largura;
      x += passo
    ) {
      const indice =
        (y * largura + x) * 4;


      const alpha =
        dados[
          indice + 3
        ];


      if (
        alpha < 80
      ) {
        transparentes++;
      }


      total++;
    }
  }


  if (!total) {
    return;
  }


  const percentual =
    transparentes /
    total;


  if (
    percentual >=
    0.65
  ) {
    revelarResultado();
  }
}


// ============================================================
// REVELAR RESULTADO
// ============================================================

async function revelarResultado() {
  if (revelada) {
    return;
  }


  revelada = true;

  raspando = false;


  pararAnimacao();


  // Remove a camada de raspagem
  // e deixa o resultado aparecer

  limparRaspagem();


  if (!jogadaIdAtual) {
    mostrarMensagem(
      "Não foi possível identificar esta jogada.",
      "erro"
    );

    return;
  }


  mostrarMensagem(
    "🍀 Revelando sua sorte...",
    "normal"
  );


  try {
    const resposta =
      await revelarJogada({
        jogadaId:
          jogadaIdAtual
      });


    const dados =
      resposta.data;


    if (
      !dados ||
      !dados.resultado
    ) {
      throw new Error(
        "Resultado da raspadinha não encontrado."
      );
    }


    mostrarResultado(
      dados.resultado
    );


  } catch (erro) {
    console.error(
      "Erro ao revelar raspadinha:",
      erro
    );


    mostrarMensagem(
      obterMensagemErro(
        erro
      ),
      "erro"
    );
  }
}


// ============================================================
// MOSTRAR PRÊMIO
// ============================================================

function mostrarResultado(
  premio
) {
  if (!resultado) {
    return;
  }


  resultado.innerHTML =
    "";


  const titulo =
    document.createElement(
      "div"
    );

  titulo.className =
    "raspadinha-titulo-resultado";

  titulo.textContent =
    "🍀 PARABÉNS! 🍀";


  const nome =
    document.createElement(
      "div"
    );

  nome.className =
    "raspadinha-premio";

  nome.textContent =
    premio.nome ||
    "Você ganhou um prêmio!";


  resultado.appendChild(
    titulo
  );

  resultado.appendChild(
    nome
  );


  if (premio.imagem) {
    const imagem =
      document.createElement(
        "img"
      );


    imagem.src =
      premio.imagem;


    imagem.alt =
      premio.nome ||
      "Prêmio da raspadinha";


    imagem.className =
      "raspadinha-imagem-premio";


    resultado.appendChild(
      imagem
    );
  }


  resultado.style.display =
    "block";


  mostrarMensagem(
    "🎉 Sua raspadinha foi revelada!",
    "sucesso"
  );
}


// ============================================================
// LIBERAR JOGADA
// ============================================================

async function liberarJogada() {
  if (!firebaseConfigured) {
    mostrarMensagem(
      "O Firebase ainda não está configurado.",
      "erro"
    );

    return;
  }


  const numero =
    normalizarNumero(
      campoNumero?.value
    );


  if (!numero) {
    mostrarMensagem(
      "Digite um número válido de 000 a 999.",
      "erro"
    );

    campoNumero?.focus();

    return;
  }


  try {
    botaoLiberar.disabled =
      true;


    mostrarMensagem(
      "🔐 Verificando sua participação...",
      "normal"
    );


    await garantirAutenticacao();


    mostrarMensagem(
      "🍀 Liberando sua raspadinha...",
      "normal"
    );


    const resposta =
      await criarJogada({
        numeroRifa:
          numero
      });


    const dados =
      resposta.data;


    if (
      !dados ||
      !dados.jogadaId
    ) {
      throw new Error(
        "O servidor não retornou a jogada."
      );
    }


    jogadaIdAtual =
      dados.jogadaId;


    numeroAtual =
      numero;


    revelada = false;


    // --------------------------------------------------------
    // Mostrar área
    // --------------------------------------------------------

    if (areaRaspadinha) {
      areaRaspadinha.style.display =
        "block";
    }


    // --------------------------------------------------------
    // Limpar resultado
    // --------------------------------------------------------

    if (resultado) {
      resultado.innerHTML =
        "";

      resultado.style.display =
        "none";
    }


    // --------------------------------------------------------
    // Preparar duas camadas
    // --------------------------------------------------------

    prepararCamadas();

    ajustarCanvas();

    limparRaspagem();


    // --------------------------------------------------------
    // Iniciar animação
    // --------------------------------------------------------

    iniciarAnimacao();


    mostrarMensagem(
      "🍀 BOA SORTE! Raspe a capa dourada para descobrir seu prêmio!",
      "sucesso"
    );


    // --------------------------------------------------------
    // Rolar até a raspadinha
    // --------------------------------------------------------

    setTimeout(
      () => {
        areaRaspadinha?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      },
      120
    );


  } catch (erro) {
    console.error(
      "Erro ao liberar raspadinha:",
      erro
    );


    mostrarMensagem(
      obterMensagemErro(
        erro
      ),
      "erro"
    );


  } finally {
    botaoLiberar.disabled =
      false;
  }
}


// ============================================================
// ERROS
// ============================================================

function obterMensagemErro(
  erro
) {
  const codigo =
    erro?.code || "";

  const texto =
    erro?.message || "";


  if (
    codigo.includes(
      "unauthenticated"
    )
  ) {
    return (
      "Sua sessão expirou. Tente novamente."
    );
  }


  if (
    codigo.includes(
      "failed-precondition"
    )
  ) {
    return (
      "Esta raspadinha ainda não está liberada."
    );
  }


  if (
    codigo.includes(
      "not-found"
    )
  ) {
    return (
      "Jogada não encontrada."
    );
  }


  if (
    codigo.includes(
      "permission-denied"
    )
  ) {
    return (
      "Você não tem permissão para realizar esta ação."
    );
  }


  if (texto) {
    return texto;
  }


  return (
    "Não foi possível revelar a raspadinha. Tente novamente."
  );
}


// ============================================================
// EVENTOS
// ============================================================

if (botaoLiberar) {
  botaoLiberar.addEventListener(
    "click",
    liberarJogada
  );
}


if (campoNumero) {
  campoNumero.addEventListener(
    "keydown",
    evento => {
      if (
        evento.key === "Enter"
      ) {
        evento.preventDefault();

        liberarJogada();
      }
    }
  );
}


// ============================================================
// CONFIGURAR EVENTOS DA CAMADA DE RASPAGEM
// ============================================================

function configurarEventosCanvas() {
  if (!canvasRaspagem) {
    return;
  }


  canvasRaspagem.addEventListener(
    "mousedown",
    iniciarRaspagem
  );


  canvasRaspagem.addEventListener(
    "mousemove",
    raspar
  );


  canvasRaspagem.addEventListener(
    "mouseup",
    pararRaspagem
  );


  canvasRaspagem.addEventListener(
    "mouseleave",
    pararRaspagem
  );


  canvasRaspagem.addEventListener(
    "touchstart",
    iniciarRaspagem,
    {
      passive: false
    }
  );


  canvasRaspagem.addEventListener(
    "touchmove",
    raspar,
    {
      passive: false
    }
  );


  canvasRaspagem.addEventListener(
    "touchend",
    pararRaspagem,
    {
      passive: true
    }
  );


  canvasRaspagem.addEventListener(
    "touchcancel",
    pararRaspagem,
    {
      passive: true
    }
  );
}


// ============================================================
// CSS
// ============================================================

function adicionarEstilos() {
  const id =
    "estilo-raspadinha-gilfest";

  if (
    document.getElementById(id)
  ) {
    return;
  }


  const estilo =
    document.createElement(
      "style"
    );


  estilo.id =
    id;


  estilo.textContent = `
    #areaRaspadinha {
      width: 100%;
      max-width: 560px;
      margin: 25px auto;
      text-align: center;
    }

    .gilfest-scratch-container {
      position: relative;
      width: 100%;
      max-width: 520px;
      height: 260px;
      margin: 18px auto;
      border-radius: 18px;
      overflow: hidden;
      box-shadow:
        0 8px 25px rgba(0,0,0,0.25),
        0 0 0 3px rgba(180,120,20,0.35);
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .gilfest-canvas-capa,
    .gilfest-canvas-raspagem {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
      border-radius: 18px;
    }

    .gilfest-canvas-capa {
      z-index: 1;
      pointer-events: none;
    }

    .gilfest-canvas-raspagem {
      z-index: 2;
      cursor: crosshair;
      touch-action: none;
    }

    .raspadinha-titulo-resultado {
      font-size: 26px;
      font-weight: 900;
      margin: 12px 0;
      letter-spacing: 1px;
    }

    .raspadinha-premio {
      font-size: 29px;
      font-weight: 900;
      margin: 15px 0;
    }

    .raspadinha-imagem-premio {
      display: block;
      width: auto;
      max-width: 230px;
      max-height: 230px;
      margin: 15px auto;
      object-fit: contain;
      border-radius: 15px;
    }

    #liberar:disabled {
      opacity: 0.6;
      cursor: wait;
    }

    @media (max-width: 600px) {
      .gilfest-scratch-container {
        height: 230px;
        border-radius: 15px;
      }

      .gilfest-canvas-capa,
      .gilfest-canvas-raspagem {
        border-radius: 15px;
      }

      .raspadinha-premio {
        font-size: 24px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .gilfest-canvas-capa {
        animation: none;
      }
    }
  `;


  document.head.appendChild(
    estilo
  );
}


// ============================================================
// RESIZE
// ============================================================

window.addEventListener(
  "resize",
  () => {
    if (
      !jogadaIdAtual ||
      revelada ||
      !canvasCapa
    ) {
      return;
    }


    // Não recria a raspagem durante
    // um simples redimensionamento.
    //
    // Ajustamos apenas as dimensões.
    ajustarCanvas();
  }
);


// ============================================================
// INICIALIZAÇÃO
// ============================================================

adicionarEstilos();


if (areaRaspadinha) {
  areaRaspadinha.style.display =
    "none";
}


if (canvas) {
  prepararCamadas();

  ajustarCanvas();

  configurarEventosCanvas();
}


console.log(
  "🍀 Raspadinha da Amizade — GILFEST carregada."
);
