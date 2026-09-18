const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const crypto = require('crypto');

initializeApp();

const db = getDatabase();

const TEMPO_RESERVA = 24 * 60 * 60 * 1000;


/* =========================================================
   NORMALIZAR NÚMERO
   ========================================================= */

const normalizar = n => {

  const s = String(n ?? '').trim();

  if (!/^\d{1,3}$/.test(s)) {
    return null;
  }

  const v = s.padStart(3, '0');

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
    await db.ref(`adminUids/${request.auth.uid}`).once('value');

  return snap.val() === true;
};


/* =========================================================
   CRIAR RESERVA
   ========================================================= */

exports.criarReserva = onCall(
  {
    region: 'southamerica-east1'
  },
  async request => {

    const nome =
      String(request.data?.nome || '').trim();

    const telefone =
      String(request.data?.telefone || '').trim();

    const nums =
      Array.isArray(request.data?.numeros)
        ? request.data.numeros
            .map(normalizar)
            .filter(n => n !== null)
        : [];


    if (
      !nome ||
      !telefone ||
      nums.length < 1 ||
      nums.length > 10
    ) {

      throw new HttpsError(
        'invalid-argument',
        'Dados da reserva inválidos.'
      );

    }


    /* Remove números repetidos */

    const unique = [...new Set(nums)];


    if (unique.length !== nums.length) {

      throw new HttpsError(
        'invalid-argument',
        'Há números repetidos.'
      );

    }


    /* Verificar disponibilidade */

    const updates = {};

    for (const numero of unique) {

      const snap =
        await db
          .ref(`rifa/numeros/${numero}`)
          .once('value');

      if (
        !snap.exists() ||
        snap.val().status !== 'disponivel'
      ) {

        throw new HttpsError(
          'failed-precondition',
          `Número ${numero} não está disponível.`
        );

      }

       const TEMPO_RESERVA = 24 * 60 * 60 * 1000;


      updates[
        `rifa/numeros/${numero}`
      ] = {

        numero,
        status: 'reservado',
        nome,
        telefone,
        dataReserva: Date.now()

      };

    }


    /* Criar ID único da reserva */

    const reservaId =
      crypto.randomUUID();


    updates[
      `rifa/reservas/${reservaId}`
    ] = {

      nome,
      telefone,
      numeros: unique,
      status: 'reservado',
      criadoEm: Date.now()

    };


    /* Gravar tudo de uma vez */

    await db.ref().update(updates);


    return {

      reservaId,
      numeros: unique

    };

  }
);


/* =========================================================
   CRIAR JOGADA DA RASPADINHA
   ========================================================= */

exports.criarJogadaRaspadinha = onCall(
  {
    region: 'southamerica-east1'
  },
  async request => {

    if (!request.auth) {

      throw new HttpsError(
        'unauthenticated',
        'Autenticação necessária.'
      );

    }


    const numero =
      normalizar(request.data?.numeroRifa);


    if (numero === null) {

      throw new HttpsError(
        'invalid-argument',
        'Número inválido.'
      );

    }


    const snap =
      await db
        .ref(`rifa/numeros/${numero}`)
        .once('value');


    if (!snap.exists()) {

      throw new HttpsError(
        'not-found',
        'Número não encontrado.'
      );

    }


    const n = snap.val();


    /* Só número pago pode gerar raspadinha */

    if (n.status !== 'pago') {

      throw new HttpsError(
        'failed-precondition',
        'O pagamento ainda não foi confirmado.'
      );

    }


    /* Verificar participante */

    if (
      n.participanteId &&
      n.participanteId !== request.auth.uid
    ) {

      throw new HttpsError(
        'permission-denied',
        'Este número pertence a outro participante.'
      );

    }


    /* Criar jogada */

    const id =
      crypto.randomUUID();


    await db
      .ref(`rifa/raspadinha/jogadas/${id}`)
      .set({

        participanteId: request.auth.uid,
        numeroRifa: numero,
        liberada: true,
        utilizada: false,
        resultado: null,
        criadaEm: Date.now()

      });


    return {

      jogadaId: id

    };

  }
);


/* =========================================================
   ADMIN — ATUALIZAR NÚMERO
   ========================================================= */

exports.adminAtualizarNumero = onCall(
  {
    region: 'southamerica-east1'
  },
  async request => {

    if (!(await admin(request))) {

      throw new HttpsError(
        'permission-denied',
        'Administrador não autorizado.'
      );

    }


    const numero =
      normalizar(request.data?.numero);

    const patch =
      request.data?.patch;


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


    const permitidos = [

      'status',
      'pagamento',
      'participanteId',
      'nome',
      'telefone',
      'dataVenda'

    ];


    const limpo = {};


    for (const k of permitidos) {

      if (
        Object.prototype.hasOwnProperty.call(
          patch,
          k
        )
      ) {

        limpo[k] = patch[k];

      }

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
  {
    region: 'southamerica-east1'
  },
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

      const n =
        String(i).padStart(3, '0');


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

        premios: {

          premio1: {

            nome: 'Liquidificador',
            ativo: true

          },

          premio2: {

            nome: 'Ferro elétrico',
            ativo: true

          }

        },

        novasChances: {},

        jogadas: {}

      }

    });


    return {

      ok: true,
      jaExistia: false

    };

  }
);
