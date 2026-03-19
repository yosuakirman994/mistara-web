document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('open');
            
            // Transform hamburger icon
            const bars = document.querySelectorAll('.bar');
            if (menuToggle.classList.contains('open')) {
                bars[0].style.transform = 'translateY(8px) rotate(45deg)';
                bars[1].style.opacity = '0';
                bars[2].style.transform = 'translateY(-8px) rotate(-45deg)';
            } else {
                bars[0].style.transform = 'none';
                bars[1].style.opacity = '1';
                bars[2].style.transform = 'none';
            }
        });
    }

    // Set active link visually based on URL path
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === path && !link.classList.contains('btn-outline')) {
            link.classList.add('active');
        }
    });

    // Mobile dropdown toggle
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(drop => {
        drop.addEventListener('click', () => {
            if(window.innerWidth <= 768) {
                drop.classList.toggle('active');
            }
        });
    });
});
