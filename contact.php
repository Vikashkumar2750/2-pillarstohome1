<?php
require_once 'includes/db.php';
require_once 'includes/functions.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us | Pillars to Home</title>
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
            <a href="contact.php" class="text-black font-bold">Contact</a>
        </div>
    </nav>

    <!-- Header -->
    <header class="pt-32 pb-12 px-6 max-w-7xl mx-auto">
        <h1 class="text-5xl md:text-6xl mb-4">Get in Touch</h1>
        <p class="text-gray-500 text-lg font-light">Our bespoke advisory team is available for private consultations.</p>
    </header>

    <!-- Contact Section -->
    <main class="px-6 max-w-7xl mx-auto pb-24">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-24">
            <!-- Form -->
            <div>
                <form id="contact-form" class="space-y-8">
                    <input type="hidden" name="status" value="submitted">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Full Name</label>
                            <input type="text" name="name" required class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition" placeholder="John Doe">
                        </div>
                        <div>
                            <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Email Address</label>
                            <input type="email" name="email" required class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition" placeholder="john@example.com">
                        </div>
                    </div>
                    <div>
                        <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Phone Number</label>
                        <input type="tel" name="phone" required class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition" placeholder="+91 98765 43210">
                    </div>
                    <div>
                        <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Message (Optional)</label>
                        <textarea name="message" rows="5" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition" placeholder="How can we help you?"></textarea>
                    </div>
                    <button type="submit" class="bg-black text-white px-12 py-5 rounded-full text-lg font-medium hover:bg-gray-800 transition shadow-2xl">Send Message</button>
                </form>
                <div id="form-success" class="hidden mt-12 p-8 bg-green-50 text-green-700 rounded-3xl text-center text-lg font-medium">
                    Thank you! Your message has been received.
                </div>
            </div>

            <!-- Info -->
            <div class="space-y-12">
                <div>
                    <h3 class="text-xl font-bold uppercase tracking-widest text-xs mb-6">Global Offices</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 class="font-bold mb-2">Mumbai</h4>
                            <p class="text-gray-500 text-sm leading-relaxed">Level 15, One BKC, Bandra Kurla Complex, Mumbai 400051</p>
                        </div>
                        <div>
                            <h4 class="font-bold mb-2">Dubai</h4>
                            <p class="text-gray-500 text-sm leading-relaxed">Burj Daman, DIFC, Dubai, UAE</p>
                        </div>
                        <div>
                            <h4 class="font-bold mb-2">London</h4>
                            <p class="text-gray-500 text-sm leading-relaxed">1 Berkeley Square, Mayfair, London W1J 6EA</p>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-xl font-bold uppercase tracking-widest text-xs mb-6">Direct Contact</h3>
                    <p class="text-2xl font-light mb-2">inquiry@pillarstohome.com</p>
                    <p class="text-2xl font-light">+91 22 6789 0000</p>
                </div>
            </div>
        </div>
    </main>

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
    <script>
        const form = document.getElementById('contact-form');
        const successMsg = document.getElementById('form-success');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            data.status = 'submitted';
            data.source_url = window.location.href;

            try {
                const response = await fetch('api/save_lead.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.status === 'success') {
                    form.classList.add('hidden');
                    successMsg.classList.remove('hidden');
                }
            } catch (err) {
                console.error('Submission error:', err);
            }
        });
    </script>
</body>
</html>
