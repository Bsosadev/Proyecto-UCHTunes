// Función para obtener la cantidad total de canciones con género desde Firebase
function actualizarCantidadTotalCanciones() {
    firebase.database().ref('songs').on('value', snapshot => {
        const cantidadTotal = snapshot.numChildren(); // Devuelve la cantidad total de canciones en la base de datos
        const elementoCantidadTotal = document.getElementById('cantidadTotalCanciones');
        elementoCantidadTotal.textContent = cantidadTotal;
    }, error => {
        console.error('Error al obtener la cantidad total de canciones:', error);
    });
}

// Función para obtener la cantidad total de géneros
function actualizarCantidadTotalGeneros() {
    firebase.database().ref('genres').on('value', snapshot => {
        const generos = snapshot.val();
        const cantidadGeneros = generos ? Object.keys(generos).length : 0; // Devuelve la cantidad total de géneros
        const elementoCantidadGeneros = document.getElementById('cantidadGeneros');
        elementoCantidadGeneros.textContent = cantidadGeneros;
    }, error => {
        console.error('Error al obtener la cantidad total de géneros:', error);
    });
}

// Función para obtener la cantidad de canciones con letras asignadas
function actualizarCantidadCancionesConLetras() {
    firebase.database().ref('songs').on('value', snapshot => {
        const songs = snapshot.val();
        let cantidadCancionesConLetras = 0;
        if (songs) {
            for (let key in songs) {
                const cancion = songs[key];
                if (cancion.lyrics) {
                    cantidadCancionesConLetras++;
                }
            }
        }
        const elementoCantidadCanciones = document.getElementById('cantidadLetras');
        elementoCantidadCanciones.textContent = cantidadCancionesConLetras;
    }, error => {
        console.error('Error al obtener la cantidad de canciones con letras:', error);
    });
}

// Función para obtener la cantidad de artistas únicos
function actualizarCantidadArtistas() {
    firebase.database().ref('songs').on('value', snapshot => {
        const songs = snapshot.val();
        const artistasSet = new Set();
        if (songs) {
            Object.values(songs).forEach(song => {
                if (song.artist) {
                    artistasSet.add(song.artist);
                }
            });
        }
        const cantidadArtistas = artistasSet.size; // Devuelve la cantidad de artistas únicos
        const elementoCantidadArtistas = document.getElementById('totalArtists');
        elementoCantidadArtistas.textContent = cantidadArtistas;
    }, error => {
        console.error('Error al obtener la cantidad de artistas:', error);
    });
}

// Llamar a las funciones para actualizar las métricas en tiempo real
actualizarCantidadTotalCanciones();
actualizarCantidadTotalGeneros();
actualizarCantidadCancionesConLetras();
actualizarCantidadArtistas();

// Inicializar el gráfico
let chart;

// Función para obtener la cantidad de canciones con y sin letras
function actualizarDatosCancionesConYLetras() {
    firebase.database().ref('songs').on('value', snapshot => {
        const songs = snapshot.val();
        let conLetras = 0;
        let sinLetras = 0;

        if (songs) {
            for (let key in songs) {
                const cancion = songs[key];
                if (cancion.lyrics && cancion.lyrics.trim() !== '') {
                    conLetras++;
                } else {
                    sinLetras++;
                }
            }
        }

        const series = [sinLetras, conLetras];

        // Actualizar el gráfico si ya está creado
        if (chart) {
            chart.updateSeries(series);
        } else {
            // Crear el gráfico si no existe
            const chartOptions = getChartOptions(series);
            chart = new ApexCharts(document.getElementById("pie-chart"), chartOptions);
            chart.render();
        }
    }, error => {
        console.error('Error al obtener las canciones con y sin letras:', error);
    });
}

