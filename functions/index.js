const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const crypto = require('crypto');

initializeApp();

const db = getDatabase();

/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

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


    /* =====================================================
       VALIDAR DADOS
       ===================================================== */

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


    /* =====================================================
       REMOVER NÚMEROS REPETIDOS
       ===================================================== */

    const unique = [...new Set(nums)];


    if (unique.length !== nums.length) {

      throw new HttpsError(
        'invalid-argument',
        'Há números repetidos.'
      );

    }


    /* =====================================================
       TEMPO DA RESERVA
       ===================================================== */

    const agora = Date.now();

    const expiraEm =
      agora + TEMPO_RESERVA;


    /* =====================================================
       VERIFICAR DISPONIBILIDADE
       ===================================================== */

    const updates = {};

    for (const numero of unique) {

      const snap =
        await db
          .ref(`rifa/numeros/${numero}`)
          .once('value');


      if (!snap.exists()) {

        throw new HttpsError(
          'not-found',
          `Número ${numero} não encontrado.`
        );

      }


      const dados =
        snap.val();


      /* ===================================================
         VERIFICAR SE ESTÁ DISPONÍVEL
         =================================================== */

      if (dados.status !== 'disponivel') {

        /*
         * Se estiver reservado mas a reserva já expirou,
         * permitimos uma nova reserva.
         */

        const reservaExpirada =
          dados.status === 'reservado' &&
          dados.expiraEm &&
          Number(dados.expiraEm) <= agora;


        if (!reservaExpirada) {

          throw new HttpsError(
            'failed-precondition',
            `Número ${numero} não está disponível.`
          );

        }

      }


      /* ===================================================
         RESERVAR NÚMERO
         =================================================== */

      updates[
        `rifa/numeros/${numero}`
      ] = {

        numero,

        status: 'reservado',

        reservado: true,

        nome,

        telefone,

        dataReserva: agora,

        expiraEm

      };

    }


    /* =====================================================
       CRIAR ID ÚNICO DA RESERVA
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

      numeros: unique,

      status: 'reservado',

      criadoEm: agora,

      expiraEm

    };


    /* =====================================================
       GRAVAR TUDO DE UMA VEZ
       ===================================================== */

    await db
      .ref()
      .update(updates);


    /* =====================================================
       RETORNO
       ===================================================== */

    return {

      ok: true,

      reservaId,

      numeros: unique,

      criadoEm: agora,

      expiraEm

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

    /* =====================================================
       VERIFICAR AUTENTICAÇÃO
       ===================================================== */

    if (!request.auth) {

      throw new HttpsError(
        'unauthenticated',
        'Autenticação necessária.'
      );

    }


    /* =====================================================
       NORMALIZAR NÚMERO
       ===================================================== */

    const numero =
      normalizar(request.data?.numeroRifa);


    if (numero === null) {

      throw new HttpsError(
        'invalid-argument',
        'Número inválido.'
      );

    }


    /* =====================================================
       BUSCAR NÚMERO
       ===================================================== */

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


    const n =
      snap.val();


    /* =====================================================
       SOMENTE NÚMERO PAGO
       ===================================================== */

    if (n.status !== 'pago') {

      throw new HttpsError(
        'failed-precondition',
        'O pagamento ainda não foi confirmado.'
      );

    }


    /* =====================================================
       VERIFICAR PARTICIPANTE
       ===================================================== */

    if (
      n.participanteId &&
      n.participanteId !== request.auth.uid
    ) {

      throw new HttpsError(
        'permission-denied',
        'Este número pertence a outro participante.'
      );

    }


    /* =====================================================
       CRIAR ID DA JOGADA
       ===================================================== */

    const id =
      crypto.randomUUID();


    /* =====================================================
       CRIAR JOGADA
       ===================================================== */

    await db
      .ref(`rifa/raspadinha/jogadas/${id}`)
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

      ok: true,

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

    /* =====================================================
       VERIFICAR ADMIN
       ===================================================== */

    if (!(await admin(request))) {

      throw new HttpsError(
        'permission-denied',
        'Administrador não autorizado.'
      );

    }


    /* =====================================================
       DADOS
       ===================================================== */

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


    /* =====================================================
       CAMPOS PERMITIDOS
       ===================================================== */

    const permitidos = [

      'status',

      'pagamento',

      'participanteId',

      'nome',

      'telefone',

      'dataVenda',

      'reservado',

      'dataReserva',

      'expiraEm'

    ];


    /* =====================================================
       LIMPAR PATCH
       ===================================================== */

    const limpo = {};


    for (const k of permitidos) {

      if (
        Object.prototype.hasOwnProperty.call(
          patch,
          k
        )
      ) {

        limpo[k] =
          patch[k];

      }

    }


    /* =====================================================
       ATUALIZAR
       ===================================================== */

    await db
      .ref(`rifa/numeros/${numero}`)
      .update(limpo);


    /* =====================================================
       RETORNO
       ===================================================== */

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

    /* =====================================================
       VERIFICAR ADMIN
       ===================================================== */

    if (!(await admin(request))) {

      throw new HttpsError(
        'permission-denied',
        'Administrador não autorizado.'
      );

    }


    /* =====================================================
       VERIFICAR SE JÁ EXISTE
       ===================================================== */

    const base =
      await db
        .ref('rifa')
        .once('value');


    if (base.exists()) {

      return {

        ok: true,

        jaExistia: true

      };

    }


    /* =====================================================
       CRIAR NÚMEROS
       ===================================================== */

    const numeros = {};


    for (let i = 0; i < 1000; i++) {

      const n =
        String(i).padStart(3, '0');


      numeros[n] = {

        numero: n,

        status: 'disponivel'

      };

    }


    /* =====================================================
       CRIAR ESTRUTURA DO BANCO
       ===================================================== */

    await db
      .ref('rifa')
      .set({

        configuracao: {

          nome:
            'RIFA SOLIDÁRIA',

          beneficiada:
            'Dona Bené',

          premio:
            'Geladeira Midea Frost Free',

          valorNumero:
            10,

          quantidadeNumeros:
            1000,

          quantidadeCartelas:
            10,

          numerosPorCartela:
            100,

          dataSorteio:
            '2026-12-30T20:00:00-03:00'

        },


        numeros,


        reservas:
          {},


        raspadinha: {

          configuracao: {

            nome:
              'Raspadinha da Amizade',

            ativa:
              true,

            exigePagamentoConfirmado:
              true,

            maxJogadasPorCompra:
              1

          },


          premios: {

            premio1: {

              nome:
                'Liquidificador',

              imagem:
                'img/liquidificador.png',

              quantidade:
                50,

              ativo:
                true

            },


            premio2: {

              nome:
                'Ferro elétrico',

              imagem:
                'img/ferro.png',

              quantidade:
                50,

              ativo:
                true

            }

          },


          novasChances:
            {},


          jogadas:
            {}

        }

      });


    /* =====================================================
       RETORNO
       ===================================================== */

    return {

      ok: true,

      jaExistia: false

    };

  }
);
