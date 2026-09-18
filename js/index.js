const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const crypto = require('crypto');

initializeApp();

const db = getDatabase();

const REGIAO = 'southamerica-east1';
const MAX_NUMEROS_RESERVA = 10;
const DURACAO_RESERVA_MS = 24 * 60 * 60 * 1000;


/* =========================================================
   NORMALIZAR NÚMERO
   ========================================================= */

function normalizar(n) {
  const s = String(n ?? '').trim();

  if (!/^\d{1,3}$/.test(s)) {
    return null;
  }

  const v = s.padStart(3, '0');

  if (Number(v) > 999) {
    return null;
  }

  return v;
}


/* =========================================================
   VERIFICAR ADMINISTRADOR
   ========================================================= */

async function admin(request) {
  if (!request.auth) {
    return false;
  }

  const snap = await db
    .ref(`adminUids/${request.auth.uid}`)
    .once('value');

  return snap.val() === true;
}


/* =========================================================
   LIMPAR CAMPOS DO PATCH DO ADMIN
   ========================================================= */

function limparPatchNumero(patch) {
  const permitidos = [
    'status',
    'pagamento',
    'participanteId',
    'nome',
    'telefone',
    'dataVenda',
    'comprovante',
    'dataPagamento'
  ];

  const limpo = {};

  for (const campo of permitidos) {
    if (Object.prototype.hasOwnProperty.call(patch, campo)) {
      limpo[campo] = patch[campo];
    }
  }

  return limpo;
}


/* =========================================================
   CRIAR RESERVA
   ========================================================= */

exports.criarReserva = onCall(
  { region: REGIAO },
  async request => {
    const nome = String(request.data?.nome || '').trim();
    const telefone = String(request.data?.telefone || '').trim();

    const nums = Array.isArray(request.data?.numeros)
      ? request.data.numeros
          .map(normalizar)
          .filter(n => n !== null)
      : [];

    if (
      !nome ||
      !telefone ||
      nums.length < 1 ||
      nums.length > MAX_NUMEROS_RESERVA
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Dados da reserva inválidos.'
      );
    }

    const unique = [...new Set(nums)];

    if (unique.length !== nums.length) {
      throw new HttpsError(
        'invalid-argument',
        'Há números repetidos.'
      );
    }

    /*
     * Fazemos a verificação individual antes da gravação.
     * A regra de negócio continua sendo: somente números
     * disponíveis podem entrar em uma nova reserva.
     */

    for (const numero of unique) {
      const snap = await db
        .ref(`rifa/numeros/${numero}`)
        .once('value');

      if (!snap.exists() || snap.val().status !== 'disponivel') {
        throw new HttpsError(
          'failed-precondition',
          `Número ${numero} não está disponível.`
        );
      }
    }

    const agora = Date.now();
    const expiraEm = agora + DURACAO_RESERVA_MS;
    const reservaId = crypto.randomUUID();

    const updates = {};

    for (const numero of unique) {
      updates[`rifa/numeros/${numero}`] = {
        numero,
        status: 'reservado',
        nome,
        telefone,
        reservaId,
        dataReserva: agora,
        expiraEm
      };
    }

    updates[`rifa/reservas/${reservaId}`] = {
      nome,
      telefone,
      numeros: unique,
      status: 'reservado',
      criadoEm: agora,
      expiraEm
    };

    await db.ref().update(updates);

    return {
      reservaId,
      numeros: unique,
      expiraEm
    };
  }
);


/* =========================================================
   LER PRÊMIOS DISPONÍVEIS
   ========================================================= */

async function obterPremiosDisponiveis() {
  const snap = await db
    .ref('rifa/raspadinha/premios')
    .once('value');

  const valor = snap.val();

  if (!valor || typeof valor !== 'object') {
    return [];
  }

  return Object.entries(valor)
    .map(([id, premio]) => ({
      id,
      ...(premio || {})
    }))
    .filter(premio => {
      const quantidade = Number(premio.quantidade);

      return (
        premio.ativo === true &&
        Number.isFinite(quantidade) &&
        quantidade > 0 &&
        String(premio.nome || '').trim() !== ''
      );
    });
}


/* =========================================================
   ESCOLHER E RESERVAR UM PRÊMIO
   ========================================================= */

