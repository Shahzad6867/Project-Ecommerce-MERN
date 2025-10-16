
        document.addEventListener('DOMContentLoaded', function() {
            const carousel = document.querySelector('.flex.transition-transform');
            const slides = document.querySelectorAll('.min-w-full');
            const dots = document.querySelectorAll('.absolute button');
            let currentIndex = 0;

            function updateCarousel() {
                carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
                dots.forEach((dot, index) => {
                    dot.style.backgroundColor = index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)';
                });
            }

            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    currentIndex = index;
                    updateCarousel();
                });
            });

            // Auto-rotate every 5 seconds
            setInterval(() => {
                currentIndex = (currentIndex + 1) % slides.length;
                updateCarousel();
            }, 5000);
        });
