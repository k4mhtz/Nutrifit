// autenticacion/auth.js
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

export const registrarUsuario = async (auth, db, email, password, nombre, telefono) => {
    // 1. Crea la cuenta en Firebase
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    
    // 2. Dispara el correo oficial de validación
    await sendEmailVerification(userCred.user);
    
    // 3. Guarda los datos en tu base de datos (Firestore)
    await setDoc(doc(db, "Usuarios", userCred.user.uid), {
        nombre: nombre,
        telefono: telefono,
        peso: "", estatura: "", objetivo: "",
        fecha_registro: new Date().toISOString()
    });

    // 4. Lo sacamos del sistema inmediatamente para obligarlo a verificar su correo
    await signOut(auth);

    Swal.fire({
        icon: 'success',
        title: '¡Registro casi listo!',
        text: 'Te enviamos un enlace de seguridad. Revisa tu correo (y la bandeja de SPAM) para activar tu cuenta antes de iniciar sesión.'
    });
};

export const loguearUsuario = async (auth, email, password) => {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    
    // El Cadenero: Si su correo no está verificado, lo pateamos de vuelta a la calle
    if (!userCred.user.emailVerified) {
        await signOut(auth);
        Swal.fire({
            icon: 'warning',
            title: 'Cuenta no verificada',
            text: 'Aún no has validado tu correo. Ve a tu bandeja de entrada y haz clic en el enlace que te enviamos.'
        });
        throw new Error("Email no verificado"); 
    }

    Swal.fire({ icon: 'success', title: 'Acceso autorizado', showConfirmButton: false, timer: 1500 });
};

export const recuperarPassword = async (auth, email) => {
    if (!email) {
        Swal.fire({ icon: 'error', title: 'Falta tu correo', text: 'Escribe tu correo electrónico en el campo de arriba y vuelve a presionar "Olvidé mi contraseña".' });
        return;
    }
    
    try {
        await sendPasswordResetEmail(auth, email);
        Swal.fire({ icon: 'success', title: 'Enlace enviado', text: 'Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.' });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'No pudimos enviar el correo. Verifica que esté bien escrito.' });
    }
};
