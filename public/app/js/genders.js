// Obtener referencia a los géneros en la base de datos
const database = firebase.database();
const genresRef = db.ref('genres');

// Escuchar cambios en los datos de la tabla "genres"
genresRef.once('value', function(snapshot) {
    // Obtener los datos de la tabla "genres"
    const genresData = snapshot.val();

    // Mostrar los datos en la consola
    console.log('Datos de la tabla "genres":', genresData);
}).catch(function(error) {
    // Manejar errores
    console.error('Error al obtener datos de la tabla "genres":', error);
});

var genreInput = document.getElementById('genre');
var genreForm = document.getElementById('genre-form');

// Maneja la adición de géneros cuando se envía el formulario de géneros
genreForm.addEventListener('submit', function(e) {
    e.preventDefault();

    var genre = genreInput.value.trim(); // Obtener y limpiar el valor del input

    if (!genre) {
        Swal.fire({
            title: 'Error',
            text: 'El campo de género no puede estar vacío',
            icon: 'error'
        });
        return; // Asegurarse de que este return esté dentro de la función
    }

    // Verificar si el género ya existe en la base de datos
    genresRef.once('value', function(snapshot) {
        const genresData = snapshot.val();
        let exists = false;

        snapshot.forEach(function(childSnapshot) {
            if (childSnapshot.val().toLowerCase() === genre.toLowerCase()) {
                exists = true;
            }
        });

        if (exists) {
            Swal.fire({
                title: 'Error',
                text: 'El género ya existe',
                icon: 'error'
            });
        } else {
            // Guarda el género en la base de datos
            db.ref('genres').push(genre).then(function() {
                Swal.fire({
                    title: 'Éxito',
                    text: 'Género agregado correctamente',
                    icon: 'success'
                });
                genreInput.value = ''; // Limpiar el input después de agregar el género
            }).catch(function(error) {
                console.error('Error al guardar el género:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Hubo un problema al agregar el género',
                    icon: 'error'
                });
            });
        }
    }).catch(function(error) {
        console.error('Error al verificar los géneros:', error);
    });
});

// Escuchar cambios en los datos de la tabla "genres"
genresRef.once('value', function(snapshot) {
    // Obtener los datos de la tabla "genres"
    const genresData = snapshot.val();

    // Iterar sobre cada género
    snapshot.forEach(function(childSnapshot) {
        // Obtener el ID del género
        const genreId = childSnapshot.key;
        
        // Utilizar el ID del género como desees
        console.log('ID del género:', genreId);
    });
}).catch(function(error) {
    // Manejar errores
    console.error('Error al obtener datos de la tabla "genres":', error);
});

// Obtener referencia al elemento donde se imprimirán los géneros
const gendersArti = document.getElementById('gendersArti');

// Escuchar los cambios en los géneros y actualizar la lista cuando cambie
genresRef.on('value', function(snapshot) {
    // Limpiar el contenido existente antes de agregar nuevos géneros
    gendersArti.innerHTML = '';

    // Iterar sobre los géneros y agregarlos al elemento con el template
    snapshot.forEach(function(childSnapshot) {
        const genre = childSnapshot.val();
        const genreId = childSnapshot.key;
        const template = `
            <article id="${genreId}" class="group flex justify-between items-center bg-white border shadow-sm rounded-xl hover:shadow-md transition dark:bg-neutral-900 dark:border-neutral-800 p-4 md:p-5">
                <h3 class="group-hover:text-blue-600 font-semibold text-gray-800 dark:group-hover:text-neutral-400 dark:text-neutral-200">
                    ${genre}
                </h3>
                <button id="delete-gender-${genreId}" type="button" class="ps-3 delete-gender-button" data-genre-id="${genreId}">
                    <svg class="lucide lucide-eraser flex-shrink-0 size-5 text-gray-800 dark:text-neutral-200 hover:text-red-600" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                        <path d="M22 21H7" />
                        <path d="m5 11 9 9" />
                    </svg>
                </button>
            </article>
        `; 
        // Agregar el template al elemento de géneros
        gendersArti.innerHTML += template;
    });

    // Obtener referencia al modal y a los botones
    const deleteModal = document.getElementById('deleteModal');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    const cancelDeleteButton = document.getElementById('cancelDeleteButton');

    // Agregar controlador de eventos para mostrar el modal
    document.querySelectorAll('.delete-gender-button').forEach(item => {
        item.addEventListener('click', event => {
            const genreIdToDelete = event.currentTarget.getAttribute('data-genre-id');
            deleteModal.setAttribute('data-genre-id', genreIdToDelete);
            deleteModal.classList.remove('hidden');
        });
    });
    
    // Agregar controlador de eventos para ocultar el modal al hacer clic en Cancelar
    cancelDeleteButton.addEventListener('click', function() {
        deleteModal.classList.add('hidden');
    });
    
    // Agregar controlador de eventos para eliminar el género al hacer clic en Eliminar
    confirmDeleteButton.addEventListener('click', function() {
        // Obtener el ID del género a eliminar del atributo data-genre-id del modal
        const genreIdToDelete = deleteModal.getAttribute('data-genre-id');
        
        // Llamar a la función para eliminar el género
        deleteGenre(genreIdToDelete);
        
        console.log("se elimino:" + genreIdToDelete)

        // Ocultar el modal después de eliminar el género
        deleteModal.classList.add('hidden');
    });
});

function deleteGenre(genreId) {
    // Obtener una referencia al género que se va a eliminar
    const genreRef = genresRef.child(genreId);
    
    // Eliminar el género de la base de datos
    genreRef.remove()
        .then(function() {
            console.log('Género eliminado exitosamente');
        })
        .catch(function(error) {
            console.error('Error al eliminar el género:', error);
        });
}