async function escolherPremio() {
  /*
   * O sorteio acontece dentro da Cloud Function.
   * O navegador nunca escolhe o prêmio.
   */

  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const disponiveis = await obterPremiosDisponiveis();

    if (!disponiveis.length) {
      throw new HttpsError(
        'resource-exhausted',
        'Não há prêmios disponíveis para a raspadinha.'
      );
    }

    const indice = crypto.randomInt(0, disponiveis.length);
    const escolhido = disponiveis[indice];

    const quantidadeRef = db.ref(
      `rifa/raspadinha/premios/${escolhido.id}/quantidade`
    );

    let conseguiuReservar = false;
    let quantidadeRestante = 0;

    await quantidadeRef.transaction(current => {
      const quantidade = Number(current);

      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        return;
      }

      quantidadeRestante = quantidade - 1;
      conseguiuReservar = true;

      return quantidadeRestante;
    });

    if (conseguiuReservar) {
      return {
        id: escolhido.id,
        nome: String(escolhido.nome).trim(),
        imagem: escolhido.imagem || '',
        quantidadeRestante
      };
    }
  }

  throw new HttpsError(
    'aborted',
    'Não foi possível reservar um prêmio. Tente novamente.'
  );
}


/* =========================================================
   CRIAR JOGADA DA RASPADINHA
   ========================================================= */

exports.criarJogadaRaspadinha = onCall(
  { region: REGIAO },
  async request => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Autenticação necessária.'
      );
    }

    const numero = normalizar(request.data?.numeroRifa);

    if (numero === null) {
      throw new HttpsError(
        'invalid-argument',
        'Número inválido.'
      );
    }

    const numeroSnap = await db
      .ref(`rifa/numeros/${numero}`)
      .once('value');

    if (!numeroSnap.exists()) {
      throw new HttpsError(
        'not-found',
        'Número não encontrado.'
      );
    }

    const n = numeroSnap.val();

    if (n.status !== 'pago') {
      throw new HttpsError(
        'failed-precondition',
        'O pagamento ainda não foi confirmado.'
      );
    }

    if (
      n.participanteId &&
      n.participanteId !== request.auth.uid
    ) {
      throw new HttpsError(
        'permission-denied',
        'Este número pertence a outro participante.'
      );
    }

    /*
     * O mesmo número não pode consumir duas raspadinhas.
     * Usamos uma chave por número para impedir duplicidade
     * mesmo quando o participante toca no botão mais de uma vez.
     */

    const controleRef = db.ref(
      `rifa/raspadinha/jogadasPorNumero/${numero}`
    );

    let jogadaId = null;
    let criouControle = false;

    await controleRef.transaction(current => {
      if (current && typeof current === 'object') {
        jogadaId = current.jogadaId || null;
        return;
      }

      jogadaId = crypto.randomUUID();
      criouControle = true;

      return {
        jogadaId,
        participanteId: request.auth.uid,
        numeroRifa: numero,
        criadaEm: Date.now()
      };
    });

    /*
     * Se já havia uma jogada para esse número,
     * devolvemos a mesma jogada em vez de consumir
     * outro prêmio.
     */

    if (!criouControle) {
      if (!jogadaId) {
        throw new HttpsError(
          'aborted',
          'Não foi possível localizar a jogada anterior.'
        );
      }

      const existente = await db
        .ref(`rifa/raspadinha/jogadas/${jogadaId}`)
        .once('value');

      if (!existente.exists()) {
        throw new HttpsError(
          'aborted',
          'A jogada anterior está inconsistente. Procure o administrador.'
        );
      }

      const dados = existente.val();

      if (dados.participanteId !== request.auth.uid) {
        throw new HttpsError(
          'permission-denied',
          'Este número já possui uma jogada vinculada a outro participante.'
        );
      }

      return {
        jogadaId,
        novaJogada: false
      };
    }

    let premio;

    try {
      premio = await escolherPremio();
    } catch (error) {
      /*
       * Não deixa um controle órfão impedir novas tentativas
       * se não foi possível reservar um prêmio.
       */
      await controleRef.remove();

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        'internal',
        'Não foi possível preparar o prêmio da raspadinha.'
      );
    }

    const agora = Date.now();

    await db
      .ref(`rifa/raspadinha/jogadas/${jogadaId}`)
      .set({
        participanteId: request.auth.uid,
        numeroRifa: numero,
        liberada: true,
        utilizada: false,
        resultado: premio.nome,
        premioId: premio.id,
        imagemPremio: premio.imagem,
        criadaEm: agora,
        liberadaEm: agora
      });

    return {
      jogadaId,
      novaJogada: true
    };
  }
);


/* =========================================================
   REVELAR JOGADA DA RASPADINHA
   ========================================================= */

