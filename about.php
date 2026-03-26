<?php
require_once 'includes/db.php';
require_once 'includes/functions.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About Us | Pillars to Home</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'DM Serif Display', serif; }
    </style>
</head>
<body class="bg-white text-gray-900">
    <!-- Navigation -->
    <nav class="fixed w-full z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100">
        <a href="index.php" class="text-2xl font-bold tracking-tighter">PILLARS TO HOME</a>
        <div class="hidden md:flex space-x-8 text-sm font-medium uppercase tracking-widest">
            <a href="index.php" class="hover:text-gold-600 transition">Home</a>
            <a href="listings.php" class="hover:text-gold-600 transition">Listings</a>
            <a href="about.php" class="text-black font-bold">About</a>
            <a href="contact.php" class="hover:text-gold-600 transition">Contact</a>
        </div>
    </nav>

    <!-- Header -->
    <header class="pt-32 pb-24 px-6 max-w-7xl mx-auto text-center">
        <h1 class="text-5xl md:text-7xl mb-8">Redefining Luxury <br> Real Estate</h1>
        <p class="text-gray-500 text-xl font-light max-w-3xl mx-auto">Founded on the principles of transparency and excellence, Pillars to Home is the premier destination for discerning investors and homeowners.</p>
    </header>

    <!-- Story -->
    <section class="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
        <div class="rounded-[40px] overflow-hidden shadow-2xl">
            <img src="https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=1000&q=80" alt="Office" class="w-full h-full object-cover">
        </div>
        <div>
            <h2 class="text-4xl mb-8">Our Vision</h2>
            <p class="text-gray-600 text-lg font-light leading-relaxed mb-8">
                We believe that a home is more than just a physical space; it's a pillar of your legacy. Our mission is to connect global citizens with properties that reflect their status and aspirations.
            </p>
            <div class="grid grid-cols-2 gap-12">
                <div>
                    <h4 class="text-4xl font-serif mb-2">15+</h4>
                    <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Years Experience</p>
                </div>
                <div>
                    <h4 class="text-4xl font-serif mb-2">$2B+</h4>
                    <p class="text-xs font-bold uppercase tracking-widest text-gray-400">Assets Managed</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-white py-20 px-6 border-t border-gray-100">
        <div class="max-w-7xl mx-auto text-center">
            <h2 class="text-2xl font-bold mb-6">PILLARS TO HOME</h2>
            <p class="text-gray-400 text-sm">&copy; <?= date('Y') ?> Pillars to Home. All rights reserved.</p>
        </div>
    </footer>

    <!-- Scripts -->
    <script src="assets/js/tracker.js"></script>
    <script src="assets/js/lead_capture.js"></script>
</body>
</html>
