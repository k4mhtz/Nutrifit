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

// 1. Base de datos de comidas ampliada con opciones altas en carbohidratos
const baseDeComidas = [
    // --- 🍗 OPCIONES CON POLLO / AVES ---
    { nombre: "Pechuga de pollo con brócoli al vapor y taza y media de arroz blanco", tags: ["pollo", "arroz", "brocoli", "carbohidratos"] },
    { nombre: "Plato grande de pasta al pesto con pechuga de pollo asada", tags: ["pollo", "pasta", "carbohidratos"] },
    { nombre: "Arroz frito estilo oriental con pechuga de pollo, huevo y chícharos", tags: ["pollo", "huevo", "arroz", "carbohidratos"] },
    { nombre: "Sándwich triple de pavo con queso panela y papas gajo al horno", tags: ["pollo", "pavo", "pan", "papa", "carbohidratos"] },
    { nombre: "Tacos de pollo con aguacate y doble tortilla de maíz", tags: ["pollo", "aguacate", "tortilla", "carbohidratos"] },
    { nombre: "Tostadas horneadas de tinga de pollo con base de frijoles refritos", tags: ["pollo", "tortilla", "frijoles", "carbohidratos"] },
    { nombre: "Macarrones con queso (versión fit) y trozos de pechuga de pollo", tags: ["pollo", "lacteos", "pasta", "carbohidratos"] },
    { nombre: "Ensalada césar con pollo a la parrilla y crutones integrales", tags: ["pollo", "ensalada", "pan"] },
    { nombre: "Fajitas de pollo con pimientos, cebolla y tortillas de harina", tags: ["pollo", "tortilla", "carbohidratos"] },
    { nombre: "Milanesa de pollo (empanizada al horno) con puré de papa", tags: ["pollo", "papa", "carbohidratos"] },
    { nombre: "Alambre de pollo con queso oaxaca light y tortillas", tags: ["pollo", "lacteos", "tortilla", "carbohidratos"] },
    { nombre: "Bowl teriyaki de pollo con arroz de sushi y edamames", tags: ["pollo", "arroz", "carbohidratos"] },
    { nombre: "Caldo tlalpeño con pollo, garbanzos, aguacate y arroz", tags: ["pollo", "arroz", "garbanzos", "carbohidratos"] },

    // --- 🥩 OPCIONES CON CARNE DE RES / CERDO ---
    { nombre: "Bistec de res con abundante arroz blanco y frijoles charros", tags: ["res", "carne", "arroz", "frijoles", "carbohidratos"] },
    { nombre: "Tacos de bistec con tortilla de maíz, aguacate y unas gotas de limón recién cortado", tags: ["res", "carne", "tortilla", "carbohidratos"] },
    { nombre: "Pasta bolognesa con abundante carne molida de res magra", tags: ["res", "carne", "pasta", "carbohidratos"] },
    { nombre: "Papas al horno gigantes rellenas de carne molida y un toque de queso", tags: ["res", "carne", "papa", "carbohidratos"] },
    { nombre: "Burrito gigante de fajitas de res, arroz, frijoles y guacamole", tags: ["res", "carne", "arroz", "frijoles", "tortilla", "carbohidratos"] },
    { nombre: "Carne de cerdo magra con arroz, aguacate y tortillas", tags: ["res", "carne", "cerdo", "arroz", "tortilla", "carbohidratos"] },
    { nombre: "Picadillo de res con papas, zanahorias y tostadas", tags: ["res", "carne", "papa", "tortilla", "carbohidratos"] },
    { nombre: "Albóndigas de res en salsa de tomate con arroz blanco", tags: ["res", "carne", "arroz", "carbohidratos"] },
    { nombre: "Hamburguesa casera de res magra con pan integral y camote frito al horno", tags: ["res", "carne", "pan", "camote", "carbohidratos"] },
    { nombre: "Salpicón de res con aguacate y tostadas deshidratadas", tags: ["res", "carne", "tortilla", "aguacate"] },
    { nombre: "Medallón de res (filete) con espárragos y puré de camote", tags: ["res", "carne", "camote", "esparragos", "carbohidratos"] },
    { nombre: "Chuleta de cerdo ahumada con ensalada de manzana y nuez", tags: ["res", "carne", "cerdo", "manzana"] },

    // --- 🐟 OPCIONES CON PESCADO / ATÚN / MARISCOS ---
    { nombre: "Ensalada de pasta fría con atún, elote, chícharos y mayonesa ligera", tags: ["pescado", "atun", "pasta", "carbohidratos"] },
    { nombre: "Bowl de arroz blanco con salmón teriyaki y aguacate", tags: ["pescado", "arroz", "carbohidratos"] },
    { nombre: "Sándwich doble de atún con papa hervida a un lado", tags: ["pescado", "atun", "pan", "papa", "carbohidratos"] },
    { nombre: "Pescado a la plancha con ensalada verde mixta", tags: ["pescado", "ensalada"] },
    { nombre: "Salmón al horno con espárragos y quinoa", tags: ["pescado", "esparragos", "quinoa", "carbohidratos"] },
    { nombre: "Ceviche de pescado con tostadas horneadas y aguacate", tags: ["pescado", "tortilla", "aguacate", "carbohidratos"] },
    { nombre: "Tacos de pescado a la plancha con col morada y aderezo de yogur", tags: ["pescado", "tortilla", "lacteos", "carbohidratos"] },
    { nombre: "Camarones al ajillo con arroz blanco y ensalada", tags: ["pescado", "mariscos", "arroz", "carbohidratos"] },
    { nombre: "Croquetas de atún al horno con avena y ensalada fresca", tags: ["pescado", "atun", "avena", "carbohidratos"] },
    { nombre: "Pasta integral con camarones, ajo y aceite de oliva", tags: ["pescado", "mariscos", "pasta", "carbohidratos"] },

    // --- 🍳 OPCIONES DULCES / DESAYUNOS (Huevo, Lácteos, Avena) ---
    { nombre: "Avena trasnochada con chía, doble porción de plátano, miel y leche", tags: ["lacteos", "avena", "vegetariano", "carbohidratos", "dulce", "platano"] },
    { nombre: "Hotcakes gruesos de avena y plátano bañados en miel de abeja", tags: ["huevo", "avena", "vegetariano", "dulce", "carbohidratos"] },
    { nombre: "Licuado hipercalórico: Leche, avena, plátano, y mucha crema de maní", tags: ["lacteos", "avena", "platano", "mani", "carbohidratos", "dulce"] },
    { nombre: "Yogur griego con abundante granola, nueces y miel", tags: ["lacteos", "yogur", "nueces", "carbohidratos", "dulce"] },
    { nombre: "Omelette de 4 claras y 2 yemas con champiñones y 2 panes tostados", tags: ["huevo", "champiñones", "pan", "carbohidratos"] },
    { nombre: "Huevos revueltos con papa picada y tortillas de harina", tags: ["huevo", "papa", "tortilla", "carbohidratos"] },
    { nombre: "Chilaquiles rojos horneados con huevo estrellado y queso panela", tags: ["huevo", "lacteos", "tortilla", "carbohidratos"] },
    { nombre: "Sincronizadas de jamón de pavo con queso y pico de gallo", tags: ["huevo", "lacteos", "tortilla", "pavo", "carbohidratos"] },
    { nombre: "Huevos motuleños sobre tortilla tostada con frijoles y chícharos", tags: ["huevo", "tortilla", "frijoles", "carbohidratos"] },
    { nombre: "Pan francés (french toast) integral con claras de huevo y fresas", tags: ["huevo", "pan", "dulce", "carbohidratos"] },
    { nombre: "Copa de queso cottage con piña, almendras y semillas de girasol", tags: ["lacteos", "vegetariano", "dulce"] },

    // --- 🥗 OPCIONES VEGETARIANAS / VEGANAS ---
    { nombre: "Tazón de quinoa con garbanzos, camote asado y aderezo de tahini", tags: ["vegetariano", "quinoa", "garbanzos", "camote", "carbohidratos"] },
    { nombre: "Lentejas guisadas con plátano macho asado y arroz blanco", tags: ["vegetariano", "lentejas", "arroz", "platano", "carbohidratos"] },
    { nombre: "Ensalada abundante de garbanzos, quinoa y aguacate", tags: ["vegetariano", "garbanzos", "quinoa", "carbohidratos"] },
    { nombre: "Tofu revuelto a la mexicana con champiñones y frijoles", tags: ["vegetariano", "tofu", "champiñones", "frijoles"] },
    { nombre: "Camote asado relleno de frijoles negros, elote y queso", tags: ["vegetariano", "frijoles", "camote", "lacteos", "carbohidratos"] },
    { nombre: "Hamburguesa de lentejas con pan integral y papas a la francesa al horno", tags: ["vegetariano", "lentejas", "pan", "papa", "carbohidratos"] },
    { nombre: "Enchiladas mineras de papa y zanahoria con queso fresco", tags: ["vegetariano", "papa", "tortilla", "lacteos", "carbohidratos"] },
    { nombre: "Ceviche de soya texturizada con tostadas y mucho aguacate", tags: ["vegetariano", "soya", "tortilla", "carbohidratos"] },
    { nombre: "Tacos al pastor veganos (de jamaica o soya) con piña", tags: ["vegetariano", "tortilla", "soya", "carbohidratos"] },
    { nombre: "Pasta integral con salsa de tomate, albóndigas de berenjena y parmesano", tags: ["vegetariano", "pasta", "lacteos", "carbohidratos"] },
    { nombre: "Calabacitas rellenas de elote y queso panela gratinado", tags: ["vegetariano", "lacteos", "elote"] },
    { nombre: "Sopa de fideos con espinacas y garbanzos tostados", tags: ["vegetariano", "pasta", "garbanzos", "carbohidratos"] },
    { nombre: "Wrap de hummus, pepino, zanahoria y espinaca en tortilla integral", tags: ["vegetariano", "tortilla", "garbanzos", "carbohidratos"] }
];


