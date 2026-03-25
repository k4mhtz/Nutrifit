// pagina/js/rutina.js
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

export const configurarRutina = (db, userId, dataRutina = {}, objetivo = "") => {
    const hoy = new Date().toLocaleDateString();
    const listaTareas = document.getElementById('listaTareas');
    const btnAgregar = document.getElementById('btnAgregarTarea');
    const inputNueva = document.getElementById('inputNuevaTarea');
    const btnGuardar = document.getElementById('btnGuardarRutina');

    let tareas = [];

    // 1. CARGA INTELIGENTE
    if (dataRutina.fechaRutina === hoy && dataRutina.tareas) {
        // Ya guardó progreso hoy, cargamos exactamente como lo dejó
        tareas = dataRutina.tareas;
    } else if (dataRutina.tareas && dataRutina.tareas.length > 0) {
        // Es un día nuevo. Arrastramos sus tareas, pero las ponemos en "incompleto" (Reset)
        tareas = dataRutina.tareas.map(t => ({ ...t, completada: false }));
    } else {
        // Primera vez usando la app: ¡Recomendaciones personalizadas según su objetivo!
        if (objetivo.includes("Perder")) {
            tareas = [
                { id: 1, texto: "Respetar mi déficit calórico", completada: false },
                { id: 2, texto: "Hacer 30 min de Cardio", completada: false },
                { id: 3, texto: "Dormir 7-8 horas", completada: false }
            ];
        } else if (objetivo.includes("Aumento")) {
            tareas = [
                { id: 1, texto: "Cumplir mi meta de Proteína", completada: false },
                { id: 2, texto: "Entrenamiento de fuerza pesado", completada: false },
                { id: 3, texto: "Dormir 8 horas para recuperar", completada: false }
            ];
        } else {
            tareas = [
                { id: 1, texto: "Comer balanceado", completada: false },
                { id: 2, texto: "Caminar 10,000 pasos", completada: false },
                { id: 3, texto: "Tomar mis vitaminas/suplementos", completada: false }
            ];
        }
    }

    // 2. RENDERIZADO VISUAL
    const renderizar = () => {
        listaTareas.innerHTML = '';
        tareas.forEach(tarea => {
            const div = document.createElement('div');
            div.className = 'task-item';
            div.innerHTML = `
                <label class="task-left">
                    <input type="checkbox" class="task-check" data-id="${tarea.id}" ${tarea.completada ? 'checked' : ''}> 
                    <span>${tarea.texto}</span>
                </label>
                <button class="btn-delete-task" data-id="${tarea.id}" title="Eliminar tarea"><i class="fa-solid fa-trash"></i></button>
            `;
            listaTareas.appendChild(div);
        });

        // Evento: Marcar palomita
        document.querySelectorAll('.task-check').forEach(chk => {
            chk.addEventListener('change', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const tarea = tareas.find(t => t.id === id);
                if(tarea) tarea.completada = e.target.checked;
            });
        });

        // Evento: Borrar tarea
        document.querySelectorAll('.btn-delete-task').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                tareas = tareas.filter(t => t.id !== id);
                renderizar();
            });
        });
    };

    renderizar();

    // 3. AGREGAR TAREA NUEVA
    btnAgregar.onclick = () => {
        const texto = inputNueva.value.trim();
        if (texto !== '') {
            tareas.push({ id: Date.now(), texto: texto, completada: false });
            inputNueva.value = '';
            renderizar();
        }
    };
    
    // Permitir agregar presionando "Enter"
    inputNueva.onkeypress = (e) => {
        if (e.key === 'Enter') btnAgregar.click();
    };

    // 4. GUARDAR EN FIREBASE
    btnGuardar.onclick = async () => {
        btnGuardar.innerText = 'Guardando...';
        try {
            await updateDoc(doc(db, "Usuarios", userId), { 
                rutinaDiaria: {
                    fechaRutina: hoy,
                    tareas: tareas
                }
            });
            Swal.fire({
                icon: 'success', title: '¡Progreso Guardado!', 
                text: 'Tus hábitos de hoy han sido registrados.',
                timer: 1500, showConfirmButton: false
            });
        } catch (error) {
            console.error(error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la rutina.' });
        } finally {
            btnGuardar.innerText = 'Guardar Progreso de Hoy';
        }
    };
};