<!-- resources/views/layouts/app.blade.php -->
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }}</title>
    @vite('resources/css/app.css')
</head>
<body class="bg-gray-100">
    <div class="flex h-screen bg-gray-100">
        <!-- Sidebar -->
        <aside class="w-64 bg-indigo-600 text-white">
            <div class="p-4">
                <h1 class="text-2xl font-semibold">Dashboard</h1>
            </div>
            <nav class="mt-4">
                <a href="#" class="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
                    <i class="fas fa-home mr-2"></i>Dashboard
                </a>
                <a href="#" class="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
                    <i class="fas fa-users mr-2"></i>Team
                </a>
                <a href="#" class="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
                    <i class="fas fa-folder mr-2"></i>Projects
                </a>
                <a href="#" class="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
                    <i class="fas fa-calendar mr-2"></i>Calendar
                </a>
                <a href="#" class="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
                    <i class="fas fa-file mr-2"></i>Documents
                </a>
                <a href="#" class="block py-2.5 px-4 rounded transition duration-200 hover:bg-indigo-700">
                    <i class="fas fa-chart-bar mr-2"></i>Reports
                </a>
            </nav>
            <div class="mt-8 p-4">
                <h2 class="text-xl font-semibold mb-4">Your teams</h2>
                <div class="space-y-2">
                    <a href="#" class="flex items-center py-2 px-4 rounded transition duration-200 hover:bg-indigo-700">
                        <span class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-2">H</span>
                        Heroicons
                    </a>
                    <a href="#" class="flex items-center py-2 px-4 rounded transition duration-200 hover:bg-indigo-700">
                        <span class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-2">T</span>
                        Tailwind Labs
                    </a>
                    <a href="#" class="flex items-center py-2 px-4 rounded transition duration-200 hover:bg-indigo-700">
                        <span class="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center mr-2">W</span>
                        Workcation
                    </a>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            <div class="container mx-auto px-6 py-8">
                <nav class="flex justify-between items-center mb-4">
                    <div class="flex items-center">
                        <input type="text" placeholder="Search..." class="px-4 py-2 rounded-md bg-white">
                    </div>
                    <div class="flex items-center">
                        <button class="mr-4">
                            <i class="fas fa-bell text-gray-500"></i>
                        </button>
                        <div class="relative">
                            <button class="flex items-center focus:outline-none" id="user-menu" aria-label="User menu" aria-haspopup="true">
                                <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
                                <span class="ml-2 text-gray-700">Tom Cook</span>
                                <svg class="ml-1 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            <!-- Dropdown menu, show/hide based on menu state -->
                            <div class="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Your Profile</a>
                                <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Sign out</a>
                            </div>
                        </div>
                    </div>
                </nav>
                @yield('content')
            </div>
        </main>
    </div>

    <script src="https://kit.fontawesome.com/your-fontawesome-kit.js" crossorigin="anonymous"></script>
    <script>
        // Toggle user menu dropdown
        const userMenu = document.getElementById('user-menu');
        const userMenuDropdown = userMenu.nextElementSibling;
        userMenu.addEventListener('click', () => {
            userMenuDropdown.classList.toggle('hidden');
        });

        // Close the dropdown when clicking outside
        window.addEventListener('click', (event) => {
            if (!userMenu.contains(event.target)) {
                userMenuDropdown.classList.add('hidden');
            }
        });
    </script>
</body>
</html>