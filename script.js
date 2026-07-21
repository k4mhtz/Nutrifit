// Importaciones de Firebase v12.10.0 (Con Storage para fotos)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";
import { configurarAgua } from './js/habitos.js';
import { configurarRutina } from './js/rutina.js'; 
import { registrarUsuario, loguearUsuario, recuperarPassword } from './autenticacion/auth.js';

const firebaseConfig = {
    apiKey: "AIzaSyAoowzmCUuoyNQcrbEU60TknICVaA22StA",
    authDomain: "tarea-588d2.firebaseapp.com",
    projectId: "tarea-588d2",
    storageBucket: "tarea-588d2.firebasestorage.app",
    messagingSenderId: "1097872716155",
    appId: "1:1097872716155:web:b71f4a189ba2f1a993cdde",
    measurementId: "G-09ZTK2VCLG"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 

AOS.init({ duration: 1000, once: true });
// ==========================================
// SEGURIDAD: PREVENCIÓN XSS (SANITIZACIÓN)
// ==========================================
function sanitizarEntrada(texto) {
    if (!texto) return "";
    const mapa = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;'
    };
    const reg = /[&<>"'/]/ig;
    return texto.replace(reg, (match) => (mapa[match]));
}

let isLogin = true;
const sidePanel = document.getElementById('sidePanel');
const overlay = document.getElementById('overlay');
const profileBtn = document.getElementById('profileBtn');
const closePanel = document.getElementById('closePanel');
const toggleEye = document.getElementById('togglePassword');
const passInput = document.getElementById('password');
const passReqsList = document.getElementById('pass-reqs');
const reqLength = document.getElementById('req-length');
const reqUpper = document.getElementById('req-upper');
const reqNumber = document.getElementById('req-number');

window.togglePanel = () => { sidePanel.classList.toggle('active'); overlay.classList.toggle('active'); };
closePanel.onclick = window.togglePanel;
overlay.onclick = window.togglePanel;

// MENÚ DESPLEGABLE
window.usuarioLogueado = false; 

profileBtn.onclick = (e) => {
    e.stopPropagation(); 
    if (window.usuarioLogueado) {
        document.getElementById('profileDropdown').classList.toggle('active');
    } else {
        window.togglePanel();
    }
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-menu-wrapper')) {
        const drop = document.getElementById('profileDropdown');
        if(drop) drop.classList.remove('active');
    }
});

// NAVEGACIÓN DE PESTAÑAS (PERFIL, SALUD, CONFIG)
window.abrirSeccion = (seccion) => {
    document.getElementById('profileDropdown').classList.remove('active');
    if (!sidePanel.classList.contains('active')) window.togglePanel();

    document.getElementById('seccionPerfil').style.display = 'none';
    document.getElementById('seccionSalud').style.display = 'none';
    document.getElementById('seccionConfig').style.display = 'none';

    if (seccion === 'perfil') {
        document.getElementById('panelTitle').innerText = "Mi Perfil";
        document.getElementById('seccionPerfil').style.display = 'block';
    } else if (seccion === 'salud') {
        document.getElementById('panelTitle').innerText = "Salud y Nutrición";
        document.getElementById('seccionSalud').style.display = 'block';
    } else if (seccion === 'config') {
        document.getElementById('panelTitle').innerText = "Ajustes de Cuenta";
        document.getElementById('seccionConfig').style.display = 'block';
    }
};

