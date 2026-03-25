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
const btnHamburguesa = document.getElementById('btnHamburguesa');

// Elementos de validación
const passReqsList = document.getElementById('pass-reqs');
const reqLength = document.getElementById('req-length');
const reqUpper = document.getElementById('req-upper');
const reqNumber = document.getElementById('req-number');

// Anclamos togglePanel a window para que los botones del HTML lo puedan usar
window.togglePanel = () => { sidePanel.classList.toggle('active'); overlay.classList.toggle('active'); };

closePanel.onclick = window.togglePanel;
overlay.onclick = window.togglePanel;

// --- NUEVA LÓGICA DEL MENÚ DESPLEGABLE DE PERFIL ---
window.usuarioLogueado = false; // Variable global para saber si ya entró

profileBtn.onclick = (e) => {
    e.stopPropagation(); // Evita que se cierre al instante
    if (window.usuarioLogueado) {
        // Si ya inició sesión, abre el menú flotante
        document.getElementById('profileDropdown').classList.toggle('active');
    } else {
        // Si no ha iniciado, abre el panel negro para registrarse
        window.togglePanel();
    }
};

// Cierra el menú flotante si el usuario da clic en cualquier otra parte de la página
document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-menu-wrapper')) {
        const drop = document.getElementById('profileDropdown');
        if(drop) drop.classList.remove('active');
    }
});

// Navegación estilo Tabs desde el menú
window.abrirSeccion = (seccion) => {
    document.getElementById('profileDropdown').classList.remove('active'); // Oculta el menú
    
    // Abre el panel lateral si está cerrado
    if (!sidePanel.classList.contains('active')) {
        window.togglePanel();
    }

    // Traemos todas las vistas
    const vistaResumen = document.getElementById('vistaResumen');
    const vistaEditar = document.getElementById('vistaEditar');
    const infoResumen = document.getElementById('infoResumen');
    const macroResultados = document.getElementById('macroResultados');
    const habitosContainer = document.getElementById('habitosContainer');

    // Muestra u oculta dependiendo la sección elegida
    if (seccion === 'perfil') {
        document.getElementById('panelTitle').innerText = "Mi Perfil";
        vistaResumen.style.display = 'block';
        vistaEditar.style.display = 'none';
        infoResumen.style.display = 'block';
        if(macroResultados) macroResultados.style.display = 'none';
        if(habitosContainer) habitosContainer.style.display = 'none';
        
    } else if (seccion === 'salud') {
        document.getElementById('panelTitle').innerText = "Salud y Hábitos";
        vistaResumen.style.display = 'block';
        vistaEditar.style.display = 'none';
        infoResumen.style.display = 'none';
        if(macroResultados) macroResultados.style.display = 'block';
        if(habitosContainer) habitosContainer.style.display = 'block';
        
    } else if (seccion === 'config') {
        document.getElementById('panelTitle').innerText = "Actualizar Datos";
        vistaResumen.style.display = 'none';
        vistaEditar.style.display = 'block';
    }
};

// --- 1. ESTADÍSTICAS ANIMADAS AL HACER SCROLL ---
const counters = document.querySelectorAll('.counter');
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

const statsSection = document.getElementById('stats');
if(statsSection) observer.observe(statsSection);

// --- 2. FAQ ACORDEÓN INTERACTIVO ---
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

// Menú Hamburguesa (Mantenido por compatibilidad)
let isEditing = false;
btnHamburguesa.addEventListener('click', () => {
    isEditing = !isEditing;
    document.getElementById('vistaResumen').style.display = isEditing ? 'none' : 'block';
    document.getElementById('vistaEditar').style.display = isEditing ? 'block' : 'none';
    btnHamburguesa.classList.toggle('fa-xmark');
});

// Validación en tiempo real
passInput.addEventListener('input', (e) => {
    if (isLogin) return; 
    const val = e.target.value;
    if (val.length >= 8) reqLength.classList.add('valid'); else reqLength.classList.remove('valid');
    if (/[A-Z]/.test(val)) reqUpper.classList.add('valid'); else reqUpper.classList.remove('valid');
    if (/[0-9]/.test(val)) reqNumber.classList.add('valid'); else reqNumber.classList.remove('valid');
});

// Anclar toggleForm a window para que funcione en el HTML
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
    reqLength.classList.remove('valid');
    reqUpper.classList.remove('valid');
    reqNumber.classList.remove('valid');
};

