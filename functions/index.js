const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const crypto = require('crypto');

initializeApp();

const db = getDatabase();


/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

const REGIAO = 'southamerica-east1';

const TEMPO_RESERVA =
  24 * 60 * 60 * 1000;

const MAX_NUMEROS_POR_RESERVA = 10;


/* =========================================================
   NORMALIZAR NÚMERO
   ========================================================= */

const normalizar = n => {

  const s =
    String(n ?? '').trim();

  if (!/^\d{1,3}$/.test(s)) {
    return null;
  }

  const v =
    s.padStart(3, '0');

  if (Number(v) > 999) {
    return null;
  }

  return v;
};


/* =========================================================
   VERIFICAR ADMINISTRADOR
   ========================================================= */

const admin = async request => {

  if (!request.auth) {
    return false;
  }

  const snap =
    await db
      .ref(`adminUids/${request.auth.uid}`)
      .once('value');

  return snap.val() === true;
};


/* =========================================================
   CRIAR RESERVA
   ========================================================= */

exports.criarReserva = onCall(
  {
    region: REGIAO
  },
  async request => {

    const nome =
      String(
        request.data?.nome || ''
      ).trim();

    const telefone =
      String(
        request.data?.telefone || ''
      ).trim();

    const nums =
      Array.isArray(
        request.data?.numeros
      )
        ? request.data.numeros
            .map(normalizar)
            .filter(
              n => n !== null
            )
        : [];


    /* =====================================================
       VALIDAR DADOS
       ===================================================== */

    if (
      !nome ||
      !telefone ||
      nums.length < 1 ||
      nums.length > MAX_NUMEROS_POR_RESERVA
    ) {

      throw new HttpsError(
        'invalid-argument',
        'Dados da reserva inválidos.'
      );

    }


    /* =====================================================
       VERIFICAR REPETIÇÃO
       ===================================================== */

    const unique =
      [...new Set(nums)];


    if (
      unique.length !== nums.length
    ) {

      throw new HttpsError(
        'invalid-argument',
        'Há números repetidos.'
      );

    }


    /* =====================================================
       TEMPO DA RESERVA
       ===================================================== */

    const agora =
      Date.now();

    const expiraEm =
      agora + TEMPO_RESERVA;


    /* =====================================================
       PREPARAR ATUALIZAÇÕES
       ===================================================== */

    const updates = {};


    /* =====================================================
       VERIFICAR DISPONIBILIDADE
       ===================================================== */

    for (
      const numero of unique
    ) {

      const numeroRef =
        db.ref(
          `rifa/numeros/${numero}`
        );

      const snap =
        await numeroRef.once('value');


      if (!snap.exists()) {

        throw new HttpsError(
          'not-found',
          `Número ${numero} não encontrado.`
        );

      }


      const dados =
        snap.val() || {};


      /* ===================================================
         VERIFICAR RESERVA EXPIRADA
         =================================================== */

      const reservaExpirada =
        dados.status === 'reservado' &&
        dados.expiraEm &&
        Number(dados.expiraEm) <= agora;


      /* ===================================================
         VERIFICAR DISPONIBILIDADE
         =================================================== */

      if (
        dados.status !== 'disponivel' &&
        !reservaExpirada
      ) {

        throw new HttpsError(
          'failed-precondition',
          `Número ${numero} não está disponível.`
        );

      }


      /* ===================================================
         RESERVAR NÚMERO
         =================================================== */

      updates[
        `rifa/numeros/${numero}`
      ] = {

        numero,

        status:
          'reservado',

        reservado:
          true,

        nome,

        telefone,

        dataReserva:
          agora,

        expiraEm

      };

    }


    /* =====================================================
       ID DA RESERVA
       ===================================================== */

    const reservaId =
      crypto.randomUUID();


    /* =====================================================
       SALVAR RESERVA
       ===================================================== */

    updates[
      `rifa/reservas/${reservaId}`
    ] = {

      nome,

      telefone,

      numeros:
        unique,

      status:
        'reservado',

      criadoEm:
        agora,

      expiraEm

    };


    /* =====================================================
       GRAVAR
       ===================================================== */

    await db
      .ref()
      .update(updates);


    /* =====================================================
       RETORNO
       ===================================================== */

    return {

      ok:
        true,

      reservaId,

      numeros:
        unique,

      criadoEm:
        agora,

      expiraEm

    };

  }
);