window.abrirRecomendaciones = (objetivo) => {
    Swal.fire({
        title: 'Arma tu Plan Ideal',
        width: '750px',
        html: `
            <style>
                .fitia-container { text-align: left; max-height: 65vh; overflow-y: auto; overflow-x: hidden; padding-right: 10px; font-family: 'Poppins', sans-serif; color: #1a1a1a; }
                .fitia-section { margin-bottom: 25px; }
                .fitia-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
                .fitia-title { font-size: 1.1rem; font-weight: 600; margin: 0; }
                .fitia-subtitle { font-size: 0.8rem; color: #666; margin: 0; display: block; }
                .fitia-select-all { font-size: 0.85rem; font-weight: 600; color: #1a1a1a; cursor: pointer; border: none; background: none; padding: 0; transition: color 0.2s; }
                .fitia-select-all:hover { color: #27ae60; text-decoration: underline; }
                .fitia-grid { display: flex; flex-wrap: wrap; gap: 10px; }
                .fitia-checkbox { display: none; }
                .fitia-label { display: inline-flex; align-items: center; gap: 8px; background-color: #f0efe9; color: #1a1a1a; padding: 10px 16px; border-radius: 12px; cursor: pointer; font-size: 0.95rem; font-weight: 500; border: 2px solid transparent; transition: all 0.2s ease; user-select: none; }
                .fitia-label:hover { background-color: #e6e4db; }
                .fitia-checkbox:checked + .fitia-label { background-color: #e6e4db; border-color: #27ae60; }
                .fitia-dropdown { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ddd; font-family: 'Poppins'; font-size: 0.95rem; outline: none; background: #fff; cursor: pointer;}
            </style>
            <div class="fitia-container">
                
                <div class="fitia-section" style="display: flex; gap: 20px;">
                    <div style="flex: 1;">
                        <h3 class="fitia-title" style="margin-bottom: 8px;"><i class="fa-regular fa-calendar"></i> Duración del plan</h3>
                        <select id="selectDias" class="fitia-dropdown">
                            <option value="1">1 Día</option>
                            <option value="3">3 Días</option>
                            <option value="5" selected>5 Días</option>
                            <option value="7">7 Días</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <h3 class="fitia-title" style="margin-bottom: 8px;"><i class="fa-solid fa-utensils"></i> Comidas al día</h3>
                        <select id="selectComidas" class="fitia-dropdown">
                            <option value="3">3 Comidas (Principales)</option>
                            <option value="4">4 Comidas (+1 Snack)</option>
                            <option value="5">5 Comidas (+2 Snacks)</option>
                        </select>
                    </div>
                </div>

                <div class="fitia-section">
                    <div class="fitia-header">
                        <div><h3 class="fitia-title">Proteínas</h3></div>
                        <button type="button" class="fitia-select-all" data-target="grid-prot">Seleccionar todo</button>
                    </div>
                    <div class="fitia-grid" id="grid-prot">
                        <input type="checkbox" id="p_pollo" class="fitia-checkbox pref-check" value="pollo" checked>
                        <label for="p_pollo" class="fitia-label">🍗 Pollo</label>
                        <input type="checkbox" id="p_carne" class="fitia-checkbox pref-check" value="res" checked>
                        <label for="p_carne" class="fitia-label">🥩 Carne de Res</label>
                        <input type="checkbox" id="p_pescado" class="fitia-checkbox pref-check" value="pescado">
                        <label for="p_pescado" class="fitia-label">🐟 Pescado Blanco</label>
                        <input type="checkbox" id="p_atun" class="fitia-checkbox pref-check" value="atún">
                        <label for="p_atun" class="fitia-label">🥫 Atún</label>
                        <input type="checkbox" id="p_huevo" class="fitia-checkbox pref-check" value="huevo" checked>
                        <label for="p_huevo" class="fitia-label">🍳 Huevo</label>
                        <input type="checkbox" id="p_pavo" class="fitia-checkbox pref-check" value="pavo">
                        <label for="p_pavo" class="fitia-label">🦃 Pavo</label>
                        <input type="checkbox" id="p_cerdo" class="fitia-checkbox pref-check" value="cerdo magro">
                        <label for="p_cerdo" class="fitia-label">🥓 Cerdo</label>
                        <input type="checkbox" id="p_tofu" class="fitia-checkbox pref-check" value="tofu">
                        <label for="p_tofu" class="fitia-label">🥗 Tofu / Soya</label>
                    </div>
                </div>
                
                <div class="fitia-section">
                    <div class="fitia-header">
                        <div><h3 class="fitia-title">Frutas y Verduras</h3></div>
                        <button type="button" class="fitia-select-all" data-target="grid-veg">Seleccionar todo</button>
                    </div>
                    <div class="fitia-grid" id="grid-veg">
                        <input type="checkbox" id="v_brocoli" class="fitia-checkbox pref-check" value="brócoli" checked>
                        <label for="v_brocoli" class="fitia-label">🥦 Brócoli</label>
                        <input type="checkbox" id="v_espinaca" class="fitia-checkbox pref-check" value="espinaca" checked>
                        <label for="v_espinaca" class="fitia-label">🍃 Espinaca</label>
                        <input type="checkbox" id="v_zanahoria" class="fitia-checkbox pref-check" value="zanahoria">
                        <label for="v_zanahoria" class="fitia-label">🥕 Zanahoria</label>
                        <input type="checkbox" id="v_tomate" class="fitia-checkbox pref-check" value="tomate" checked>
                        <label for="v_tomate" class="fitia-label">🍅 Tomate</label>
                        <input type="checkbox" id="v_frutos" class="fitia-checkbox pref-check" value="frutos rojos">
                        <label for="v_frutos" class="fitia-label">🍓 Frutos Rojos</label>
                        <input type="checkbox" id="v_platano" class="fitia-checkbox pref-check" value="plátano">
                        <label for="v_platano" class="fitia-label">🍌 Plátano</label>
                    </div>
                </div>

                <div class="fitia-section">
                    <div class="fitia-header">
                        <div><h3 class="fitia-title">Carbohidratos</h3></div>
                        <button type="button" class="fitia-select-all" data-target="grid-carb">Seleccionar todo</button>
                    </div>
                    <div class="fitia-grid" id="grid-carb">
                        <input type="checkbox" id="c_arroz" class="fitia-checkbox pref-check" value="arroz" checked>
                        <label for="c_arroz" class="fitia-label">🍚 Arroz</label>
                        <input type="checkbox" id="c_papa" class="fitia-checkbox pref-check" value="papa">
                        <label for="c_papa" class="fitia-label">🥔 Papa</label>
                        <input type="checkbox" id="c_camote" class="fitia-checkbox pref-check" value="camote">
                        <label for="c_camote" class="fitia-label">🍠 Camote</label>
                        <input type="checkbox" id="c_frijol" class="fitia-checkbox pref-check" value="frijoles" checked>
                        <label for="c_frijol" class="fitia-label">🫘 Frijoles</label>
                        <input type="checkbox" id="c_lenteja" class="fitia-checkbox pref-check" value="lentejas">
                        <label for="c_lenteja" class="fitia-label">🧆 Lentejas</label>
                        <input type="checkbox" id="c_pasta" class="fitia-checkbox pref-check" value="pasta integral">
                        <label for="c_pasta" class="fitia-label">🍝 Pasta</label>
                        <input type="checkbox" id="c_avena" class="fitia-checkbox pref-check" value="avena">
                        <label for="c_avena" class="fitia-label">🥣 Avena</label>
                        <input type="checkbox" id="c_tortilla" class="fitia-checkbox pref-check" value="tortillas de maíz" checked>
                        <label for="c_tortilla" class="fitia-label">🌮 Tortilla</label>
                    </div>
                </div>
                
                <div class="fitia-section">
                    <div class="fitia-header">
                        <div><h3 class="fitia-title">Grasas & Lácteos</h3></div>
                        <button type="button" class="fitia-select-all" data-target="grid-grasas">Seleccionar todo</button>
                    </div>
                    <div class="fitia-grid" id="grid-grasas">
                        <input type="checkbox" id="g_aguacate" class="fitia-checkbox pref-check" value="aguacate" checked>
                        <label for="g_aguacate" class="fitia-label">🥑 Aguacate</label>
                        <input type="checkbox" id="g_oliva" class="fitia-checkbox pref-check" value="aceite de oliva">
                        <label for="g_oliva" class="fitia-label">🫒 Aceite de Oliva</label>
                        <input type="checkbox" id="g_almendra" class="fitia-checkbox pref-check" value="almendras">
                        <label for="g_almendra" class="fitia-label">🌰 Almendras</label>
                        <input type="checkbox" id="g_cacahuate" class="fitia-checkbox pref-check" value="crema de cacahuate">
                        <label for="g_cacahuate" class="fitia-label">🥜 Cacahuates</label>
                        <input type="checkbox" id="g_lacteos" class="fitia-checkbox pref-check" value="yogurt griego">
                        <label for="g_lacteos" class="fitia-label">🥛 Yogurt Griego</label>
                        <input type="checkbox" id="g_queso" class="fitia-checkbox pref-check" value="queso panela">
                        <label for="g_queso" class="fitia-label">🧀 Queso</label>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Generar Plan Dinámico',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#27ae60',
        didOpen: () => {
            const selectAllBtns = Swal.getPopup().querySelectorAll('.fitia-select-all');
            selectAllBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetId = e.target.getAttribute('data-target');
                    const container = Swal.getPopup().querySelector('#' + targetId);
                    const checkboxes = container.querySelectorAll('.pref-check');
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    checkboxes.forEach(cb => cb.checked = !allChecked);
                });
            });
        },
        preConfirm: () => {
            // Obtenemos los valores en crudo de los checkboxes marcados por categoría
            const prots = Array.from(document.querySelectorAll('#grid-prot .pref-check:checked')).map(c => c.value);
            const carbs = Array.from(document.querySelectorAll('#grid-carb .pref-check:checked')).map(c => c.value);
            const vegs = Array.from(document.querySelectorAll('#grid-veg .pref-check:checked')).map(c => c.value);
            const fats = Array.from(document.querySelectorAll('#grid-grasas .pref-check:checked')).map(c => c.value);
            
            const dias = parseInt(document.getElementById('selectDias').value);
            const numComidas = parseInt(document.getElementById('selectComidas').value);

            if (prots.length === 0 || carbs.length === 0) {
                Swal.showValidationMessage('Necesitamos al menos una fuente de proteína y carbohidrato para armar comidas.');
                return false;
            }
            return { prots, carbs, vegs, fats, dias, numComidas };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { prots, carbs, vegs, fats, dias, numComidas } = result.value;

            // Funciones de apoyo para armar las combinaciones dinámicas
            const getRand = (arr, fallback) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : fallback;
            const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

            // Armado de las pestañas
            let tabsHeaderHTML = '<div style="display:flex; gap:10px; overflow-x:auto; margin-bottom:20px; padding-bottom:5px;">';
            let tabsBodyHTML = '<div>';

            const tiposComidas = ['Desayuno', 'Comida', 'Cena', 'Snack AM', 'Snack PM'];
            const iconosComidas = ['fa-mug-hot', 'fa-utensils', 'fa-moon', 'fa-apple-whole', 'fa-cookie'];

            for (let i = 1; i <= dias; i++) {
                const isActive = i === 1 ? 'active' : '';
                const displayStyle = i === 1 ? 'block' : 'none';
                
                tabsHeaderHTML += `<button class="btn-dia-gen ${isActive}" onclick="cambiarDiaGenerado(${i})" id="btn-dia-gen-${i}" style="padding:10px 18px; border-radius:12px; border:none; background:${i === 1 ? '#27ae60' : '#f0efe9'}; color:${i === 1 ? 'white' : '#1a1a1a'}; font-weight:bold; cursor:pointer; white-space:nowrap; transition:0.3s;">Día ${i}</button>`;
                
                tabsBodyHTML += `<div id="content-dia-gen-${i}" class="content-dia-gen" style="display:${displayStyle}; animation: fadeIn 0.3s;">`;
                
                for (let c = 0; c < numComidas; c++) {
                    let tipo = tiposComidas[c];
                    let descripcionCulinaria = "";
                    
                    // Lógica para armar la comida dependiendo de lo que eligió el usuario
                    if (tipo === 'Desayuno') {
                        descripcionCulinaria = `${capitalize(getRand(prots, 'proteína'))} acompañado de ${getRand(carbs, 'carbohidratos')}, integrando un toque de ${getRand(vegs, 'vegetales')} y ${getRand(fats, 'grasa saludable')}.`;
                    } else if (tipo === 'Comida') {
                        descripcionCulinaria = `Porción de ${getRand(prots, 'proteína magra')} cocinada a la plancha con guarnición de ${getRand(carbs, 'carbohidrato')} y ensalada fresca de ${getRand(vegs, 'vegetales')}.`;
                    } else if (tipo === 'Cena') {
                        descripcionCulinaria = `${capitalize(getRand(prots, 'proteína'))} en preparación ligera, servido con ${getRand(vegs, 'vegetales')} y un extra de ${getRand(fats, 'grasa')}.`;
                    } else {
                        descripcionCulinaria = `Snack rápido combinando ${getRand(fats, 'frutos secos')} con ${getRand(vegs, 'fruta/vegetal')} para darte energía.`;
                    }

                    tabsBodyHTML += `
                        <div style="display:flex; align-items:center; background:#ffffff; border:1px solid #eee; border-radius:12px; padding:15px; margin-bottom:12px; text-align:left; box-shadow:0 2px 5px rgba(0,0,0,0.03);">
                            <div style="width:45px; height:45px; min-width:45px; border-radius:10px; background:#f4f9f4; color:#27ae60; display:flex; justify-content:center; align-items:center; font-size:1.3rem; margin-right:15px;">
                                <i class="fa-solid ${iconosComidas[c]}"></i>
                            </div>
                            <div style="flex-grow:1;">
                                <span style="background:#27ae60; color:white; padding:3px 8px; border-radius:6px; font-size:0.7rem; font-weight:bold; text-transform:uppercase;">${tipo}</span>
                                <p style="margin:6px 0 0 0; color:#2d3436; font-size:0.95rem; line-height:1.4;">${descripcionCulinaria}</p>
                            </div>
                        </div>
                    `;
                }
                tabsBodyHTML += `</div>`;
            }
            
            tabsHeaderHTML += '</div>';
            tabsBodyHTML += '</div>';

            // Función global temporal para inyectar en SweetAlert y cambiar pestañas
            window.cambiarDiaGenerado = (diaTarget) => {
                document.querySelectorAll('.btn-dia-gen').forEach((btn) => {
                    btn.style.background = '#f0efe9';
                    btn.style.color = '#1a1a1a';
                });
                document.querySelectorAll('.content-dia-gen').forEach((content) => {
                    content.style.display = 'none';
                });
                
                const btnActivo = document.getElementById(`btn-dia-gen-${diaTarget}`);
                const contentActivo = document.getElementById(`content-dia-gen-${diaTarget}`);
                
                if(btnActivo) {
                    btnActivo.style.background = '#27ae60';
                    btnActivo.style.color = 'white';
                }
                if(contentActivo) {
                    contentActivo.style.display = 'block';
                }
            };

            Swal.fire({
                title: `Tu Plan: ${objetivo}`,
                html: `
                    <div class="recom-modal-content" style="max-height: 65vh; overflow-y: auto; padding-right: 5px;">
                        ${tabsHeaderHTML}
                        ${tabsBodyHTML}
                        <div style="margin-top: 25px; padding-top:15px; border-top: 1px solid #eee; text-align: left;">
                            <h5 style="color:#27ae60; margin:0 0 5px 0;"><i class="fa-solid fa-scale-balanced"></i> Proporciones</h5>
                            <p style="font-size: 0.85rem; color: #636e72; margin:0;">
                                Recuerda pesar los alimentos en crudo y adaptar las cantidades según los requerimientos calóricos exactos de tu objetivo.
                            </p>
                        </div>
                    </div>
                `,
                showConfirmButton: true,
                confirmButtonText: 'Genial, ¡entendido!',
                confirmButtonColor: '#27ae60',
                width: '650px'
            });
        }
    });
};

function actualizarDashboardDinamico(data, userId) {
    const macroResultados = document.getElementById('macroResultados');
    const btnRecomendaciones = document.getElementById('btnVerRecomendaciones');
    const dashboardDinamico = document.getElementById('dashboardDinamico');
    const mensajeCompletar = document.getElementById('mensajeCompletarDatos');

    if(data.peso && data.estatura && data.edad && data.genero && data.actividad && data.objetivo) {
        mensajeCompletar.style.display = 'none';
        dashboardDinamico.style.display = 'block';

        const macros = calcularMacros(data.peso, data.estatura, data.edad, data.genero, data.actividad, data.objetivo);
        macroResultados.innerHTML = `<div class="macro-container"><h4>Tu Meta Diaria (${data.objetivo})</h4><div class="calorias-totales">${macros.cal} <span>kcal</span></div><div class="macro-grid"><div class="macro-box"><span style="color:#3498db;">${macros.car}g</span><small>Carbos</small></div><div class="macro-box"><span style="color:#e74c3c;">${macros.pro}g</span><small>Proteína</small></div><div class="macro-box"><span style="color:#f1c40f;">${macros.gra}g</span><small>Grasas</small></div></div></div>`;
        btnRecomendaciones.style.display = 'flex';
        btnRecomendaciones.onclick = () => window.abrirRecomendaciones(data.objetivo);
    } else {
        mensajeCompletar.style.display = 'block';
        dashboardDinamico.style.display = 'none';
    }
    
    configurarAgua(db, userId, data.vasosAgua || 0, data.rachaAgua || 0, data.ultimaFechaAgua || '');            
    configurarRutina(db, userId, data.rutinaDiaria || {}, data.objetivo || ""); 
}

function calcularMacros(peso, estatura, edad, genero, actividad, objetivo) {
    let tmb = (genero === 'M') ? (10 * peso) + (6.25 * estatura) - (5 * edad) + 5 : (10 * peso) + (6.25 * estatura) - (5 * edad) - 161;
    let calorias = tmb * parseFloat(actividad);
    
    // Unificamos las palabras clave del Wizard
    if (objetivo.includes("Perder")) calorias -= 500;
    if (objetivo.includes("Aumento") || objetivo.includes("Ganar")) calorias += 500; 
    
    let proteina = peso * 2.2; 
    let grasa = peso * 0.9; 
    let carbs = (calorias - ((proteina * 4) + (grasa * 9))) / 4;
    return { cal: Math.round(calorias), pro: Math.round(proteina), gra: Math.round(grasa), car: Math.round(carbs > 0 ? carbs : 0) };
}

onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) { 
        window.usuarioLogueado = true; 
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('userProfile').style.display = 'block';
        
        const docSnap = await getDoc(doc(db, "Usuarios", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            const userRole = data.rol || 'usuario';
            window.userRole = userRole; 
            const roleColor = userRole === 'admin' ? '#e74c3c' : '#1B4332'; 
            document.getElementById('perfilNombre').innerHTML = `${data.nombre || 'Usuario'} <span style="font-size: 0.75rem; background: ${roleColor}; color: white; padding: 3px 10px; border-radius: 12px; margin-left: 10px; vertical-align: middle; letter-spacing: 1px;">${userRole.toUpperCase()}</span>`;

            const dropdown = document.getElementById('profileDropdown');
            if (dropdown) {
                const botonExistente = document.getElementById('btnAdminPanelLink');
                if (botonExistente) botonExistente.remove(); 
                
                if (userRole === 'admin') {
                    const opcionAdmin = document.createElement('div');
                    opcionAdmin.id = 'btnAdminPanelLink';
                    opcionAdmin.innerHTML = `
                        <button onclick="window.abrirPanelAdmin()" style="width: 100%; text-align: left; background: none; border: none; padding: 10px 15px; color: #e74c3c; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; border-top: 1px solid #eee;">
                            <i class="fa-solid fa-user-shield"></i> Panel de Control Admin
                        </button>
                    `;
                    dropdown.appendChild(opcionAdmin);
                }
            }

            document.getElementById('perfilEmail').innerText = user.email;
            document.getElementById('perfilTelefono').innerHTML = `<i class="fa-solid fa-phone"></i> ${data.telefono || 'Sin teléfono'}`;
            
            const urlAvatar = data.fotoPerfil || `https://ui-avatars.com/api/?name=${data.nombre ? data.nombre.split(' ')[0] : 'U'}&background=27ae60&color=fff&bold=true`;
            document.getElementById('avatarImg').src = urlAvatar;
            document.getElementById('navAvatarImg').src = urlAvatar;
            document.getElementById('navProfileText').innerText = data.nombre ? data.nombre.split(' ')[0] : 'Mi Perfil';

            if(data.fotoPortada) document.getElementById('portadaBg').style.backgroundImage = `url('${data.fotoPortada}')`;

            if(data.nombre) document.getElementById('editNombre').value = data.nombre;
            if(data.telefono) document.getElementById('editTelefono').value = data.telefono;
            
            actualizarDashboardDinamico(data, user.uid);
            
            window.abrirSeccion('perfil');
        }
    } else {
        window.usuarioLogueado = false; 
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('userProfile').style.display = 'none';
        document.getElementById('navAvatarImg').src = 'https://ui-avatars.com/api/?name=User&background=bdc3c7&color=fff';
        document.getElementById('navProfileText').innerText = 'Ingresar';
    }
});

