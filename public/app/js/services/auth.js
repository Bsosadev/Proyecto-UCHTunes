// Obtener referencias a los botones de login
const loginGoogleButton = document.getElementById('login-google');
const loginGithubButton = document.getElementById('login-github');

// Configuración de los proveedores de autenticación
const googleProvider = new firebase.auth.GoogleAuthProvider();
const githubProvider = new firebase.auth.GithubAuthProvider();

// Función para manejar el login con Google
loginGoogleButton.addEventListener('click', () => {
    firebase.auth().signInWithPopup(googleProvider)
        .then((result) => {
            console.log(result.user);
            window.location = '../../index.html'; // Redirigir a la página principal después del login
        })
        .catch((error) => {
            console.error('Error al iniciar sesión con Google:', error);
        });
});

// Función para manejar el login con GitHub
loginGithubButton.addEventListener('click', () => {
    firebase.auth().signInWithPopup(githubProvider)
        .then((result) => {
            console.log(result.user);
            window.location = 'index.html'; // Redirigir a la página principal después del login
        })
        .catch((error) => {
            console.error('Error al iniciar sesión con GitHub:', error);
        });
});


