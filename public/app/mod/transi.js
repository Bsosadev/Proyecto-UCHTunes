
document.addEventListener("DOMContentLoaded", function () {
    // Obtener todas las imágenes
    var images = document.querySelectorAll('img');
    // Índice de la imagen actual
    var currentImageIndex = 0;
    // Función para mostrar la imagen actual
    function showCurrentImage() {
        // Ocultar todas las imágenes
        images.forEach(function (image) {
            image.classList.add('hidden');
        });
        // Mostrar la imagen actual
        images[currentImageIndex].classList.remove('hidden');
    }
    // Mostrar la primera imagen
    showCurrentImage();
    // Función para cambiar la imagen cada 4 segundos
    setInterval(function () {
        // Incrementar el índice para mostrar la siguiente imagen
        currentImageIndex = (currentImageIndex + 1) % images.length;
        // Mostrar la siguiente imagen
        showCurrentImage();
    }, 3000); // 3 segundos
});