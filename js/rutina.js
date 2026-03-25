// pagina/js/rutina.js
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

export const configurarRutina = (db, userId, dataRutina = {}) => {
    const hoy = new Date().toLocaleDateString();
    
    // 1. Cargar datos: Si la fecha guardada es de HOY, cargamos las palomitas
    if (dataRutina.fechaRutina === hoy) {
        document.getElementById('task1').checked = dataRutina.task1 || false;
        document.getElementById('task2').checked = dataRutina.task2 || false;
        document.getElementById('task3').checked = dataRutina.task3 || false;
        document.getElementById('task4').checked = dataRutina.task4 || false;
    } else {
        // Si es un día nuevo, desmarcamos todo (Reset diario)
        document.getElementById('task1').checked = false;
        document.getElementById('task2').checked = false;
        document.getElementById('task3').checked = false;
        document.getElementById('task4').checked = false;
    }

    // 2. Guardar progreso al dar clic en el botón
    const btnGuardar = document.getElementById('btnGuardarRutina');
    btnGuardar.onclick = async () => {
        btnGuardar.innerText = 'Guardando...';

        const rutinaActualizada = {
            task1: document.getElementById('task1').checked,
            task2: document.getElementById('task2').checked,
            task3: document.getElementById('task3').checked,
            task4: document.getElementById('task4').checked,
            fechaRutina: hoy // Marcamos que se guardó hoy
        };

        try {
            await updateDoc(doc(db, "Usuarios", userId), { rutinaDiaria: rutinaActualizada });
            Swal.fire({
                icon: 'success', title: '¡Progreso Guardado!', 
                text: 'Tus hábitos de hoy han sido registrados.',
                timer: 1500, showConfirmButton: false
            });
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la rutina.' });
        } finally {
            btnGuardar.innerText = 'Guardar Progreso';
        }
    };
};