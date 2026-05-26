<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REMEHBS | @yield('title')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        :root {
            --primary-color: #3b82f6;
            --secondary-color: #1e40af;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --danger-color: #ef4444;
            --dark-color: #111827;
            --light-color: #f3f4f6;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #f9fafb;
        }

        /* Sidebar styles */
        .sidebar {
            height: 100vh;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .sidebar-collapsed {
            width: 5rem;
        }

        .sidebar-expanded {
            width: 16rem;
        }

        .sidebar-link {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            margin-bottom: 0.5rem;
            transition: all 0.2s ease;
        }

        .sidebar-link:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }

        .sidebar-link.active {
            background-color: var(--primary-color);
            color: white;
        }

        .sidebar-icon {
            flex-shrink: 0;
            width: 1.5rem;
            height: 1.5rem;
            margin-right: 1rem;
        }

        /* Header styles */
        .header {
            height: 4rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            z-index: 10;
        }

        /* Badge animations */
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .badge-pulse {
            animation: pulse 2s infinite;
        }

        /* Card styles */
        .card {
            background-color: white;
            border-radius: 0.5rem;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
        }

        .card:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        /* Notification panel */
        .notifications-container {
            position: fixed;
            top: 4rem;
            right: 1rem;
            width: calc(100% - 2rem);
            max-width: 24rem;
            z-index: 50;
            visibility: hidden;
            opacity: 0;
            transform: translateY(-1rem);
            transition: all 0.3s ease-in-out;
        }

        .notifications-container.show {
            visibility: visible;
            opacity: 1;
            transform: translateY(0);
        }

        .notifications-list {
            max-height: calc(100vh - 16rem);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }

        .notifications-list::-webkit-scrollbar {
            width: 4px;
        }

        .notifications-list::-webkit-scrollbar-track {
            background: transparent;
        }

        .notifications-list::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 2px;
        }

        /* Footer styles */
        .footer {
            background-color: var(--dark-color);
            color: white;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .main-content {
                padding-left: 0 !important;
            }
        }
    </style>
</head>

