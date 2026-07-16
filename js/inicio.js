// pagina/js/inicio.js
export const iniciarCalculadoraIMC = () => {
    const btnCalcular = document.getElementById('btnCalcularImc');
    const resultadoDiv = document.getElementById('imcResultado');

    if(!btnCalcular) return;

    btnCalcular.addEventListener('click', () => {
        const peso = parseFloat(document.getElementById('imcPesoRapido').value);
        const estaturaCm = parseFloat(document.getElementById('imcEstaturaRapida').value);

        if(!peso || !estaturaCm) {
            Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Ingresa tu peso y estatura.' });
            return;
        }

        const estaturaM = estaturaCm / 100;
        const imc = (peso / (estaturaM * estaturaM)).toFixed(1);
        
        let categoria = '';
        let claseCSS = '';

        if(imc < 18.5) { categoria = 'Bajo peso'; claseCSS = 'imc-alerta'; }
        else if(imc >= 18.5 && imc <= 24.9) { categoria = 'Peso saludable'; claseCSS = 'imc-normal'; }
        else if(imc >= 25 && imc <= 29.9) { categoria = 'Sobrepeso'; claseCSS = 'imc-alerta'; }
        else { categoria = 'Obesidad'; claseCSS = 'imc-peligro'; }

        resultadoDiv.className = `imc-resultado ${claseCSS}`;
        resultadoDiv.innerHTML = `Tu IMC es <span>${imc}</span> (${categoria}). <br><small style="font-weight:normal; font-size:0.9rem; margin-top:10px; display:block;">¡Crea tu perfil gratis en el botón verde de arriba para obtener tu plan a la medida!</small>`;
        resultadoDiv.style.display = 'block';
    });
};