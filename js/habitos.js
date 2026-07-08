}

/* =========================================================
   NUEVO DISEÑO MASCOTA GAMIFICADA (TAMAGOTCHI WATER)
   DISEÑO GOTA 2.0 (ARRASTRABLE, CON CARA Y FORMA REAL)
========================================================= */

/* 1. CONTENEDOR PRINCIPAL FLOTANTE */
.mascota-container {
position: fixed; bottom: 30px; left: 30px; 
    z-index: 1000; text-align: center; 
    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 2000; text-align: center; 
    user-select: none; /* Evita que se seleccione texto al arrastrar */
}

/* 2. DISEÑO GOTITA 100% CSS (ANIMADA) */
/* 1. EL ENVOLTORIO QUE SE AGARRA */
.gota-wrapper { 
    position: relative; width: 80px; height: 110px; margin: 0 auto; 
    cursor: pointer; transform-origin: bottom center; 
    position: relative; width: 80px; height: 100px; margin: 0 auto; 
    cursor: grab; transform-origin: bottom center; 
}
.gota-wrapper:active { cursor: grabbing; }

/* 2. FORMA DE LÁGRIMA PERFECTA EN CSS */
.gota-visual {
width: 80px; height: 80px; background: #3498db; 
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
    position: relative; top: 30px;
    box-shadow: inset 0 -10px 20px rgba(0,0,0,0.1), 0 5px 15px rgba(52, 152, 219, 0.4);
    animation: gotaFloat 4s ease-in-out infinite, gotaRespirar 6s ease-in-out infinite;
    transition: 0.3s;
}
/* La punta de la gota */
.gota-visual::before {
    content: ''; position: absolute; width: 40px; height: 40px; 
    background: #3498db; border-radius: 5px; 
    top: -15px; left: 50%; transform: translateX(-50%) rotate(45deg);
    border-radius: 0 50% 50% 50%; /* Esto le da la punta arriba */
    transform: rotate(45deg); /* Giramos el cuadrado para que la punta apunte arriba */
    position: relative; top: 10px; margin: 0 auto;
    box-shadow: inset -10px -10px 20px rgba(0,0,0,0.15), 5px 5px 15px rgba(52, 152, 219, 0.4);
    animation: gotaFloat 4s ease-in-out infinite;
    display: flex; justify-content: center; align-items: center;
}
/* Brillo interno de la gota */

