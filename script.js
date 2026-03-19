AOS.init({ duration: 1000, once: true });

let isLogin = true;
const sidePanel = document.getElementById('sidePanel');
const overlay = document.getElementById('overlay');
const profileBtn = document.getElementById('profileBtn');
const closePanel = document.getElementById('closePanel');
const toggleEye = document.getElementById('togglePassword');
const passInput = document.getElementById('password');
const btnHamburguesa = document.getElementById('btnHamburguesa');

// Elementos de validación (Los que se ponen verdes)
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

// MENÚ HAMBURGUESA
let isEditing = false;
btnHamburguesa.addEventListener('click', () => {
    isEditing = !isEditing;
    document.getElementById('vistaResumen').style.display = isEditing ? 'none' : 'block';
    document.getElementById('vistaEditar').style.display = isEditing ? 'block' : 'none';
    btnHamburguesa.classList.toggle('fa-xmark');
});

// === LA PIEZA QUE FALTABA: VALIDACIÓN EN TIEMPO REAL ===
passInput.addEventListener('input', (e) => {
    if (isLogin) return; // En login no mostramos validación visual
    const val = e.target.value;
    
    // Validar longitud (8+)
    if (val.length >= 8) reqLength.classList.add('valid');
    else reqLength.classList.remove('valid');
    
    // Validar Mayúscula
    if (/[A-Z]/.test(val)) reqUpper.classList.add('valid');
    else reqUpper.classList.remove('valid');
    
    // Validar Número
    if (/[0-9]/.test(val)) reqNumber.classList.add('valid');
    else reqNumber.classList.remove('valid');
});

// CARGAR DATOS AL INICIAR
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('http://localhost:3000/api/perfil', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('authContainer').style.display = 'none';
                document.getElementById('userProfile').style.display = 'block';
                profileBtn.innerHTML = '<i class="fa-solid fa-circle-user"></i> Cuenta Activa';
                
                document.getElementById('infoResumen').innerHTML = `
                    <h3 style="margin-bottom: 5px; color:#2d3436;">Hola, ${data.nombre.split(' ')[0]}</h3>
                    <p style="font-size: 0.85rem; color:#636e72;">${data.correo}</p>
                    <div class="health-grid">
                        <div class="health-box">
                            <i class="fa-solid fa-weight-scale"></i>
                            <span>${data.peso} ${data.peso !== '--' ? 'kg' : ''}</span>
                            <small>Peso</small>
                        </div>
                        <div class="health-box">
                            <i class="fa-solid fa-ruler-vertical"></i>
                            <span>${data.estatura} ${data.estatura !== '--' ? 'cm' : ''}</span>
                            <small>Estatura</small>
                        </div>
                        <div class="health-box obj-box">
                            <i class="fa-solid fa-bullseye"></i>
                            <span>${data.objetivo}</span>
                            <small>Objetivo Actual</small>
                        </div>
                    </div>
                `;

                if(data.peso !== '--') document.getElementById('editPeso').value = data.peso;
                if(data.estatura !== '--') document.getElementById('editEstatura').value = data.estatura;
                if(data.objetivo !== 'No definido') document.getElementById('editObjetivo').value = data.objetivo;

            } else { logout(); }
        } catch (error) { console.error("Error", error); }
    }
});

// ENVIAR ACTUALIZACIÓN DE SALUD
document.getElementById('healthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const peso = document.getElementById('editPeso').value;
    const estatura = document.getElementById('editEstatura').value;
    const objetivo = document.getElementById('editObjetivo').value;
    const btnGuardar = document.getElementById('btnGuardarSalud');
    
    btnGuardar.innerText = 'Guardando...';

    try {
        const response = await fetch('http://localhost:3000/api/perfil', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ peso, estatura, objetivo })
        });

        if (response.ok) {
            Swal.fire({ icon: 'success', title: 'Actualizado', showConfirmButton: false, timer: 1500 })
            .then(() => location.reload());
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron guardar los datos.' });
            btnGuardar.innerText = 'Guardar Cambios';
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Sin conexión.' });
        btnGuardar.innerText = 'Guardar Cambios';
    }
});

function toggleForm() {
    isLogin = !isLogin;
    document.getElementById('formTitle').innerText = isLogin ? "Bienvenido" : "Crea tu Cuenta";
    document.getElementById('btnAction').innerText = isLogin ? "Acceder" : "Registrarme";
    document.getElementById('toggleMsg').innerHTML = isLogin ? '¿No tienes cuenta? <span onclick="toggleForm()">Regístrate</span>' : '¿Ya tienes cuenta? <span onclick="toggleForm()">Inicia sesión</span>';
    
    document.getElementById('groupNombre').style.display = isLogin ? 'none' : 'block';
    document.getElementById('groupTelefono').style.display = isLogin ? 'none' : 'block';
    passReqsList.style.display = isLogin ? 'none' : 'block';
    document.getElementById('forgotPassText').style.display = isLogin ? 'block' : 'none';
    document.getElementById('identificador').placeholder = isLogin ? "Email o Teléfono" : "Correo electrónico";

    // Limpiar validaciones al cambiar
    passInput.value = '';
    reqLength.classList.remove('valid');
    reqUpper.classList.remove('valid');
    reqNumber.classList.remove('valid');
}

document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnAction = document.getElementById('btnAction');
    const identificador = document.getElementById('identificador').value;
    const password = passInput.value;

    if (!isLogin) {
        // Validación final antes de enviar registro
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(password)) {
            Swal.fire({ icon: 'warning', title: 'Contraseña incompleta', text: 'Cumple los requisitos en verde.' });
            return; 
        }
    }

    let bodyData = isLogin ? { identificador, password } : { 
        nombre: document.getElementById('nombre').value, 
        email: identificador, 
        telefono: document.getElementById('telefono').value, 
        password 
    };

    btnAction.disabled = true; btnAction.innerText = 'Procesando...';
    const endpoint = isLogin ? 'http://localhost:3000/api/login' : 'http://localhost:3000/api/registro';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();

        if (response.ok) {
            if (isLogin) {
                localStorage.setItem('token', data.token);
               // location.reload();
            } else {
                Swal.fire({ icon: 'success', title: 'Registro exitoso' });
                toggleForm(); 
            }
        } else { Swal.fire({ icon: 'error', title: 'Oops...', text: data.error }); }
    } catch (error) { Swal.fire({ icon: 'error', title: 'Error', text: 'Sin conexión.' }); } 
    finally { btnAction.disabled = false; btnAction.innerText = isLogin ? 'Acceder' : 'Registrarme'; }
});

document.getElementById('forgotPassText').addEventListener('click', () => {
    Swal.fire({
        title: 'Recuperar contraseña', text: 'Ingresa tu correo o teléfono.', input: 'text', showCancelButton: true, confirmButtonText: 'Enviar'
    }).then((result) => { if (result.isConfirmed) Swal.fire('¡Enviado!', 'Recibirás instrucciones en breve.', 'success'); });
});

function logout() { localStorage.removeItem('token'); location.reload(); }