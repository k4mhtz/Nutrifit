// Importaciones de Firebase v12.10.0
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

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

// --- LÓGICA DE INTERFAZ (Tu código original) ---
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

const togglePanel = () => { sidePanel.classList.toggle('active'); overlay.classList.toggle('active'); };
profileBtn.onclick = togglePanel;
closePanel.onclick = togglePanel;
overlay.onclick = togglePanel;

toggleEye.addEventListener('click', () => {
    if (passInput.type === 'password') {
        passInput.type = 'text'; toggleEye.classList.replace('fa-eye-slash', 'fa-eye');
    } else {
        passInput.type = 'password'; toggleEye.classList.replace('fa-eye', 'fa-eye-slash');
    }
});

// Menú Hamburguesa
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
    // Fórmula Harris-Benedict
    if (genero === 'M') {
        tmb = (10 * peso) + (6.25 * estatura) - (5 * edad) + 5;
    } else {
        tmb = (10 * peso) + (6.25 * estatura) - (5 * edad) - 161;
    }
    
    let calorias = tmb * parseFloat(actividad);
    
    // Ajuste por objetivo
    if (objetivo.includes("Perder")) calorias -= 500;
    if (objetivo.includes("Aumento")) calorias += 500;
    
    let proteina = peso * 2.2; // 2.2g por kg
    let grasa = peso * 0.9; // 0.9g por kg
    let carbs = (calorias - ((proteina * 4) + (grasa * 9))) / 4;
    
    return {
        cal: Math.round(calorias),
        pro: Math.round(proteina),
        gra: Math.round(grasa),
        car: Math.round(carbs > 0 ? carbs : 0)
    };
}

// --- LÓGICA DE FIREBASE ---

// 1. Observador de Sesión (Cargar datos al abrir)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('userProfile').style.display = 'block';
        profileBtn.innerHTML = '<i class="fa-solid fa-circle-user"></i> Cuenta Activa';
        
        // Cargar datos desde Firestore
        const docRef = doc(db, "Usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Resumen Básico
            document.getElementById('infoResumen').innerHTML = `
                <h3 style="margin-bottom: 5px; color:#2d3436;">Hola, ${data.nombre.split(' ')[0]}</h3>
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
            }
        }
    } else {
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('userProfile').style.display = 'none';
        profileBtn.innerHTML = '<i class="fa-solid fa-circle-user"></i> Mi Perfil';
    }
});

// 2. Registro y Login
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('identificador').value;
    const password = passInput.value;
    const btnAction = document.getElementById('btnAction');

    if (!isLogin) {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            Swal.fire({ icon: 'warning', title: 'Contraseña incompleta', text: 'Cumple los requisitos en verde.' });
            return; 
        }
    }

    btnAction.disabled = true; 
    btnAction.innerText = 'Procesando...';

    try {
        if (!isLogin) {
            // Registro
            const nombre = document.getElementById('nombre').value;
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Guardar extra en Firestore
            await setDoc(doc(db, "Usuarios", userCredential.user.uid), {
                nombre: nombre,
                telefono: document.getElementById('telefono').value,
                peso: "", estatura: "", objetivo: "",
                fecha_registro: new Date().toISOString()
            });
            
            Swal.fire({ icon: 'success', title: 'Registro exitoso' }).then(() => {
                window.toggleForm();
                document.getElementById('authForm').reset();
            });
        } else {
            // Login
            await signInWithEmailAndPassword(auth, email, password);
            Swal.fire({ icon: 'success', title: 'Acceso correcto', showConfirmButton: false, timer: 1500 });
        }
    } catch (error) { 
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Verifica tus datos o conexión.' }); 
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

// 4. Olvidé mi contraseña
document.getElementById('forgotPassText').addEventListener('click', () => {
    Swal.fire({
        title: 'Recuperar contraseña', text: 'Esta función se conectará pronto.', icon: 'info'
    });
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