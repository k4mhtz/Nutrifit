// Importaciones de Firebase v12.10.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { configurarAgua } from './js/habitos.js';
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

// Elementos de validación
const passReqsList = document.getElementById('pass-reqs');
const reqLength = document.getElementById('req-length');
const reqUpper = document.getElementById('req-upper');
const reqNumber = document.getElementById('req-number');

// Anclamos togglePanel a window
window.togglePanel = () => { sidePanel.classList.toggle('active'); overlay.classList.toggle('active'); };

closePanel.onclick = window.togglePanel;
overlay.onclick = window.togglePanel;

// --- LÓGICA DEL MENÚ DESPLEGABLE DE PERFIL ---
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

// Navegación estilo Tabs
window.abrirSeccion = (seccion) => {
    const drop = document.getElementById('profileDropdown');
    if(drop) drop.classList.remove('active'); 
    
    if (!sidePanel.classList.contains('active')) {
        window.togglePanel();
    }

    const vistaResumen = document.getElementById('vistaResumen');
    const vistaEditar = document.getElementById('vistaEditar');

    if (seccion === 'perfil') {
        document.getElementById('panelTitle').innerText = "Mi Perfil";
        vistaResumen.style.display = 'block';
        vistaEditar.style.display = 'none';
    } else if (seccion === 'config' || seccion === 'salud') {
        document.getElementById('panelTitle').innerText = "Mis Datos de Salud";
        vistaResumen.style.display = 'none';
        vistaEditar.style.display = 'block';
    }
};

// --- Matriz de Recomendaciones Inteligentes Predefinidas (Fase 1) ---
const matrizRecomendaciones = {
    "Perder grasa": {
        comidas: [
            "Pechuga de pollo con brócoli al vapor y media taza de arroz integral.",
            "Pescado a la plancha con ensalada verde mixta (lechuga, espinaca, pepino) y aguacate.",
            "Omelette de claras de huevo con champiñones y una rebanada de pan tostado integral.",
            "Tip: Prioriza proteínas magras y verduras verdes. Reduce carbohidratos refinados."
        ],
        ejercicio: "Enfoque en entrenamiento de fuerza (pesas) 3-4 veces por semana + Cardio LISS (caminata rápida, elíptica) 30 min post-pesas.",
        suplementos: "Whey Protein (para completar proteína), Creatina (ayuda a mantener músculo en déficit), Multivitamínico."
    },
    "Aumento muscular": {
        comidas: [
            "Bistec de res magro con abundante arroz blanco, frijoles y ensalada.",
            "Licuado alto en calorías: Leche entera, avena, plátano, crema de maní y Whey protein.",
            "Pasta bolognesa con carne molida de pavo y queso parmesano.",
            "Tip: Necesitas comer más calorías de las que quemas. No saltes comidas."
        ],
        ejercicio: "Enfoque 100% en Fuerza e Hipertrofia. Sobrecarga progresiva (subir pesos semanalmente). Descansa más, haz menos cardio.",
        suplementos: "Whey Protein, Creatina (INDISPENSABLE), Ganador de Peso (solo si te cuesta mucho comer)."
    },
    "Mantenimiento": {
        comidas: [
            "Tostadas de pollo deshebrado con aguacate y crema baja en grasa.",
            "Sándwich de pavo en pan integral con queso panela y guarnición de fruta.",
            "Salmón al horno con espárragos y quinoa.",
            "Tip: Busca el equilibrio. Come variado y controla porciones sin obsesionarte."
        ],
        ejercicio: "Mezcla equilibrada de Fuerza (2-3 veces/semana) y Cardio de intensidad moderada (natación, correr, bici). Mantente activo.",
        suplementos: "Whey Protein (opcional para practicidad), Creatina, Omega 3."
    }
};

// --- Función para abrir el Modal de Recomendaciones Inteligentes ---
window.abrirRecomendaciones = (objetivo) => {
    const plan = matrizRecomendaciones[objetivo];
    if(!plan) return;

    Swal.fire({
        title: `Tu Plan Personalizado: ${objetivo}`,
        html: `
            <div class="recom-modal-content">
                <h5><i class="fa-solid fa-utensils"></i> Ejemplos de Comidas (Altas en ${objetivo === 'Aumento muscular' ? 'Carbos' : 'Proteína'})</h5>
                <ul>
                    ${plan.comidas.map(c => `<li>${c}</li>`).join('')}
                </ul>
                
                <h5><i class="fa-solid fa-dumbbell"></i> Enfoque de Entrenamiento</h5>
                <p>${plan.ejercicio}</p>
                
                <h5><i class="fa-solid fa-pills"></i> Suplementación Básica Sugerida</h5>
                <p>${plan.suplementos}</p>
                
                <p style="font-size:0.8rem; color:#b2bec3; margin-top:15px; font-style:italic;">Nota: Estas son guías generales basadas en ciencia. Consulta siempre a un profesional antes de cambios drásticos.</p>
            </div>
        `,
        icon: 'info',
        confirmButtonText: '¡Entendido, a darle!',
        confirmButtonColor: '#27ae60'
    });
};