// --- FUNCIÓN MATEMÁTICA PARA CALCULAR MACROS ---
function calcularMacros(peso, estatura, edad, genero, actividad, objetivo) {
    let tmb = 0;
    if (genero === 'M') {
        tmb = (10 * peso) + (6.25 * estatura) - (5 * edad) + 5;
    } else {
        tmb = (10 * peso) + (6.25 * estatura) - (5 * edad) - 161;
    }
    
    let calorias = tmb * parseFloat(actividad);
    
    if (objetivo.includes("Perder")) calorias -= 500;
    if (objetivo.includes("Aumento")) calorias += 500;
    
    let proteina = peso * 2.2; 
    let grasa = peso * 0.9; 
    let carbs = (calorias - ((proteina * 4) + (grasa * 9))) / 4;
    
    return {
        cal: Math.round(calorias),
        pro: Math.round(proteina),
        gra: Math.round(grasa),
        car: Math.round(carbs > 0 ? carbs : 0)
    };
}

// --- LÓGICA DE FIREBASE Y SEGURIDAD ---

// 1. Observador de Sesión (Cargar datos al abrir)
onAuthStateChanged(auth, async (user) => {
    // EL CANDADO MAESTRO: Si no ha verificado su correo, lo trata como no logueado
    if (user && user.emailVerified) { 
        window.usuarioLogueado = true; // Activa el menú desplegable
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('userProfile').style.display = 'block';
        profileBtn.innerHTML = '<i class="fa-solid fa-circle-user"></i> Cuenta Activa';
        
        // Cargar datos desde Firestore
        const docRef = doc(db, "Usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Inyectar datos en el nuevo diseño de perfil
            document.getElementById('perfilNombre').innerText = data.nombre || 'Usuario sin nombre';
            document.getElementById('perfilEmail').innerText = user.email;
            document.getElementById('perfilTelefono').innerHTML = `<i class="fa-solid fa-phone"></i> ${data.telefono || 'Sin teléfono'}`;
            
            // Si ya tiene foto de perfil guardada, la ponemos. Si no, generamos una con sus iniciales.
            const avatarUrl = data.fotoPerfil || `https://ui-avatars.com/api/?name=${data.nombre ? data.nombre.split(' ')[0] : 'User'}&background=27ae60&color=fff&bold=true`;
            document.getElementById('avatarImg').src = avatarUrl;
            
            // Si ya tiene portada, la ponemos. Si no, dejamos la default.
            if(data.fotoPortada) {
                document.getElementById('portadaBg').style.backgroundImage = `url('${data.fotoPortada}')`;
            }

            // Rellenar formulario oculto
            if(data.peso) document.getElementById('editPeso').value = data.peso;
            if(data.estatura) document.getElementById('editEstatura').value = data.estatura;
            if(data.edad) document.getElementById('editEdad').value = data.edad;
            if(data.genero) document.getElementById('editGenero').value = data.genero;
            if(data.actividad) document.getElementById('editActividad').value = data.actividad;
            if(data.objetivo) document.getElementById('editObjetivo').value = data.objetivo;

            // Renderizar Macros si ya tiene todos los datos completos
            if(data.peso && data.estatura && data.edad && data.genero && data.actividad && data.objetivo) {
                const macros = calcularMacros(data.peso, data.estatura, data.edad, data.genero, data.actividad, data.objetivo);
                
                document.getElementById('macroResultados').innerHTML = `
                    <div class="macro-container" onclick="mostrarRecetas('${data.objetivo}')">
                        <h4>Tu Dieta Diaria (${data.objetivo})</h4>
                        <div class="calorias-totales">
                            ${macros.cal} <span>kcal</span>
                        </div>
                        <div class="macro-grid">
                            <div class="macro-box"><span style="color:#3498db;">${macros.car}g</span><small>Carbos</small></div>
                            <div class="macro-box"><span style="color:#e74c3c;">${macros.pro}g</span><small>Proteína</small></div>
                            <div class="macro-box"><span style="color:#f1c40f;">${macros.gra}g</span><small>Grasas</small></div>
                        </div>
                        <div class="click-hint"><i class="fa-solid fa-hand-pointer"></i> Ver ejemplos de comidas</div>
                    </div>
                `;
                // Mostrar e inicializar el panel de hábitos
                document.getElementById('habitosContainer').style.display = 'block';
                configurarAgua(db, user.uid, data.vasosAgua || 0, data.rachaAgua || 0, data.ultimaFechaAgua || '');            
            }
        }
    } else {
        window.usuarioLogueado = false; // Desactiva el menú desplegable
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('userProfile').style.display = 'none';
        profileBtn.innerHTML = '<i class="fa-solid fa-circle-user"></i> Mi Perfil';
    }
});