exports.revelarJogadaRaspadinha = onCall(
  { region: REGIAO },
  async request => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Autenticação necessária.'
      );
    }

    const jogadaId =
      String(request.data?.jogadaId || '').trim();

    if (!jogadaId) {
      throw new HttpsError(
        'invalid-argument',
        'ID da jogada não informado.'
      );
    }

    const jogadaRef = db.ref(
      `rifa/raspadinha/jogadas/${jogadaId}`
    );

    const snap = await jogadaRef.once('value');

    if (!snap.exists()) {
      throw new HttpsError(
        'not-found',
        'Jogada não encontrada.'
      );
    }

    const jogada = snap.val();

    if (jogada.participanteId !== request.auth.uid) {
      throw new HttpsError(
        'permission-denied',
        'Esta jogada pertence a outro participante.'
      );
    }

    if (jogada.liberada !== true) {
      throw new HttpsError(
        'failed-precondition',
        'Esta jogada ainda não foi liberada.'
      );
    }

    if (!jogada.resultado) {
      throw new HttpsError(
        'failed-precondition',
        'O resultado desta jogada ainda não está disponível.'
      );
    }

    /*
     * A marcação de utilizada é feita em transação.
     * Assim a mesma jogada não pode ser resgatada duas vezes.
     */

    let resultadoFinal = null;

    await jogadaRef.transaction(current => {
      if (!current) {
        return;
      }

      if (current.participanteId !== request.auth.uid) {
        return;
      }

      if (current.utilizada === true) {
        resultadoFinal = current.resultado;
        return;
      }

      resultadoFinal = current.resultado;

      return {
        ...current,
        utilizada: true,
        reveladaEm: Date.now()
      };
    });

    if (!resultadoFinal) {
      throw new HttpsError(
        'aborted',
        'Não foi possível revelar o resultado.'
      );
    }

    return {
      ok: true,
      resultado: resultadoFinal,
      premioId: jogada.premioId || '',
      imagemPremio: jogada.imagemPremio || '',
      jaUtilizada: jogada.utilizada === true
    };
  }
);


/* =========================================================
   ADMIN — ATUALIZAR NÚMERO
   ========================================================= */

exports.adminAtualizarNumero = onCall(
  { region: REGIAO },
  async request => {
    if (!(await admin(request))) {
      throw new HttpsError(
        'permission-denied',
        'Administrador não autorizado.'
      );
    }

    const numero = normalizar(request.data?.numero);
    const patch = request.data?.patch;

    if (
      numero === null ||
      !patch ||
      typeof patch !== 'object'
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Dados inválidos.'
      );
    }

    const limpo = limparPatchNumero(patch);

    if (!Object.keys(limpo).length) {
      throw new HttpsError(
        'invalid-argument',
        'Nenhum campo permitido foi informado.'
      );
    }

    await db
      .ref(`rifa/numeros/${numero}`)
      .update(limpo);

    return {
      ok: true
    };
  }
);


/* =========================================================
   INICIALIZAR BANCO
   ========================================================= */

exports.inicializarBanco = onCall(
  { region: REGIAO },
  async request => {
    if (!(await admin(request))) {
      throw new HttpsError(
        'permission-denied',
        'Administrador não autorizado.'
      );
    }

    const base =
      await db.ref('rifa').once('value');

    if (base.exists()) {
      return {
        ok: true,
        jaExistia: true
      };
    }

    const numeros = {};

    for (let i = 0; i < 1000; i++) {
      const n = String(i).padStart(3, '0');

      numeros[n] = {
        numero: n,
        status: 'disponivel'
      };
    }

    await db.ref('rifa').set({
      configuracao: {
        nome: 'RIFA SOLIDÁRIA',
        beneficiada: 'Dona Bené',
        premio: 'Geladeira Midea Frost Free',
        valorNumero: 10,
        quantidadeNumeros: 1000,
        quantidadeCartelas: 10,
        numerosPorCartela: 100,
        dataSorteio: '2026-12-30T20:00:00-03:00'
      },

      numeros,

      reservas: {},

      raspadinha: {
        configuracao: {
          nome: 'Raspadinha da Amizade',
          ativa: true,
          exigePagamentoConfirmado: true,
          maxJogadasPorCompra: 1
        },

        premios: {
          liquidificador: {
            nome: 'Liquidificador',
            imagem: 'img/liquidificador.png',
            quantidade: 50,
            ativo: true
          },

          ferro: {
            nome: 'Ferro de passar',
            imagem: 'img/ferro.png',
            quantidade: 50,
            ativo: true
          }
        },

        novasChances: {},
        jogadas: {},
        jogadasPorNumero: {}
      }
    });

    return {
      ok: true,
      jaExistia: false
    };
  }
);
