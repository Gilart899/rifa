// =====================================
// Firebase - Rifa GilFest
// =====================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    child,
    update,
    remove,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Configuração do Firebase

const firebaseConfig = {

    apiKey: "AIzaSyDFFi2nbKHYkBDgThN6MlCy-jw5Se7eYfg",

    authDomain: "rifa-1bc12.firebaseapp.com",

    databaseURL: "https://rifa-1bc12-default-rtdb.firebaseio.com",

    projectId: "rifa-1bc12",

    storageBucket: "rifa-1bc12.firebasestorage.app",

    messagingSenderId: "331108957670",

    appId: "1:331108957670:web:1875f8481555beddbb6a27"

};

// Inicializa

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

// Exporta para o script.js

export {

    db,

    ref,

    set,

    get,

    child,

    update,

    remove,

    onValue

};