window.abrirRecomendaciones = (objetivo) => {
    Swal.fire({
        title: 'Arma tu Plan Ideal',
        width: '750px', // Hacemos el modal más ancho para la cuadrícula
        html: `
            <style>
                /* Estilos inspirados en la interfaz de Fitia */
                .fitia-container { text-align: left; max-height: 65vh; overflow-y: auto; overflow-x: hidden; padding-right: 10px; font-family: 'Poppins', sans-serif; color: #1a1a1a; }
                .fitia-section { margin-bottom: 25px; }
                .fitia-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
                .fitia-title { font-size: 1.1rem; font-weight: 600; margin: 0; }
                .fitia-subtitle { font-size: 0.8rem; color: #666; margin: 0; display: block; }
                
                /* Botón de Seleccionar todo */
                .fitia-select-all { font-size: 0.85rem; font-weight: 600; color: #1a1a1a; cursor: pointer; border: none; background: none; padding: 0; transition: color 0.2s; }
                .fitia-select-all:hover { color: #27ae60; text-decoration: underline; }
                
                .fitia-grid { display: flex; flex-wrap: wrap; gap: 10px; }
                
                /* Magia CSS: Ocultar el checkbox real y diseñar el Label */
                .fitia-checkbox { display: none; }
                
                .fitia-label { 
                    display: inline-flex; align-items: center; gap: 8px; 
                    background-color: #f0efe9; color: #1a1a1a; 
                    padding: 10px 16px; border-radius: 12px; 
                    cursor: pointer; font-size: 0.95rem; font-weight: 500; 
                    border: 2px solid transparent; transition: all 0.2s ease; 
                    user-select: none;
                }
                .fitia-label:hover { background-color: #e6e4db; }
                
                /* Estado Activo/Seleccionado */
                .fitia-checkbox:checked + .fitia-label { 
                    background-color: #e6e4db; 
                    border-color: #27ae60; 
                }
            </style>

            <div class="fitia-container">
                
                <!-- CATEGORÍA 1: PROTEÍNAS -->
                <div class="fitia-section">
                    <div class="fitia-header">
                        <div><h3 class="fitia-title">Proteínas</h3></div>
                        <button type="button" class="fitia-select-all" data-target="grid-prot">Seleccionar todo</button>
                    </div>
                    <div class="fitia-grid" id="grid-prot">
                        <input type="checkbox" id="p_pollo" class="fitia-checkbox pref-check" value="pollo" checked>
                        <label for="p_pollo" class="fitia-label">🍗 Pollo</label>

                        <input type="checkbox" id="p_carne" class="fitia-checkbox pref-check" value="res" checked>
                        <label for="p_carne" class="fitia-label">🥩 Carne</label>
                        
                        <input type="checkbox" id="p_pescado" class="fitia-checkbox pref-check" value="pescado">
                        <label for="p_pescado" class="fitia-label">🐟 Pescado</label>
                        
                        <input type="checkbox" id="p_atun" class="fitia-checkbox pref-check" value="atun">
                        <label for="p_atun" class="fitia-label">🥫 Atún</label>

                        <input type="checkbox" id="p_huevo" class="fitia-checkbox pref-check" value="huevo" checked>
                        <label for="p_huevo" class="fitia-label">🍳 Huevo</label>

                        <input type="checkbox" id="p_pavo" class="fitia-checkbox pref-check" value="pavo">
                        <label for="p_pavo" class="fitia-label">🦃 Pavo</label>

                        <input type="checkbox" id="p_cerdo" class="fitia-checkbox pref-check" value="cerdo">
                        <label for="p_cerdo" class="fitia-label">🥓 Cerdo</label>

                        <input type="checkbox" id="p_tofu" class="fitia-checkbox pref-check" value="vegetariano">
                        <label for="p_tofu" class="fitia-label">🥗 Tofu / Soya</label>
                    </div>
                </div>

                <!-- CATEGORÍA 2: CARBOHIDRATOS -->
                <div class="fitia-section">
                    <div class="fitia-header">
                        <div>
                            <h3 class="fitia-title">Carbohidratos</h3>
                            <span class="fitia-subtitle">Elige tus favoritos</span>
                        </div>
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

                        <input type="checkbox" id="c_garbanzo" class="fitia-checkbox pref-check" value="garbanzos">
                        <label for="c_garbanzo" class="fitia-label">🥙 Garbanzos</label>

                        <input type="checkbox" id="c_pasta" class="fitia-checkbox pref-check" value="pasta">
                        <label for="c_pasta" class="fitia-label">🍝 Pasta</label>

                        <input type="checkbox" id="c_avena" class="fitia-checkbox pref-check" value="avena">
                        <label for="c_avena" class="fitia-label">🥣 Avena</label>

                        <input type="checkbox" id="c_pan" class="fitia-checkbox pref-check" value="pan">
                        <label for="c_pan" class="fitia-label">🍞 Pan</label>

                        <input type="checkbox" id="c_tortilla" class="fitia-checkbox pref-check" value="tortilla" checked>
                        <label for="c_tortilla" class="fitia-label">🌮 Tortilla</label>
                        
                        <input type="checkbox" id="c_elote" class="fitia-checkbox pref-check" value="elote">
                        <label for="c_elote" class="fitia-label">🌽 Elote / Choclo</label>
                    </div>
                </div>

                <!-- CATEGORÍA 3: GRASAS & LÁCTEOS -->
                <div class="fitia-section">
                    <div class="fitia-header">
                        <div><h3 class="fitia-title">Grasas & Lácteos</h3></div>
                        <button type="button" class="fitia-select-all" data-target="grid-grasas">Seleccionar todo</button>
                    </div>
                    <div class="fitia-grid" id="grid-grasas">
                        <input type="checkbox" id="g_aguacate" class="fitia-checkbox pref-check" value="aguacate" checked>
                        <label for="g_aguacate" class="fitia-label">🥑 Palta / Aguacate</label>

                        <input type="checkbox" id="g_nueces" class="fitia-checkbox pref-check" value="nueces">
                        <label for="g_nueces" class="fitia-label">🥜 Nueces / Maní</label>

                        <input type="checkbox" id="g_lacteos" class="fitia-checkbox pref-check" value="lacteos">
                        <label for="g_lacteos" class="fitia-label">🥛 Leche / Yogurt</label>

                        <input type="checkbox" id="g_queso" class="fitia-checkbox pref-check" value="lacteos">
                        <label for="g_queso" class="fitia-label">🧀 Queso</label>
                    </div>
                </div>

                <p style="margin-bottom: 5px; font-weight: 600;">¿Algo que no te guste o alergias? (Opcional):</p>
                <input type="text" id="inputAlergias" class="swal2-input" style="width: 100%; box-sizing: border-box; margin: 0; font-size: 0.9rem; padding: 10px;" placeholder="Ej: brócoli, chocolate, uvas...">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Generar Plan',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#27ae60',
        didOpen: () => {
            // Lógica en JavaScript para que funcionen los botones de "Seleccionar todo"
            const selectAllBtns = Swal.getPopup().querySelectorAll('.fitia-select-all');
            selectAllBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetId = e.target.getAttribute('data-target');
                    const container = Swal.getPopup().querySelector('#' + targetId);
                    const checkboxes = container.querySelectorAll('.pref-check');
                    
                    // Verifica si todos están marcados. Si es así, los desmarca todos. Si no, los marca todos.
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    checkboxes.forEach(cb => cb.checked = !allChecked);
                });
            });
        },
        preConfirm: () => {
            const checks = document.querySelectorAll('.pref-check:checked');
            const preferencias = Array.from(checks).map(cb => cb.value);
            const excluidos = document.getElementById('inputAlergias').value.toLowerCase().split(',').map(i => i.trim()).filter(i => i);

            if (preferencias.length === 0) {
                Swal.showValidationMessage('Por favor selecciona al menos una preferencia de alimento.');
                return false;
            }
            return { preferencias, excluidos };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { preferencias, excluidos } = result.value;

            let comidasFiltradas = baseDeComidas.filter(comida => {
                const coincidePreferencia = comida.tags.some(tag => preferencias.includes(tag));
                const tieneExcluido = excluidos.some(ex => comida.tags.includes(ex) || comida.nombre.toLowerCase().includes(ex));
                return coincidePreferencia && !tieneExcluido;
            });

            if (comidasFiltradas.length < 3) {
                Swal.fire({ icon: 'warning', title: 'Muy pocas opciones', text: 'Tus restricciones son muy altas y no hay suficientes comidas en la base de datos. Selecciona más opciones de alimentos.' });
                return;
            }

            let diasHTML = '';
            for (let i = 1; i <= 5; i++) {
                let comidasMezcladas = comidasFiltradas.sort(() => 0.5 - Math.random());
                let comidasDelDia = comidasMezcladas.slice(0, 3); 
                
                diasHTML += `
                    <div style="background: #f4f9f4; padding: 12px; margin-bottom: 12px; border-radius: 10px; border-left: 4px solid #27ae60;">
                        <h6 style="color: #27ae60; margin: 0 0 8px 0; font-size: 1rem;"><i class="fa-regular fa-calendar"></i> Día ${i}</h6>
                        <ul style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #636e72;">
                            <li style="margin-bottom: 4px;">${comidasDelDia[0].nombre}</li>
                            <li style="margin-bottom: 4px;">${comidasDelDia[1].nombre}</li>
                            <li style="margin-bottom: 4px;">${comidasDelDia[2].nombre}</li>
                        </ul>
                    </div>
                `;
            }

            Swal.fire({
                title: `Plan Generado: ${objetivo}`,
                html: `
                    <div class="recom-modal-content" style="max-height: 50vh; overflow-y: auto; padding-right: 10px; text-align: left;">
                        <h5><i class="fa-solid fa-utensils"></i> Tu Menú Personalizado de 5 Días</h5>
                        ${diasHTML}
                        
                        <h5 style="margin-top: 20px;"><i class="fa-solid fa-dumbbell"></i> Enfoque</h5>
                        <p style="font-size: 0.9rem;">Tus porciones y tipo de entrenamiento deben estar alineados a tu meta de <b>${objetivo}</b>. Escucha a tu cuerpo.</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: '¡A darle!',
                confirmButtonColor: '#27ae60',
                width: '600px'
            });
        }
    });
};window.abrirRecomendaciones = (objetivo) => {
    Swal.fire({
        title: 'Arma tu Plan Ideal',
        width: '750px', // Hacemos el modal más ancho para la cuadrícula
        html: `
            <style>
                /* Estilos inspirados en la interfaz de Fitia */
                .fitia-container { text-align: left; max-height: 65vh; overflow-y: auto; overflow-x: hidden; padding-right: 10px; font-family: 'Poppins', sans-serif; color: #1a1a1a; }
                .fitia-section { margin-bottom: 25px; }
                .fitia-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
                .fitia-title { font-size: 1.1rem; font-weight: 600; margin: 0; }
                .fitia-subtitle { font-size: 0.8rem; color: #666; margin: 0; display: block; }
                
                /* Botón de Seleccionar todo */
                .fitia-select-all { font-size: 0.85rem; font-weight: 600; color: #1a1a1a; cursor: pointer; border: none; background: none; padding: 0; transition: color 0.2s; }
                .fitia-select-all:hover { color: #27ae60; text-decoration: underline; }
                
                .fitia-grid { display: flex; flex-wrap: wrap; gap: 10px; }
                
                /* Magia CSS: Ocultar el checkbox real y diseñar el Label */
                .fitia-checkbox { display: none; }
                
                .fitia-label { 
                    display: inline-flex; align-items: center; gap: 8px; 
                    background-color: #f0efe9; color: #1a1a1a; 
                    padding: 10px 16px; border-radius: 12px; 
                    cursor: pointer; font-size: 0.95rem; font-weight: 500; 
                    border: 2px solid transparent; transition: all 0.2s ease; 
                    user-select: none;
                }
                .fitia-label:hover { background-color: #e6e4db; }
                
                /* Estado Activo/Seleccionado */
                .fitia-checkbox:checked + .fitia-label { 
                    background-color: #e6e4db; 
                    border-color: #27ae60; 
                }
            </style>

            <div class="fitia-container">
                
                <!-- CATEGORÍA 1: PROTEÍNAS -->
                <div class="fitia-section">
                    <div class="fitia-header">
                        <div><h3 class="fitia-title">Proteínas</h3></div>
                        <button type="button" class="fitia-select-all" data-target="grid-prot">Seleccionar todo</button>
                    </div>
                    <div class="fitia-grid" id="grid-prot">
                        <input type="checkbox" id="p_pollo" class="fitia-checkbox pref-check" value="pollo" checked>
                        <label for="p_pollo" class="fitia-label">🍗 Pollo</label>

                        <input type="checkbox" id="p_carne" class="fitia-checkbox pref-check" value="res" checked>
                        <label for="p_carne" class="fitia-label">🥩 Carne</label>
                        
                        <input type="checkbox" id="p_pescado" class="fitia-checkbox pref-check" value="pescado">
                        <label for="p_pescado" class="fitia-label">🐟 Pescado</label>
                        
                        <input type="checkbox" id="p_atun" class="fitia-checkbox pref-check" value="atun">
                        <label for="p_atun" class="fitia-label">🥫 Atún</label>

                        <input type="checkbox" id="p_huevo" class="fitia-checkbox pref-check" value="huevo" checked>
                        <label for="p_huevo" class="fitia-label">🍳 Huevo</label>

                        <input type="checkbox" id="p_pavo" class="fitia-checkbox pref-check" value="pavo">
                        <label for="p_pavo" class="fitia-label">🦃 Pavo</label>

                        <input type="checkbox" id="p_cerdo" class="fitia-checkbox pref-check" value="cerdo">
                        <label for="p_cerdo" class="fitia-label">🥓 Cerdo</label>

                        <input type="checkbox" id="p_tofu" class="fitia-checkbox pref-check" value="vegetariano">
                        <label for="p_tofu" class="fitia-label">🥗 Tofu / Soya</label>
                    </div>
                </div>

                <!-- CATEGORÍA 2: CARBOHIDRATOS -->
                <div class="fitia-section">
                    <div class="fitia-header">
                        <div>
                            <h3 class="fitia-title">Carbohidratos</h3>
                            <span class="fitia-subtitle">Elige tus favoritos</span>
                        </div>
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

                        <input type="checkbox" id="c_garbanzo" class="fitia-checkbox pref-check" value="garbanzos">
                        <label for="c_garbanzo" class="fitia-label">🥙 Garbanzos</label>

                        <input type="checkbox" id="c_pasta" class="fitia-checkbox pref-check" value="pasta">
                        <label for="c_pasta" class="fitia-label">🍝 Pasta</label>

                        <input type="checkbox" id="c_avena" class="fitia-checkbox pref-check" value="avena">
                        <label for="c_avena" class="fitia-label">🥣 Avena</label>

                        <input type="checkbox" id="c_pan" class="fitia-checkbox pref-check" value="pan">
                        <label for="c_pan" class="fitia-label">🍞 Pan</label>

                        <input type="checkbox" id="c_tortilla" class="fitia-checkbox pref-check" value="tortilla" checked>
                        <label for="c_tortilla" class="fitia-label">🌮 Tortilla</label>
                        
                        <input type="checkbox" id="c_elote" class="fitia-checkbox pref-check" value="elote">
                        <label for="c_elote" class="fitia-label">🌽 Elote / Choclo</label>
                    </div>
                </div>

                <!-- CATEGORÍA 3: GRASAS & LÁCTEOS -->
                <div class="fitia-section">
                    <div class="fitia-header">
                        <div><h3 class="fitia-title">Grasas & Lácteos</h3></div>
                        <button type="button" class="fitia-select-all" data-target="grid-grasas">Seleccionar todo</button>
                    </div>
                    <div class="fitia-grid" id="grid-grasas">
                        <input type="checkbox" id="g_aguacate" class="fitia-checkbox pref-check" value="aguacate" checked>
                        <label for="g_aguacate" class="fitia-label">🥑 Palta / Aguacate</label>

                        <input type="checkbox" id="g_nueces" class="fitia-checkbox pref-check" value="nueces">
                        <label for="g_nueces" class="fitia-label">🥜 Nueces / Maní</label>

                        <input type="checkbox" id="g_lacteos" class="fitia-checkbox pref-check" value="lacteos">
                        <label for="g_lacteos" class="fitia-label">🥛 Leche / Yogurt</label>

                        <input type="checkbox" id="g_queso" class="fitia-checkbox pref-check" value="lacteos">
                        <label for="g_queso" class="fitia-label">🧀 Queso</label>
                    </div>
                </div>

                <p style="margin-bottom: 5px; font-weight: 600;">¿Algo que no te guste o alergias? (Opcional):</p>
                <input type="text" id="inputAlergias" class="swal2-input" style="width: 100%; box-sizing: border-box; margin: 0; font-size: 0.9rem; padding: 10px;" placeholder="Ej: brócoli, chocolate, uvas...">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Generar Plan',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#27ae60',
        didOpen: () => {
            // Lógica en JavaScript para que funcionen los botones de "Seleccionar todo"
            const selectAllBtns = Swal.getPopup().querySelectorAll('.fitia-select-all');
            selectAllBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetId = e.target.getAttribute('data-target');
                    const container = Swal.getPopup().querySelector('#' + targetId);
                    const checkboxes = container.querySelectorAll('.pref-check');
                    
                    // Verifica si todos están marcados. Si es así, los desmarca todos. Si no, los marca todos.
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    checkboxes.forEach(cb => cb.checked = !allChecked);
                });
            });
        },
        preConfirm: () => {
            const checks = document.querySelectorAll('.pref-check:checked');
            const preferencias = Array.from(checks).map(cb => cb.value);
            const excluidos = document.getElementById('inputAlergias').value.toLowerCase().split(',').map(i => i.trim()).filter(i => i);

            if (preferencias.length === 0) {
                Swal.showValidationMessage('Por favor selecciona al menos una preferencia de alimento.');
                return false;
            }
            return { preferencias, excluidos };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const { preferencias, excluidos } = result.value;

            let comidasFiltradas = baseDeComidas.filter(comida => {
                const coincidePreferencia = comida.tags.some(tag => preferencias.includes(tag));
                const tieneExcluido = excluidos.some(ex => comida.tags.includes(ex) || comida.nombre.toLowerCase().includes(ex));
                return coincidePreferencia && !tieneExcluido;
            });

            if (comidasFiltradas.length < 3) {
                Swal.fire({ icon: 'warning', title: 'Muy pocas opciones', text: 'Tus restricciones son muy altas y no hay suficientes comidas en la base de datos. Selecciona más opciones de alimentos.' });
                return;
            }

            let diasHTML = '';
            for (let i = 1; i <= 5; i++) {
                let comidasMezcladas = comidasFiltradas.sort(() => 0.5 - Math.random());
                let comidasDelDia = comidasMezcladas.slice(0, 3); 
                
                diasHTML += `
                    <div style="background: #f4f9f4; padding: 12px; margin-bottom: 12px; border-radius: 10px; border-left: 4px solid #27ae60;">
                        <h6 style="color: #27ae60; margin: 0 0 8px 0; font-size: 1rem;"><i class="fa-regular fa-calendar"></i> Día ${i}</h6>
                        <ul style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #636e72;">
                            <li style="margin-bottom: 4px;">${comidasDelDia[0].nombre}</li>
                            <li style="margin-bottom: 4px;">${comidasDelDia[1].nombre}</li>
                            <li style="margin-bottom: 4px;">${comidasDelDia[2].nombre}</li>
                        </ul>
                    </div>
                `;
            }

            Swal.fire({
                title: `Plan Generado: ${objetivo}`,
                html: `
                    <div class="recom-modal-content" style="max-height: 50vh; overflow-y: auto; padding-right: 10px; text-align: left;">
                        <h5><i class="fa-solid fa-utensils"></i> Tu Menú Personalizado de 5 Días</h5>
                        ${diasHTML}
                        
                        <h5 style="margin-top: 20px;"><i class="fa-solid fa-dumbbell"></i> Enfoque</h5>
                        <p style="font-size: 0.9rem;">Tus porciones y tipo de entrenamiento deben estar alineados a tu meta de <b>${objetivo}</b>. Escucha a tu cuerpo.</p>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: '¡A darle!',
                confirmButtonColor: '#27ae60',
                width: '600px'
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
    if (objetivo.includes("Perder")) calorias -= 500;
    if (objetivo.includes("Aumento")) calorias += 500;
    let proteina = peso * 2.2; let grasa = peso * 0.9; 
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
            
            // INYECTAR FOTOS Y TEXTO DE PERFIL
// INYECCIÓN DE ROL PARA AUDITORÍA VISUAL
const userRole = data.rol || 'usuario';
window.userRole = userRole; // Guardamos globalmente para usarlo en otras funciones
const roleColor = userRole === 'admin' ? '#e74c3c' : '#1B4332'; 
document.getElementById('perfilNombre').innerHTML = `${data.nombre || 'Usuario'} <span style="font-size: 0.75rem; background: ${roleColor}; color: white; padding: 3px 10px; border-radius: 12px; margin-left: 10px; vertical-align: middle; letter-spacing: 1px;">${userRole.toUpperCase()}</span>`;

// CONTROL DINÁMICO DEL PANEL DE ADMINISTRACIÓN
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

            // Rellenar formularios
            if(data.nombre) document.getElementById('editNombre').value = data.nombre;
            if(data.telefono) document.getElementById('editTelefono').value = data.telefono;
            if(data.peso) document.getElementById('editPeso').value = data.peso;
            if(data.estatura) document.getElementById('editEstatura').value = data.estatura;
            if(data.edad) document.getElementById('editEdad').value = data.edad;
            if(data.genero) document.getElementById('editGenero').value = data.genero;
            if(data.actividad) document.getElementById('editActividad').value = data.actividad;
            if(data.objetivo) document.getElementById('editObjetivo').value = data.objetivo;

            actualizarDashboardDinamico(data, user.uid);
            
            // Forzar a que siempre abra en la pestaña de Perfil al iniciar sesión
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

// SUBIR FOTOS A STORAGE
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

// GUARDAR DATOS PERSONALES (CON PROTECCIÓN XSS)
document.getElementById('personalForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser; if (!user) return;
    const btn = document.getElementById('btnGuardarPersonal');
    btn.innerText = 'Guardando...';

    // 1. Filtramos (sanitizamos) lo que el usuario escribió
    const nombreSanitizado = sanitizarEntrada(document.getElementById('editNombre').value);
    const telefonoSanitizado = sanitizarEntrada(document.getElementById('editTelefono').value);

    try {
        // 2. Guardamos los datos limpios en la base de datos
        await updateDoc(doc(db, "Usuarios", user.uid), {
            nombre: nombreSanitizado,
            telefono: telefonoSanitizado
        });

        // 3. Volvemos a leer el documento para mantener tu etiqueta de Rol visualmente intacta
        const docSnap = await getDoc(doc(db, "Usuarios", user.uid));
        const data = docSnap.data();
        const userRole = data.rol || 'usuario';
        const roleColor = userRole === 'admin' ? '#e74c3c' : '#1B4332'; 

        // 4. Actualizamos la interfaz
        document.getElementById('perfilNombre').innerHTML = `${nombreSanitizado} <span style="font-size: 0.75rem; background: ${roleColor}; color: white; padding: 3px 10px; border-radius: 12px; margin-left: 10px; vertical-align: middle; letter-spacing: 1px;">${userRole.toUpperCase()}</span>`;
        document.getElementById('perfilTelefono').innerHTML = `<i class="fa-solid fa-phone"></i> ${telefonoSanitizado}`;
        document.getElementById('navProfileText').innerText = nombreSanitizado.split(' ')[0];

        Swal.fire({ icon: 'success', title: 'Datos actualizados', timer: 1500, showConfirmButton: false });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron guardar los datos.' });
    } finally { btn.innerText = 'Actualizar Perfil'; }
});

// GUARDAR SALUD
document.getElementById('healthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser; if (!user) return;
    const btnGuardar = document.getElementById('btnGuardarSalud');
    btnGuardar.innerText = 'Calculando...';

    const nuevosDatos = {
        genero: document.getElementById('editGenero').value,
        edad: parseFloat(document.getElementById('editEdad').value),
        peso: parseFloat(document.getElementById('editPeso').value),
        estatura: parseFloat(document.getElementById('editEstatura').value),
        actividad: document.getElementById('editActividad').value,
        objetivo: document.getElementById('editObjetivo').value
    };

    try {
        await updateDoc(doc(db, "Usuarios", user.uid), nuevosDatos);
        const docSnap = await getDoc(doc(db, "Usuarios", user.uid));
        actualizarDashboardDinamico(docSnap.data(), user.uid);
        Swal.fire({ icon: 'success', title: '¡Plan Generado!', timer: 1500, showConfirmButton: false });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.' });
    } finally { btnGuardar.innerText = 'Calcular Mis Macros'; }
});

// CARRITO DE COMPRAS
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

// AUTENTICACIÓN RESTANTE
// AUTENTICACIÓN RESTANTE CON TÉRMINOS Y CONDICIONES
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
            // MODAL DE TÉRMINOS Y CONDICIONES
            const { value: accept } = await Swal.fire({
                title: 'Términos y Condiciones',
                html: `
                    <div style="text-align: left; max-height: 280px; overflow-y: auto; font-size: 0.85rem; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; color: #2d3436; line-height: 1.5;">
                        <p><b>TÉRMINOS Y CONDICIONES DE USO DE NUTRIFIT</b></p>
                        <p><i>Última actualización: Junio de 2026</i></p>
                        <p>Bienvenido a NutriFit. Al registrarse y utilizar esta plataforma, el usuario acepta los presentes Términos y Condiciones. Si no está de acuerdo con ellos, deberá abstenerse de utilizar el servicio.</p>
                        <br>
                        <p><b>1. Objeto del Servicio</b><br>NutriFit es una plataforma web diseñada para proporcionar información relacionada con hábitos saludables, alimentación, nutrición y seguimiento personal de objetivos de bienestar.</p>
                        <br>
                        <p><b>2. Registro de Usuario</b><br>Para acceder a determinadas funciones, el usuario deberá crear una cuenta proporcionando información verídica y actualizada. El usuario es responsable de mantener la confidencialidad de su contraseña, proteger el acceso a su cuenta y notificar cualquier uso no autorizado de la misma.</p>
                        <br>
                        <p><b>3. Uso Adecuado de la Plataforma</b><br>El usuario se compromete a utilizar la plataforma de manera responsable y legal, no proporcionar información falsa o engañosa, no realizar actividades que puedan afectar el funcionamiento del sistema y no intentar acceder a información de otros usuarios sin autorización.</p>
                        <br>
                        <p><b>4. Información de Salud y Nutrición</b><br>La información proporcionada por NutriFit tiene fines exclusivamente informativos y educativos. NutriFit no sustituye la atención médica profesional, nutricional o psicológica. Antes de realizar cambios importantes en la alimentación o actividad física, se recomienda consultar a un profesional de la salud.</p>
                        <br>
                        <p><b>5. Protección de Datos Personales</b><br>Los datos personales proporcionados por el usuario serán utilizados únicamente para el funcionamiento de la plataforma y la mejora de los servicios ofrecidos. NutriFit se compromete a proteger la información personal conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</p>
                        <br>
                        <p><b>6. Disponibilidad del Servicio</b><br>Aunque se realizarán esfuerzos razonables para mantener la plataforma disponible, NutriFit no garantiza que el servicio esté libre de interrupciones, errores o fallos técnicos.</p>
                        <br>
                        <p><b>7. Propiedad Intelectual</b><br>Todo el contenido de la plataforma, incluyendo textos, imágenes, logotipos, diseños y software, es propiedad de NutriFit o de sus respectivos titulares y se encuentra protegido por las leyes de propiedad intelectual. Queda prohibida su reproducción, distribución o modificación sin autorización previa.</p>
                        <br>
                        <p><b>8. Limitación de Responsabilidad</b><br>NutriFit no será responsable por daños directos o indirectos derivados del uso de la plataforma, incluyendo decisiones tomadas por el usuario con base en la información proporcionada.</p>
                        <br>
                        <p><b>9. Modificaciones</b><br>NutriFit podrá actualizar o modificar estos términos y condiciones en cualquier momento. Los cambios serán publicados en la plataforma y entrarán en vigor desde su publicación.</p>
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
                    // Validar que la casilla esté marcada antes de dejarlo avanzar
                    const isChecked = Swal.getPopup().querySelector('#termsCheckbox').checked;
                    if (!isChecked) {
                        Swal.showValidationMessage('Debes marcar la casilla para aceptar los términos y continuar.');
                        return false;
                    }
                    return true;
                }
            });

            // Si el usuario marcó la casilla y le dio a Aceptar, procedemos a registrarlo en Firebase
            if (accept) {
                await registrarUsuario(auth, db, email, password, document.getElementById('nombre').value, document.getElementById('telefono').value);
                window.toggleForm(); 
                document.getElementById('authForm').reset(); 
                grecaptcha.reset();
            }
        } else { 
            // Si el usuario ya tiene cuenta y solo está iniciando sesión, entra directo
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

// ==========================================
// MECANISMO: PANEL DE ADMINISTRACIÓN (RBAC)
// ==========================================
window.abrirPanelAdmin = async () => {
    // Cerramos el menú desplegable para mejorar la experiencia visual
    document.getElementById('profileDropdown').classList.remove('active');
    
    Swal.fire({
        title: 'Abriendo Panel...',
        text: 'Consultando registros en la base de datos NoSQL...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        // Consultamos la colección completa de Usuarios en Firestore
        const querySnapshot = await getDocs(collection(db, "Usuarios"));
        
        // Construimos una tabla HTML estilizada que combine con el tema verde oscuro
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

        // Desplegamos el Panel de Administración en pantalla
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

// ==========================================
// VENTANAS EMERGENTES (MODALS) DE SERVICIOS
// ==========================================
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
