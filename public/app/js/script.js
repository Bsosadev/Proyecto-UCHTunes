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

// Definimos la cantidad de canciones por página y la página actual
const songsPerPage = 4;
let currentPage = 1;
const paginationDiv = document.getElementById('pagination');

let currentAudio = null;
let currentSongKey = null;
let isPlaying = false;


// Función para mostrar las canciones de acuerdo a la página actual
function showSongs(snapshot) {
    songsTable.innerHTML = ''; // Limpiar el contenido previo

    const startIndex = (currentPage - 1) * songsPerPage;
    const endIndex = startIndex + songsPerPage;

    let index = 0; // Variable para contar el número de canciones mostradas

    snapshot.forEach(function(songSnapshot) {
        if (index >= startIndex && index < endIndex) {
            const songKey = songSnapshot.key;
            const song = songSnapshot.val();

            // Crear el template para la canción
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
                        <button id="play-${songKey}" class="btn-player-music block w-full text-left text-gray-900 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 text-sm" data-song-url="${song.songURL}">Reproducir</button>
                        <button id="${songKey}" class="btn-view-lyrics block w-full text-left text-gray-900 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 text-sm">Ver Letra</button>
                        <a href="edit-music.html?songKey=${songKey}" class="block w-full text-left text-gray-900 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 text-sm">Editar</a>
                        <button id="${songKey}" class="btn-delete block w-full text-left text-gray-900 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 text-sm">Eliminar</button>
                    </td>
                </tr>
            `;

            // Agregar el template al elemento songsTable
            songsTable.innerHTML += songTemplate;
        }
        index++;
    });

    // Verificar si hay más canciones para mostrar y agregar botones de paginación si es necesario
    const totalSongs = snapshot.numChildren();
    const totalPages = Math.ceil(totalSongs / songsPerPage);

    if (totalPages > 1) {
        updatePagination(totalPages, snapshot);
    }

    // Configurar botones de reproducción
    setupPlayButtons();
    // Configurar eventos de control de reproducción
    setupControlButtons();
    // Configurar botones de ver letra
    setupViewLyricsButtons();
    // Configurar botones de eliminar canción
    setupDeleteButtons();
}


function setupPlayButtons() {
    const playButtons = document.querySelectorAll('.btn-player-music');
    const musicModal = document.getElementById('music-modal');
    const musicAudio = document.getElementById('music-audio');
    const imageMusic = document.getElementById('image-music');
    const nameMusic = document.getElementById('name-music');
    const artistMusic = document.getElementById('artist-music');

    playButtons.forEach(button => {
        button.addEventListener('click', function() {
            const songKey = this.id.replace('play-', '');
            const songUrl = this.getAttribute('data-song-url');

            // Obtener los datos de la canción de Firebase
            const songRef = db.ref('songs').child(songKey);
            songRef.once('value', function(snapshot) {
                const song = snapshot.val();
                if (!song) return;

                // Actualizar los elementos del modal con los datos de la canción
                if (imageMusic) imageMusic.src = song.imageURL;
                if (nameMusic) nameMusic.textContent = song.name;
                if (artistMusic) artistMusic.textContent = song.artist;
                if (musicAudio) musicAudio.src = songUrl;

                currentSongKey = songKey;
                isPlaying = true;

                // Mostrar el modal de música
                if (musicModal) musicModal.classList.remove('hidden');
                if (musicAudio) musicAudio.play().catch(error => console.error('Error al reproducir el audio:', error));
            });
        });
    });
}


function setupControlButtons() {
    const musicAudio = document.getElementById('music-audio');
    const playPauseButton = document.getElementById('playButton');
    const rewindButton = document.getElementById('rewindButton');
    const forwardButton = document.getElementById('forwardButton');
    const closeMusicModalButton = document.getElementById('close-music-modal');
    const progressMusic = document.getElementById('progress-music');
    const durationStart = document.getElementById('duration-start');
    const durationEnd = document.getElementById('duration-end');
    const musicModal = document.getElementById('music-modal');

    // Control de reproducción/pausa
    if (playPauseButton) {
        playPauseButton.addEventListener('click', function() {
            if (musicAudio.paused) {
                musicAudio.play();
                isPlaying = true;
            } else {
                musicAudio.pause();
                isPlaying = false;
            }
        });
    }

    // Control de cierre del modal
    if (closeMusicModalButton) {
        closeMusicModalButton.addEventListener('click', function() {
            if (musicModal) musicModal.classList.add('hidden');
            if (musicAudio) musicAudio.pause();
            isPlaying = false;
        });
    }

    // Control de avance y retroceso
    if (rewindButton) {
        rewindButton.addEventListener('click', function() {
            if (musicAudio) musicAudio.currentTime -= 10; // Retroceder la canción 10 segundos
        });
    }

    if (forwardButton) {
        forwardButton.addEventListener('click', function() {
            if (musicAudio) musicAudio.currentTime += 10; // Avanzar la canción 10 segundos
        });
    }

    // Actualizar progreso de la canción
    if (musicAudio) {
        musicAudio.addEventListener('timeupdate', function() {
            const currentTime = musicAudio.currentTime;
            const duration = musicAudio.duration;
            if (progressMusic) progressMusic.style.width = `${(currentTime / duration) * 100}%`;
            if (durationStart) durationStart.textContent = formatTime(currentTime);
            if (durationEnd) durationEnd.textContent = formatTime(duration);
        });
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}


function setupViewLyricsButtons() {
    const viewLyricsButtons = document.querySelectorAll('.btn-view-lyrics');
    const lyricsModal = document.getElementById('lyrics-modal');
    const lyricsContent = document.getElementById('lyrics-content');

    viewLyricsButtons.forEach(button => {
        button.addEventListener('click', function() {
            const songKey = this.id;

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

    // Añadir listener para el evento click en el fondo oscurecido del modal
    const modalBackground = document.querySelector('.bg-gray-500.opacity-75');
    if (modalBackground) {
        modalBackground.addEventListener('click', function() {
            lyricsModal.classList.add('hidden');
        });
    }

    // Añadir listener para el botón de cerrar el modal
    const closeLyricsModalButton = document.getElementById('close-lyrics-modal');
    if (closeLyricsModalButton) {
        closeLyricsModalButton.addEventListener('click', function() {
            lyricsModal.classList.add('hidden');
        });
    }
}

function setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.btn-delete');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteButton = document.getElementById('confirm-delete-button');
    const cancelDeleteButton = document.getElementById('cancel-delete-button');

    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const songKey = this.id;
            deleteModal.dataset.songKey = songKey;
            deleteModal.classList.remove('hidden');
        });
    });

    // Confirmar eliminación
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', function() {
            const songKey = deleteModal.dataset.songKey;

            db.ref('songs/' + songKey).remove()
                .then(function() {
                    console.log('¡Canción eliminada correctamente!');
                    deleteModal.classList.add('hidden');
                })
                .catch(function(error) {
                    console.error('Error al eliminar la canción:', error);
                });
        });
    }

    // Cancelar eliminación
    if (cancelDeleteButton) {
        cancelDeleteButton.addEventListener('click', function() {
            deleteModal.classList.add('hidden');
        });
    }
}


function updatePagination(totalPages, snapshot) {
    paginationDiv.innerHTML = ''; // Limpiar el contenido previo de paginación

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.type = 'button';
        pageButton.textContent = i;
        pageButton.classList.add('py-1.5', 'px-3', 'inline-flex', 'items-center', 'gap-x-2', 'text-sm', 'font-medium', 'rounded-lg', 'border', 'border-gray-200', 'bg-white', 'text-gray-800', 'shadow-sm', 'hover:bg-gray-50', 'disabled:opacity-50', 'disabled:pointer-events-none', 'dark:bg-neutral-800', 'dark:border-neutral-700', 'dark:text-white', 'dark:hover:bg-neutral-800');

        if (i === currentPage) {
            pageButton.classList.add('bg-gray-200', 'text-gray-700');
            pageButton.disabled = true;
        } else {
            pageButton.addEventListener('click', function() {
                currentPage = i;
                showSongs(snapshot);
            });
        }

        paginationDiv.appendChild(pageButton);
    }
}



// Listener para actualizar las canciones cuando cambia la base de datos
db.ref('songs').on('value', function(snapshot) {
    showSongs(snapshot);
});


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

