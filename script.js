});

// AUTENTICACIÓN RESTANTE
// AUTENTICACIÓN RESTANTE CON TÉRMINOS Y CONDICIONES
document.getElementById('authForm').addEventListener('submit', async (e) => {
e.preventDefault();
const recaptchaResponse = grecaptcha.getResponse();
@@ -300,15 +301,77 @@ document.getElementById('authForm').addEventListener('submit', async (e) => {
const btnAction = document.getElementById('btnAction');

if (!isLogin && !/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) { Swal.fire({ icon: 'warning', title: 'Contraseña débil', text: 'Cumple los requisitos.' }); return; }
    
btnAction.disabled = true; btnAction.innerText = 'Procesando...';

try {
if (!isLogin) {
            await registrarUsuario(auth, db, email, password, document.getElementById('nombre').value, document.getElementById('telefono').value);
            window.toggleForm(); document.getElementById('authForm').reset(); grecaptcha.reset();
        } else { await loguearUsuario(auth, email, password); }
    } catch (error) { if (error.message !== "Email no verificado") Swal.fire({ icon: 'error', title: 'Oops...', text: 'Credenciales incorrectas.' }); grecaptcha.reset(); } 
    finally { btnAction.disabled = false; btnAction.innerText = isLogin ? 'Acceder' : 'Registrarme'; }
            // MODAL DE TÉRMINOS Y CONDICIONES
            const { value: accept } = await Swal.fire({
                title: 'Términos y Condiciones',
                html: `
                    <div style="text-align: left; max-height: 280px; overflow-y: auto; font-size: 0.85rem; margin-bottom: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; color: #2d3436; line-height: 1.5;">
                        <p><b>TÉRMINOS Y CONDICIONES DE USO DE NUTRIFIT</b></p>
                        <p><i>Última actualización: Junio de 2026</i></p>
                        <p>Bienvenido a NutriFit. Al registrarse y utilizar esta plataforma, el usuario acepta los presentes Términos y Condiciones. Si no está de acuerdo con ellos, deberá abstenerse de utilizar el servicio.</p>
                        <br>
                        <p><b>1. Objeto del Servicio</b><br>NutriFit es una plataforma web diseñada para proporcionar información relacionada con hábitos saludables, alimentación, nutrición y seguimiento personal de objetivos de bienestar.</p>
                        <br>
                        <p><b>2. Registro de Usuario</b><br>Para acceder a determinadas funciones, el usuario deberá crear una cuenta proporcionando información verídica y actualizada. El usuario es responsable de mantener la confidencialidad de su contraseña, proteger el acceso a su cuenta y notificar cualquier uso no autorizado de la misma.</p>
                        <br>
                        <p><b>3. Uso Adecuado de la Plataforma</b><br>El usuario se compromete a utilizar la plataforma de manera responsable y legal, no proporcionar información falsa o engañosa, no realizar actividades que puedan afectar el funcionamiento del sistema y no intentar acceder a información de otros usuarios sin autorización.</p>
                        <br>
                        <p><b>4. Información de Salud y Nutrición</b><br>La información proporcionada por NutriFit tiene fines exclusivamente informativos y educativos. NutriFit no sustituye la atención médica profesional, nutricional o psicológica. Antes de realizar cambios importantes en la alimentación o actividad física, se recomienda consultar a un profesional de la salud.</p>
                        <br>
                        <p><b>5. Protección de Datos Personales</b><br>Los datos personales proporcionados por el usuario serán utilizados únicamente para el funcionamiento de la plataforma y la mejora de los servicios ofrecidos. NutriFit se compromete a proteger la información personal conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).</p>
                        <br>
                        <p><b>6. Disponibilidad del Servicio</b><br>Aunque se realizarán esfuerzos razonables para mantener la plataforma disponible, NutriFit no garantiza que el servicio esté libre de interrupciones, errores o fallos técnicos.</p>
                        <br>
                        <p><b>7. Propiedad Intelectual</b><br>Todo el contenido de la plataforma, incluyendo textos, imágenes, logotipos, diseños y software, es propiedad de NutriFit o de sus respectivos titulares y se encuentra protegido por las leyes de propiedad intelectual. Queda prohibida su reproducción, distribución o modificación sin autorización previa.</p>
                        <br>
                        <p><b>8. Limitación de Responsabilidad</b><br>NutriFit no será responsable por daños directos o indirectos derivados del uso de la plataforma, incluyendo decisiones tomadas por el usuario con base en la información proporcionada.</p>
                        <br>
                        <p><b>9. Modificaciones</b><br>NutriFit podrá actualizar o modificar estos términos y condiciones en cualquier momento. Los cambios serán publicados en la plataforma y entrarán en vigor desde su publicación.</p>
                    </div>
                    <div style="text-align: left; display: flex; align-items: flex-start; gap: 10px;">
                        <input type="checkbox" id="termsCheckbox" style="margin-top: 4px; transform: scale(1.2); cursor: pointer;">
                        <label for="termsCheckbox" style="font-size: 0.9rem; cursor: pointer; color: #2d3436; font-weight: 600;">He leído y acepto los Términos y Condiciones de Uso y el Aviso de Privacidad de NutriFit.</label>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Aceptar y Registrarme',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#27ae60',
                cancelButtonColor: '#e74c3c',
                width: '600px',
                preConfirm: () => {
                    // Validar que la casilla esté marcada antes de dejarlo avanzar
                    const isChecked = Swal.getPopup().querySelector('#termsCheckbox').checked;
                    if (!isChecked) {
                        Swal.showValidationMessage('Debes marcar la casilla para aceptar los términos y continuar.');
                        return false;
                    }
                    return true;
                }
            });

            // Si el usuario marcó la casilla y le dio a Aceptar, procedemos a registrarlo en Firebase
            if (accept) {
                await registrarUsuario(auth, db, email, password, document.getElementById('nombre').value, document.getElementById('telefono').value);
                window.toggleForm(); 
                document.getElementById('authForm').reset(); 
                grecaptcha.reset();
            }
        } else { 
            // Si el usuario ya tiene cuenta y solo está iniciando sesión, entra directo
            await loguearUsuario(auth, email, password); 
        }
    } catch (error) { 
        if (error.message !== "Email no verificado") Swal.fire({ icon: 'error', title: 'Oops...', text: 'Credenciales incorrectas o error en la conexión.' }); 
        grecaptcha.reset(); 
    } finally { 
        btnAction.disabled = false; btnAction.innerText = isLogin ? 'Acceder' : 'Registrarme'; 
    }
});

window.toggleForm = () => {
