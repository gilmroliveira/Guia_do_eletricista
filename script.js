// Carrossel de Fotos
let slideIndex = 0;
const slides = document.getElementsByClassName("slide");
const slideshowWrapper = document.querySelector(".slideshow-wrapper");

function showSlides() {
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

// Inicializa o carrossel
function initSlideshow() {
    // Cria o wrapper dinamicamente se necessário
    const slideshowContainer = document.querySelector(".slideshow-container");
    const wrapper = document.createElement("div");
    wrapper.className = "slideshow-wrapper";
    while (slideshowContainer.firstChild) {
        wrapper.appendChild(slideshowContainer.firstChild);
    }
    slideshowContainer.appendChild(wrapper);
    showSlides();
}
initSlideshow();

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