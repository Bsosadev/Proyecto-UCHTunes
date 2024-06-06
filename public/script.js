// Referencias a los elementos del formulario
var artistInput = document.getElementById('artist');
var songNameInput = document.getElementById('song-name');
var songFileInput = document.getElementById('song-file');
var imageFileInput = document.getElementById('image-file');
var lyricsInput = document.getElementById('lyrics');
var form = document.getElementById('music-form');

// Maneja la subida de archivos cuando se envía el formulario
form.addEventListener('submit', function(e) {
    e.preventDefault();

    var artist = artistInput.value;
    var songName = songNameInput.value;
    var songFile = songFileInput.files[0];
    var imageFile = imageFileInput.files[0];
    var lyrics = lyricsInput.value;
    var genre = musicGenreSelect.value;

    // Genera una clave única para la canción
    var songKey = db.ref('songs').push().key;

    // Sube el archivo de música a una carpeta con el songKey de la música
    var songStorageRef = storage.ref('songs/' + songKey).child(songFile.name);
    var songUploadTask = songStorageRef.put(songFile);

    // Sube el archivo de imagen
    var imageStorageRef = storage.ref('images/' + songKey).child(imageFile.name);
    var imageUploadTask = imageStorageRef.put(imageFile);

    // Espera a que ambos archivos se hayan subido
    Promise.all([songUploadTask, imageUploadTask]).then(function() {
        // Obtiene las URLs de descarga de los archivos
        return Promise.all([songStorageRef.getDownloadURL(), imageStorageRef.getDownloadURL()]);
    }).then(function(downloadURLs) {
        var songDownloadURL = downloadURLs[0];
        var imageDownloadURL = downloadURLs[1];

        // Guarda la información de la canción en la base de datos con el mismo songKey
        db.ref('songs/' + songKey).set({
            artist: artist,
            name: songName,
            gender: genre,
            songURL: songDownloadURL,
            imageURL: imageDownloadURL,
            lyrics: lyrics
        }).then(function() {
            // Limpiar los campos del formulario
            artistInput.value = '';
            songNameInput.value = '';
            songFileInput.value = '';
            imageFileInput.value = '';
            lyricsInput.value = '';

            Swal.fire({
              title: `La cancion: ${songName}`,
              text: "Se subio exitosamente",
              icon: "success"
            });
        }).catch(function(error) {
            console.error('Error al guardar la información de la canción:', error);
        });
    }).catch(function(error) {
        console.error('Error al subir los archivos:', error);
    });
}); 

// Escucha los cambios en la base de datos y muestra las canciones
const songsTable = document.getElementById('songs');

// Listener para actualizar las canciones cuando cambia la base de datos
db.ref('songs').on('value', function(snapshot) {
    showSongs(snapshot);
});

// Definimos la cantidad de canciones por página y la página actual
const songsPerPage = 5;
let currentPage = 1;

