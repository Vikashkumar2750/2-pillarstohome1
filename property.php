<?php
require_once 'includes/db.php';
require_once 'includes/functions.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$prop = getProperty($id);

if (!$prop) {
    header('Location: listings.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $prop['title'] ?> | Pillars to Home</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3 { font-family: 'DM Serif Display', serif; }
        .glass { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); }
    </style>
</head>
<body class="bg-white text-gray-900">
    <!-- Navigation -->
    <nav class="fixed w-full z-50 px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-gray-100">
        <a href="index.php" class="text-2xl font-bold tracking-tighter">PILLARS TO HOME</a>
        <div class="hidden md:flex space-x-8 text-sm font-medium uppercase tracking-widest">
            <a href="index.php" class="hover:text-gold-600 transition">Home</a>
            <a href="listings.php" class="hover:text-gold-600 transition">Listings</a>
            <a href="contact.php" class="hover:text-gold-600 transition">Contact</a>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <!-- Left Column: Details -->
            <div class="lg:col-span-2">
                <div class="mb-12">
                    <span class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 block"><?= $prop['location'] ?></span>
                    <h1 class="text-5xl md:text-6xl mb-6"><?= $prop['title'] ?></h1>
                    <div class="flex gap-8 text-sm font-medium uppercase tracking-widest border-y border-gray-100 py-6">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400">Price:</span>
                            <span><?= formatCurrency($prop['price']) ?></span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400">BHK:</span>
                            <span><?= $prop['bhk'] ?> BHK</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-gray-400">City:</span>
                            <span><?= $prop['city'] ?></span>
                        </div>
                    </div>
                </div>

                <!-- Gallery -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    <div class="rounded-3xl overflow-hidden aspect-video md:col-span-2">
                        <img src="<?= $prop['images'] ?>" class="w-full h-full object-cover" alt="Property Main">
                    </div>
                    <div class="rounded-3xl overflow-hidden aspect-square">
                        <img src="https://images.unsplash.com/photo-1600607687940-47a04b629753?auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover" alt="Interior">
                    </div>
                    <div class="rounded-3xl overflow-hidden aspect-square">
                        <img src="https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover" alt="Living Room">
                    </div>
                </div>

                <!-- Description -->
                <div class="mb-12">
                    <h2 class="text-3xl mb-6">About this Property</h2>
                    <p class="text-gray-600 leading-relaxed text-lg font-light mb-8">
                        <?= nl2br($prop['description']) ?>
                    </p>
                    <h3 class="text-xl font-bold uppercase tracking-widest text-xs mb-6">Amenities</h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <?php 
                        $amenities = explode(',', $prop['amenities']);
                        foreach ($amenities as $amenity): 
                        ?>
                        <div class="flex items-center gap-3 text-gray-500">
                            <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                            <?= trim($amenity) ?>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <!-- Video Embed -->
                <div class="mb-12">
                    <h2 class="text-3xl mb-6">Property Tour</h2>
                    <div class="rounded-3xl overflow-hidden aspect-video bg-gray-100">
                        <iframe class="w-full h-full" src="https://www.youtube.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen></iframe>
                    </div>
                </div>

                <!-- Map -->
                <div class="mb-12">
                    <h2 class="text-3xl mb-6">Location</h2>
                    <div class="rounded-3xl overflow-hidden h-[400px] bg-gray-100">
                        <iframe class="w-full h-full grayscale" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3770.796904221702!2d72.8335!3d18.922!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTjCsDU1JzE5LjIiTiA3MsKwNTAnMDAuNiJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin" frameborder="0" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                    </div>
                </div>
            </div>

            <!-- Right Column: Inquiry Form -->
            <div class="lg:col-span-1">
                <div class="sticky top-32 bg-gray-50 p-10 rounded-[40px] shadow-sm">
                    <h2 class="text-3xl mb-4">Inquire Now</h2>
                    <p class="text-gray-500 mb-8 text-sm">Fill out the form below and our property advisor will contact you shortly.</p>
                    
                    <form id="property-inquiry-form" class="space-y-6">
                        <input type="hidden" name="property_id" value="<?= $prop['id'] ?>">
                        <input type="hidden" name="status" value="submitted">
                        <div>
                            <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Full Name</label>
                            <input type="text" name="name" required class="w-full bg-white border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition shadow-sm" placeholder="John Doe">
                        </div>
                        <div>
                            <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Email Address</label>
                            <input type="email" name="email" required class="w-full bg-white border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition shadow-sm" placeholder="john@example.com">
                        </div>
                        <div>
                            <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2 block">Phone Number</label>
                            <input type="tel" name="phone" required class="w-full bg-white border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-black outline-none transition shadow-sm" placeholder="+91 98765 43210">
                        </div>
                        <button type="submit" class="w-full bg-black text-white py-5 rounded-2xl font-bold hover:bg-gray-800 transition shadow-xl mt-4">Send Inquiry</button>
                    </form>
                    <div id="form-success" class="hidden mt-6 p-4 bg-green-50 text-green-700 rounded-2xl text-center text-sm font-medium">
                        Thank you! We will contact you shortly.
                    </div>
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
        const form = document.getElementById('property-inquiry-form');
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