<body class="bg-gray-100 flex flex-col min-h-screen">
    <div class="flex h-screen flex-1 overflow-hidden">
        <!-- Sidebar -->
        <aside id="sidebar" class="sidebar bg-gray-900 text-white sidebar-expanded hidden md:block">
            <div class="p-4">
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center space-x-3">
                        <img src="/assets/img/logo.png" alt="Logo" class="h-10 w-10">
                        <span class="text-xl font-bold">REMEHBS</span>
                    </div>
                    <button id="toggleSidebar" class="text-white focus:outline-none md:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav class="space-y-1">
                    <a href="{{ route('soumission.dashboard') }}" class="sidebar-link">
                        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Tableau de bord</span>
                    </a>
                    <a href="{{ route('soumission.en_attente') }}" class="sidebar-link">
                        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8V12L15 15M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Soumissions en attente</span>
                    </a>
                    <a href="{{ route('soumission.approuvee') }}" class="sidebar-link">
                        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Soumissions approuvées</span>
                    </a>
                    <a href="{{ route('soumission.rejetee') }}" class="sidebar-link">
                        <svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Soumissions rejetées</span>
                    </a>
                </nav>
            </div>
        </aside>

        <!-- Main content -->
        <div class="flex-1 flex flex-col overflow-hidden">
            <!-- Header -->
            <header class="header bg-white flex items-center justify-between px-6">
                <div class="flex items-center md:hidden">
                    <button id="mobileMenuBtn" class="text-gray-500 focus:outline-none" onclick="toggleMobileSidebar()">
                        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                <div class="flex items-center ml-auto space-x-4">
                    <!-- Notifications -->
                    <div class="relative">
                        <button type="button" class="relative p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none" id="notification-button" onclick="toggleNotifications()">
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            @if (!Auth::user()->unreadNotifications->isEmpty())
                                <span class="badge-pulse absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {{ Auth::user()->unreadNotifications->count() }}
                                </span>
                            @endif
                        </button>

                        <!-- Notification panel -->
                        <div class="notifications-container" id="notifications">
                            <div class="bg-white rounded-lg shadow-xl border border-gray-200">
                                <div class="p-4 border-b border-gray-200">
                                    <div class="flex items-center justify-between">
                                        <h2 class="text-lg font-semibold text-gray-800">Notifications</h2>
                                        <button onclick="toggleNotifications()" class="text-gray-500 hover:text-gray-700">
                                            <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div class="notifications-list">
                                    @if (Auth::user()->unreadNotifications->isEmpty())
                                        <div class="p-6 text-center text-gray-500">
                                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p class="mt-4 text-sm">Aucune notification</p>
                                        </div>
                                    @else
                                        @foreach (Auth::user()->unreadNotifications as $notification)
                                            <div class="p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-0">
                                                <div class="flex items-start space-x-3">
                                                    <div class="flex-1">
                                                        <div class="flex items-center justify-between mb-1">
                                                            <h3 class="text-sm font-medium text-gray-900">
                                                                <a href="{{ route('soumission.show_noti', [$notification->data['id'], $notification->id]) }}">
                                                                    {{ $notification->data['document'] }}
                                                                </a>
                                                            </h3>
                                                            <span class="text-xs text-gray-500">{{ $notification->created_at->diffForHumans() }}</span>
                                                        </div>
                                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                            {{ $notification->data['type'] == 'Abstract' ? 'bg-blue-100 text-blue-800' : '' }}
                                                            {{ $notification->data['type'] == 'Poster' ? 'bg-green-100 text-green-800' : '' }}
                                                            {{ $notification->data['type'] == 'Communication' ? 'bg-yellow-100 text-yellow-800' : '' }}">
                                                            {{ $notification->data['type'] }}
                                                        </span>
                                                        <p @class(['mt-1 text-sm text-blue-500', 'text-indigo-700' => $notification->type == 'App\Notifications\NotificationUpdateSoumission'])>
                                                            {{ $notification->type == 'App\Notifications\NotificationUpdateSoumission' ? 'Soumission modifiée' : 'Nouvelle soumission' }}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        @endforeach
                                    @endif
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- User dropdown -->
                    <div class="relative">
                        <button class="flex items-center space-x-2 focus:outline-none" onclick="toggleDropdown()">
                            <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M5.121 17.804C7.21942 16.6179 9.58958 15.9963 12 16C14.5 16 16.847 16.655 18.879 17.804M15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 8.34315 10.3431 7 12 7C13.6569 7 15 8.34315 15 10ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="text-sm font-medium text-gray-700">{{ Auth::user()->nom }}</div>
                            <svg class="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div id="userDropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 hidden">
                            <div class="py-1">
                                <a href="{{ route('profile.edit_admin') }}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profil</a>
                                <form method="POST" action="{{ route('logout') }}">
                                    @csrf
                                    <button type="submit" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Déconnexion</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main content area -->
            <main class="flex-1 overflow-y-auto max-h-[calc(100vh-5rem)] p-6 bg-gray-50">
                @if (session('success'))
                    <div class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 flex items-center justify-between rounded-md" role="alert">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p class="font-semibold">Succès</p>
                                <p>{{ session('success') }}</p>
                            </div>
                        </div>
                        <button class="text-green-700 hover:text-green-900" onclick="this.parentElement.style.display='none';">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                @endif

                @yield('content')
            </main>
        </div>
    </div>

    <!-- Footer -->
    <footer class="footer mt-auto">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
                <div class="flex flex-col items-center md:items-start">
                    <img class="h-16 w-auto mb-4" src="/assets/img/logo.png" alt="Logo Réseau Mère - Enfant">
                    <h3 class="text-lg font-medium text-white mb-2">RÉSEAU MÈRE - ENFANT</h3>
                    <p class="text-gray-300 text-sm">Réseau d'excellence pour la santé maternelle et infantile</p>
                </div>
                
                <div>
                    <h3 class="text-lg font-medium text-white mb-4">Localisation</h3>
                    <address class="text-gray-300 text-sm not-italic">
                        <p class="mb-2">Centre Hospitalier Universitaire Sourô SANOU</p>
                        <p class="mb-2">Bobo - Dioulasso</p>
                        <p>BURKINA - FASO</p>
                    </address>
                </div>
                
                <div>
                    <h3 class="text-lg font-medium text-white mb-4">Contacts</h3>
                    <div class="text-gray-300 text-sm">
                        @foreach (['70244827', '78694467', '70340000', '76562667'] as $phone)
                            <p class="mb-2">Tél: +226 {{ $phone }}</p>
                        @endforeach
                        <p>Email: secretariat@remehbs-bf.org</p>
                    </div>
                </div>
                
                <div>
                    <h3 class="text-lg font-medium text-white mb-4">Liens rapides</h3>
                    <ul class="text-gray-300 text-sm">
                        <li class="mb-2">
                            <a href="/remehbs/journee-remehbs" class="hover:text-white transition-colors">
                                Journées REMEHBS 2025
                            </a>
                        </li>
                        <li>
                            <a href="#" class="hover:text-white transition-colors">
                                FeedBack 6e journée
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div class="border-t border-gray-700 py-6">
                <p class="text-center text-gray-300 text-sm">&copy; 2024 Réseau Mère - Enfant. Tous droits réservés.</p>
            </div>
        </div>
    </footer>

    <script>
        // Mobile sidebar toggle
        function toggleMobileSidebar() {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('hidden');
        }

        // User dropdown toggle
        function toggleDropdown() {
            const dropdown = document.getElementById('userDropdown');
            dropdown.classList.toggle('hidden');
            
            // Close dropdown when clicking outside
            if (!dropdown.classList.contains('hidden')) {
                document.addEventListener('click', closeDropdownOnClickOutside);
            } else {
                document.removeEventListener('click', closeDropdownOnClickOutside);
            }
        }
        
        function closeDropdownOnClickOutside(event) {
            const dropdown = document.getElementById('userDropdown');
            const button = document.querySelector('[onclick="toggleDropdown()"]');
            
            if (!dropdown.contains(event.target) && !button.contains(event.target)) {
                dropdown.classList.add('hidden');
                document.removeEventListener('click', closeDropdownOnClickOutside);
            }
        }

        // Notifications panel toggle
        function toggleNotifications() {
            const container = document.querySelector('.notifications-container');
            container.classList.toggle('show');
            
            // Close notifications when clicking outside
            if (container.classList.contains('show')) {
                document.addEventListener('click', closeNotificationsOnClickOutside);
            } else {
                document.removeEventListener('click', closeNotificationsOnClickOutside);
            }
        }
        
        function closeNotificationsOnClickOutside(event) {
            const container = document.querySelector('.notifications-container');
            const button = document.getElementById('notification-button');
            
            if (!container.contains(event.target) && !button.contains(event.target)) {
                container.classList.remove('show');
                document.removeEventListener('click', closeNotificationsOnClickOutside);
            }
        }
        
        // Set active menu item based on current route
        document.addEventListener('DOMContentLoaded', function() {
            const currentPath = window.location.pathname;
            const menuItems = document.querySelectorAll('.sidebar-link');
            
            menuItems.forEach(item => {
                const href = item.getAttribute('href');
                if (href && currentPath.includes(href.replace(/^https?:\/\/[^\/]+/i, ''))) {
                    item.classList.add('active');
                }
            });
        });
        
        // Responsive notifications positioning
        function updateNotificationsPosition() {
            const container = document.querySelector('.notifications-container');
            
            if (window.innerWidth < 640) {
                container.style.right = '1rem';
                container.style.left = '1rem';
                container.style.width = 'auto';
            } else {
                container.style.right = '1rem';
                container.style.left = 'auto';
                container.style.width = '24rem';
            }
        }
        
        window.addEventListener('load', updateNotificationsPosition);
        window.addEventListener('resize', updateNotificationsPosition);
    </script>
</body>
</html>