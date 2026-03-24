// pagina/js/habitos.js
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

export const configurarAgua = (db, userId, vasosActuales = 0) => {
    let vasos = vasosActuales;
    const waterCountEl = document.getElementById('waterCount');
    const btnWater = document.getElementById('btnWater');
    
    // Mostrar los vasos al cargar
    waterCountEl.innerText = vasos;

    btnWater.onclick = async () => {
        if (vasos < 8) {
            vasos++;
            waterCountEl.innerText = vasos;
            
            // Guardar en Firebase silenciosamente (sin recargar la página)
            try {
                const userRef = doc(db, "Usuarios", userId);
                await updateDoc(userRef, { vasosAgua: vasos });
            } catch (error) {
                console.error("Error al guardar agua:", error);
            }
            
            if(vasos === 8) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Meta alcanzada!',
                    text: 'Excelente trabajo tomando tus 8 vasos de agua hoy.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        }
    };
};