// --- Función Maestra para Actualizar el Dashboard (Macros, Agua, Botones) ---
function actualizarDashboardDinamico(data, userId) {
    const macroResultados = document.getElementById('macroResultados');
    const habitosContainer = document.getElementById('habitosContainer');
    const btnRecomendaciones = document.getElementById('btnVerRecomendaciones');
    const dashboardDinamico = document.getElementById('dashboardDinamico');
    const mensajeCompletar = document.getElementById('mensajeCompletarDatos');

    // Verificamos si tiene datos completos para calcular
    if(data.peso && data.estatura && data.edad && data.genero && data.actividad && data.objetivo) {
        // 1. Ocultar mensaje de error y mostrar dashboard
        mensajeCompletar.style.display = 'none';
        dashboardDinamico.style.display = 'block';

        // 2. Calcular e inyectar Macros
        const macros = calcularMacros(data.peso, data.estatura, data.edad, data.genero, data.actividad, data.objetivo);
        macroResultados.innerHTML = `
            <div class="macro-container">
                <h4>Tu Meta Diaria (${data.objetivo})</h4>
                <div class="calorias-totales">${macros.cal} <span>kcal</span></div>
                <div class="macro-grid">
                    <div class="macro-box"><span style="color:#3498db;">${macros.car}g</span><small>Carbos</small></div>
                    <div class="macro-box"><span style="color:#e74c3c;">${macros.pro}g</span><small>Proteína</small></div>
                    <div class="macro-box"><span style="color:#f1c40f;">${macros.gra}g</span><small>Grasas</small></div>
                </div>
            </div>
        `;

        // 3. Configurar el Gran Botón de Recomendaciones Inteligentes
        btnRecomendaciones.style.display = 'flex';
        btnRecomendaciones.onclick = () => window.abrirRecomendaciones(data.objetivo);

        // 4. Inicializar la Gotita de Agua
        configurarAgua(db, userId, data.vasosAgua || 0, data.rachaAgua || 0, data.ultimaFechaAgua || '');            
    
    } else {
        // Mostrar mensaje para que complete datos
        mensajeCompletar.style.display = 'block';
        dashboardDinamico.style.display = 'none';
    }
}


// --- 1. ESTADÍSTICAS ANIMADAS (LANDING) ---
const counters = document.querySelectorAll('.counter');
const statsSection = document.getElementById('stats');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            counters.forEach(counter => {
                const target = +counter.getAttribute('data-target');
                const updateCount = () => {
                    const count = +counter.innerText;
                    const inc = target / 100;
                    if (count < target) {
                        counter.innerText = Math.ceil(count + inc);
                        setTimeout(updateCount, 15);
                    } else {
                        counter.innerText = target + (target === 100 ? '%' : '+');
                    }
                };
                updateCount();
            });
            observer.disconnect(); 
        }
    });
});
if(statsSection) observer.observe(statsSection);

// --- 2. FAQ ACORDEÓN ---
const faqQuestions = document.querySelectorAll('.faq-question');
faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling;
        const icon = question.querySelector('i');
        if (answer.style.maxHeight) {
            answer.style.maxHeight = null;
            icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        } else {
            answer.style.maxHeight = answer.scrollHeight + "px";
            icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
        }
    });
});

toggleEye.addEventListener('click', () => {
    if (passInput.type === 'password') {
        passInput.type = 'text'; toggleEye.classList.replace('fa-eye-slash', 'fa-eye');
    } else {
        passInput.type = 'password'; toggleEye.classList.replace('fa-eye', 'fa-eye-slash');
    }
});

