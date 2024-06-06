// Obtener el songKey de la URL actual
const urlParams = new URLSearchParams(window.location.search);
const songKey = urlParams.get('songKey');
console.log('SongKey:', songKey);

const database = firebase.database();
const songRef = database.ref('songs/' + songKey); //Base de datos

// Obtener referencia a la lista de géneros
const genresRef = database.ref('genres');
// Escuchar los cambios en los datos de la canción
songRef.on('value', function(snapshot) {
    const song = snapshot.val();
    if (song) {
        // Asignar los valores de la canción a los campos del formulario
        const nameAndArtist = song.name + ' - ' + song.artist;
        document.getElementById('NameAndArtist').textContent = nameAndArtist;
        document.getElementById('ImgMusic').src = song.imageURL;
        document.getElementById('ImgMusic2').src = song.imageURL;
        document.getElementById('audioPlayer').src = song.songURL;
        document.getElementById('edit-artist').value = song.artist; // Artista de la canción
        document.getElementById('edit-song-name').value = song.name; // Nombre de la canción
        document.getElementById('edit-lyrics').value = song.lyrics; // Letra de la canción
        document.getElementById('edit-gender').value = song.gender;

        // Obtener referencia al elemento select
        const editGenderSelect = document.getElementById('edit-gender');
        const genresSet = new Set();

        // Obtener la lista de géneros y agregarlos al select
        db.ref('genres').once('value').then(function(snapshot) {
            snapshot.forEach(function(genreSnapshot) {
                const genre = genreSnapshot.val();
                genresSet.add(genre); // Agregar el género al conjunto
            });
            editGenderSelect.innerHTML = '';
            genresSet.forEach(function(genre) {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre;
                if (genre === song.gender) {
                    option.selected = true
                }
                editGenderSelect.appendChild(option);
            });
        });
    } else {
        console.log('No se encontró la canción');
    }
}, function(error) {
    console.error('Error al obtener la canción:', error);
});

/* EDITAR LA MUSICA */

// Función para mostrar el modal
function showModal() {
  document.getElementById('modal').classList.remove('hidden');
}

// Función para ocultar el modal
function hideModal() {
  document.getElementById('modal').classList.add('hidden');
}

// Obtener referencia al botón "Guardar Cambios"
const saveEditButton = document.getElementById('save-edit-button');

// Obtener referencia al elemento de input de la foto
const fileInputImage = document.getElementById('file-input-image');

// Obtener referencia al elemento de input de la música
const fileInputMusic = document.getElementById('file-input-music');

