<?php
require_once 'includes/db.php';
require_once 'includes/functions.php';

$featured_properties = getFeaturedProperties(3);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pillars to Home | Luxury Real Estate</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'DM Serif Display', serif; }
        .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
        .hero-gradient { background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80'); background-size: cover; background-position: center; }
    </style>
</head>
<body class="bg-white text-gray-900 transition-colors duration-300">
    <!-- Navigation -->
    <nav class="fixed w-full z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md">
        <a href="index.php" class="text-2xl font-bold tracking-tighter">PILLARS TO HOME</a>
        <div class="hidden md:flex space-x-8 text-sm font-medium uppercase tracking-widest">
            <a href="index.php" class="hover:text-gold-600 transition">Home</a>
            <a href="listings.php" class="hover:text-gold-600 transition">Listings</a>
            <a href="about.php" class="hover:text-gold-600 transition">About</a>
            <a href="investment.php" class="hover:text-gold-600 transition">Investment</a>
            <a href="contact.php" class="hover:text-gold-600 transition">Contact</a>
        </div>
        <button id="theme-toggle" class="p-2 rounded-full hover:bg-gray-100 transition">
            <svg id="sun-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.071 16.071l.707.707M7.757 7.757l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"></path></svg>
            <svg id="moon-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
        </button>
    </nav>

    <!-- Hero Section -->
    <section class="h-screen hero-gradient flex items-center justify-center text-white text-center px-4">
        <div class="max-w-4xl">
            <h1 class="text-5xl md:text-7xl mb-6 leading-tight">Exceptional Living <br> For Exceptional People</h1>
            <p class="text-lg md:text-xl mb-10 font-light tracking-wide">Curating the world's most prestigious properties in Dubai, London, and Mumbai.</p>
            <div class="flex flex-col md:flex-row justify-center gap-4">
                <a href="listings.php" class="bg-white text-black px-10 py-4 rounded-full font-medium hover:bg-gray-100 transition shadow-xl">Explore Properties</a>
                <a href="contact.php" class="glass text-white px-10 py-4 rounded-full font-medium hover:bg-white/20 transition">Inquire Now</a>
            </div>
        </div>
    </section>

    <!-- Featured Properties -->
    <section class="py-24 px-6 max-w-7xl mx-auto">
        <div class="flex justify-between items-end mb-16">
            <div>
                <h2 class="text-4xl md:text-5xl mb-4">Featured Collections</h2>
                <p class="text-gray-500 max-w-md">Discover our hand-picked selection of luxury residences designed for the modern connoisseur.</p>
            </div>
            <a href="listings.php" class="text-sm font-bold uppercase tracking-widest border-b-2 border-black pb-1 hover:text-gray-600 transition">View All</a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
            <?php foreach ($featured_properties as $prop): ?>
            <div class="group cursor-pointer">
                <div class="relative overflow-hidden rounded-3xl aspect-[4/5] mb-6 shadow-lg">
                    <img src="<?= $prop['images'] ?>" alt="<?= $prop['title'] ?>" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
                    <div class="absolute top-6 right-6 bg-white/90 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">Featured</div>
                </div>
                <h3 class="text-2xl mb-2"><?= $prop['title'] ?></h3>
                <p class="text-gray-500 mb-4 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <?= $prop['location'] ?>
                </p>
                <div class="flex justify-between items-center">
                    <span class="text-xl font-semibold"><?= formatCurrency($prop['price']) ?></span>
                    <a href="property.php?id=<?= $prop['id'] ?>" class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-black hover:text-white transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </a>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 bg-gray-50">
        <div class="max-w-5xl mx-auto px-6 text-center">
            <h2 class="text-4xl md:text-6xl mb-8">Ready to find your dream home?</h2>
            <p class="text-xl text-gray-500 mb-12 font-light">Our expert advisors are ready to assist you in your global real estate journey.</p>
            <a href="contact.php" class="bg-black text-white px-12 py-5 rounded-full text-lg font-medium hover:bg-gray-800 transition shadow-2xl inline-block">Book a Private Viewing</a>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white py-20 px-6 border-t border-gray-100">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div class="col-span-1 md:col-span-2">
                <h2 class="text-2xl font-bold mb-6">PILLARS TO HOME</h2>
                <p class="text-gray-500 max-w-sm mb-8 leading-relaxed">Redefining luxury real estate through transparency, technology, and unparalleled service.</p>
                <div class="flex space-x-6">
                    <a href="#" class="text-gray-400 hover:text-black transition">Instagram</a>
                    <a href="#" class="text-gray-400 hover:text-black transition">LinkedIn</a>
                    <a href="#" class="text-gray-400 hover:text-black transition">Twitter</a>
                </div>
            </div>
            <div>
                <h4 class="font-bold uppercase tracking-widest text-xs mb-6">Quick Links</h4>
                <ul class="space-y-4 text-gray-500">
                    <li><a href="listings.php" class="hover:text-black transition">All Listings</a></li>
                    <li><a href="about.php" class="hover:text-black transition">Our Projects</a></li>
                    <li><a href="investment.php" class="hover:text-black transition">Investment Guide</a></li>
                    <li><a href="contact.php" class="hover:text-black transition">Contact Us</a></li>
                </ul>
            </div>
            <div>
                <h4 class="font-bold uppercase tracking-widest text-xs mb-6">Newsletter</h4>
                <p class="text-gray-500 text-sm mb-6">Subscribe to receive exclusive off-market opportunities.</p>
                <form id="newsletter-form" class="flex gap-2">
                    <input type="email" name="email" placeholder="Email Address" class="bg-gray-50 border-none rounded-full px-6 py-3 w-full focus:ring-2 focus:ring-black outline-none transition">
                    <button type="submit" class="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition">Join</button>
                </form>
            </div>
        </div>
        <div class="max-w-7xl mx-auto mt-20 pt-10 border-t border-gray-50 text-center text-gray-400 text-sm">
            &copy; <?= date('Y') ?> Pillars to Home. All rights reserved.
        </div>
    </footer>

    <!-- Lead Capture Scripts -->
    <script src="assets/js/tracker.js"></script>
    <script src="assets/js/lead_capture.js"></script>
    <script>
        // Theme Toggle
        const themeToggle = document.getElementById('theme-toggle');
        const sunIcon = document.getElementById('sun-icon');
        const moonIcon = document.getElementById('moon-icon');
        
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            if (isDark) {
                document.body.classList.add('bg-gray-900', 'text-white');
                document.body.classList.remove('bg-white', 'text-gray-900');
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            } else {
                document.body.classList.remove('bg-gray-900', 'text-white');
                document.body.classList.add('bg-white', 'text-gray-900');
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            }
        });
    </script>
</body>
</html>
