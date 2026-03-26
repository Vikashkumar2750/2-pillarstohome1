<?php
/**
 * Reusable Landing Page Template - Pillars to Home
 */
require_once 'includes/db.php';
require_once 'includes/functions.php';

$campaign_name = isset($_GET['campaign']) ? sanitize($_GET['campaign']) : 'General Luxury';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $campaign_name ?> | Pillars to Home</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'DM Serif Display', serif; }
        .hero-bg { background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1920&q=80'); background-size: cover; background-position: center; }
    </style>
</head>
<body class="bg-white text-gray-900">
    <!-- Hero -->
    <section class="min-h-screen hero-bg flex items-center justify-center px-6 py-24">
        <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div class="text-white">
                <h1 class="text-5xl md:text-7xl mb-8 leading-tight">Your Exclusive Gateway to <?= $campaign_name ?></h1>
                <p class="text-xl font-light mb-12 opacity-80">Experience the pinnacle of luxury living with our curated collection of off-market residences.</p>
                <div class="flex items-center gap-8">
                    <div>
                        <p class="text-3xl font-serif">100+</p>
                        <p class="text-[10px] uppercase tracking-widest font-bold opacity-60">Units Available</p>
                    </div>
                    <div class="w-px h-12 bg-white/20"></div>
                    <div>
                        <p class="text-3xl font-serif">24/7</p>
                        <p class="text-[10px] uppercase tracking-widest font-bold opacity-60">Expert Support</p>
                    </div>
                </div>
            </div>

            <!-- Form Card -->
            <div class="bg-white rounded-[40px] p-12 shadow-2xl">
                <h2 class="text-3xl mb-4 text-black">Get Early Access</h2>
                <p class="text-gray-500 mb-8 text-sm">Register now to receive the full property brochure and pricing details.</p>
                
                <form id="landing-form" class="space-y-6">
                    <input type="hidden" name="status" value="submitted">
                    <input type="hidden" name="utm_campaign" value="<?= $campaign_name ?>">
                    <div>
                        <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Full Name</label>
                        <input type="text" name="name" required class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition" placeholder="John Doe">
                    </div>
                    <div>
                        <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Email Address</label>
                        <input type="email" name="email" required class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition" placeholder="john@example.com">
                    </div>
                    <div>
                        <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Phone Number</label>
                        <input type="tel" name="phone" required class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition" placeholder="+91 98765 43210">
                    </div>
                    <button type="submit" class="w-full bg-black text-white py-5 rounded-2xl font-bold hover:bg-gray-800 transition shadow-xl mt-4">Download Brochure</button>
                </form>
                <div id="form-success" class="hidden mt-6 p-4 bg-green-50 text-green-700 rounded-2xl text-center text-sm font-medium">
                    Success! Check your email for the brochure.
                </div>
            </div>
        </div>
    </section>

    <!-- Scripts -->
    <script src="assets/js/tracker.js"></script>
    <script src="assets/js/lead_capture.js"></script>
    <script>
        const form = document.getElementById('landing-form');
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
