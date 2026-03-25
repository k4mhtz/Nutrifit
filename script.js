// Importaciones de Firebase v12.10.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { configurarAgua } from './js/habitos.js';
import { configurarRutina } from './js/rutina.js'; // <-- NUEVO CEREBRO MODULAR
import { registrarUsuario, loguearUsuario, recuperarPassword } from './autenticacion/auth.js';

// Tus credenciales oficiales
const firebaseConfig = {
    apiKey: "AIzaSyAoowzmCUuoyNQcrbEU60TknICVaA22StA",
    authDomain: "tarea-588d2.firebaseapp.com",
    projectId: "tarea-588d2",
    storageBucket: "tarea-588d2.firebasestorage.app",
    messagingSenderId: "1097872716155",
    appId: "1:1097872716155:web:b71f4a189ba2f1a993cdde",
    measurementId: "G-09ZTK2VCLG"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- LÓGICA DE INTERFAZ ---
AOS.init({ duration: 1000, once: true });

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

// Anclamos la apertura del panel
window.togglePanel = () => { sidePanel.classList.toggle('active'); overlay.classList.toggle('active'); };
profileBtn.onclick = window.togglePanel;
closePanel.onclick = window.togglePanel;
overlay.onclick = window.togglePanel;

// Lógica de Menú Hamburguesa en el Panel Original
let isEditing = false;
const btnHamburguesa = document.getElementById('btnHamburguesa');
if (btnHamburguesa) {
    btnHamburguesa.addEventListener('click', () => {
        isEditing = !isEditing;
        document.getElementById('vistaResumen').style.display = isEditing ? 'none' : 'block';
        document.getElementById('vistaEditar').style.display = isEditing ? 'block' : 'none';
        btnHamburguesa.classList.toggle('fa-xmark');
    });
}

window.usuarioLogueado = false; 

// --- Matriz de Recomendaciones Inteligentes ---
const matrizRecomendaciones = {
    "Perder grasa": { comidas: ["Pechuga de pollo con brócoli al vapor y media taza de arroz.", "Pescado a la plancha con ensalada verde mixta.", "Omelette de claras con champiñones."], ejercicio: "Fuerza (pesas) 3 veces por semana + Cardio LISS 30 min.", suplementos: "Whey Protein, Creatina." },
    "Aumento muscular": { comidas: ["Bistec de res con abundante arroz blanco y frijoles.", "Licuado: Leche, avena, plátano, crema de maní y proteína.", "Pasta bolognesa con carne molida."], ejercicio: "Enfoque 100% en Hipertrofia. Sobrecarga progresiva.", suplementos: "Whey Protein, Creatina (Indispensable)." },
    "Mantenimiento": { comidas: ["Tostadas de pollo con aguacate.", "Sándwich de pavo en pan integral.", "Salmón al horno con espárragos y quinoa."], ejercicio: "Mezcla de Fuerza y Cardio moderado.", suplementos: "Whey Protein (opcional), Omega 3." }
};

window.abrirRecomendaciones = (objetivo) => {
    const plan = matrizRecomendaciones[objetivo];
    if(!plan) return;
    Swal.fire({
        title: `Tu Plan: ${objetivo}`,
        html: `<div class="recom-modal-content"><h5><i class="fa-solid fa-utensils"></i> Ejemplos de Comidas</h5><ul>${plan.comidas.map(c => `<li>${c}</li>`).join('')}</ul><h5><i class="fa-solid fa-dumbbell"></i> Entrenamiento</h5><p>${plan.ejercicio}</p><h5><i class="fa-solid fa-pills"></i> Suplementos Sugeridos</h5><p>${plan.suplementos}</p></div>`,
        icon: 'info', confirmButtonText: '¡A darle!', confirmButtonColor: '#27ae60'
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
    
    // Inicializar los Hábitos (Agua y Rutina)
    configurarAgua(db, userId, data.vasosAgua || 0, data.rachaAgua || 0, data.ultimaFechaAgua || '');            
    configurarRutina(db, userId, data.rutinaDiaria || {}); // <-- NUEVA LLAMADA MODULAR
}

// --- FÓRMULA HARRIS-BENEDICT ---
function calcularMacros(peso, estatura, edad, genero, actividad, objetivo) {
    let tmb = (genero === 'M') ? (10 * peso) + (6.25 * estatura) - (5 * edad) + 5 : (10 * peso) + (6.25 * estatura) - (5 * edad) - 161;
    let calorias = tmb * parseFloat(actividad);
    if (objetivo.includes("Perder")) calorias -= 500;
    if (objetivo.includes("Aumento")) calorias += 500;
    let proteina = peso * 2.2; let grasa = peso * 0.9; 
    let carbs = (calorias - ((proteina * 4) + (grasa * 9))) / 4;
    return { cal: Math.round(calorias), pro: Math.round(proteina), gra: Math.round(grasa), car: Math.round(carbs > 0 ? carbs : 0) };
}

// --- OBSERVADOR DE SESIÓN MAESTRO ---
onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) { 
        window.usuarioLogueado = true; 
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('userProfile').style.display = 'block';
        
        const docSnap = await getDoc(doc(db, "Usuarios", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Inyectar datos en el diseño de cuadritos original
            document.getElementById('infoResumen').innerHTML = `
                <h3 style="margin-bottom: 5px; color:#2d3436;">Hola, ${data.nombre ? data.nombre.split(' ')[0] : 'Usuario'}</h3>
                <p style="font-size: 0.85rem; color:#636e72;">${user.email}</p>
                <div class="health-grid">
                    <div class="health-box">
                        <i class="fa-solid fa-weight-scale"></i>
                        <span>${data.peso || '--'} ${data.peso ? 'kg' : ''}</span>
                        <small>Peso</small>
                    </div>
                    <div class="health-box">
                        <i class="fa-solid fa-ruler-vertical"></i>
                        <span>${data.estatura || '--'} ${data.estatura ? 'cm' : ''}</span>
                        <small>Estatura</small>
                    </div>
                </div>
            `;
            
            // ACTUALIZAR NAVBAR
            document.getElementById('navProfileText').innerText = data.nombre ? data.nombre.split(' ')[0] : 'Mi Perfil';

            // Rellenar formularios
            if(data.peso) document.getElementById('editPeso').value = data.peso;
            if(data.estatura) document.getElementById('editEstatura').value = data.estatura;
            if(data.edad) document.getElementById('editEdad').value = data.edad;
            if(data.genero) document.getElementById('editGenero').value = data.genero;
            if(data.actividad) document.getElementById('editActividad').value = data.actividad;
            if(data.objetivo) document.getElementById('editObjetivo').value = data.objetivo;

            actualizarDashboardDinamico(data, user.uid);
        }
    } else {
        window.usuarioLogueado = false; 
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('userProfile').style.display = 'none';
        
        // NAVBAR CUANDO NO ESTÁ LOGUEADO
        document.getElementById('navProfileText').innerText = 'Mi Perfil';
    }
});

// --- GUARDAR DATOS DE SALUD ---
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
        
        // Actualizamos la tarjeta de cuadritos
        const data = docSnap.data();
        document.getElementById('infoResumen').innerHTML = `
            <h3 style="margin-bottom: 5px; color:#2d3436;">Hola, ${data.nombre ? data.nombre.split(' ')[0] : 'Usuario'}</h3>
            <p style="font-size: 0.85rem; color:#636e72;">${user.email}</p>
            <div class="health-grid">
                <div class="health-box">
                    <i class="fa-solid fa-weight-scale"></i>
                    <span>${data.peso || '--'} ${data.peso ? 'kg' : ''}</span>
                    <small>Peso</small>
                </div>
                <div class="health-box">
                    <i class="fa-solid fa-ruler-vertical"></i>
                    <span>${data.estatura || '--'} ${data.estatura ? 'cm' : ''}</span>
                    <small>Estatura</small>
                </div>
            </div>
        `;

        actualizarDashboardDinamico(data, user.uid);
        
        // Regresamos la vista al resumen simulando clic en hamburguesa
        isEditing = false;
        document.getElementById('vistaResumen').style.display = 'block';
        document.getElementById('vistaEditar').style.display = 'none';
        if (btnHamburguesa) btnHamburguesa.classList.remove('fa-xmark');

        Swal.fire({ icon: 'success', title: '¡Plan Generado!', timer: 1500, showConfirmButton: false });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar.' });
    } finally { btnGuardar.innerText = 'Calcular Mis Macros'; }
});

// --- SIMULADOR DE CARRITO DE COMPRAS ---
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

// Autenticación Restante
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
            await registrarUsuario(auth, db, email, password, document.getElementById('nombre').value, document.getElementById('telefono').value);
            window.toggleForm(); document.getElementById('authForm').reset(); grecaptcha.reset();
        } else { await loguearUsuario(auth, email, password); }
    } catch (error) { if (error.message !== "Email no verificado") Swal.fire({ icon: 'error', title: 'Oops...', text: 'Credenciales incorrectas.' }); grecaptcha.reset(); } 
    finally { btnAction.disabled = false; btnAction.innerText = isLogin ? 'Acceder' : 'Registrarme'; }
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

// Animaciones y Acordeón
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