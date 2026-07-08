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