// Configuración del gráfico
const getChartOptions = (series) => {
    return {
        series: series,
        colors: ["#1C64F2", "#16BDCA"],
        chart: {
            height: 420,
            width: "100%",
            type: "pie",
        },
        stroke: {
            colors: ["white"],
            lineCap: "",
        },
        plotOptions: {
            pie: {
                labels: {
                    show: true,
                },
                size: "100%",
                dataLabels: {
                    offset: -25
                }
            },
        },
        labels: ["Sin Letras", "Con Letras"],
        dataLabels: {
            enabled: true,
            style: {
                fontFamily: "Inter, sans-serif",
            },
        },
        legend: {
            position: "bottom",
            fontFamily: "Inter, sans-serif",
        },
        yaxis: {
            labels: {
                formatter: function (value) {
                    return value
                },
            },
        },
        xaxis: {
            labels: {
                formatter: function (value) {
                    return value
                },
            },
            axisTicks: {
                show: false,
            },
            axisBorder: {
                show: false,
            },
        },
    }
}

// Escuchar cambios en la base de datos y actualizar el gráfico
actualizarDatosCancionesConYLetras();




function generarColorAleatorio() {
    const letras = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letras[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generarColoresAleatorios(n) {
    const colores = [];
    for (let i = 0; i < n; i++) {
        colores.push(generarColorAleatorio());
    }
    return colores;
}

function obtenerYEscucharDatosArtistas(callback) {
    const artistas = {};

    // Listener para agregar canciones
    firebase.database().ref('songs').on('child_added', snapshot => {
        const song = snapshot.val();
        if (song.artist) {
            if (!artistas[song.artist]) {
                artistas[song.artist] = 0;
            }
            artistas[song.artist]++;
            callback(artistas);
        }
    });

    // Listener para cambiar canciones
    firebase.database().ref('songs').on('child_changed', snapshot => {
        const song = snapshot.val();
        if (song.artist) {
            recalcularArtistas(artistas, callback);
        }
    });

    // Listener para eliminar canciones
    firebase.database().ref('songs').on('child_removed', snapshot => {
        const song = snapshot.val();
        if (song.artist && artistas[song.artist]) {
            artistas[song.artist]--;
            if (artistas[song.artist] === 0) {
                delete artistas[song.artist];
            }
            callback(artistas);
        }
    });
}

function recalcularArtistas(artistas, callback) {
    firebase.database().ref('songs').once('value', snapshot => {
        const songs = snapshot.val();
        for (let artist in artistas) {
            artistas[artist] = 0;
        }
        for (let key in songs) {
            const song = songs[key];
            if (song.artist) {
                if (!artistas[song.artist]) {
                    artistas[song.artist] = 0;
                }
                artistas[song.artist]++;
            }
        }
        callback(artistas);
    });
}

function crearChartArtistas() {
    obtenerYEscucharDatosArtistas(artistas => {
        const artistNames = Object.keys(artistas);
        const songCounts = Object.values(artistas);
        const totalArtistas = artistNames.length;

        // Generar colores aleatorios
        const coloresAleatorios = generarColoresAleatorios(totalArtistas);

        const chartOptions = {
            series: songCounts,
            colors: coloresAleatorios,
            chart: {
                height: 320,
                width: "100%",
                type: "donut",
            },
            stroke: {
                colors: ["transparent"],
                lineCap: "",
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontFamily: "Inter, sans-serif",
                                offsetY: 20,
                            },
                            total: {
                                showAlways: true,
                                show: true,
                                label: "Artistas",
                                fontFamily: "Inter, sans-serif",
                                formatter: function () {
                                    return totalArtistas;
                                },
                            },
                            value: {
                                show: true,
                                fontFamily: "Inter, sans-serif",
                                offsetY: -20,
                                formatter: function (value) {
                                    return value;
                                },
                            },
                        },
                        size: "80%",
                    },
                },
            },
            grid: {
                padding: {
                    top: -2,
                },
            },
            labels: artistNames,
            dataLabels: {
                enabled: false,
            },
            legend: {
                position: "bottom",
                fontFamily: "Inter, sans-serif",
            },
            yaxis: {
                labels: {
                    formatter: function (value) {
                        return value;
                    },
                },
            },
            xaxis: {
                labels: {
                    formatter: function (value) {
                        return value;
                    },
                },
                axisTicks: {
                    show: false,
                },
                axisBorder: {
                    show: false,
                },
            },
        };

        if (document.getElementById("donut-chart-2") && typeof ApexCharts !== 'undefined') {
            const chart = new ApexCharts(document.getElementById("donut-chart-2"), chartOptions);
            chart.render();

            obtenerYEscucharDatosArtistas(artistas => {
                const artistNames = Object.keys(artistas);
                const songCounts = Object.values(artistas);
                chart.updateOptions({
                    labels: artistNames,
                    series: songCounts,
                    plotOptions: {
                        pie: {
                            donut: {
                                labels: {
                                    total: {
                                        formatter: function () {
                                            return artistNames.length;
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
            });
        }
    });
}

crearChartArtistas(); // Llamar a la función para crear el gráfico


// Función para obtener la lista de todos los géneros disponibles
function obtenerGenerosDisponibles() {
    return firebase.database().ref('genres').once('value')
        .then(snapshot => {
            const generos = [];
            snapshot.forEach(childSnapshot => {
                generos.push(childSnapshot.val());
            });
            return generos;
        })
        .catch(error => {
            console.error('Error al obtener los géneros:', error);
            return [];
        });
}

// Función para obtener la cantidad de canciones por género
function obtenerCantidadCancionesPorGenero(generos) {
    return firebase.database().ref('songs').once('value')
        .then(snapshot => {
            const data = snapshot.val();
            const cancionesPorGenero = {};

            // Inicializar el contador de canciones por género
            generos.forEach(genero => {
                cancionesPorGenero[genero] = 0;
            });

            // Contar la cantidad de canciones por género
            for (let key in data) {
                const cancion = data[key];
                const genero = cancion.gender;

                if (cancionesPorGenero[genero] !== undefined) {
                    cancionesPorGenero[genero]++;
                }
            }

            return cancionesPorGenero;
        })
        .catch(error => {
            console.error('Error al obtener la cantidad de canciones por género:', error);
            return {};
        });
}

// Función para generar colores aleatorios
function generarColorAleatorio() {
    return `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.5)`;
}

// Función para generar el gráfico con Chart.js
function generarGraficoCancionesPorGenero(data) {
    const ctx = document.getElementById('graficoCancionesPorGenero').getContext('2d');

    const colores = Object.keys(data).map(() => generarColorAleatorio()); // Generar colores aleatorios para cada barra

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data), // Nombres de los géneros
            datasets: [{
                label: 'Cantidad de Canciones',
                data: Object.values(data), // Cantidad de canciones por género
                backgroundColor: colores, // Asignar colores aleatorios
                borderColor: 'rgba(54, 162, 235, 8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
// Función para generar los botones con colores específicos
function generarBotonesConColor(data) {
    const container = document.getElementById('botonesGenero');

    Object.entries(data).forEach(([genero, cantidad]) => {
        const boton = document.createElement('button');
        boton.textContent = `${genero} (${cantidad})`;
        boton.style.backgroundColor = generarColorAleatorio(); // Asignar color aleatorio al botón
        boton.classList.add('botonGenero');
        container.appendChild(boton);
    });
}
// Obtener todos los géneros disponibles y generar el gráfico cuando se cargue la página
window.onload = function() {
    obtenerGenerosDisponibles()
        .then(generos => {
            return obtenerCantidadCancionesPorGenero(generos);
        })
        .then(cancionesPorGenero => {
            generarGraficoCancionesPorGenero(cancionesPorGenero);
        });
};

// Crear una referencia a la colección de canciones en tu base de datos
const songsRef = db.ref('songs');

// Definir un conjunto para almacenar artistas únicos
const uniqueArtists = new Set();

// Obtener las canciones de la base de datos
songsRef.once('value', (snapshot) => {
    snapshot.forEach((songSnapshot) => {
        const songData = songSnapshot.val();
        // Obtener los nombres de los artistas de la canción
        const artists = songData.artist.split(',').map(artist => artist.trim());
        // Agregar cada artista al conjunto de artistas únicos
        artists.forEach(artist => uniqueArtists.add(artist));
    });
    // Obtener el número total de artistas únicos
    const totalUniqueArtists = uniqueArtists.size;
    // Mostrar el número total de artistas únicos en el HTML
    document.getElementById('totalArtists').textContent = totalUniqueArtists;
});