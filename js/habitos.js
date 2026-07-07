// pagina/js/habitos.js
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const tipsBienvenida = [
    "¡Qué onda! Un gusto verte. ¿Listos para hidratarnos?",
    "Tip: Tomar agua en ayunas limpia tu sistema digestivo.",
    "El agua es vida. ¡Échate un vasito para despertar!",
    "¡A darle! Recuerda que tu cuerpo es 70% agua.",
    "Bienvenido. Tu cerebro funciona mejor si lo mantienes hidratado."
];

const burbujasAgua = [
    "Glug glug... ¡Qué rico! Dame otro.",
    "¡Excelente! Siento cómo me recargo.",
    "¡Ya ando a la mitad! Dame fuerza.",
    "Siento el poder de la hidratación corriendo por mis venas.",
    "¡Un poco más y seremos invencibles!",
    "¡Estoy por explotar de energía!",
    "¡Misión cumplida por hoy! Gracias crack."
];

export const configurarAgua = (db, userId, vasosActuales = 0, rachaActual = 0, ultimaFecha = '') => {
    let vasos = vasosActuales;
    let racha = rachaActual;
    let timeoutBurbuja; // Controla el temporizador de los 30 seg

    const widget = document.getElementById('mascotaWidget');
    widget.style.display = 'block';

    const btnMascota = document.getElementById('btnMascotaAgua');
    const gotaVisual = document.getElementById('gotaAnimada');
    const mensajeEl = document.getElementById('mascotaMensaje');
    const vasosEl = document.getElementById('mascotaVasos');
    const gotaWrapper = document.getElementById('gotaWrapper');

    // Reinicio diario
    const hoy = new Date().toLocaleDateString();
    if (ultimaFecha !== hoy && ultimaFecha !== '') {
        const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
        if (ultimaFecha !== ayer.toLocaleDateString() || vasos < 8) { racha = 0; }
        vasos = 0;
    }

    const actualizarColorGota = () => {
        gotaVisual.classList.remove('gota-cool', 'gota-dios');
        if (racha >= 7) gotaVisual.classList.add('gota-dios');
        else if (racha >= 3) gotaVisual.classList.add('gota-cool');
    };

    // Función para mostrar texto y borrarlo a los 30s
    const mostrarMensaje = (texto) => {
        mensajeEl.innerText = texto;
        mensajeEl.style.opacity = '1';
        
        clearTimeout(timeoutBurbuja); // Reinicia el contador si hablan de nuevo
        timeoutBurbuja = setTimeout(() => {
            mensajeEl.style.opacity = '0';
        }, 30000); // 30 segundos
    };

    // Saludo inicial dinámico
    vasosEl.innerText = vasos;
    actualizarColorGota();
    if(vasos === 8) mostrarMensaje("¡Misión cumplida por hoy! Nos vemos mañana.");
    else if(vasos > 0) mostrarMensaje("¡Hey! No olvides terminar tus 8 vasos de hoy.");
    else mostrarMensaje(tipsBienvenida[Math.floor(Math.random() * tipsBienvenida.length)]);

    // ==========================================
    // LÓGICA DE ARRASTRE (DRAG & DROP)
    // ==========================================
    let isDragging = false;
    let offsetX, offsetY;

    gotaWrapper.addEventListener('mousedown', (e) => {
        isDragging = true;
        gotaVisual.classList.add('durmiendo'); // Cierra los ojos
        
        const rect = widget.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        // Limpiamos bottom y left para moverlo libremente con top y left
        widget.style.bottom = 'auto';
        widget.style.right = 'auto';
        widget.style.left = (e.clientX - offsetX) + 'px';
        widget.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            gotaVisual.classList.remove('durmiendo'); // Abre los ojos
        }
    });
    // ==========================================

    btnMascota.onclick = async () => {
        if (vasos < 8) {
            vasos++;
            vasosEl.innerText = vasos;
            actualizarColorGota();
            mostrarMensaje(burbujasAgua[vasos - 1]);

            if (vasos === 8) {
                racha++;
                Swal.fire({ title: '¡Mascota Feliz! 🎉', text: `Tu racha subió a ${racha} días.`, icon: 'success', timer: 2000, showConfirmButton: false });
            }

            try {
                const userRef = doc(db, "Usuarios", userId);
                await updateDoc(userRef, { vasosAgua: vasos, rachaAgua: racha, ultimaFechaAgua: hoy });
            } catch (error) { console.error(error); }
        } else {
            mostrarMensaje("¡Mi tanque ya está lleno por hoy! Gracias.");
        }
    };
};
