<?php
require_once 'includes/db.php';
require_once 'includes/functions.php';

// Initial fetch for properties
$stmt = $pdo->query("SELECT * FROM properties ORDER BY created_at DESC");
$properties = $stmt->fetchAll();

// Get unique cities for filter
$stmt = $pdo->query("SELECT DISTINCT city FROM properties");
$cities = $stmt->fetchAll(PDO::FETCH_COLUMN);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Property Listings | Pillars to Home</title>
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
            <a href="listings.php" class="text-black font-bold">Listings</a>
            <a href="about.php" class="hover:text-gold-600 transition">About</a>
            <a href="investment.php" class="hover:text-gold-600 transition">Investment</a>
            <a href="contact.php" class="hover:text-gold-600 transition">Contact</a>
        </div>
    </nav>

    <!-- Header -->
    <header class="pt-32 pb-12 px-6 max-w-7xl mx-auto">
        <h1 class="text-5xl md:text-6xl mb-4">Curated Residences</h1>
        <p class="text-gray-500 text-lg font-light">Explore our exclusive portfolio of luxury properties across the globe.</p>
    </header>

    <!-- Filters -->
    <section class="sticky top-20 z-40 bg-white/90 backdrop-blur-md py-6 px-6 border-b border-gray-100 mb-12">
        <div class="max-w-7xl mx-auto flex flex-wrap gap-6 items-center">
            <div class="flex flex-col gap-1">
                <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400">City</label>
                <select id="filter-city" class="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-black outline-none transition min-w-[150px]">
                    <option value="">All Cities</option>
                    <?php foreach ($cities as $city): ?>
                    <option value="<?= $city ?>"><?= $city ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400">Budget (Max)</label>
                <select id="filter-budget" class="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-black outline-none transition min-w-[150px]">
                    <option value="">Any Budget</option>
                    <option value="50000000">Up to 5 Cr</option>
                    <option value="100000000">Up to 10 Cr</option>
                    <option value="250000000">Up to 25 Cr</option>
                    <option value="500000000">Up to 50 Cr</option>
                </select>
            </div>
            <div class="flex flex-col gap-1">
                <label class="text-[10px] uppercase tracking-widest font-bold text-gray-400">BHK</label>
                <select id="filter-bhk" class="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-black outline-none transition min-w-[150px]">
                    <option value="">Any BHK</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4 BHK</option>
                    <option value="5">5+ BHK</option>
                </select>
            </div>
            <button id="reset-filters" class="mt-4 text-xs font-bold uppercase tracking-widest hover:text-red-500 transition">Reset</button>
        </div>
    </section>

    <!-- Property Grid -->
    <main class="px-6 max-w-7xl mx-auto pb-24">
        <div id="property-grid" class="grid grid-cols-1 md:grid-cols-3 gap-12">
            <!-- Properties will be loaded here via JS -->
            <?php foreach ($properties as $prop): ?>
            <div class="group cursor-pointer property-card" data-city="<?= $prop['city'] ?>" data-price="<?= $prop['price'] ?>" data-bhk="<?= $prop['bhk'] ?>">
                <div class="relative overflow-hidden rounded-3xl aspect-[4/5] mb-6 shadow-lg">
                    <img src="<?= $prop['images'] ?>" alt="<?= $prop['title'] ?>" class="w-full h-full object-cover group-hover:scale-110 transition duration-700">
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
        <div id="no-results" class="hidden text-center py-24">
            <h3 class="text-3xl text-gray-400">No properties match your criteria.</h3>
            <p class="text-gray-500 mt-4">Try adjusting your filters or contact us for off-market options.</p>
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
        const cityFilter = document.getElementById('filter-city');
        const budgetFilter = document.getElementById('filter-budget');
        const bhkFilter = document.getElementById('filter-bhk');
        const resetBtn = document.getElementById('reset-filters');
        const propertyGrid = document.getElementById('property-grid');
        const noResults = document.getElementById('no-results');
        const cards = document.querySelectorAll('.property-card');

        function filterProperties() {
            const city = cityFilter.value;
            const budget = budgetFilter.value ? parseInt(budgetFilter.value) : Infinity;
            const bhk = bhkFilter.value ? parseInt(bhkFilter.value) : 0;

            let visibleCount = 0;

            cards.forEach(card => {
                const cardCity = card.dataset.city;
                const cardPrice = parseInt(card.dataset.price);
                const cardBhk = parseInt(card.dataset.bhk);

                const cityMatch = !city || cardCity === city;
                const budgetMatch = cardPrice <= budget;
                const bhkMatch = !bhk || cardBhk >= bhk;

                if (cityMatch && budgetMatch && bhkMatch) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            if (visibleCount === 0) {
                propertyGrid.classList.add('hidden');
                noResults.classList.remove('hidden');
            } else {
                propertyGrid.classList.remove('hidden');
                noResults.classList.add('hidden');
            }
        }

        cityFilter.addEventListener('change', filterProperties);
        budgetFilter.addEventListener('change', filterProperties);
        bhkFilter.addEventListener('change', filterProperties);
        resetBtn.addEventListener('click', () => {
            cityFilter.value = '';
            budgetFilter.value = '';
            bhkFilter.value = '';
            filterProperties();
        });
    </script>
</body>
</html>
