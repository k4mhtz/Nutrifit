// Importaciones de Firebase v12.10.0 (Con Storage para fotos)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
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

// Lógica de cálculo estricta estilo Fitia
function actualizarDashboardDinamico(data, userId) {
    const macroResultados = document.getElementById('macroResultados');
    const btnRecomendaciones = document.getElementById('btnVerRecomendaciones');
    const dashboardDinamico = document.getElementById('dashboardDinamico');
    const mensajeCompletar = document.getElementById('mensajeCompletarDatos');

    if (dashboardDinamico && mensajeCompletar) {
        if(data.peso && data.estatura && data.edad && data.genero && data.actividad && data.objetivo) {
            mensajeCompletar.style.display = 'none';
            dashboardDinamico.style.display = 'block';

            const macros = calcularMacros(data.peso, data.estatura, data.edad, data.genero, data.actividad, data.objetivo);
            if (macroResultados) {
                // SEGURIDAD XSS: Inyección modular controlada por variables numéricas sanitizadas
                macroResultados.innerHTML = `
                <div class="macro-container">
                    <h4>Distribución Diaria Ideal</h4>
                    <div class="calorias-totales">${macros.cal} <span>kcal</span></div>
                    <div class="macro-grid">
                        <div class="macro-box"><span style="color:#3498db;">${macros.car}g</span><small>Carbos</small></div>
                        <div class="macro-box"><span style="color:#e74c3c;">${macros.pro}g</span><small>Proteína</small></div>
                        <div class="macro-box"><span style="color:#f1c40f;">${macros.gra}g</span><small>Grasas</small></div>
                    </div>
                </div>`;
            }
            if (btnRecomendaciones) {
                btnRecomendaciones.style.display = 'flex';
                btnRecomendaciones.onclick = () => window.abrirRecomendaciones(data.objetivo);
            }
        } else {
            mensajeCompletar.style.display = 'block';
            dashboardDinamico.style.display = 'none';
        }
    }
}

function calcularMacros(peso, estatura, edad, genero, actividad, objetivo) {
    // Fórmula de Mifflin-St Jeor
    let tmb = (genero === 'M') ? (10 * peso) + (6.25 * estatura) - (5 * edad) + 5 : (10 * peso) + (6.25 * estatura) - (5 * edad) - 161;
    let calorias = tmb * parseFloat(actividad);
    if (objetivo.includes("Perder")) calorias -= 400;
    if (objetivo.includes("Aumento")) calorias += 400;
    
    let proteina = peso * 2; 
    let grasa = peso * 0.8; 
    let carbs = (calorias - ((proteina * 4) + (grasa * 9))) / 4;
    return { cal: Math.round(calorias), pro: Math.round(proteina), gra: Math.round(grasa), car: Math.round(carbs > 0 ? carbs : 0) };
}

// CONTROL DE CAMBIO DE ESTADO SEGURO
onAuthStateChanged(auth, async (user) => {
    const authContainer = document.getElementById('authContainer');
    const userProfile = document.getElementById('userProfile');

    if (user && user.emailVerified) { 
        window.usuarioLogueado = true; 
        if (authContainer) authContainer.style.display = 'none';
        if (userProfile) userProfile.style.display = 'block';
        
        const docSnap = await getDoc(doc(db, "Usuarios", user.uid));
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // SEGURIDAD MITIGACIÓN XSS: Uso exclusivo de .innerText para evitar la renderización de código scripts maliciosos
            if (document.getElementById('perfilNombre')) document.getElementById('perfilNombre').innerText = data.nombre || 'Usuario';
            if (document.getElementById('perfilEmail')) document.getElementById('perfilEmail').innerText = user.email;
            if (document.getElementById('dropdownNombre')) document.getElementById('dropdownNombre').innerText = data.nombre || 'Mi Perfil';
            if (document.getElementById('navProfileText')) document.getElementById('navProfileText').innerText = data.nombre ? data.nombre.split(' ')[0] : 'Perfil';

            const urlAvatar = data.fotoPerfil || `https://ui-avatars.com/api/?name=${data.nombre ? data.nombre.split(' ')[0] : 'U'}&background=27ae60&color=fff&bold=true`;
            if (document.getElementById('avatarImg')) document.getElementById('avatarImg').src = urlAvatar;
            if (document.getElementById('navAvatarImg')) document.getElementById('navAvatarImg').src = urlAvatar;

            actualizarDashboardDinamico(data, user.uid);
        }
    } else {
        window.usuarioLogueado = false; 
        if (authContainer) authContainer.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
        if (document.getElementById('navAvatarImg')) document.getElementById('navAvatarImg').src = 'https://ui-avatars.com/api/?name=User&background=bdc3c7&color=fff';
        if (document.getElementById('navProfileText')) document.getElementById('navProfileText').innerText = 'Ingresar';
    }
});