/* 3. LA CARITA (Hay que deshacer la rotación de 45 grados para que no se vea chueca) */
.cara-gota {
    transform: rotate(-45deg);
    display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2;
    margin-top: 15px; margin-left: 15px;
}
.ojos-container { display: flex; gap: 12px; margin-bottom: 5px; }
.ojo { width: 10px; height: 14px; background: white; border-radius: 50%; position: relative; }
/* Pupilas */
.ojo::after { content: ''; position: absolute; width: 4px; height: 4px; background: #2d3436; border-radius: 50%; bottom: 3px; right: 2px; }
.boca { width: 12px; height: 6px; background: #1a5276; border-radius: 0 0 10px 10px; }

/* 4. MODO ARRRASTRE (CERRAR LOS OJOS) */
.gota-visual.durmiendo .ojo { height: 3px; background: #1a5276; margin-top: 5px; border-radius: 10px;}
.gota-visual.durmiendo .ojo::after { display: none; }
.gota-visual.durmiendo .boca { height: 3px; width: 8px; border-radius: 50%; background: #1a5276; }

/* 5. DETALLES EXTRA */
.gota-brillo {
    position: absolute; width: 15px; height: 30px; background: rgba(255,255,255,0.4);
    border-radius: 50%; top: 20px; left: 15px; transform: rotate(15deg);
    position: absolute; width: 20px; height: 30px; background: rgba(255,255,255,0.3);
    border-radius: 50%; top: 5px; left: 10px; transform: rotate(-45deg);
}
/* Sombra en el suelo para efecto flotante */
.gota-sombra {
    width: 60px; height: 10px; background: rgba(0,0,0,0.1); 
    border-radius: 50%; margin: 35px auto 0;
    width: 50px; height: 10px; background: rgba(0,0,0,0.1); 
    border-radius: 50%; margin: 15px auto 0;
animation: sombraFloat 4s ease-in-out infinite;
}

/* 3. BURBUJA DE TEXTO (SPEECH BUBBLE) */
/* 6. BURBUJA DE TEXTO (Ahora aparece y desaparece suavemente) */
.burbuja-texto {
    position: absolute; bottom: 130px; left: 50%; transform: translateX(-50%);
    position: absolute; bottom: 120px; left: 50%; transform: translateX(-50%);
background: white; color: #2d3436; padding: 12px 18px; border-radius: 15px;
    width: 200px; font-size: 0.85rem; font-weight: 600; line-height: 1.4;
    width: 220px; font-size: 0.85rem; font-weight: 600; line-height: 1.4;
box-shadow: 0 5px 20px rgba(0,0,0,0.1); border: 1px solid #eee;
    animation: burbujaEntrar 0.5s ease-out; transform-origin: bottom center;
    transition: opacity 0.5s ease-in-out; pointer-events: none; /* Evita que moleste al arrastrar */
}
/* El triángulo que sale de la burbuja */
.burbuja-texto::after {
    content: ''; position: absolute; bottom: -10px; left: 50%; 
    transform: translateX(-50%); border-width: 10px 10px 0; 
    border-style: solid; border-color: white transparent transparent transparent;
    content: ''; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); 
    border-width: 10px 10px 0; border-style: solid; border-color: white transparent transparent transparent;
}

/* 4. BOTÓN DE INTERACCIÓN (CHICO Y MODERNO) */
/* 7. BOTÓN */
.btn-interact-agua {
background: white; color: #3498db; border: none; padding: 8px 15px;
border-radius: 20px; font-weight: bold; cursor: pointer; 
    font-family: 'Poppins', sans-serif; font-size: 0.9rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 10px; transition: 0.3s;
    font-family: 'Poppins', sans-serif; box-shadow: 0 4px 10px rgba(0,0,0,0.1); margin-top: 5px; transition: 0.3s;
}
.btn-interact-agua:hover { background: #3498db; color: white; transform: translateY(-2px); }

/* =========================================================
   ANIMACIONES KEYFRAMES (PURO ARTE)
========================================================= */
@keyframes gotaFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes gotaRespirar { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02, 0.98); } }
@keyframes sombraFloat { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.8); opacity: 0.5; } }
@keyframes burbujaEntrar { 0% { opacity: 0; transform: translateX(-50%) scale(0.5); } 100% { opacity: 1; transform: translateX(-50%) scale(1); } }

/* Recompensa al tragar agua */
.tragar-anim { animation: tragarGota 0.4s ease-out !important; }
@keyframes tragarGota {
    0% { transform: scale(1) translateY(0); }
    20% { transform: scale(1.2, 0.8) translateY(10px); }
    100% { transform: scale(1) translateY(0); }
}

/* Estados de Evolución (Color) */
.gota-cool { background: #16a085 !important; } /* Nivel Cool */
.gota-cool::before { background: #16a085 !important; }
.gota-cool { box-shadow: inset 0 -10px 20px rgba(0,0,0,0.1), 0 5px 25px rgba(22, 160, 133, 0.6) !important; }
/* EVOLUCIONES */
.gota-cool { background: #16a085 !important; }
.gota-cool .boca { width: 14px; height: 3px; border-radius: 2px; background: #2d3436; } /* Sonrisa cool */
.gota-dios { background: #f1c40f !important; box-shadow: inset -10px -10px 20px rgba(0,0,0,0.1), 0 5px 30px rgba(241, 196, 15, 0.8) !important; }

.gota-dios { background: #f1c40f !important; animation: gotaFloat 4s infinite, gotaRespirar 6s infinite, gotaBrilloDios 1.5s infinite !important; } /* Nivel Dios */
.gota-dios::before { background: #f1c40f !important; }
.gota-dios { box-shadow: inset 0 -10px 20px rgba(0,0,0,0.1), 0 5px 30px rgba(241, 196, 15, 0.8) !important; }
@keyframes gotaBrilloDios { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
@keyframes gotaFloat { 0%, 100% { transform: rotate(45deg) translate(0, 0); } 50% { transform: rotate(45deg) translate(-7px, -7px); } }
@keyframes sombraFloat { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.8); opacity: 0.5; } }
