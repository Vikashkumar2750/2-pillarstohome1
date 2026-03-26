<?php
require_once 'includes/db.php';
require_once 'includes/functions.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investment & NRI Services | Pillars to Home</title>
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
            <a href="investment.php" class="text-black font-bold">Investment</a>
            <a href="contact.php" class="hover:text-gold-600 transition">Contact</a>
        </div>
    </nav>

    <!-- Header -->
    <header class="pt-32 pb-24 px-6 max-w-7xl mx-auto text-center">
        <h1 class="text-5xl md:text-7xl mb-8">Global Investment <br> Advisory</h1>
        <p class="text-gray-500 text-xl font-light max-w-3xl mx-auto">Providing specialized real estate investment services for NRIs and global institutional investors.</p>
    </header>

    <!-- Services -->
    <section class="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
        <div class="bg-gray-50 p-12 rounded-[40px] shadow-sm hover:shadow-xl transition">
            <h3 class="text-3xl mb-6">NRI Services</h3>
            <p class="text-gray-500 font-light leading-relaxed mb-8">End-to-end support for Non-Resident Indians, including legal, tax, and property management services.</p>
            <a href="contact.php" class="text-xs font-bold uppercase tracking-widest border-b-2 border-black pb-1">Learn More</a>
        </div>
        <div class="bg-gray-50 p-12 rounded-[40px] shadow-sm hover:shadow-xl transition">
            <h3 class="text-3xl mb-6">Portfolio Growth</h3>
            <p class="text-gray-500 font-light leading-relaxed mb-8">Strategic advice on building a diversified global real estate portfolio for long-term capital appreciation.</p>
            <a href="contact.php" class="text-xs font-bold uppercase tracking-widest border-b-2 border-black pb-1">Learn More</a>
        </div>
        <div class="bg-gray-50 p-12 rounded-[40px] shadow-sm hover:shadow-xl transition">
            <h3 class="text-3xl mb-6">Off-Market Access</h3>
            <p class="text-gray-500 font-light leading-relaxed mb-8">Exclusive access to off-market luxury units and pre-launch opportunities in prime global locations.</p>
            <a href="contact.php" class="text-xs font-bold uppercase tracking-widest border-b-2 border-black pb-1">Learn More</a>
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