// CALCULO EXCLUSIVO IMC DE LA LANDING (SANITIZADO)
window.calcularIMCExclusivo = () => {
    const peso = parseFloat(document.getElementById('imcPeso').value);
    const estatura = parseFloat(document.getElementById('imcEstatura').value) / 100;
    const contenedor = document.getElementById('imcResultado');

    if(!peso || !estatura) {
        Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Por favor, llena los parámetros requeridos.' });
        return;
    }

    const imc = (peso / (estatura * estatura)).toFixed(1);
    contenedor.style.display = "block";
    
    // Sanitización condicional por medio de texto plano (.innerText)
    if(imc < 18.5) { contenedor.innerText = `Tu IMC es ${imc} - Bajo Peso`; contenedor.className = "imc-resultado imc-alerta"; }
    else if(imc >= 18.5 && imc <= 24.9) { contenedor.innerText = `Tu IMC es ${imc} - Peso Saludable`; contenedor.className = "imc-resultado imc-normal"; }
    else { contenedor.innerText = `Tu IMC es ${imc} - Sobrepeso u Obesidad`; contenedor.className = "imc-resultado imc-peligro"; }
};

// AUTENTICACIÓN CON CONTROL DE FORMULARIO DE ACCESO Y RECAPTCHA
if (document.getElementById('authForm')) {
    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Mitigación Fuerza Bruta: Verificación obligatoria de reCAPTCHA en el cliente
        const recaptchaResponse = grecaptcha.getResponse();
        if (recaptchaResponse.length === 0) { 
            Swal.fire({ icon: 'warning', title: 'Verificación de Seguridad', text: 'Por favor confirma que no eres un robot.' }); 
            return; 
        }

        const email = document.getElementById('identificador').value;
        const password = passInput.value;
        const btnAction = document.getElementById('btnAction');
    
        if (!isLogin && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) { 
            Swal.fire({ icon: 'warning', title: 'Contraseña no segura', text: 'Asegúrate de cumplir con las directivas de seguridad solicitadas.' }); 
            return; 
        }
        
        if (btnAction) { btnAction.disabled = true; btnAction.innerText = 'Procesando...'; }
    
        try {
            if (!isLogin) {
                // MODAL EXCLUSIVO TÉRMINOS Y CONDICIONES (Aviso de Privacidad LFPDPPP de NutriFit)
                const { value: accept } = await Swal.fire({
                    title: 'Términos y Condiciones de Uso',
                    html: `
                        <div style="text-align: left; max-height: 200px; overflow-y: auto; font-size: 0.8rem; padding: 10px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; color: #2d3436; line-height: 1.4;">
                            <p><b>AVISO DE PRIVACIDAD Y PROTECCIÓN DE DATOS PERSONALES</b></p>
                            <p>NutriFit protege los datos personales recopilados conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). Al aceptar los términos, autorizas el tratamiento automatizado de tus datos con fines de cálculo nutricional e hidratación.</p>
                        </div>
                        <div style="text-align: left; display: flex; align-items: flex-start; gap: 8px; margin-top: 10px;">
                            <input type="checkbox" id="termsCheckbox" style="margin-top: 3px; cursor: pointer;">
                            <label for="termsCheckbox" style="font-size: 0.85rem; cursor: pointer; color: #2d3436;">Acepto los Términos de Uso y Políticas de Criptografía de NutriFit.</label>
                        </div>`,
                    showCancelButton: true,
                    confirmButtonText: 'Registrarme',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#27ae60',
                    cancelButtonColor: '#e74c3c',
                    preConfirm: () => {
                        const isChecked = Swal.getPopup().querySelector('#termsCheckbox').checked;
                        if (!isChecked) { Swal.showValidationMessage('Es obligatorio aceptar las casillas de protección de datos.'); return false; }
                        return true;
                    }
                });
    
                if (accept) {
                    await registrarUsuario(auth, db, email, password, document.getElementById('nombre').value, document.getElementById('telefono').value);
                    window.toggleForm(); 
                    document.getElementById('authForm').reset(); 
                }
            } else { 
                await loguearUsuario(auth, email, password); 
            }
        } catch (error) { 
            if (error.message !== "Email no verificado") Swal.fire({ icon: 'error', title: 'Fallo de Autenticación', text: 'Credenciales inválidas.' }); 
        } finally { 
            grecaptcha.reset();
            if (btnAction) { btnAction.disabled = false; btnAction.innerText = isLogin ? 'Acceder' : 'Registrarme'; }
        }
    });
}