// Validación contraseña registro
passInput.addEventListener('input', (e) => {
    if (isLogin) return; 
    const val = e.target.value;
    if (val.length >= 8) reqLength.classList.add('valid'); else reqLength.classList.remove('valid');
    if (/[A-Z]/.test(val)) reqUpper.classList.add('valid'); else reqUpper.classList.remove('valid');
    if (/[0-9]/.test(val)) reqNumber.classList.add('valid'); else reqNumber.classList.remove('valid');
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
    passInput.value = '';
    reqLength.classList.remove('valid'); reqUpper.classList.remove('valid'); reqNumber.classList.remove('valid');
    grecaptcha.reset(); 
};

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

// --- LÓGICA DE FIREBASE Y SEGURIDAD ---

// 1. Observador de Sesión Maestro
onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) { 
        window.usuarioLogueado = true; 
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('userProfile').style.display = 'block';
        profileBtn.innerHTML = '<i class="fa-solid fa-circle-user"></i> Cuenta Activa';
        
        const docRef = doc(db, "Usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Inyectar datos tarjeta perfil
            document.getElementById('perfilNombre').innerText = data.nombre || 'Usuario sin nombre';
            document.getElementById('perfilEmail').innerText = user.email;
            document.getElementById('perfilTelefono').innerHTML = `<i class="fa-solid fa-phone"></i> ${data.telefono || 'Sin teléfono'}`;
            const avatarUrl = data.fotoPerfil || `https://ui-avatars.com/api/?name=${data.nombre ? data.nombre.split(' ')[0] : 'User'}&background=27ae60&color=fff&bold=true`;
            document.getElementById('avatarImg').src = avatarUrl;
            if(data.fotoPortada) document.getElementById('portadaBg').style.backgroundImage = `url('${data.fotoPortada}')`;

            // Rellenar formulario oculto (para editar)
            if(data.peso) document.getElementById('editPeso').value = data.peso;
            if(data.estatura) document.getElementById('editEstatura').value = data.estatura;
            if(data.edad) document.getElementById('editEdad').value = data.edad;
            if(data.genero) document.getElementById('editGenero').value = data.genero;
            if(data.actividad) document.getElementById('editActividad').value = data.actividad;
            if(data.objetivo) document.getElementById('editObjetivo').value = data.objetivo;

            // --- AQUÍ ARREGLAMOS EL BUG ---
            // Llamamos a la función maestra que decide qué mostrar en el dashboard
            actualizarDashboardDinamico(data, user.uid);
        }
    } else {
        window.usuarioLogueado = false; 
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('userProfile').style.display = 'none';
        profileBtn.innerHTML = '<i class="fa-solid fa-circle-user"></i> Mi Perfil';
    }
});

// 2. Registro y Login
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const recaptchaResponse = grecaptcha.getResponse();
    if (recaptchaResponse.length === 0) { Swal.fire({ icon: 'warning', title: 'Verificación requerida', text: 'Por favor, confirma que no eres un robot.' }); return; }

    const email = document.getElementById('identificador').value;
    const password = passInput.value;
    const btnAction = document.getElementById('btnAction');

    if (!isLogin) {
        if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) { Swal.fire({ icon: 'warning', title: 'Contraseña débil', text: 'Cumple los requisitos.' }); return; }
    }
    btnAction.disabled = true; btnAction.innerText = 'Procesando...';

    try {
        if (!isLogin) {
            await registrarUsuario(auth, db, email, password, document.getElementById('nombre').value, document.getElementById('telefono').value);
            window.toggleForm(); document.getElementById('authForm').reset(); grecaptcha.reset();
        } else { await loguearUsuario(auth, email, password); }
    } catch (error) { 
        console.error(error); if (error.message !== "Email no verificado") { Swal.fire({ icon: 'error', title: 'Oops...', text: 'Credenciales incorrectas o cuenta inexistente.' }); }
        grecaptcha.reset(); 
    } finally { btnAction.disabled = false; btnAction.innerText = isLogin ? 'Acceder' : 'Registrarme'; }
});

// 3. Guardar Cambios Salud (ACTUALIZADO PARA CORREGIR BUG)
document.getElementById('healthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser; if (!user) return;
    const btnGuardar = document.getElementById('btnGuardarSalud');
    btnGuardar.innerText = 'Calculando...';

    // Creamos el objeto con los nuevos datos
    const nuevosDatos = {
        genero: document.getElementById('editGenero').value,
        edad: parseFloat(document.getElementById('editEdad').value),
        peso: parseFloat(document.getElementById('editPeso').value),
        estatura: parseFloat(document.getElementById('editEstatura').value),
        actividad: document.getElementById('editActividad').value,
        objetivo: document.getElementById('editObjetivo').value
    };

    try {
        // 1. Guardar en Firestore
        await updateDoc(doc(db, "Usuarios", user.uid), nuevosDatos);
        
        // 2. Traer todos los datos actuales para tener la racha de agua, etc.
        const docSnap = await getDoc(doc(db, "Usuarios", user.uid));
        const dataCompleta = docSnap.data();

        // 3. --- EL FIX MÁGICO ---
        // Actualizamos el Dashboard INMEDIATAMENTE con los nuevos datos, sin recargar página
        actualizarDashboardDinamico(dataCompleta, user.uid);
        
        // Regresamos a la vista de perfil
        window.abrirSeccion('perfil');

        Swal.fire({ icon: 'success', title: '¡Plan Generado!', text: 'Tus macros y plan ya están listos en tu perfil.', showConfirmButton: false, timer: 2000 });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron guardar los datos.' });
    } finally { btnGuardar.innerText = 'Guardar Cambios y Calcular'; }
});

document.getElementById('forgotPassText').addEventListener('click', () => { recuperarPassword(auth, document.getElementById('identificador').value); });
window.logout = () => signOut(auth).then(() => location.reload());