/* =========================================================
   CRIAR JOGADA DA RASPADINHA
   ========================================================= */

exports.criarJogadaRaspadinha = onCall(
  {
    region: REGIAO
  },
  async request => {

    /* =====================================================
       AUTENTICAÇÃO
       ===================================================== */

    if (!request.auth) {

      throw new HttpsError(
        'unauthenticated',
        'Autenticação necessária.'
      );

    }


    /* =====================================================
       NÚMERO
       ===================================================== */

    const numero =
      normalizar(
        request.data?.numeroRifa
      );


    if (numero === null) {

      throw new HttpsError(
        'invalid-argument',
        'Número inválido.'
      );

    }


    /* =====================================================
       BUSCAR NÚMERO
       ===================================================== */

    const numeroSnap =
      await db
        .ref(`rifa/numeros/${numero}`)
        .once('value');


    if (!numeroSnap.exists()) {

      throw new HttpsError(
        'not-found',
        'Número não encontrado.'
      );

    }


    const dadosNumero =
      numeroSnap.val() || {};


    /* =====================================================
       PAGAMENTO CONFIRMADO
       ===================================================== */

    if (
      dadosNumero.status !== 'pago'
    ) {

      throw new HttpsError(
        'failed-precondition',
        'O pagamento ainda não foi confirmado.'
      );

    }


    /* =====================================================
       VERIFICAR PARTICIPANTE
       ===================================================== */

    if (
      dadosNumero.participanteId &&
      dadosNumero.participanteId !==
        request.auth.uid
    ) {

      throw new HttpsError(
        'permission-denied',
        'Este número pertence a outro participante.'
      );

    }


    /* =====================================================
       VERIFICAR CONFIGURAÇÃO
       ===================================================== */

    const configSnap =
      await db
        .ref(
          'rifa/raspadinha/configuracao'
        )
        .once('value');


    const config =
      configSnap.val() || {};


    if (
      config.ativa === false
    ) {

      throw new HttpsError(
        'failed-precondition',
        'A raspadinha está temporariamente desativada.'
      );

    }


    /* =====================================================
       VERIFICAR JOGADA EXISTENTE
       ===================================================== */

    const jogadasSnap =
      await db
        .ref(
          'rifa/raspadinha/jogadas'
        )
        .once('value');


    const jogadas =
      jogadasSnap.val() || {};


    for (
      const [id, jogada] of
      Object.entries(jogadas)
    ) {

      if (
        jogada &&
        jogada.participanteId ===
          request.auth.uid &&
        jogada.numeroRifa ===
          numero
      ) {

        return {

          ok:
            true,

          jogadaId:
            id,

          novaJogada:
            false

        };

      }

    }


    /* =====================================================
       LIMITE DE JOGADAS
       ===================================================== */

    const maxJogadas =
      Number(
        config.maxJogadasPorCompra ||
        1
      );


    let quantidadeJogadas =
      0;


    for (
      const jogada of
      Object.values(jogadas)
    ) {

      if (
        jogada &&
        jogada.participanteId ===
          request.auth.uid
      ) {

        quantidadeJogadas++;

      }

    }


    if (
      quantidadeJogadas >=
      maxJogadas
    ) {

      throw new HttpsError(
        'resource-exhausted',
        'O limite de jogadas desta participação foi atingido.'
      );

    }


    /* =====================================================
       CRIAR JOGADA
       ===================================================== */

    const jogadaId =
      crypto.randomUUID();


    await db
      .ref(
        `rifa/raspadinha/jogadas/${jogadaId}`
      )
      .set({

        participanteId:
          request.auth.uid,

        numeroRifa:
          numero,

        liberada:
          true,

        utilizada:
          false,

        resultado:
          null,

        criadaEm:
          Date.now()

      });


    /* =====================================================
       RETORNO
       ===================================================== */

    return {

      ok:
        true,

      jogada