window.toggleForm = () => {
    isLogin = !isLogin;
    if (document.getElementById('formTitle')) document.getElementById('formTitle').innerText = isLogin ? "Bienvenido" : "Crea tu Cuenta";
    if (document.getElementById('btnAction')) document.getElementById('btnAction').innerText = isLogin ? "Acceder" : "Registrarme";
    if (document.getElementById('toggleMsg')) document.getElementById('toggleMsg').innerHTML = isLogin ? '¿No tienes cuenta? <span onclick="toggleForm()">Regístrate</span>' : '¿Ya tienes cuenta? <span onclick="toggleForm()">Inicia sesión</span>';
    if (document.getElementById('groupNombre')) document.getElementById('groupNombre').style.display = isLogin ? 'none' : 'block';
    if (document.getElementById('groupTelefono')) document.getElementById('groupTelefono').style.display = isLogin ? 'none' : 'block';
    if (passReqsList) passReqsList.style.display = isLogin ? 'none' : 'block';
    if (document.getElementById('forgotPassText')) document.getElementById('forgotPassText').style.display = isLogin ? 'block' : 'none';
    passInput.value = ''; grecaptcha.reset(); 
};

if (toggleEye) {
    toggleEye.addEventListener('click', () => { passInput.type = passInput.type === 'password' ? 'text' : 'password'; toggleEye.classList.toggle('fa-eye-slash'); toggleEye.classList.toggle('fa-eye'); });
}

if (passInput) {
    passInput.addEventListener('input', (e) => {
        if (isLogin) return; const val = e.target.value;
        val.length >= 8 ? reqLength.className = 'valid' : reqLength.className = '';
        /[A-Z]/.test(val) ? reqUpper.className = 'valid' : reqUpper.className = '';
        /[0-9]/.test(val) ? reqNumber.className = 'valid' : reqNumber.className = '';
    });
}

if (document.getElementById('forgotPassText')) {
    document.getElementById('forgotPassText').addEventListener('click', () => { recuperarPassword(auth, document.getElementById('identificador').value); });
}
window.logout = () => signOut(auth).then(() => location.reload());

// ANIMACIÓN DE CONTADORES DE LA LANDING PAGE
const counters = document.querySelectorAll('.counter');
const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { counters.forEach(counter => { const target = +counter.getAttribute('data-target'); const updateCount = () => { const count = +counter.innerText; const inc = target / 100; if (count < target) { counter.innerText = Math.ceil(count + inc); setTimeout(updateCount, 15); } else { counter.innerText = target + (target === 100 ? '%' : '+'); } }; updateCount(); }); observer.disconnect(); } }); });
if(document.getElementById('stats')) observer.observe(document.getElementById('stats'));

document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const answer = question.nextElementSibling; const icon = question.querySelector('i');
        if (answer.style.maxHeight) { answer.style.maxHeight = null; icon.classList.replace('fa-chevron-up', 'fa-chevron-down'); } 
        else { answer.style.maxHeight = answer.scrollHeight + \"px\"; icon.classList.replace('fa-chevron-down', 'fa-chevron-up'); }
    });
});

// GUARDAR CAMPOS FORMULARIO SALUD DE FORMA DINÁMICA EN FIRESTORE
if (document.getElementById('healthForm')) {
    document.getElementById('healthForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser; if (!user) return;
        const btnGuardar = document.getElementById('btnGuardarSalud');
        if (btnGuardar) btnGuardar.innerText = 'Calculando...';
    
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
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la información.' });
        } finally { if (btnGuardar) btnGuardar.innerText = 'Calcular Mis Macros'; }
    });
}