const subirImagen = async (file, ruta) => {
    const storageRef = ref(storage, ruta);
    Swal.fire({ title: 'Subiendo...', text: 'Espera un momento', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
};

document.getElementById('inputAvatar').addEventListener('change', async (e) => {
    const file = e.target.files[0]; const user = auth.currentUser;
    if (!file || !user) return;
    try {
        const urlFoto = await subirImagen(file, `avatares/${user.uid}`);
        await updateDoc(doc(db, "Usuarios", user.uid), { fotoPerfil: urlFoto });
        document.getElementById('avatarImg').src = urlFoto;
        document.getElementById('navAvatarImg').src = urlFoto; 
        Swal.fire({ icon: 'success', title: '¡Foto actualizada!', timer: 1500, showConfirmButton: false });
    } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo subir la foto.' }); }
});

document.getElementById('inputPortada').addEventListener('change', async (e) => {
    const file = e.target.files[0]; const user = auth.currentUser;
    if (!file || !user) return;
    try {
        const urlPortada = await subirImagen(file, `portadas/${user.uid}`);
        await updateDoc(doc(db, "Usuarios", user.uid), { fotoPortada: urlPortada });
        document.getElementById('portadaBg').style.backgroundImage = `url('${urlPortada}')`;
        Swal.fire({ icon: 'success', title: '¡Portada actualizada!', timer: 1500, showConfirmButton: false });
    } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo subir la portada.' }); }
});

document.getElementById('personalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser; if (!user) return;
    const btn = document.getElementById('btnGuardarPersonal');
    btn.innerText = 'Guardando...';

    const nombreSanitizado = sanitizarEntrada(document.getElementById('editNombre').value);
    const telefonoSanitizado = sanitizarEntrada(document.getElementById('editTelefono').value);

    try {
        await updateDoc(doc(db, "Usuarios", user.uid), {
            nombre: nombreSanitizado,
            telefono: telefonoSanitizado
        });

        const docSnap = await getDoc(doc(db, "Usuarios", user.uid));
        const data = docSnap.data();
        const userRole = data.rol || 'usuario';
        const roleColor = userRole === 'admin' ? '#e74c3c' : '#1B4332'; 

        document.getElementById('perfilNombre').innerHTML = `${nombreSanitizado} <span style="font-size: 0.75rem; background: ${roleColor}; color: white; padding: 3px 10px; border-radius: 12px; margin-left: 10px; vertical-align: middle; letter-spacing: 1px;">${userRole.toUpperCase()}</span>`;
        document.getElementById('perfilTelefono').innerHTML = `<i class="fa-solid fa-phone"></i> ${telefonoSanitizado}`;
        document.getElementById('navProfileText').innerText = nombreSanitizado.split(' ')[0];

        Swal.fire({ icon: 'success', title: 'Datos actualizados', timer: 1500, showConfirmButton: false });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron guardar los datos.' });
    } finally { btn.innerText = 'Actualizar Perfil'; }
});



document.querySelectorAll('.btn-comprar').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const planNombre = e.target.getAttribute('data-plan');
        
        if (!window.usuarioLogueado) {
            Swal.fire({
                icon: 'info', title: 'Inicia sesión',
                text: 'Necesitas una cuenta para adquirir un plan.',
                confirmButtonText: 'Ir a registrarme', confirmButtonColor: '#27ae60'
            }).then((result) => { if (result.isConfirmed) { window.togglePanel(); } });
            return;
        }

        Swal.fire({
            title: `¿Adquirir ${planNombre}?`,
            text: "Estás en un entorno de prueba. No se te cobrará nada real.",
            icon: 'question', showCancelButton: true,
            confirmButtonColor: '#27ae60', cancelButtonColor: '#e74c3c',
            confirmButtonText: 'Simular Pago', cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Procesando pago...', html: 'Conectando con pasarela segura...',
                    timer: 2000, timerProgressBar: true, allowOutsideClick: false,
                    didOpen: () => { Swal.showLoading(); }
                }).then(() => {
                    Swal.fire({
                        icon: 'success', title: '¡Pago Exitoso!',
                        text: `Bienvenido al ${planNombre}. Pronto un especialista se contactará contigo.`,
                        confirmButtonColor: '#27ae60'
                    });
                });
            }
        });
    });
});

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const recaptchaResponse = grecaptcha.getResponse();
    if (recaptchaResponse.length === 0) { Swal.fire({ icon: 'warning', title: 'Verificación requerida', text: 'Confirma que no eres un robot.' }); return; }
    const email = document.getElementById('identificador').value;
    const password = passInput.value;
    const btnAction = document.getElementById('btnAction');

    if (!isLogin && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) { Swal.fire({ icon: 'warning', title: 'Contraseña débil', text: 'Cumple los requisitos.' }); return; }
    
    btnAction.disabled = true; btnAction.innerText = 'Procesando...';

    try {
        if (!isLogin) {
            const { value: accept } = await Swal.fire({
                title: 'Términos y Condiciones',
                html: `
                    <div style="text-align: left; max-height: 280px; overflow-y: auto; font-size: 0.85rem; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; color: #2d3436; line-height: 1.5;">
                        <p><b>TÉRMINOS Y CONDICIONES DE USO DE NUTRIFIT</b></p>
                        <p><i>Última actualización: Junio de 2026</i></p>
                        <p>Bienvenido a NutriFit. Al registrarse y utilizar esta plataforma, el usuario acepta los presentes Términos y Condiciones.</p>
                        <!-- (Resto de tu código original de términos se mantiene intacto) -->
                    </div>
                    <div style="text-align: left; display: flex; align-items: flex-start; gap: 10px;">
                        <input type="checkbox" id="termsCheckbox" style="margin-top: 4px; transform: scale(1.2); cursor: pointer;">
                        <label for="termsCheckbox" style="font-size: 0.9rem; cursor: pointer; color: #2d3436; font-weight: 600;">He leído y acepto los Términos y Condiciones de Uso y el Aviso de Privacidad de NutriFit.</label>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Aceptar y Registrarme',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#27ae60',
                cancelButtonColor: '#e74c3c',
                width: '600px',
                preConfirm: () => {
                    const isChecked = Swal.getPopup().querySelector('#termsCheckbox').checked;
                    if (!isChecked) {
                        Swal.showValidationMessage('Debes marcar la casilla para aceptar los términos y continuar.');
                        return false;
                    }
                    return true;
                }
            });

            if (accept) {
                await registrarUsuario(auth, db, email, password, document.getElementById('nombre').value, document.getElementById('telefono').value);
                window.toggleForm(); 
                document.getElementById('authForm').reset(); 
                grecaptcha.reset();
            }
        } else { 
            await loguearUsuario(auth, email, password); 
        }
    } catch (error) { 
        if (error.message !== "Email no verificado") Swal.fire({ icon: 'error', title: 'Oops...', text: 'Credenciales incorrectas o error en la conexión.' }); 
        grecaptcha.reset(); 
    } finally { 
        btnAction.disabled = false; btnAction.innerText = isLogin ? 'Acceder' : 'Registrarme'; 
    }
});

window.toggleForm = () => {
    isLogin = !isLogin;
    document.getElementById('formTitle').innerText = isLogin ? "Bienvenido" : "Crea tu Cuenta";
    document.getElementById('btnAction').innerText = isLogin ? "Acceder" : "Registrarme";
    document.getElementById('toggleMsg').innerHTML = isLogin ? '¿No tienes cuenta? <span onclick="toggleForm()">Regístrate</span>' : '¿Ya tienes cuenta? <span onclick="toggleForm()">Inicia sesión</span>';
    document.getElementById('groupNombre').style.display = isLogin ? 'none' : 'block';
    document.getElementById('groupTelefono').style.display = isLogin ? 'none' : 'block';
    passReqsList.style.display = isLogin ? 'none' : 'block';
    document.getElementById('forgotPassText').style.display = isLogin ? 'block' : 'none';
    document.getElementById('identificador').placeholder = isLogin ? "Email o Teléfono" : "Correo electrónico";
    passInput.value = ''; reqLength.classList.remove('valid'); reqUpper.classList.remove('valid'); reqNumber.classList.remove('valid'); grecaptcha.reset(); 
};

toggleEye.addEventListener('click', () => { passInput.type = passInput.type === 'password' ? 'text' : 'password'; toggleEye.classList.toggle('fa-eye-slash'); toggleEye.classList.toggle('fa-eye'); });
passInput.addEventListener('input', (e) => {
    if (isLogin) return; const val = e.target.value;
    val.length >= 8 ? reqLength.classList.add('valid') : reqLength.classList.remove('valid');
    /[A-Z]/.test(val) ? reqUpper.classList.add('valid') : reqUpper.classList.remove('valid');
    /[0-9]/.test(val) ? reqNumber.classList.add('valid') : reqNumber.classList.remove('valid');
});

document.getElementById('forgotPassText').addEventListener('click', () => { recuperarPassword(auth, document.getElementById('identificador').value); });
window.logout = () => signOut(auth).then(() => location.reload());

const counters = document.querySelectorAll('.counter');
const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { counters.forEach(counter => { const target = +counter.getAttribute('data-target'); const updateCount = () => { const count = +counter.innerText; const inc = target / 100; if (count < target) { counter.innerText = Math.ceil(count + inc); setTimeout(updateCount, 15); } else { counter.innerText = target + (target === 100 ? '%' : '+'); } }; updateCount(); }); observer.disconnect(); } }); });
if(document.getElementById('stats')) observer.observe(document.getElementById('stats'));

document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling; const icon = question.querySelector('i');
        if (answer.style.maxHeight) { answer.style.maxHeight = null; icon.classList.replace('fa-chevron-up', 'fa-chevron-down'); } 
        else { answer.style.maxHeight = answer.scrollHeight + "px"; icon.classList.replace('fa-chevron-down', 'fa-chevron-up'); }
    });
});

window.abrirPanelAdmin = async () => {
    document.getElementById('profileDropdown').classList.remove('active');
    Swal.fire({
        title: 'Abriendo Panel...',
        text: 'Consultando registros en la base de datos NoSQL...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const querySnapshot = await getDocs(collection(db, "Usuarios"));
        let tablaHTML = `
            <div style="overflow-x: auto; max-height: 380px; margin-top: 15px; border-radius: 8px; border: 1px solid #ddd;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; font-family: sans-serif;">
                    <thead>
                        <tr style="background-color: #1B4332; color: white;">
                            <th style="padding: 12px;">Nombre de Usuario</th>
                            <th style="padding: 12px;">Teléfono</th>
                            <th style="padding: 12px;">Meta / Objetivo</th>
                            <th style="padding: 12px;">Privilegios</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        querySnapshot.forEach((doc) => {
            const usuario = doc.data();
            const badgeBg = usuario.rol === 'admin' ? '#e74c3c' : '#3498db';
            tablaHTML += `
                <tr style="border-bottom: 1px solid #eee; background: #fff;">
                    <td style="padding: 12px; font-weight: bold; color: #2d3436;">${usuario.nombre || 'Anónimo'}</td>
                    <td style="padding: 12px; color: #555;">${usuario.telefono || 'N/A'}</td>
                    <td style="padding: 12px; font-style: italic; color: #27ae60;">${usuario.objetivo || 'No configurado'}</td>
                    <td style="padding: 12px;">
                        <span style="background: ${badgeBg}; color: white; padding: 3px 8px; border-radius: 10px; font-size: 0.7rem; font-weight: bold;">
                            ${(usuario.rol || 'usuario').toUpperCase()}
                        </span>
                    </td>
                </tr>
            `;
        });
        tablaHTML += `</tbody></table></div>`;

        Swal.fire({
            title: '⚙️ Panel de Control y Auditoría',
            html: tablaHTML,
            width: '750px',
            confirmButtonText: 'Cerrar Panel',
            confirmButtonColor: '#1B4332'
        });

    } catch (error) {
        console.error("Error al auditar usuarios: ", error);
        Swal.fire({ icon: 'error', title: 'Acceso Denegado', text: 'Error al consultar el registro de auditoría del servidor.' });
    }
};

window.abrirVentanaInfo = (tema) => {
    const drop = document.getElementById('profileDropdown');
    if (drop) drop.classList.remove('active');

    const info = {
        'enfoque': {
            icono: '<i class="fa-solid fa-brain" style="color: #27ae60;"></i>',
            titulo: 'Enfoque Mental',
            texto: '<p style="text-align: justify; color: #636e72; font-size: 0.95rem; line-height: 1.6;">El cerebro consume alrededor del 20% de tu energía diaria. Una dieta equilibrada con carbohidratos complejos y grasas saludables mantiene tu agudeza mental. <b>No hay que temerle a los carbohidratos</b>; son el combustible preferido de tu mente. Un buen balance elimina la fatiga mental sin necesidad de dietas extremas.</p>'
        },
        'salud': {
            icono: '<i class="fa-solid fa-heart-pulse" style="color: #27ae60;"></i>',
            titulo: 'Salud a Largo Plazo',
            texto: '<p style="text-align: justify; color: #636e72; font-size: 0.95rem; line-height: 1.6;">La salud a largo plazo no se trata de dietas restrictivas perfectas, sino de patrones sostenibles. Ningún alimento por sí solo te enferma ni te cura mágicamente. Fomentamos la inclusión de nutrientes esenciales sin prohibir tus comidas favoritas, entendiendo que el equilibrio y un buen descanso son tu mejor medicina preventiva.</p>'
        },
        'energia': {
            icono: '<i class="fa-solid fa-battery-full" style="color: #27ae60;"></i>',
            titulo: 'Energía Real',
            texto: '<p style="text-align: justify; color: #636e72; font-size: 0.95rem; line-height: 1.6;">Olvídate de depender exclusivamente de estimulantes. La energía real y sostenida proviene de una correcta hidratación y de estabilizar el azúcar en la sangre combinando fibra, proteína y grasa en tus comidas. Además, <b>dormir bien no es un lujo, es una necesidad biológica</b> fundamental para recargar tu cuerpo.</p>'
        },
        'peso': {
            icono: '<i class="fa-solid fa-apple-whole" style="color: #27ae60;"></i>',
            titulo: 'Control de Peso',
            texto: '<p style="text-align: justify; color: #636e72; font-size: 0.95rem; line-height: 1.6;">El control de peso responde a la ciencia del balance energético (déficit para perder grasa, superávit para ganar masa). <b>No satanizamos ningún alimento</b>: puedes disfrutar de todo lo que te gusta ajustando las porciones. Se trata de consistencia y flexibilidad, no de buscar la perfección.</p>'
        },
        'deporte': {
            icono: '<i class="fa-solid fa-person-running" style="color: #27ae60;"></i>',
            titulo: 'Nutrición Deportiva',
            texto: '<p style="text-align: justify; color: #636e72; font-size: 0.95rem; line-height: 1.6;">Tu cuerpo necesita combustible para rendir y bloques de construcción para recuperarse. Los carbohidratos te dan energía explosiva para entrenar y las proteínas reparan el tejido. Recuerda: el músculo no crece mientras entrenas, <b>crece mientras descansas</b>. Subestimar el descanso es estancar tu progreso.</p>'
        },
        'educacion': {
            icono: '<i class="fa-solid fa-clipboard-check" style="color: #27ae60;"></i>',
            titulo: 'Educación Alimentaria',
            texto: '<p style="text-align: justify; color: #636e72; font-size: 0.95rem; line-height: 1.6;">Aprender a leer etiquetas te da libertad absoluta. Te enseñamos a identificar macronutrientes y tomar decisiones informadas <b>sin clasificar la comida en "buena" o "mala"</b>. El conocimiento real elimina el miedo y la culpa al comer, permitiéndote tomar el control total de tus decisiones en el supermercado.</p>'
        }
    };

    const data = info[tema];
    Swal.fire({
        title: `${data.icono} ${data.titulo}`,
        html: data.texto,
        width: '500px',
        confirmButtonText: 'Genial, lo entiendo',
        confirmButtonColor: '#27ae60'
    });
};

// ==========================================
// DATOS COMPLETOS DE RECETAS (CÓDIGO DE TU COMPAÑERO)
// ==========================================
const recetas = [
    {
        id: 0,
        titulo: 'Pechuga de Pollo a la Mostaza',
        imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600',
        stats: '300 cal | 35g proteína | 50g grasas | 100g carbos',
        ingredientes: [
            '2 pechugas de pollo (200g)',
            '3 cucharadas de mostaza Dijon',
            '2 dientes de ajo picados',
            '1 cucharada de aceite de oliva',
            'Sal y pimienta al gusto',
            'Perejil fresco (opcional)'
        ],
        pasos: [
            'Mezcla la mostaza con ajo picado y sal en un bowl',
            'Calienta el aceite en una sartén a fuego medio-alto',
            'Coloca las pechugas y dóralo por ambos lados (5 min cada lado)',
            'Baja el fuego y aplica la mezcla de mostaza sobre el pollo',
            'Cocina 8-10 minutos más hasta que esté cocido internamente',
            'Deja reposar 2 minutos y sirve con verduras asadas'
        ],
        nutricion: { calorias: '300 cal', proteina: '35g', carbos: '50g', grasas: '50g' }
    },
    {
        id: 1,
        titulo: 'Salmón al Horno con Limón',
        imagen: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600',
        stats: '320 cal | 32g proteína | 18g grasas | Omega-3',
        ingredientes: [
            '1 filete de salmón (150g)',
            '1 limón cortado en rodajas',
            '2 cucharadas de aceite de oliva',
            'Sal y pimienta al gusto',
            'Eneldo fresco',
            'Verduras (espárragos, zanahorias)'
        ],
        pasos: [
            'Precalienta el horno a 200°C',
            'Coloca el salmón en papel aluminio o bandeja de horno',
            'Rocía con aceite de oliva y sazona con sal y pimienta',
            'Coloca rodajas de limón sobre el salmón',
            'Agrega eneldo fresco y verduras alrededor',
            'Hornea durante 15-20 minutos hasta que se desmenuce fácilmente'
        ],
        nutricion: { calorias: '320 cal', proteina: '32g', carbos: '0g', grasas: '18g' }
    },
    {
        id: 2,
        titulo: 'Omelette de Espinaca y Queso',
        imagen: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600',
        stats: '250 cal | 18g proteína | Desayuno perfecto',
        ingredientes: [
            '3 huevos medianos',
            '2 tazas de espinaca fresca (o 100g)',
            '1/4 taza de queso bajo en grasa',
            '1 cucharada de aceite o spray',
            'Cebolla picada (opcional)',
            'Sal y pimienta al gusto'
        ],
        pasos: [
            'Calienta el aceite en una sartén antiadherente a fuego medio',
            'Saltea la espinaca durante 1-2 minutos y retira',
            'Bate los huevos con sal y pimienta',
            'Vierte los huevos en la sartén y espera a que comiencen a cuajar',
            'Cuando esté semi-cocido, agrega la espinaca y queso en el centro',
            'Dobla el omelette por la mitad y sirve inmediatamente'
        ],
        nutricion: { calorias: '250 cal', proteina: '18g', carbos: '3g', grasas: '12g' }
    },
    {
        id: 3,
        titulo: 'Pechuga Rellena de Brócoli',
        imagen: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=600',
        stats: '300 cal | 38g proteína | Superproteico',
        ingredientes: [
            '1 pechuga de pollo (180g)',
            '1 taza de brócoli al vapor',
            '2 cucharadas de queso blanco rallado',
            '1 cucharada de aceite de oliva',
            'Ajo picado (1 diente)',
            'Sal y pimienta al gusto'
        ],
        pasos: [
            'Aplasta la pechuga con un mazo para hacerla más delgada',
            'Realiza un corte horizontal para crear un bolsillo',
            'Mezcla brócoli al vapor con queso blanco',
            'Rellena el bolsillo de la pechuga con esta mezcla',
            'Calienta aceite en una sartén y cocina a fuego medio-alto',
            'Cocina 6-7 minutos por cada lado hasta que esté dorada y cocida'
        ],
        nutricion: { calorias: '300 cal', proteina: '38g', carbos: '4g', grasas: '8g' }
    },
    {
        id: 4,
        titulo: 'Avena con Frutos Rojos',
        imagen: 'https://images.unsplash.com/photo-1585518419759-d9b93fbf7bc1?q=80&w=600',
        stats: '220 cal | 8g proteína | Fibra y energía',
        ingredientes: [
            '1/2 taza de avena integral',
            '1 taza de leche desnatada',
            '1/2 taza de frutos rojos (arándanos, fresas)',
            '1 cucharadita de miel',
            'Canela al gusto',
            'Almendras picadas (10g)'
        ],
        pasos: [
            'Calienta la leche en una olla a fuego medio',
            'Cuando hierva, agrega la avena revolviendo constantemente',
            'Cocina durante 5-7 minutos hasta que espese',
            'Agrega canela y mezcla bien',
            'Sirve en un bowl y decora con frutos rojos',
            'Coloca miel al gusto y almendras por encima'
        ],
        nutricion: { calorias: '220 cal', proteina: '8g', carbos: '38g', grasas: '4g' }
    },
    {
        id: 5,
        titulo: 'Ensalada Proteica de Pollo',
        imagen: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=600',
        stats: '280 cal | 30g proteína | Almuerzo ligero',
        ingredientes: [
            '150g de pechuga de pollo cocida',
            '3 tazas de lechuga mixta',
            '1 tomate mediano',
            '1/2 pepino',
            '1/4 cebolla morada',
            '2 cucharadas de vinagre de manzana',
            '1 cucharada de aceite de oliva',
            'Limón, sal y pimienta'
        ],
        pasos: [
            'Desmenuzar el pollo cocido en trozos pequeños',
            'Lavar y picar la lechuga en un bowl',
            'Cortar el tomate, pepino y cebolla en cubos',
            'Mezclar las verduras en el bowl',
            'Preparar vinagretas con vinagre, aceite, limón y sal',
            'Agregar el pollo y aderezar la ensalada',
            'Servir inmediatamente'
        ],
        nutricion: { calorias: '280 cal', proteina: '30g', carbos: '15g', grasas: '8g' }
    },
    {
        id: 6,
        titulo: 'Filete de Pescado a la Parrilla',
        imagen: 'https://images.unsplash.com/photo-1504674900152-b8d9668f6f62?q=80&w=600',
        stats: '200 cal | 30g proteína | Ultra ligero',
        ingredientes: [
            '1 filete de merluza o pargo (150g)',
            '1 limón',
            'Espárragos (150g)',
            '2 zanahorias medianas',
            '1 cucharada de aceite de oliva',
            'Sal, pimienta y orégano'
        ],
        pasos: [
            'Precalienta la parrilla o grill a fuego medio-alto',
            'Sazona el pescado con sal, pimienta y orégano',
            'Rocía ligeramente con aceite de oliva',
            'Coloca el pescado en la parrilla 5-7 minutos por cada lado',
            'Simultáneamente, asa las verduras cortadas a lo largo',
            'Exprime limón fresco sobre el pescado antes de servir'
        ],
        nutricion: { calorias: '200 cal', proteina: '30g', carbos: '8g', grasas: '4g' }
    },
    {
        id: 7,
        titulo: 'Yogur Griego con Granola',
        imagen: 'https://images.unsplash.com/photo-1488477181946-6428a0291840?q=80&w=600',
        stats: '190 cal | 15g proteína | Snack proteico',
        ingredientes: [
            '1 taza de yogur griego sin azúcar',
            '3 cucharadas de granola casera',
            '1/2 taza de frutos secos (almendras, nueces)',
            '1 cucharadita de miel',
            'Canela al gusto',
            'Frutas frescas (arándanos, fresas)'
        ],
        pasos: [
            'Vierte el yogur griego en un bowl',
            'Agrega los frutos secos picados',
            'Coloca la granola sobre el yogur',
            'Añade frutas frescas al gusto',
            'Rocía con miel según tu preferencia',
            'Espolvorea canela y disfruta inmediatamente'
        ],
        nutricion: { calorias: '190 cal', proteina: '15g', carbos: '18g', grasas: '6g' }
    },
    {
        id: 8,
        titulo: 'Arroz Integral con Pollo y Verduras',
        imagen: 'https://images.unsplash.com/photo-1610332049056-a8f4c55e5f16?q=80&w=600',
        stats: '380 cal | 28g proteína | Comida balanceada',
        ingredientes: [
            '150g de pechuga de pollo',
            '3/4 taza de arroz integral cocido',
            '1 taza de mezcla de verduras (zanahorias, guisantes, brócoli)',
            '1 diente de ajo picado',
            '2 cucharaditas de aceite de oliva',
            'Caldo de pollo (1 taza)',
            'Sal, pimienta y cúrcuma'
        ],
        pasos: [
            'Corta el pollo en trozos pequeños',
            'Calienta aceite en un wok o sartén grande',
            'Saltea el ajo y el pollo hasta que esté cocido',
            'Agrega las verduras y cocina 3-4 minutos',
            'Añade el arroz integral y mezcla bien',
            'Vierte un poco de caldo para mantener la humedad',
            'Sazona con sal, pimienta y cúrcuma al gusto'
        ],
        nutricion: { calorias: '380 cal', proteina: '28g', carbos: '42g', grasas: '8g' }
    },
    {
        id: 9,
        titulo: 'Sopa de Lentejas y Pollo',
        imagen: 'https://images.unsplash.com/photo-1535612317861-45f90d0c8200?q=80&w=600',
        stats: '240 cal | 22g proteína | Reconfortante',
        ingredientes: [
            '100g de lentejas rojas',
            '100g de pechuga de pollo',
            '1 cebolla pequeña',
            '2 zanahorias',
            '2 dientes de ajo',
            '1 litro de caldo de pollo bajo en sodio',
            'Tomillo y laurel',
            'Sal y pimienta'
        ],
        pasos: [
            'Desmenuzar el pollo cocido en trozos pequeños',
            'Calentar el caldo en una olla grande',
            'Agregar las lentejas limpias y enjuagadas',
            'Picar finamente cebolla, zanahoria y ajo',
            'Agregar las verduras picadas al caldo',
            'Cocina durante 25-30 minutos hasta que las lentejas estén suaves',
            'Agrega el pollo, tomillo, laurel y sazona al gusto',
            'Cocina 5 minutos más y sirve caliente'
        ],
        nutricion: { calorias: '240 cal', proteina: '22g', carbos: '28g', grasas: '3g' }
    },
    {
        id: 10,
        titulo: 'Pechuga de Pavo con Champiñones',
        imagen: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=600',
        stats: '260 cal | 36g proteína | Ultra magro',
        ingredientes: [
            '1 filete de pechuga de pavo (180g)',
            '250g de champiñones frescos',
            '1/2 taza de vino blanco seco',
            '2 dientes de ajo picados',
            '1 cucharada de aceite de oliva',
            'Sal, pimienta y tomillo'
        ],
        pasos: [
            'Limpia y corta los champiñones en rodajas',
            'Calienta el aceite en una sartén a fuego medio-alto',
            'Cocina la pechuga de pavo 6-7 minutos por lado',
            'Retira el pavo y saltea ajo y champiñones 3-4 minutos',
            'Vierte el vino blanco y deja reducir por 2-3 minutos',
            'Devuelve el pavo al sartén y cocina 2 minutos más',
            'Sazona con sal, pimienta y tomillo al gusto'
        ],
        nutricion: { calorias: '260 cal', proteina: '36g', carbos: '5g', grasas: '7g' }
    },
    {
        id: 11,
        titulo: 'Tofu a la Parrilla con Verduras',
        imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600',
        stats: '180 cal | 20g proteína | Vegano',
        ingredientes: [
            '350g de tofu firme',
            '3 cucharadas de salsa de soja baja en sodio',
            '1 cucharada de jengibre fresco rallado',
            '2 dientes de ajo picados',
            '1 cucharada de aceite de sésamo',
            'Verduras mixtas (calabacín, pimiento, berenjena)',
            'Limón al gusto'
        ],
        pasos: [
            'Corta el tofu en bloques de 1 cm de espesor',
            'Prepara marinada: mezcla soja, jengibre, ajo y aceite de sésamo',
            'Marina el tofu durante 15-20 minutos',
            'Calienta la parrilla a fuego medio-alto',
            'Cocina el tofu 5-6 minutos por cada lado',
            'Simultáneamente, asa las verduras cortadas longitudinalmente',
            'Sirve con limón fresco y salsa marinada'
        ],
        nutricion: { calorias: '180 cal', proteina: '20g', carbos: '8g', grasas: '7g' }
    },
    {
        id: 12,
        titulo: 'Tilapia al Vapor con Brócoli',
        imagen: 'https://images.unsplash.com/photo-1504674900152-b8d9668f6f62?q=80&w=600',
        stats: '210 cal | 28g proteína | Súper ligero',
        ingredientes: [
            '1 filete de tilapia (150g)',
            '2 tazas de brócoli fresco',
            '2 rodajas de limón',
            '1 diente de ajo picado',
            '1 cucharada de vino blanco',
            'Sal y pimienta al gusto',
            'Perejil fresco'
        ],
        pasos: [
            'Coloca agua en una olla con canastilla vaporizadora',
            'Coloca el filete de tilapia en la canastilla',
            'Distribuye el brócoli alrededor del pescado',
            'Rocía con vino blanco y coloca ajo',
            'Tapa y cocina al vapor durante 12-15 minutos',
            'El pescado debe desmigajarse fácilmente',
            'Exprime limón fresco antes de servir'
        ],
        nutricion: { calorias: '210 cal', proteina: '28g', carbos: '6g', grasas: '3g' }
    },
    {
        id: 13,
        titulo: 'Batido Proteico Post-Entreno',
        imagen: 'https://images.unsplash.com/photo-1590431768611-deb41cebc647?q=80&w=600',
        stats: '240 cal | 30g proteína | Recuperación',
        ingredientes: [
            '1 medida (30g) de proteína en polvo',
            '1 plátano mediano',
            '1 taza de leche desnatada',
            '1/2 taza de yogur natural',
            '1 cucharada de miel',
            'Hielo (1 taza)',
            'Vainilla (opcional)'
        ],
        pasos: [
            'Coloca el plátano cortado en la licuadora',
            'Agrega la proteína en polvo',
            'Vierte la leche desnatada y el yogur',
            'Añade miel según tu preferencia',
            'Agrega hielo para textura cremosa',
            'Licúa durante 60-90 segundos',
            'Sirve inmediatamente post-entreno'
        ],
        nutricion: { calorias: '240 cal', proteina: '30g', carbos: '28g', grasas: '2g' }
    },
    {
        id: 14,
        titulo: 'Tallarín de Calabacín con Pesto',
        imagen: 'https://images.unsplash.com/photo-1571407614912-ec4a0b27d0f7?q=80&w=600',
        stats: '180 cal | 15g proteína | Baja en carbos',
        ingredientes: [
            '2 calabacines medianos',
            '100g de pechuga de pollo cocida',
            '3 cucharadas de pesto casero',
            '1/4 taza de queso parmesano',
            '1 cucharada de aceite de oliva',
            'Limón al gusto',
            'Sal y pimienta'
        ],
        pasos: [
            'Usa un spiralizador para cortar calabacín en noodles',
            'Corta la pechuga de pollo en trozos pequeños',
            'Calienta aceite en una sartén a fuego medio',
            'Saltea los noodles de calabacín 2-3 minutos',
            'Agrega el pollo y calienta bien',
            'Mezcla con pesto casero fuera del fuego',
            'Decora con parmesano y limón fresco'
        ],
        nutricion: { calorias: '180 cal', proteina: '15g', carbos: '8g', grasas: '9g' }
    },
    {
        id: 15,
        titulo: 'Filete de Res Magra a la Parrilla',
        imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600',
        stats: '310 cal | 42g proteína | Proteína premium',
        ingredientes: [
            '1 filete de lomo (180g)',
            '1 cucharada de aceite de oliva',
            '4 dientes de ajo machacados',
            'Sal marina y pimienta negra',
            'Tomillo fresco',
            'Limón al gusto',
            'Verduras asadas'
        ],
        pasos: [
            'Precalienta la parrilla a fuego muy alto',
            'Saca el filete de la nevera 10 minutos antes',
            'Seca bien el filete con papel absorbente',
            'Unta con aceite de oliva y sazona generosamente',
            'Coloca en la parrilla y cocina 4-5 minutos por lado',
            'Descansa 5 minutos antes de servir',
            'Termina con ajo, tomillo y limón fresco'
        ],
        nutricion: { calorias: '310 cal', proteina: '42g', carbos: '0g', grasas: '14g' }
    },
    {
        id: 16,
        titulo: 'Tortilla de Claras de Huevo',
        imagen: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600',
        stats: '120 cal | 25g proteína | Ultrabajo en grasa',
        ingredientes: [
            '5 claras de huevo',
            'Spray de cocina sin calorías',
            'Sal y pimienta al gusto',
            '1/2 taza de vegetales picados (cebolla, tomate, pimiento)',
            'Orégano',
            'Limón (opcional)'
        ],
        pasos: [
            'Separa las claras de los huevos con cuidado',
            'Bate las claras hasta que formen espuma',
            'Calienta una sartén antiadherente con spray',
            'Vierte las claras cuando esté caliente',
            'Deja cuajar 2-3 minutos sin mover',
            'Agrega vegetales picados en el centro',
            'Dobla y sirve inmediatamente'
        ],
        nutricion: { calorias: '120 cal', proteina: '25g', carbos: '2g', grasas: '0g' }
    },
    {
        id: 17,
        titulo: 'Atún en Lata con Ensalada',
        imagen: 'https://images.unsplash.com/photo-1517525443890-6f3ee330ee8e?q=80&w=600',
        stats: '200 cal | 28g proteína | Omega-3',
        ingredientes: [
            '1 lata de atún natural sin aceite (150g)',
            '2 tazas de lechuga mixta',
            '1 tomate mediano',
            '1/2 pepino',
            '1/4 cebolla morada',
            '1 cucharada de vinagre balsámico',
            '1 cucharada de aceite de oliva',
            'Limón y sal'
        ],
        pasos: [
            'Desagua muy bien la lata de atún',
            'Lava y pica la lechuga en un bowl grande',
            'Corta el tomate, pepino y cebolla',
            'Mezcla todas las verduras',
            'Prepara vinagreta: vinagre, aceite, sal y limón',
            'Agrega el atún desmenuzado',
            'Adereza todo y sirve inmediatamente'
        ],
        nutricion: { calorias: '200 cal', proteina: '28g', carbos: '10g', grasas: '6g' }
    },
    {
        id: 18,
        titulo: 'Pechuga de Pollo en Salsa Tomate',
        imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600',
        stats: '270 cal | 34g proteína | Italiano',
        ingredientes: [
            '2 pechugas de pollo (200g)',
            '1 lata de tomates naturales (400g)',
            '3 dientes de ajo picados',
            '1 cebolla pequeña',
            '1 cucharada de aceite de oliva',
            'Albahaca fresca',
            'Orégano, sal y pimienta'
        ],
        pasos: [
            'Calienta aceite en una olla grande',
            'Dora las pechugas por ambos lados (3 min c/lado)',
            'Retira el pollo temporalmente',
            'Sofríe cebolla y ajo hasta que estén dorados',
            'Vierte los tomates naturales',
            'Regresa el pollo a la olla',
            'Cocina a fuego lento 20-25 minutos',
            'Sazona con orégano, sal, pimienta y albahaca'
        ],
        nutricion: { calorias: '270 cal', proteina: '34g', carbos: '12g', grasas: '6g' }
    },
    {
        id: 19,
        titulo: 'Smoothie Bowl Proteico',
        imagen: 'https://images.unsplash.com/photo-1590080876/smoothie-bowl?q=80&w=600',
        stats: '280 cal | 22g proteína | Desayuno',
        ingredientes: [
            '1 medida (25g) de proteína en polvo',
            '1 taza de yogur griego sin azúcar',
            '1 plátano congelado',
            '1/2 taza de frutos rojos',
            '1/2 taza de leche desnatada',
            'Granola casera (3 cucharadas)',
            'Coco rallado (1 cucharada)',
            'Miel (1 cucharadita)'
        ],
        pasos: [
            'Coloca proteína, yogur y leche en licuadora',
            'Agrega plátano congelado y frutos rojos',
            'Licúa hasta obtener consistencia espesa',
            'Vierte en un bowl',
            'Decora con granola en el centro',
            'Agrega coco rallado alrededor',
            'Coloca frutas frescas de forma atractiva',
            'Sirve inmediatamente con cuchara'
        ],
        nutricion: { calorias: '280 cal', proteina: '22g', carbos: '32g', grasas: '5g' }
    },
    {
        id: 20,
        titulo: 'Tostadas de Aguacate y Huevo',
        imagen: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600',
        stats: '290 cal | 14g proteína | Desayuno',
        ingredientes: [
            '2 rebanadas de pan integral',
            '1/2 aguacate',
            '2 huevos hervidos',
            'Sal, pimienta y semillas de sésamo',
            'Tomate cherry (opcional)'
        ],
        pasos: [
            'Tuesta las rebanadas de pan',
            'Haz un puré con el aguacate y sazona con sal y pimienta',
            'Unta el aguacate sobre el pan tostado',
            'Corta los huevos hervidos en rodajas y colócalos encima',
            'Decora con semillas de sésamo y tomates cherry'
        ],
        nutricion: { calorias: '290 cal', proteina: '14g', carbos: '28g', grasas: '16g' }
    },
    {
        id: 21,
        titulo: 'Ensalada de Atún y Garbanzos',
        imagen: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600',
        stats: '340 cal | 28g proteína | Rápido',
        ingredientes: [
            '1 lata de atún en agua (escurrido)',
            '1/2 taza de garbanzos cocidos',
            '1/4 cebolla morada picada',
            '1 cucharada de aceite de oliva',
            'Jugo de un limón',
            'Espinaca fresca'
        ],
        pasos: [
            'Enjuaga y escurre los garbanzos',
            'Mezcla el atún, garbanzos y la cebolla morada en un bowl',
            'Prepara el aderezo mezclando el aceite de oliva, limón, sal y pimienta',
            'Sirve la mezcla sobre una cama de espinaca fresca',
            'Añade el aderezo y mezcla suavemente'
        ],
        nutricion: { calorias: '340 cal', proteina: '28g', carbos: '26g', grasas: '14g' }
    },
    {
        id: 22,
        titulo: 'Tacos de Pavo Magro',
        imagen: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=600',
        stats: '310 cal | 32g proteína | Mexicano',
        ingredientes: [
            '150g de carne molida de pavo',
            '2 tortillas de maíz',
            '1/4 de aguacate',
            'Pico de gallo (tomate, cebolla, cilantro)',
            'Especias (comino, pimentón, ajo en polvo)'
        ],
        pasos: [
            'Cocina la carne molida de pavo en una sartén con las especias',
            'Calienta las tortillas de maíz',
            'Arma los tacos colocando la carne sobre las tortillas',
            'Añade el pico de gallo y rebanadas de aguacate encima',
            'Sirve inmediatamente con un toque de limón'
        ],
        nutricion: { calorias: '310 cal', proteina: '32g', carbos: '24g', grasas: '12g' }
    }
];

// ==========================================
// FUNCIONES PARA ABRIR/CERRAR RECETA
// ==========================================
function abrirReceta(indice) {
    // REDIRIGIR A LA PÁGINA DE RECETA
    window.location.href = `receta.html?id=${indice}`;
}

function cerrarReceta() {
    // NO SE USA AHORA (LA PÁGINA DE RECETA TIENE UN BOTÓN VOLVER)
}

window.abrirReceta = abrirReceta;
window.cerrarReceta = cerrarReceta;

// ==========================================
// LÓGICA DEL ASISTENTE WIZARD (TIPO FITIA)
// ==========================================
let wizCurrentStep = 1;
const wizTotalSteps = 6;
let wizData = {
    objetivo: '', metodo: '', sexo: 'M',
    edad: 25, altura: 170, peso: 70,
    actividad: '1.2', fuerza: false
};

window.abrirWizard = () => {
    document.getElementById('wizardModal').classList.add('active');
    document.body.style.overflow = 'hidden'; 
    showWizardStep(1);
};

window.cerrarWizard = () => {
    document.getElementById('wizardModal').classList.remove('active');
    document.body.style.overflow = 'auto';
};

window.showWizardStep = (step) => {
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`wizStep${step}`).classList.add('active');
    document.getElementById('wizardProgress').style.width = `${(step / wizTotalSteps) * 100}%`;
    wizCurrentStep = step;
    
    if (step === 6) { calcularResultadosWizard(); }
};

window.nextWizardStep = () => { if (wizCurrentStep < wizTotalSteps) showWizardStep(wizCurrentStep + 1); };
window.prevWizardStep = () => { if (wizCurrentStep > 1) showWizardStep(wizCurrentStep - 1); };

window.selectWizard = (key, value) => {
    wizData[key] = value;
    nextWizardStep();
};

window.calcularResultadosWizard = () => {
    wizData.sexo = document.getElementById('wizSexo').value;
    wizData.edad = parseFloat(document.getElementById('wizEdad').value);
    wizData.altura = parseFloat(document.getElementById('wizAltura').value);
    wizData.peso = parseFloat(document.getElementById('wizPeso').value);
    
    // Cálculo de Tasa Metabólica Basal
    let tmb = (wizData.sexo === 'M') ? 
        (10 * wizData.peso) + (6.25 * wizData.altura) - (5 * wizData.edad) + 5 : 
        (10 * wizData.peso) + (6.25 * wizData.altura) - (5 * wizData.edad) - 161;
    
    let calorias = tmb * parseFloat(wizData.actividad);
    
    if (wizData.objetivo === 'Perder Grasa') calorias -= 500;
    if (wizData.objetivo === 'Ganar Músculo') calorias += 500;
    
    let proteina = wizData.peso * 2.2; 
    let grasa = wizData.peso * 0.9; 
    let carbs = (calorias - ((proteina * 4) + (grasa * 9))) / 4;
    
    // Imprimir en pantalla
    document.getElementById('wizResCal').innerText = Math.round(calorias);
    document.getElementById('wizResPro').innerText = `${Math.round(proteina)}g`;
    document.getElementById('wizResCar').innerText = `${Math.round(carbs > 0 ? carbs : 0)}g`;
    document.getElementById('wizResGra').innerText = `${Math.round(grasa)}g`;
};

window.finalizarWizard = async () => {
    cerrarWizard();

    // Si el usuario ya está dentro de su cuenta, sincronizamos con la Base de Datos
    if (window.usuarioLogueado && auth.currentUser) {
        const user = auth.currentUser;
        
        // Emparejamos los datos del Wizard con el formato de la BD
        const nuevosDatos = {
            genero: wizData.sexo,
            edad: wizData.edad,
            peso: wizData.peso,
            estatura: wizData.altura,
            actividad: wizData.actividad,
            objetivo: wizData.objetivo
        };

        try {
            Swal.fire({ title: 'Guardando...', text: 'Sincronizando tus métricas...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            // Subimos a Firebase
            await updateDoc(doc(db, "Usuarios", user.uid), nuevosDatos);
            
            // Descargamos de nuevo para renderizar la caja negra sincronizada
            const docSnap = await getDoc(doc(db, "Usuarios", user.uid));
            actualizarDashboardDinamico(docSnap.data(), user.uid);
            
            Swal.fire({ icon: 'success', title: '¡Métricas Actualizadas!', timer: 1500, showConfirmButton: false });
            
            // Asegurarnos de que el panel lateral esté abierto en la pestaña de Salud
            if (!document.getElementById('sidePanel').classList.contains('active')) {
                window.togglePanel();
            }
            window.abrirSeccion('salud');
            
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la configuración.' });
        }
    } else {
        // Si es un usuario nuevo que acaba de dar clic en "Comenzar", lo mandamos al registro
        window.togglePanel(); 
    }

    // Base de datos de rutinas mejorada con iconos y formato estructurado
const baseDatosRutinasAvanzada = {
  hipertrofia: {
    3: [
      { dia: 1, enfoque: "Entrenamiento de Empuje (Pecho, Hombros, Tríceps)", icono: "icono-empuje", ejercicios: [
          { nombre: "Press de Banca (Barra)", sets: "4", reps: "8 (Pesado)" },
          { nombre: "Press Militar (Mancuernas)", sets: "4", reps: "10 (Moderado)" },
          { nombre: "Fondos en Paralelas", sets: "3", reps: "12 (Hipertrofia)" }
        ] 
      },
      { dia: 2, enfoque: "Entrenamiento de Jalón (Espalda, Bíceps)", icono: "icono-jalon", ejercicios: [
          { nombre: "Dominadas / Pulldown", sets: "4", reps: "Fallo" },
          { nombre: "Remo con barra", sets: "4", reps: "10" },
          { nombre: "Curl de bíceps con barra Z", sets: "3", reps: "12" }
        ] 
      },
      { dia: 3, enfoque: "Entrenamiento de Tren Inferior (Pierna)", icono: "icono-pierna", ejercicios: [
          { nombre: "Sentadilla con Barra (W)", sets: "4", reps: "8" },
          { nombre: "Prensa Inclinada", sets: "4", reps: "10" },
          { nombre: "Extensión de Cuádriceps", sets: "3", reps: "15" }
        ] 
      }
    ],
    4: [
        // Añadir variantes de 4 días aquí...
    ],
    // Puedes añadir más variantes para 5 días...
  },
  resistencia: {
    3: [
        // Añadir variantes de resistencia aquí...
    ],
    // Puedes añadir más variantes para 4 y 5 días...
  }
};

function generarRutina() {
  const dias = document.getElementById("dias").value;
  const enfoque = document.getElementById("enfoque").value;
  const contenedorResultado = document.getElementById("resultado-rutina");
  const selectorDiasBar = document.getElementById("selector-dias");
  const contenedorDiasDetalle = document.getElementById("contenedor-dias-detalle");
  
  // Limpiar contenedores antes de inyectar nueva información
  selectorDiasBar.innerHTML = "";
  contenedorDiasDetalle.innerHTML = "";

  // Obtener la rutina correspondiente
  const rutinaSeleccionada = baseDatosRutinasAvanzada[enfoque][dias];

  if (rutinaSeleccionada) {
    // 1. Generar la Barra de Selección de Días y los Paneles de Detalle
    rutinaSeleccionada.forEach((diaInfo, index) => {
      // Crear botón del selector
      const btnDia = document.createElement("button");
      btnDia.className = "btn-dia-tab";
      btnDia.innerText = `Día ${diaInfo.dia}`;
      btnDia.onclick = () => mostrarDia(diaInfo.dia); // Llamada para cambiar el panel
      selectorDiasBar.appendChild(btnDia);

      // Crear el panel de detalle para este día
      const diaPanel = document.createElement("div");
      diaPanel.className = `dia-panel-detalle panel-dia-${diaInfo.dia}`;
      
      // Inyectar el encabezado del día
      let htmlContenido = `<div class="info-enfoque-dia">${diaInfo.enfoque}</div>`;
      
      // Inyectar las tarjetas de ejercicio estructuradas
      diaInfo.ejercicios.forEach(ejercicio => {
        htmlContenido += `
          <div class="ejercicio-card-mini">
            <div class="icono-ejercicio-tipo ${diaInfo.icono}"></div>
            <div class="detalle-ejercicio-texto">
              <h4>${ejercicio.nombre}</h4>
              <p>Series x Repeticiones</p>
            </div>
            <div class="sets-reps-container">
              <span class="data-sets">${ejercicio.sets}</span>
              <span class="data-reps">${ejercicio.reps}</span>
            </div>
          </div>
        `;
      });

      diaPanel.innerHTML = htmlContenido;
      contenedorDiasDetalle.appendChild(diaPanel);
    });

    // 2. Hacer visible el contenedor principal
    contenedorResultado.classList.remove("resultado-oculto");
    contenedorResultado.classList.add("resultado-visible");

    // 3. Mostrar el Día 1 por defecto (y marcar el botón como activo)
    mostrarDia(1);

  } else {
    // Mensaje de respaldo
    contenedorResultado.classList.remove("resultado-oculto");
    contenedorResultado.classList.add("resultado-visible");
    selectorDiasBar.innerHTML = "";
    contenedorDiasDetalle.innerHTML = "<p>Rutina en construcción. ¡Pronto añadiremos esta variante!</p>";
  }
}

// Función auxiliar para cambiar el día activo en la vista
function mostrarDia(diaNumero) {
  // 1. Desactivar todos los botones y paneles
  const botones = document.querySelectorAll('.btn-dia-tab');
  const paneles = document.querySelectorAll('.dia-panel-detalle');
  botones.forEach(btn => btn.classList.remove('activo'));
  paneles.forEach(panel => panel.classList.remove('activo'));

  // 2. Activar el botón correspondiente
  const btnActivo = [...botones].find(btn => btn.innerText === `Día ${diaNumero}`);
  if (btnActivo) btnActivo.classList.add('activo');

  // 3. Activar el panel correspondiente
  const panelActivo = document.querySelector(`.panel-dia-${diaNumero}`);
  if (panelActivo) panelActivo.classList.add('activo');
}

};





