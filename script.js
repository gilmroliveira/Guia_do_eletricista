// Carrossel de Fotos
let slideIndex = 0;
const slides = document.getElementsByClassName("slide");

function showSlides() {
    for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slideIndex++;
    if (slideIndex > slides.length) {
        slideIndex = 1;
    }
    slides[slideIndex - 1].style.display = "block";
    setTimeout(showSlides, 3000); // Muda a cada 3 segundos
}
showSlides();

// Animação de Fogos
function launchFireworks() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6f61', '#ffb88c', '#ffffff']
    });
}
setInterval(launchFireworks, 2000); // Fogos a cada 2 segundos