// 2. Registro y Login (Conectado a autenticacion/auth.js)
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('identificador').value;
    const password = passInput.value;
    const btnAction = document.getElementById('btnAction');

    if (!isLogin) {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            Swal.fire({ icon: 'warning', title: 'Contraseña débil', text: 'Cumple los requisitos en verde.' });
            return; 
        }
    }

    btnAction.disabled = true; 
    btnAction.innerText = 'Procesando...';

    try {
        if (!isLogin) {
            const nombre = document.getElementById('nombre').value;
            const telefono = document.getElementById('telefono').value;
            await registrarUsuario(auth, db, email, password, nombre, telefono);
            window.toggleForm();
            document.getElementById('authForm').reset();
        } else {
            await loguearUsuario(auth, email, password);
        }
    } catch (error) { 
        console.error(error);
        if (error.message !== "Email no verificado") {
            Swal.fire({ icon: 'error', title: 'Oops...', text: 'Credenciales incorrectas o cuenta inexistente.' }); 
        }
    } finally { 
        btnAction.disabled = false; 
        btnAction.innerText = isLogin ? 'Acceder' : 'Registrarme'; 
    }
});

// 3. Actualizar Salud
document.getElementById('healthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const btnGuardar = document.getElementById('btnGuardarSalud');
    btnGuardar.innerText = 'Calculando...';

    try {
        await updateDoc(doc(db, "Usuarios", user.uid), {
            genero: document.getElementById('editGenero').value,
            edad: parseFloat(document.getElementById('editEdad').value),
            peso: parseFloat(document.getElementById('editPeso').value),
            estatura: parseFloat(document.getElementById('editEstatura').value),
            actividad: document.getElementById('editActividad').value,
            objetivo: document.getElementById('editObjetivo').value
        });
        Swal.fire({ icon: 'success', title: '¡Plan Generado!', text: 'Tus macros están listos.', showConfirmButton: false, timer: 1500 })
            .then(() => location.reload());
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron guardar los datos.' });
    } finally {
        btnGuardar.innerText = 'Guardar Cambios';
    }
});

// 4. Olvidé mi contraseña (Conectado a autenticacion/auth.js)
document.getElementById('forgotPassText').addEventListener('click', () => {
    const email = document.getElementById('identificador').value;
    recuperarPassword(auth, email);
});

// Anclar logout a window
window.logout = () => signOut(auth).then(() => location.reload());

// --- FUNCIÓN PARA MOSTRAR RECETAS DINÁMICAS ---
window.mostrarRecetas = (objetivo) => {
    let recetasHtml = '';
    if(objetivo.includes("Perder")) {
        recetasHtml = `<b>Desayuno:</b> Huevos revueltos con espinacas y 1 rebanada de pan integral.<br><br><b>Comida:</b> Pechuga de pollo a la plancha con ensalada verde y un poco de arroz.<br><br><b>Cena:</b> Atún en agua con pico de gallo y galletas habaneras.`;
    } else if(objetivo.includes("Aumento")) {
        recetasHtml = `<b>Desayuno:</b> Licuado de avena, plátano, crema de maní y leche entera.<br><br><b>Comida:</b> Bistec de res con abundante arroz, frijoles y aguacate.<br><br><b>Cena:</b> Pasta con carne molida y salsa de tomate.`;
    } else {
        recetasHtml = `<b>Desayuno:</b> Omelette de 2 huevos con jamón y fruta picada.<br><br><b>Comida:</b> Salmón o pescado empapelado con verduras al vapor y quinoa.<br><br><b>Cena:</b> Tostadas deshidratadas de pollo con aguacate y lechuga.`;
    }

    Swal.fire({
        title: 'Ejemplos para tu Dieta',
        html: `<div style="text-align: left; font-size: 0.95rem; line-height: 1.4; color: #2d3436;">${recetasHtml}</div>`,
        icon: 'info',
        confirmButtonText: '¡Entendido!',
        confirmButtonColor: '#27ae60'
    });
};