// Carrossel de Fotos
let slideIndex = 0;
const slideshowWrapper = document.querySelector(".slideshow-wrapper");
const slides = document.getElementsByClassName("slide");

function showSlides() {
    if (!slideshowWrapper || slides.length === 0) {
        console.error("Erro: slideshow-wrapper ou slides não encontrados.");
        return;
    }
    slideIndex++;
    if (slideIndex >= slides.length) {
        slideIndex = 0;
        slideshowWrapper.style.transition = "none"; // Remove transição ao reiniciar
        slideshowWrapper.style.transform = `translateX(0%)`;
        setTimeout(() => {
            slideshowWrapper.style.transition = "transform 0.5s ease-in-out"; // Restaura transição
        }, 50);
    } else {
        slideshowWrapper.style.transform = `translateX(-${slideIndex * 100}%)`;
    }
    setTimeout(showSlides, 3000); // Muda a cada 3 segundos
}

// Inicia o carrossel
if (slides.length > 0) {
    showSlides();
} else {
    console.error("Nenhuma imagem encontrada no carrossel.");
}

// Animação de Fogos
function launchFireworks() {
    if (typeof confetti === "undefined") {
        console.error("Erro: canvas-confetti não carregado.");
        return;
    }
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff6f61', '#ffb88c', '#ffffff']
    });
}
setInterval(launchFireworks, 2000); // Fogos a cada 2 segundos