// Función para mostrar las canciones de acuerdo a la página actual
function showSongs(snapshot) {
    songsTable.innerHTML = ''; // Limpiamos el contenido previo antes de agregar nuevas canciones

    const startIndex = (currentPage - 1) * songsPerPage;
    const endIndex = startIndex + songsPerPage;

    let index = 0; // Variable para contar el número de canciones mostradas

    snapshot.forEach(function(songSnapshot) {
        if (index >= startIndex && index < endIndex) {
            const songKey = songSnapshot.key;
            const song = songSnapshot.val();

            // Creamos un template para la canción
            const songTemplate = `
                <tr id="${songKey}">
                    <td class="w-36 whitespace-nowrap">
                        <div class="ps-4 pe-4 lg:ps-3 xl:ps-1 py-3">
                            <div class="flex flex-col justify-center items-center">
                                <img src="${song.imageURL}" class="w-32" alt="">
                                <p class="py-1 px-1.5 text-xs sm:hidden">
                                    ${song.name}
                                </p>
                                <p class="py-1 px-1.5 text-xs sm:hidden">
                                    ${song.artist}
                                </p>
                            </div>
                        </div>
                    </td>
                    <td class="w-28 whitespace-nowrap hidden sm:table-cell">
                        <div class="px-6 py-3">
                            <p class="py-1 px-1.5 text-xs">
                                ${song.name}
                            </p>
                        </div>
                    </td>
                    <td class="size-px whitespace-nowrap hidden md:table-cell">
                        <div class="px-6 py-3">
                            <p class="py-1 px-1.5 text-xs">
                                ${song.artist}
                            </p>
                        </div>
                    </td>
                    <td class="w-64 hidden lg:table-cell">
                        <div class="px-6 py-3">
                            <p class="py-1 px-1.5 text-xs w-64 truncate">
                                ${song.lyrics}
                            </p>
                        </div>
                    </td>
                    <td class="size-px whitespace-nowrap hidden xl:table-cell">
                        <div class="px-4 py-3">
                            <p class="py-1 px-1.5 text-xs">
                                ${song.gender}
                            </p>
                        </div>
                    </td>
                    <td class="size-px whitespace-nowrap">

                            <button id="${songKey}" class="btn-player-music block w-full text-left text-gray-900 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 text-sm">Reproducir</button>
                            <button id="${songKey}" class="btn-view-lyrics block w-full text-left text-gray-900 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 text-sm">Ver Letra</button>
                            <a href="edit-music.html?songKey=${songKey}" class="block w-full text-left text-gray-900 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 text-sm">Editar</a>
                            <button id="${songKey}" class="btn-delete block w-full text-left text-gray-900 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 text-sm">Eliminar</button>

                    </td>
                </tr>
            `;

            // Agregamos el template al elemento songsTable
            songsTable.innerHTML += songTemplate;
        }

        index++;

    });

    

    /* REPRODUCIR MUSICA */

    // Obtener referencia al botón "Reproducir"
    const playButtons = document.querySelectorAll('.btn-player-music');
    
    const playButton = document.getElementById('playButton');
    const musicAudio = document.getElementById('music-audio');
    // Agregar evento de clic al botón de reproducción/pausa
    playButton.addEventListener('click', function() {
        // Comprobar si el audio está pausado
        if (musicAudio.paused) {
            // Si está pausado, cargar la fuente del audio (si es necesario)
            if (!musicAudio.src) {
                // Aquí debes agregar la lógica para obtener la URL de la canción correspondiente utilizando el ID (songKey)
                const songRef = db.ref('songs').child(songKey);
                songRef.once('value', function(snapshot) {
                    const song = snapshot.val();
                    musicAudio.src = song.songURL; // Reemplaza "song.songURL" con la URL de tu archivo de audio
                });
            }
            // Reproducir el audio
            musicAudio.play();
        } else {
            // Si ya se está reproduciendo, pausar el audio
            musicAudio.pause();
        }
    });

    
    // Agregar evento de clic a cada botón "Reproducir"
    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const songKey = this.id; // Obtener el ID de la canción desde el ID del botón
        
            // Obtener referencia al modal de música
            const musicModal = document.getElementById('music-modal');
        
            // Mostrar el modal de música
            musicModal.classList.remove('hidden');
        
            // Pasar el ID de la canción al modal para identificar la música que se quiere reproducir
            musicModal.dataset.songKey = songKey;
        
            // Obtener referencia a los elementos dentro del modal
            const imageMusic = document.getElementById('image-music');
            const nameMusic = document.getElementById('name-music');
            const artistMusic = document.getElementById('artist-music');
            const progressMusic = document.getElementById('progress-music');
            const durationStart = document.getElementById('duration-start');
            const durationEnd = document.getElementById('duration-end');
            const rewindButton = document.getElementById('rewindButton');
            const forwardButton = document.getElementById('forwardButton');
        
            // Aquí debes agregar la lógica para obtener los datos de la música correspondiente utilizando el ID (songKey)
            // Por ejemplo:
            const songRef = db.ref('songs').child(songKey);
            songRef.once('value', function(snapshot) {
                const song = snapshot.val();
                // Actualizar los elementos dentro del modal con los datos de la música
                imageMusic.src = song.imageURL;
                nameMusic.textContent = song.name;
                artistMusic.textContent = song.artist;
                musicAudio.src = song.songURL;
                // Otra lógica necesaria para la reproducción de la música, como el tiempo de duración, etc.
            });
        
            // Obtener referencia al botón de cierre del modal de música
            const closeMusicModalButton = document.getElementById('close-music-modal');
        
            // Agregar evento de clic al botón de cierre del modal de música
            closeMusicModalButton.addEventListener('click', function() {
                // Ocultar el modal de música
                const musicModal = document.getElementById('music-modal');
                musicModal.classList.add('hidden');
                musicAudio.pause();
            });
        
            // Agregar evento de clic al botón de retroceso
            rewindButton.addEventListener('click', function() {
                musicAudio.currentTime -= 10; // Retroceder la canción 10 segundos
            });
        
            
        
            // Agregar evento de clic al botón de avance
            forwardButton.addEventListener('click', function() {
                musicAudio.currentTime += 10; // Avanzar la canción 10 segundos
            });
        });
    });


    

    /* VER LETRA */

    // Obtener referencia al botón "Ver Letra"
    const viewLyricsButtons = document.querySelectorAll('.btn-view-lyrics');

    // Iterar sobre cada botón y agregar un evento de clic
    viewLyricsButtons.forEach(button => {
        button.addEventListener('click', function() {
            const songKey = this.id; // Obtener la clave de la canción desde el ID del botón

            // Obtener la referencia al modal de letras
            const lyricsModal = document.getElementById('lyrics-modal');

            const lyricsContent = document.getElementById('lyrics-content');

            // Ocultamos el scroll de la página principal
            document.body.style.overflow = 'hidden';

            // Obtenemos la referencia a la canción en Firebase
            const songRef = db.ref('songs').child(songKey);

            // Obtenemos la letra de la canción desde Firebase
            songRef.once('value', function(snapshot) {
                const song = snapshot.val();
                const songLyrics = song.lyrics;

                // Mostramos la letra de la canción en el modal
                lyricsContent.textContent = songLyrics;
                lyricsModal.classList.remove('hidden');
            });
        });
    });

    // Añadimos un listener para el evento click en el fondo oscurecido del modal
    const modalBackground = document.querySelector('.bg-gray-500.opacity-75');
    modalBackground.addEventListener('click', function() {
        const modal = document.getElementById('lyrics-modal');
        modal.classList.add('hidden');

        // Mostramos nuevamente el scroll de la página principal
        document.body.style.overflow = 'auto';
    });

    // Añadimos un listener para el botón de cerrar el modal
    const closeLyricsModalButton = document.getElementById('close-lyrics-modal');
    closeLyricsModalButton.addEventListener('click', function() {
        const modal = document.getElementById('lyrics-modal');
        modal.classList.add('hidden');

        // Mostramos nuevamente el scroll de la página principal
        document.body.style.overflow = 'auto';
    });


    

    //ELIMINAR

    // Obtener referencia al botón "Eliminar"
    const deleteButtons = document.querySelectorAll('.btn-delete');

    // Agregar evento de clic a cada botón "Eliminar"
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const songKey = this.id; // Obtener el ID de la canción desde el ID del botón

            // Obtener referencia al modal de confirmación de eliminación
            const deleteModal = document.getElementById('delete-modal');

            // Mostrar el modal de confirmación de eliminación
            deleteModal.classList.remove('hidden');

            // Ocultamos el scroll de la página principal
            document.body.style.overflow = 'hidden';

            // Pasar el ID de la canción al modal para identificar la canción que se quiere eliminar
            deleteModal.dataset.songKey = songKey;
        });
    });

    // Obtener referencia al botón de confirmación de eliminación
    const confirmDeleteButton = document.getElementById('confirm-delete-button');

    // Agregar evento de clic al botón de confirmación de eliminación
    confirmDeleteButton.addEventListener('click', function() {
        // Obtener el ID de la canción desde el dataset del modal
        const songKey = document.getElementById('delete-modal').dataset.songKey;

        db.ref('songs/' + songKey).remove()
            .then(function() {
                console.log('¡Canción eliminada correctamente!');
            })
            .catch(function(error) {
                console.error('Error al eliminar la canción:', error);
            });

        // Una vez que se ha eliminado la canción, puedes ocultar el modal de confirmación de eliminación
        const deleteModal = document.getElementById('delete-modal');
        deleteModal.classList.add('hidden');

        // Mostramos nuevamente el scroll de la página principal
        document.body.style.overflow = 'auto';
    });

    // Obtener referencia al botón de cancelación de eliminación
    const cancelDeleteButton = document.getElementById('cancel-delete-button');

    // Agregar evento de clic al botón de cancelación de eliminación
    cancelDeleteButton.addEventListener('click', function() {
        // Ocultar el modal de confirmación de eliminación
        const deleteModal = document.getElementById('delete-modal');
        deleteModal.classList.add('hidden');

        // Mostramos nuevamente el scroll de la página principal
        document.body.style.overflow = 'auto';
    });


    /* aqui termia */
}



