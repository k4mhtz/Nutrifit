// autenticacion/auth.js
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification, 
    sendPasswordResetEmail, 
    signOut, 
    setPersistence, 
    browserSessionPersistence 
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

export const registrarUsuario = async (auth, db, email, password, nombre, telefono) => {
    // Registro Dinámico Seguro
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    
    // Mitigación de suplantación: Envío de enlace de verificación por correo electrónico
    await sendEmailVerification(userCred.user);
    
    // Almacenamiento seguro en base de datos NoSQL (Inmune a Inyección SQL tradicional)
    await setDoc(doc(db, "Usuarios", userCred.user.uid), {
        nombre: nombre,
        telefono: telefono,
        peso: "", 
        estatura: "", 
        objetivo: "",
        rol: "usuario", // Control de acceso basado en roles implícito
        fecha_registro: new Date().toISOString()
    });

    // Cierre forzado hasta que el usuario verifique su identidad en el cliente
    await signOut(auth);

    Swal.fire({
        icon: 'success',
        title: '¡Registro casi listo!',
        text: 'Te enviamos un enlace de seguridad. Revisa tu correo para activar tu cuenta antes de iniciar sesión.'
    });
};

export const loguearUsuario = async (auth, email, password) => {
    // PREVENCIÓN DE ROBO DE SESIÓN: Forzar almacenamiento en sessionStorage (Expiración automática al cerrar pestaña)
    await setPersistence(auth, browserSessionPersistence);
    
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    
    // Control de Acceso: El usuario no puede ingresar a la sesión dinámica si no ha validado el enlace TLS/HTTPS enviado a su email
    if (!userCred.user.emailVerified) {
        await signOut(auth);
        Swal.fire({
            icon: 'warning',
            title: 'Cuenta no verificada',
            text: 'Aún no has validado tu correo. Revisa tu bandeja de entrada.'
        });
        throw new Error("Email no verificado"); 
    }

    Swal.fire({ icon: 'success', title: 'Acceso autorizado', showConfirmButton: false, timer: 1500 });
};

export const recuperarPassword = async (auth, email) => {
    if (!email) {
        Swal.fire({ icon: 'error', title: 'Falta tu correo', text: 'Escribe tu correo electrónico para procesar el restablecimiento.' });
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        Swal.fire({ icon: 'success', title: 'Enlace enviado', text: 'Si el correo está registrado, recibirás las instrucciones de recuperación.' });
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo procesar la solicitud.' });
    }
};
