// pagina/js/habitos.js
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// Burbujas de texto dinámicas según los vasos
const burbujasAgua = [
    "¡Tengo sed! Necesito mi primer vaso.",
    "Glug glug... ¡Qué rico! Dame otro.",
    "¡Excelente! El agua acelera tu metabolismo.",
    "¡Ya ando a la mitad! Dame fuerza.",
    "Siento el poder de la hidratación.",
    "¡Un poco más y seremos invencibles!",
    "¡Estoy por explotar de energía!",
    "¡Misión cumplida por hoy! Gracias crack."
];

export const configurarAgua = (db, userId, vasosActuales = 0, rachaActual = 0, ultimaFecha = '') => {
    let vasos = vasosActuales;
    let racha = rachaActual;

    // Encendemos el widget flotante en el inicio
    document.getElementById('mascotaWidget').style.display = 'block';

    const btnMascota = document.getElementById('btnMascotaAgua');
    const gotaVisual = document.getElementById('gotaAnimada');
    const mensajeEl = document.getElementById('mascotaMensaje');
    const vasosEl = document.getElementById('mascotaVasos');

    // Lógica para reiniciar el contador si es un día nuevo
    const hoy = new Date().toLocaleDateString();
    if (ultimaFecha !== hoy && ultimaFecha !== '') {
        const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
        if (ultimaFecha !== ayer.toLocaleDateString() || vasos < 8) { racha = 0; } // Castigo
        vasos = 0; // Reinicio diario
    }

    // Sistema de vestimenta (Cambio de Color por Racha)
    const actualizarColorGota = () => {
        gotaVisual.classList.remove('gota-cool', 'gota-dios');
        if (racha >= 7) gotaVisual.classList.add('gota-dios'); // Color Dorado + Brillo
        else if (racha >= 3) gotaVisual.classList.add('gota-cool'); // Color Turquesa
    };

    // Actualizar la Burbuja de Texto y la UI
    const actualizarUI = () => {
        vasosEl.innerText = vasos;
        actualizarColorGota();
        
        // El Tamagotchi habla
        if (vasos === 8) { mensajeEl.innerText = burbujasAgua[7]; } 
        else if (vasos > 0) { mensajeEl.innerText = burbujasAgua[vasos - 1]; } 
        else { mensajeEl.innerText = "¡Hola! Dame mi primer vaso del día."; }
        
        // Forzar reiniciar la animación de la burbuja para que se note el cambio de texto
        mensajeEl.style.animation = 'none';
        mensajeEl.offsetHeight; // Truco para reiniciar animación
        mensajeEl.style.animation = 'burbujaEntrar 0.5s ease-out';
    };

    actualizarUI();

    btnMascota.onclick = async () => {
        if (vasos < 8) {
            vasos++;
            
            // Animación de "Tragar" agua
            gotaVisual.classList.add('tragar-anim');
            setTimeout(() => gotaVisual.classList.remove('tragar-anim'), 400);

            if (vasos === 8) {
                racha++;
                Swal.fire({
                    title: '¡Mascota Feliz! 🎉',
                    text: `Hidratación completada. Tu racha subió a ${racha} días y tu gota está evolucionando.`,
                    icon: 'success',
                    imageUrl: 'https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif', imageWidth: 150,
                    confirmButtonText: '¡A huevo!', confirmButtonColor: '#27ae60'
                });
            }

            actualizarUI();

            // Guardado silencioso en Firebase
            try {
                const userRef = doc(db, "Usuarios", userId);
                await updateDoc(userRef, { vasosAgua: vasos, rachaAgua: racha, ultimaFechaAgua: hoy });
            } catch (error) { console.error("Error guardando agua:", error); }
        } else {
            Swal.fire({ icon: 'info', title: '¡Tanque lleno!', text: 'Tu gota ya no puede tomar más agua por hoy.' });
        }
    };
};