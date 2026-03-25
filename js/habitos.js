// pagina/js/habitos.js
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const frasesMascota = [
    "¡Tengo sed! Dame mi primer vaso.",
    "¡Qué rica agua! Vamos por más.",
    "Glug glug... me siento más fuerte.",
    "¡A la mitad del camino! No te rindas.",
    "Ya casi, mi nivel de poder está subiendo.",
    "¡Un poco más y seremos invencibles!",
    "¡El último trago para la victoria!",
    "¡Estoy al 100%! Eres un crack."
];

export const configurarAgua = (db, userId, vasosActuales = 0, rachaActual = 0, ultimaFecha = '') => {
    let vasos = vasosActuales;
    let racha = rachaActual;

    // Encendemos el widget en el inicio
    document.getElementById('mascotaWidget').style.display = 'block';

    const btnMascota = document.getElementById('btnMascotaAgua');
    const avatarEl = document.getElementById('mascotaAvatar');
    const mensajeEl = document.getElementById('mascotaMensaje');
    const rachaEl = document.getElementById('mascotaRacha');
    const vasosEl = document.getElementById('mascotaVasos');

    // Lógica para quitarle la racha si no tomó agua ayer
    const hoy = new Date().toLocaleDateString();
    if (ultimaFecha !== hoy && ultimaFecha !== '') {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        if (ultimaFecha !== ayer.toLocaleDateString() || vasos < 8) {
            racha = 0; // Castigo por fallar
        }
        vasos = 0; // Nuevo día, 0 vasos
    }

    // El sistema de vestimenta (Evolución)
    const actualizarAvatar = () => {
        if (racha >= 7) avatarEl.innerHTML = '👑💧✨'; // Nivel Dios
        else if (racha >= 3) avatarEl.innerHTML = '💧😎'; // Nivel Cool
        else avatarEl.innerHTML = '💧'; // Bebé
    };

    const actualizarUI = () => {
        rachaEl.innerText = racha;
        vasosEl.innerText = vasos;
        actualizarAvatar();
        
        if (vasos === 8) {
            mensajeEl.innerText = "¡Estoy lleno por hoy! Gracias por cuidarme.";
        } else if (vasos > 0) {
            mensajeEl.innerText = frasesMascota[vasos - 1];
        } else {
            mensajeEl.innerText = "¡Hola! Soy tu mascota. Dame agua.";
        }
    };

    actualizarUI();

    btnMascota.onclick = async () => {
        if (vasos < 8) {
            vasos++;
            
            // Animación de tragar agua
            avatarEl.style.transform = "scale(1.3)";
            setTimeout(() => avatarEl.style.transform = "scale(1)", 200);

            if (vasos === 8) {
                racha++;
                avatarEl.classList.add('evolucion-anim');
                setTimeout(() => avatarEl.classList.remove('evolucion-anim'), 1000);
                
                Swal.fire({
                    title: '¡Mascota Feliz! 🎉',
                    text: `Completaste tu hidratación. Tu racha subió a ${racha} días y tu mascota está evolucionando.`,
                    icon: 'success',
                    confirmButtonText: '¡A huevo!',
                    confirmButtonColor: '#27ae60'
                });
            }

            actualizarUI();

            // Guardado silencioso en Firebase
            try {
                const userRef = doc(db, "Usuarios", userId);
                await updateDoc(userRef, { vasosAgua: vasos, rachaAgua: racha, ultimaFechaAgua: hoy });
            } catch (error) {
                console.error("Error guardando agua:", error);
            }
        } else {
            Swal.fire({ icon: 'info', title: '¡Tanque lleno!', text: 'Tu mascota ya no puede tomar más agua por hoy.' });
        }
    };
};