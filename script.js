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

// ==========================================
// DATOS COMPLETOS DE RECETAS
// ==========================================
const recetas = [
    {
        id: 0,
        titulo: 'Pechuga de Pollo a la Mostaza',
        imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600',
        stats: '280 cal | 35g proteína | 6g grasas | 0g carbos',
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
        nutricion: {
            calorias: '280 cal',
            proteina: '35g',
            carbos: '2g',
            grasas: '6g'
        }
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
        nutricion: {
            calorias: '320 cal',
            proteina: '32g',
            carbos: '0g',
            grasas: '18g'
        }
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
        nutricion: {
            calorias: '250 cal',
            proteina: '18g',
            carbos: '3g',
            grasas: '12g'
        }
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
        nutricion: {
            calorias: '300 cal',
            proteina: '38g',
            carbos: '4g',
            grasas: '8g'
        }
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
        nutricion: {
            calorias: '220 cal',
            proteina: '8g',
            carbos: '38g',
            grasas: '4g'
        }
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
        nutricion: {
            calorias: '280 cal',
            proteina: '30g',
            carbos: '15g',
            grasas: '8g'
        }
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
        nutricion: {
            calorias: '200 cal',
            proteina: '30g',
            carbos: '8g',
            grasas: '4g'
        }
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
        nutricion: {
            calorias: '190 cal',
            proteina: '15g',
            carbos: '18g',
            grasas: '6g'
        }
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
        nutricion: {
            calorias: '380 cal',
            proteina: '28g',
            carbos: '42g',
            grasas: '8g'
        }
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
        nutricion: {
            calorias: '240 cal',
            proteina: '22g',
            carbos: '28g',
            grasas: '3g'
        }
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
        nutricion: {
            calorias: '260 cal',
            proteina: '36g',
            carbos: '5g',
            grasas: '7g'
        }
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
        nutricion: {
            calorias: '180 cal',
            proteina: '20g',
            carbos: '8g',
            grasas: '7g'
        }
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
        nutricion: {
            calorias: '210 cal',
            proteina: '28g',
            carbos: '6g',
            grasas: '3g'
        }
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
        nutricion: {
            calorias: '240 cal',
            proteina: '30g',
            carbos: '28g',
            grasas: '2g'
        }
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
        nutricion: {
            calorias: '180 cal',
            proteina: '15g',
            carbos: '8g',
            grasas: '9g'
        }
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
        nutricion: {
            calorias: '310 cal',
            proteina: '42g',
            carbos: '0g',
            grasas: '14g'
        }
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
        nutricion: {
            calorias: '120 cal',
            proteina: '25g',
            carbos: '2g',
            grasas: '0g'
        }
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
        nutricion: {
            calorias: '200 cal',
            proteina: '28g',
            carbos: '10g',
            grasas: '6g'
        }
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
        nutricion: {
            calorias: '270 cal',
            proteina: '34g',
            carbos: '12g',
            grasas: '6g'
        }
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
        nutricion: {
            calorias: '280 cal',
            proteina: '22g',
            carbos: '32g',
            grasas: '5g'
        }
    }
];

// ==========================================
// FUNCIONES PARA ABRIR/CERRAR MODAL DE RECETA
// ==========================================
function abrirReceta(indice) {
    const receta = recetas[indice];
    const modal = document.getElementById('recetaModal');
    
    // Llenar datos del modal
    document.getElementById('recetaModalImg').src = receta.imagen;
    document.getElementById('recetaModalTitulo').textContent = receta.titulo;
    document.getElementById('recetaModalStats').textContent = receta.stats;
    
    // Llenar ingredientes
    const ingredientesHtml = receta.ingredientes.map(ing => `<li>${ing}</li>`).join('');
    document.getElementById('recetaModalIngredientes').innerHTML = ingredientesHtml;
    
    // Llenar pasos
    const pasosHtml = receta.pasos.map(paso => `<li>${paso}</li>`).join('');
    document.getElementById('recetaModalPasos').innerHTML = pasosHtml;
    
    // Llenar nutrición
    const nutricionHtml = `
        <div class="nutricion-item">
            <div class="nutricion-item-label">Calorías</div>
            <div class="nutricion-item-valor">${receta.nutricion.calorias}</div>
        </div>
        <div class="nutricion-item">
            <div class="nutricion-item-label">Proteína</div>
            <div class="nutricion-item-valor">${receta.nutricion.proteina}</div>
        </div>
        <div class="nutricion-item">
            <div class="nutricion-item-label">Carbos</div>
            <div class="nutricion-item-valor">${receta.nutricion.carbos}</div>
        </div>
        <div class="nutricion-item">
            <div class="nutricion-item-label">Grasas</div>
            <div class="nutricion-item-valor">${receta.nutricion.grasas}</div>
        </div>
    `;
    document.getElementById('recetaModalNutricion').innerHTML = nutricionHtml;
    
    // Mostrar modal
    modal.classList.add('active');
}

function cerrarReceta() {
    const modal = document.getElementById('recetaModal');
    modal.classList.remove('active');
}

// Exponer funciones en el scope global para que funcionen los onclick inline
window.abrirReceta = abrirReceta;
window.cerrarReceta = cerrarReceta;

// Event listeners para cerrar modal
document.addEventListener('DOMContentLoaded', () => {
    const cerrarBtn = document.getElementById('cerrarRecetaBtn');
    const modal = document.getElementById('recetaModal');
    
    if (cerrarBtn) {
        cerrarBtn.addEventListener('click', cerrarReceta);
    }
    
    // Cerrar modal al hacer clic fuera del contenido
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarReceta();
            }
        });
    }
    
    // Cerrar modal con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cerrarReceta();
        }
    });
});
