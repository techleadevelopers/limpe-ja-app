
// JavaScript for FAQ accordion functionality
document.addEventListener('DOMContentLoaded', () => {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Toggle active class on the clicked item
            item.classList.toggle('active');

            // Close other open FAQ items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
        });
    });

    // Advanced Phone Slider functionality with modern features
    const phoneSlider = document.getElementById('phoneSlider');
    const phoneMockups = phoneSlider.querySelectorAll('.phone-mockup');
    const totalPhones = phoneMockups.length;
    let currentIndex = 1; // Start with the second phone as active-center
    let isAnimating = false;
    let autoSlideInterval;
    let touchStartX = 0;
    let touchEndX = 0;

    // Preload images for better performance
    function preloadImages() {
        phoneMockups.forEach(phone => {
            const img = phone.querySelector('img');
            if (img) {
                const newImg = new Image();
                newImg.src = img.src;
            }
        });
    }

    // Update slider position with smooth animations
    function updateSliderPosition(animate = true) {
        if (phoneMockups.length === 0) return;
        
        isAnimating = true;
        const phoneWidth = phoneMockups[0].offsetWidth + (parseFloat(getComputedStyle(phoneMockups[0]).marginRight) * 2);
        const offset = -currentIndex * phoneWidth + (phoneSlider.offsetWidth / 2) - (phoneWidth / 2);
        
        if (animate) {
            phoneSlider.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        } else {
            phoneSlider.style.transition = 'none';
        }
        
        phoneSlider.style.transform = `translateX(${offset}px)`;

        // Update active-center class and opacity with staggered animation
        phoneMockups.forEach((phone, index) => {
            setTimeout(() => {
                if (index === currentIndex) {
                    phone.classList.add('active-center');
                    phone.style.filter = 'brightness(1) saturate(1.1)';
                    phone.style.opacity = '1';
                } else {
                    phone.classList.remove('active-center');
                    phone.style.filter = 'brightness(0.7) saturate(0.8)';
                    phone.style.opacity = '0.6';
                }
            }, Math.abs(index - currentIndex) * 50);
        });

        // Reset animation flag after transition
        setTimeout(() => {
            isAnimating = false;
        }, 600);
    }

    // Move slider with enhanced direction control
    function moveSlider(direction) {
        if (isAnimating) return;
        
        const previousIndex = currentIndex;
        currentIndex += direction;
        
        if (currentIndex < 0) {
            currentIndex = totalPhones - 1;
        } else if (currentIndex >= totalPhones) {
            currentIndex = 0;
        }
        
        // Add visual feedback for navigation
        const arrows = document.querySelectorAll('.slider-arrow');
        arrows.forEach(arrow => {
            arrow.style.transform = 'translateY(-50%) scale(0.9)';
            setTimeout(() => {
                arrow.style.transform = 'translateY(-50%) scale(1)';
            }, 150);
        });
        
        updateSliderPosition();
        resetAutoSlide();
    }

    // Auto-slide functionality
    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            if (!isAnimating) {
                moveSlider(1);
            }
        }, 4000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }

    // Touch/swipe support for mobile
    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoSlide();
    }

    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoSlide();
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                moveSlider(1); // Swipe left, move right
            } else {
                moveSlider(-1); // Swipe right, move left
            }
        }
    }

    // Keyboard navigation
    function handleKeyNavigation(e) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            moveSlider(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            moveSlider(1);
        }
    }

    // Mouse wheel navigation
    function handleWheelNavigation(e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
            if (e.deltaX > 0) {
                moveSlider(1);
            } else {
                moveSlider(-1);
            }
        }
    }

    // Initialize slider
    function initializeSlider() {
        preloadImages();
        updateSliderPosition(false);
        startAutoSlide();
        
        // Event listeners for arrows
        const leftArrow = document.querySelector('.slider-arrow.left');
        const rightArrow = document.querySelector('.slider-arrow.right');
        
        if (leftArrow) {
            leftArrow.addEventListener('click', () => moveSlider(-1));
        }
        if (rightArrow) {
            rightArrow.addEventListener('click', () => moveSlider(1));
        }
        
        // Touch and gesture support
        phoneSlider.addEventListener('touchstart', handleTouchStart, { passive: true });
        phoneSlider.addEventListener('touchend', handleTouchEnd, { passive: true });
        phoneSlider.addEventListener('wheel', handleWheelNavigation, { passive: false });
        document.addEventListener('keydown', handleKeyNavigation);
        
        // Pause auto-slide on hover
        phoneSlider.addEventListener('mouseenter', stopAutoSlide);
        phoneSlider.addEventListener('mouseleave', startAutoSlide);
        
        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                updateSliderPosition(false);
            }, 250);
        });
    }

    // Make moveSlider globally available for backward compatibility
    window.moveSlider = moveSlider;

    // Initialize everything
    initializeSlider();

    // Enhanced social icons interaction
    const socialIcons = document.querySelectorAll('.social-icon-container');
    socialIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'translateX(15px) scale(1.2) rotateY(10deg)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'translateX(0) scale(1) rotateY(0deg)';
        });
        
        icon.addEventListener('click', (e) => {
            e.preventDefault();
            // Add click effect
            icon.style.transform = 'translateX(15px) scale(1.1) rotateY(10deg)';
            setTimeout(() => {
                icon.style.transform = 'translateX(15px) scale(1.2) rotateY(10deg)';
            }, 150);
        });
    });
});