// Agregar un controlador de eventos al botón "Guardar Cambios"
document.getElementById('save-edit-button').addEventListener('click', function() {
    // Obtener los valores actualizados del formulario
    const editedArtist = document.getElementById('edit-artist').value;
    const editedSongName = document.getElementById('edit-song-name').value;
    const editedGender = document.getElementById('edit-gender').value;
    const editedLyrics = document.getElementById('edit-lyrics').value;

    // Obtener el archivo de la foto seleccionado
    const imageFile = fileInputImage.files[0];
    // Obtener el archivo de la música seleccionado
    const musicFile = fileInputMusic.files[0];

    // Obtener las URLs de descarga de los archivos actuales desde la base de datos
    database.ref('songs/' + songKey).once('value', function(snapshot) {
        const song = snapshot.val();
        if (song) {
            const currentImageURL = song.imageURL;
            const currentSongURL = song.songURL;

            // Eliminar el archivo de imagen actual en Firebase Storage
            if (currentImageURL && imageFile) {
                const imageRef = firebase.storage().refFromURL(currentImageURL);
                imageRef.delete().then(() => {
                    console.log('Archivo de imagen anterior eliminado correctamente');
                }).catch((error) => {
                    console.error('Error al eliminar el archivo de imagen anterior:', error);
                });
            }

            // Eliminar el archivo de música actual en Firebase Storage
            if (currentSongURL && musicFile) {
                const songRef = firebase.storage().refFromURL(currentSongURL);
                songRef.delete().then(() => {
                    console.log('Archivo de música anterior eliminado correctamente');
                }).catch((error) => {
                    console.error('Error al eliminar el archivo de música anterior:', error);
                });
            }
        }
    }).then(() => {
        // Subir el nuevo archivo de imagen si se seleccionó uno
        if (imageFile) {
            const storageRef = firebase.storage().ref();
            const imageRef = storageRef.child('images/' + songKey + '/' + imageFile.name);
            imageRef.put(imageFile)
                .then((snapshot) => {
                    console.log('Foto actualizada correctamente');
                    // Obtener la URL de descarga de la foto y actualizar los datos en la base de datos
                    snapshot.ref.getDownloadURL().then((downloadURL) => {
                        // Actualizar la URL de la imagen en la base de datos
                        database.ref('songs/' + songKey + '/imageURL').set(downloadURL);
                        // Continuar con la actualización de los demás datos
                        updateSongData();
                    });
                })
                .catch((error) => {
                    console.error('Error al actualizar la foto:', error);
                });
        } else {
            // Si no se seleccionó una nueva foto, continuar con la actualización de los demás datos
            updateSongData();
        }

        // Subir el nuevo archivo de música si se seleccionó uno
        if (musicFile) {
            // Obtener el nombre original del archivo de música
            const musicFileName = musicFile.name;
            // Obtener la referencia al archivo de música en el Storage
            const storageRef = firebase.storage().ref();
            const musicRef = storageRef.child('songs/' + songKey + '/' + musicFileName);
            // Subir el nuevo archivo de música
            musicRef.put(musicFile)
                .then((snapshot) => {
                    console.log('Música actualizada correctamente');
                    // Obtener la URL de descarga de la música y actualizar los datos en la base de datos
                    snapshot.ref.getDownloadURL().then((downloadURL) => {
                        // Actualizar la URL de la música en la base de datos
                        database.ref('songs/' + songKey + '/songURL').set(downloadURL);
                        // Continuar con la actualización de los demás datos
                        updateSongData();
                    });
                })
                .catch((error) => {
                    console.error('Error al actualizar la música:', error);
                });
        } else {
            // Si no se seleccionó un nuevo archivo de música, continuar con la actualización de los demás datos
            updateSongData();
        }
    });

    // Mostrar el modal después de realizar los cambios
    showModal();

    // Evento click en el botón de cerrar el modal
    document.getElementById('close-modal').addEventListener('click', function() {
      // Ocultar el modal al hacer clic en el botón de cerrar
      hideModal();
    });

    // Limpiar los inputs de música y foto después de subir los archivos
    fileInputImage.value = null;
    fileInputMusic.value = null;

    // Función para actualizar los datos de la canción en la base de datos
    function updateSongData() {
        // Actualizar los datos de la música en la base de datos
        const updates = {};
        updates['/songs/' + songKey + '/artist'] = editedArtist;
        updates['/songs/' + songKey + '/name'] = editedSongName;
        updates['/songs/' + songKey + '/gender'] = editedGender;
        updates['/songs/' + songKey + '/lyrics'] = editedLyrics;

        // Ejecutar las actualizaciones en la base de datos
        database.ref().update(updates)
            .then(() => {
                console.log('¡Música actualizada correctamente!');
                // Redirigir a la página principal u otra página después de guardar los cambios
                /* window.location.href = 'index.html'; */
                console.log("se actualizo la musica: " + songKey)
            })
            .catch((error) => {
                console.error('Error al actualizar la música:', error);
            });
    }

    
});




// Obtener el nombre de la canción asociada al songKey
/* songsRef.child(songKey).once('value', function(snapshot) {
        const songs = snapshot.val();
        if (songs) { */
        /* imprimirDatosCancion(songs) */
        /* console.log('Nombre de la canción:', songs.name); */ // Accede a 'name' en 'cancion', no 'song'
        /* console.log('Artista:', songs.artist);
        console.log('Genero:', songs.gender);
        console.log('Letra:', songs.lyrics);
    } else {
        console.log('No se encontró la canción');
    }
}, function(error) {
    console.error('Error al obtener la canción:', error);
}); */