// Referencias a los elementos de las métricas
/* var songsCountSpan = document.querySelector('#metricas div:nth-child(1) span');
var songsWithLyricsCountSpan = document.querySelector('#metricas div:nth-child(2) span');
var gendersCountSpan = document.querySelector('#metricas div:nth-child(3) span');

db.ref('genres').on('value', function(snapshot){
    var genderCount = 0;

    snapshot.forEach(function(genresSnapshot){
        genderCount++;
    })

    gendersCountSpan.textContent = 'Generos: ' + genderCount; 
}) */

// Escucha los cambios en la base de datos y actualiza las métricas
/* db.ref('songs').on('value', function(snapshot) {
    var songsCount = 0;
    var songsWithLyricsCount = 0;

    snapshot.forEach(function(songSnapshot) {
        var song = songSnapshot.val();

        songsCount++;

        if (song.lyrics && song.lyrics.trim() !== '') {
            songsWithLyricsCount++;
        }
    });

    songsCountSpan.textContent = 'Canciones: ' + songsCount;
    songsWithLyricsCountSpan.textContent = 'Canciones con letra: ' + songsWithLyricsCount;
}); */


var musicGenreSelect = document.getElementById('gender');

// Escucha los cambios en la base de datos de géneros y actualiza el select de géneros
db.ref('genres').on('value', function(snapshot) {
    // Limpia el select de géneros
    musicGenreSelect.innerHTML = '';

    snapshot.forEach(function(genreSnapshot) {
        var genre = genreSnapshot.val();

        // Crea una nueva opción para el género
        var option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;

        // Añade la opción al select de géneros
        musicGenreSelect.appendChild(option);
    });
});

