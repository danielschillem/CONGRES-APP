{{-- <!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>REMEHBS | Dashboard Utilisateur</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        /* Footer styles */
        .footer-container {
            display: grid;
            gap: 2rem;
            padding: 2rem 1rem;
            background-color: #1f2937;
            color: white;
        }

        @media (min-width: 640px) {
            .footer-container {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (min-width: 1024px) {
            .footer-container {
                grid-template-columns: repeat(4, 1fr);
            }
        }

        .footer-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        @media (min-width: 640px) {
            .footer-section {
                align-items: flex-start;
                text-align: left;
            }
        }
    </style>
</head>

<body>
    <div class="min-h-full">
        <nav class="bg-gray-800">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="flex h-16 items-center justify-between">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 mr-5">
                            <img class="h-8 w-8" src="/assets/img/logo.png" alt="Logo">
                        </div>

                        <!-- Menu de navigation principal -->
                        <nav class="">
                            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div class="flex items-center justify-between h-16">
                                    <div class="flex items-center space-x-4">
                                        <a href=""
                                            class="text-white hover:bg-white hover:bg-opacity-20 px-3 py-2 rounded-md text-sm font-medium transition duration-150">
                                            Accueil
                                        </a>
                                        <a href=""
                                            class="text-white hover:bg-white hover:bg-opacity-20 px-3 py-2 rounded-md text-sm font-medium transition duration-150">
                                            Programme
                                        </a>
                                        <a href=""
                                            class="bg-white text-blue-800 px-3 py-2 rounded-md text-sm font-medium">
                                            Soumissions
                                        </a>
                                        <a href=""
                                            class="text-white hover:bg-white hover:bg-opacity-20 px-3 py-2 rounded-md text-sm font-medium transition duration-150">
                                            Inscription
                                        </a>
                                    </div>
                                </div>
                        </nav>
                    </div>
                    <div class="hidden md:block">
                        <div class="ml-4 flex items-center md:ml-6">
                            <div class="relative ml-3">
                                <div>
                                    <button type="button"
                                        class="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                        id="notification-button" aria-expanded="false" aria-haspopup="true"
                                        onclick="toggleNotificaions()">
                                        <span class="absolute -inset-1.5"></span>
                                        <span class="sr-only">Notifications</span>
                                        @if (!Auth::user()->unreadNotifications->isEmpty())
                                            <span
                                                class="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                                        @endif
                                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                            stroke="currentColor" aria-hidden="true" data-slot="icon">
                                            <path stroke-linecap="round" stroke-linejoin="round"
                                                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                        </svg>
                                    </button>
                                </div>

                                <div class="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden"
                                    id="notifications" role="menu" aria-orientation="vertical"
                                    aria-labelledby="user-menu-button" tabindex="-1">

                                    <div class="py-2">
                                        <h2 class="px-4 text-lg font-semibold text-gray-800 mb-4">Notifications</h2>
                                        <div class="max-h-60 overflow-y-auto px-2">
                                            @if (Auth::user()->unreadNotifications->isEmpty())
                                                <p class="text-center text-gray-300 mt-3">Aucune notification</p>
                                            @else
                                                @foreach (Auth::user()->unreadNotifications as $notification)
                                                    @if ($notification->type == 'App\Notifications\NotificationRejet')
                                                        <div class="mb-2 px-3 py-2 bg-red-200 rounded-lg">
                                                            <a class="block text-sm font-medium text-gray-900"
                                                                href="{{ route('soumission.edit_noti', [$notification->data['id'], $notification->id]) }}">
                                                                {{ $notification->data['document'] }}
                                                            </a>
                                                            <p class="text-xs text-red-500">rejeté</p>
                                                            <span
                                                                class="text-xs text-gray-500">{{ $notification->created_at->diffForHumans() }}</span>
                                                        </div>
                                                    @else
                                                        <div class="mb-2 px-3 py-2 bg-teal-200 rounded-lg">
                                                            <a class="block text-sm font-medium text-gray-900"
                                                                href="{{ route('soumission.edit_noti', [$notification->data['id'], $notification->id]) }}">
                                                                {{ $notification->data['document'] }}
                                                            </a>
                                                            <p class="text-xs text-teal-600">Approuvé</p>
                                                            <span
                                                                class="text-xs text-gray-500">{{ $notification->created_at->diffForHumans() }}</span>
                                                        </div>
                                                    @endif
                                                @endforeach
                                            @endif
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div class="relative ml-3">
                                <div>
                                    <button type="button"
                                        class="relative flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                        id="user-menu-button" aria-expanded="false" aria-haspopup="true"
                                        onclick="toggleUserMenu()">
                                        <span class="absolute -inset-1.5"></span>
                                        <span class="sr-only">Ouvir le menu utilisateur</span>
                                        <svg width="32px" height="32px" viewBox="0 0 18 18"
                                            xmlns="http://www.w3.org/2000/svg" fill="#000000">
                                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round"
                                                stroke-linejoin="round"></g>
                                            <g id="SVGRepo_iconCarrier">
                                                <path fill="#494c4e"
                                                    d="M9 0a9 9 0 0 0-9 9 8.654 8.654 0 0 0 .05.92 9 9 0 0 0 17.9 0A8.654 8.654 0 0 0 18 9a9 9 0 0 0-9-9zm5.42 13.42c-.01 0-.06.08-.07.08a6.975 6.975 0 0 1-10.7 0c-.01 0-.06-.08-.07-.08a.512.512 0 0 1-.09-.27.522.522 0 0 1 .34-.48c.74-.25 1.45-.49 1.65-.54a.16.16 0 0 1 .03-.13.49.49 0 0 1 .43-.36l1.27-.1a2.077 2.077 0 0 0-.19-.79v-.01a2.814 2.814 0 0 0-.45-.78 3.83 3.83 0 0 1-.79-2.38A3.38 3.38 0 0 1 8.88 4h.24a3.38 3.38 0 0 1 3.1 3.58 3.83 3.83 0 0 1-.79 2.38 2.814 2.814 0 0 0-.45.78v.01a2.077 2.077 0 0 0-.19.79l1.27.1a.49.49 0 0 1 .43.36.16.16 0 0 1 .03.13c.2.05.91.29 1.65.54a.49.49 0 0 1 .25.75z">
                                                </path>
                                            </g>
                                        </svg>
                                    </button>
                                </div>

                                <div class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden"
                                    id="user-menu" role="menu" aria-orientation="vertical"
                                    aria-labelledby="user-menu-button" tabindex="-1">
                                    <a href="{{ route('profile.edit') }}" class="block px-4 py-2 text-sm text-gray-700"
                                        role="menuitem" tabindex="-1" id="user-menu-item-0">Profil</a>

                                    <form method="POST" action="{{ route('logout') }}">
                                        @csrf
                                        <button type="submit" class="block px-4 py-2 text-sm text-gray-700"
                                            role="menuitem" tabindex="-1" id="user-menu-item-2">Deconnexion</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="-mr-2 flex md:hidden">
                        <button type="button"
                            class="relative inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                            aria-controls="mobile-menu" aria-expanded="false" onclick="toggleMobileMenu()">
                            <span class="absolute -inset-0.5"></span>
                            <span class="sr-only">Ouvir le menu</span>
                            <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" aria-hidden="true" data-slot="icon">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                            <svg class="hidden h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" aria-hidden="true" data-slot="icon">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="md:hidden" id="mobile-menu" style="display: none;">
                <div class="border-t border-gray-700 pb-3 pt-4">
                    <div class="flex items-center px-5">
                        <div class="flex-shrink-0">
                            <svg width="32px" height="32px" viewBox="0 0 18 18"
                                xmlns="http://www.w3.org/2000/svg" fill="#000000">
                                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                <g id="SVGRepo_iconCarrier">
                                    <path fill="#494c4e"
                                        d="M9 0a9 9 0 0 0-9 9 8.654 8.654 0 0 0 .05.92 9 9 0 0 0 17.9 0A8.654 8.654 0 0 0 18 9a9 9 0 0 0-9-9zm5.42 13.42c-.01 0-.06.08-.07.08a6.975 6.975 0 0 1-10.7 0c-.01 0-.06-.08-.07-.08a.512.512 0 0 1-.09-.27.522.522 0 0 1 .34-.48c.74-.25 1.45-.49 1.65-.54a.16.16 0 0 1 .03-.13.49.49 0 0 1 .43-.36l1.27-.1a2.077 2.077 0 0 0-.19-.79v-.01a2.814 2.814 0 0 0-.45-.78 3.83 3.83 0 0 1-.79-2.38A3.38 3.38 0 0 1 8.88 4h.24a3.38 3.38 0 0 1 3.1 3.58 3.83 3.83 0 0 1-.79 2.38 2.814 2.814 0 0 0-.45.78v.01a2.077 2.077 0 0 0-.19.79l1.27.1a.49.49 0 0 1 .43.36.16.16 0 0 1 .03.13c.2.05.91.29 1.65.54a.49.49 0 0 1 .25.75z">
                                    </path>
                                </g>
                            </svg>
                        </div>
                        <div class="ml-3">
                            <div class="text-base font-medium leading-none text-white">{{ Auth::user()->nom }}
                                {{ Auth::user()->prenom }}</div>
                            <div class="text-sm font-medium leading-none text-gray-400">{{ Auth::user()->email }}
                            </div>
                        </div>
                        <button type="button"
                            class="relative ml-auto flex-shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                            onclick="toggleMobileNotifications()">
                            <span class="absolute -inset-1.5"></span>
                            <span class="sr-only">Notifications</span>
                            @if (!Auth::user()->unreadNotifications->isEmpty())
                                <span
                                    class="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                            @endif
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" aria-hidden="true" data-slot="icon">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                        </button>
                    </div>

                    <!-- Panneau de notifications mobile -->
                    <div id="mobile-notifications" class="hidden px-2 py-3 mt-3 bg-gray-700 rounded-lg mx-4">
                        <h2 class="px-3 text-lg font-semibold text-white mb-4">Notifications</h2>
                        <div class="max-h-60 overflow-y-auto">
                            @if (Auth::user()->unreadNotifications->isEmpty())
                                <p class="text-center text-gray-300 mt-3">Aucune notification</p>
                            @else
                                @foreach (Auth::user()->unreadNotifications as $notification)
                                    @if ($notification->type == 'App\Notifications\NotificationRejet')
                                        <div class="mb-2 px-3 py-2 bg-red-200 rounded-lg">
                                            <a class="block text-sm font-medium text-gray-900"
                                                href="{{ route('soumission.edit_noti', [$notification->data['id'], $notification->id]) }}">
                                                {{ $notification->data['document'] }}
                                            </a>
                                            <p class="text-xs text-red-500">rejeté</p>
                                            <span
                                                class="text-xs text-gray-500">{{ $notification->created_at->diffForHumans() }}</span>
                                        </div>
                                    @else
                                        <div class="mb-2 px-3 py-2 bg-teal-200 rounded-lg">
                                            <a class="block text-sm font-medium text-gray-900"
                                                href="{{ route('soumission.edit_noti', [$notification->data['id'], $notification->id]) }}">
                                                {{ $notification->data['document'] }}
                                            </a>
                                            <p class="text-xs text-teal-600">Approuvé</p>
                                            <span
                                                class="text-xs text-gray-500">{{ $notification->created_at->diffForHumans() }}</span>
                                        </div>
                                    @endif
                                @endforeach
                            @endif
                        </div>
                    </div>

                    <div class="mt-3 space-y-1 px-2">
                        <a href="{{ route('profile.edit') }}"
                            class="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Profil</a>

                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit"
                                class="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white">Deconnexion</button>
                        </form>
                    </div>
                </div>
            </div>
        </nav>

        @session('success')
            <div class="flex justify-center items-center my-2">
                <div role="alert" class="rounded-xl border border-gray-100 bg-teal-300 p-4">
                    <div class="flex items-start gap-4">
                        <span class="text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>

                        <div class="flex-1">
                            <strong class="block font-medium text-gray-900"> Opération réussis </strong>

                            <p class="mt-1 text-sm text-gray-700">{{ session('success') }}</p>
                        </div>
                    </div>
                </div>
            </div>
        @endsession
        @yield('Content')


    </div>


    <!-- Footer -->
    <footer class="footer-container">
        <div class="footer-section">
            <img class="w-20 mb-4" src="/assets/img/logo.png" alt="Logo Réseau Mère - Enfant" />
            <p>RESEAU MERE - ENFANT</p>
        </div>
        <div class="footer-section">
            <h3 class="text-lg font-semibold mb-4">Localisation</h3>
            <p class="mb-2">Centre Hospitalier Universitaire Sourô SANOU</p>
            <p class="mb-2">Bobo - Dioulasso</p>
            <p>BURKINA - FASO</p>
        </div>
        <div class="footer-section">
            <h3 class="text-lg font-semibold mb-4">Contacts</h3>
            @foreach (['70244827', '78694467', '70340000', '76562667'] as $phone)
                <p class="mb-2">Ph. +226 {{ $phone }}</p>
            @endforeach
            <p>Mail. secretariat@remehbs-bf.org</p>
        </div>
        <div class="footer-section">
            <h3 class="text-lg font-semibold mb-4">Lien rapide</h3>
            <p class="mb-2">
                <a href="/remehbs/journee-remehbs" class="hover:text-gray-300 transition-colors">
                    Journées remehbs 2025
                </a>
            </p>
            <p>
                <a href="#" class="hover:text-gray-300 transition-colors">
                    FeedBack 6e journée
                </a>
            </p>
        </div>
    </footer>

    <section class="bg-gray-800 p-4 text-white text-center">
        <p>&copy; 2024 Réseau Mère - Enfant. Tous droits réservés.</p>
    </section>

    <script>
        function toggleUserMenu() {
            const menu = document.getElementById('user-menu');
            menu.classList.toggle('hidden');
        }

        function toggleNotificaions() {
            const menu = document.getElementById('notifications');
            menu.classList.toggle('hidden');
        }

        function toggleMobileNotifications() {
            const notifications = document.getElementById('mobile-notifications');
            notifications.classList.toggle('hidden');
        }

        function toggleMobileMenu() {
            const menu = document.getElementById('mobile-menu');
            const mobileNotifications = document.getElementById('mobile-notifications');
            if (menu.style.display === 'none' || menu.style.display === '') {
                menu.style.display = 'block';
                mobileNotifications.classList.add('hidden'); // Masquer les notifications lors de l'ouverture du menu
            } else {
                menu.style.display = 'none';
            }
        }
    </script>


</body>

</html> --}}

<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>REMEHBS | Dashboard Utilisateur</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        :root {
            --primary-color: #2563eb;
            --secondary-color: #1f2937;
            --accent-color: #60a5fa;
            --success-color: #10b981;
            --danger-color: #ef4444;
            --text-light: #f9fafb;
            --text-dark: #1f2937;
        }

        body {
            font-family: 'Inter', sans-serif;
            color: var(--text-dark);
            background-color: #f9fafb;
        }

        .logo {
            transition: transform 0.3s ease;
        }

        .logo:hover {
            transform: scale(1.05);
        }

        .nav-link {
            position: relative;
            transition: all 0.3s ease;
        }

        .nav-link::after {
            content: '';
            position: absolute;
            width: 0;
            height: 2px;
            bottom: 0;
            left: 50%;
            background-color: white;
            transition: all 0.3s ease;
        }

        .nav-link:hover::after {
            width: 80%;
            left: 10%;
        }

        .nav-link.active {
            background-color: rgba(255, 255, 255, 0.2);
        }

        .nav-link.active::after {
            width: 80%;
            left: 10%;
        }

        .user-menu-item {
            transition: all 0.2s ease;
        }

        .user-menu-item:hover {
            background-color: #f3f4f6;
            padding-left: 1.5rem;
        }

        .notification-item {
            transition: transform 0.2s ease;
        }

        .notification-item:hover {
            transform: translateX(5px);
        }

        .footer-link {
            transition: all 0.2s ease;
            position: relative;
        }

        .footer-link::after {
            content: '';
            position: absolute;
            width: 0;
            height: 1px;
            bottom: -2px;
            left: 0;
            background-color: white;
            transition: all 0.3s ease;
        }

        .footer-link:hover::after {
            width: 100%;
        }

        .btn {
            transition: all 0.3s ease;
        }

        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        /* Animations pour les notifications */
        @keyframes pulse {
            0% {
                transform: scale(1);
            }

            50% {
                transform: scale(1.05);
            }

            100% {
                transform: scale(1);
            }
        }

        .pulse-animation {
            animation: pulse 2s infinite;
        }

        /* Footer styles */
        .footer-container {
            display: grid;
            gap: 2.5rem;
            padding: 3rem 1.5rem;
            background-color: var(--secondary-color);
            background-image: linear-gradient(to right, #1e3a8a, #1f2937);
            color: white;
        }

        @media (min-width: 640px) {
            .footer-container {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (min-width: 1024px) {
            .footer-container {
                grid-template-columns: repeat(4, 1fr);
            }
        }

        .footer-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        @media (min-width: 640px) {
            .footer-section {
                align-items: flex-start;
                text-align: left;
            }
        }

        /* Ajout d'animations et transitions */
        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        .scale-in {
            animation: scaleIn 0.3s ease-in-out;
        }

        @keyframes scaleIn {
            from {
                transform: scale(0.9);
                opacity: 0;
            }

            to {
                transform: scale(1);
                opacity: 1;
            }
        }

        /* Design des notifications */
        .notification-badge {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: var(--danger-color);
            animation: pulse 2s infinite;
        }

        /* Améliorations pour la lisibilité sur mobile */
        @media (max-width: 640px) {
            .mobile-menu-expanded {
                max-height: 100vh;
                overflow-y: auto;
            }
        }
    </style>
</head>

<body>
    <div class="min-h-full flex flex-col">
        <!-- Navigation principale -->
        <nav class="bg-gradient-to-r from-blue-900 to-gray-800 shadow-lg">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="flex h-16 items-center justify-between">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 mr-5">
                            <img class="h-10 w-10 logo" src="/assets/img/logo.png" alt="Logo REMEHBS">
                        </div>

                        <!-- Menu de navigation principal - Desktop -->
                        <div class="hidden md:block">
                            <div class="ml-4 flex items-center space-x-4">
                                <a href="{{ route('dashboard') }}"
                                    class="nav-link text-white hover:bg-white/20 px-3 py-2 rounded-md text-sm font-medium transition duration-150">
                                    Soumissions
                                </a>
                                <a href="{{ route('programme') }}"
                                    class="nav-link text-white hover:bg-white/20 px-3 py-2 rounded-md text-sm font-medium transition duration-150">
                                    Programme
                                </a>
                                <a href="{{ route('inscription') }}"
                                    class="nav-link text-white hover:bg-white/20 px-3 py-2 rounded-md text-sm font-medium transition duration-150">
                                    Inscription
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Menu utilisateur - Desktop -->
                    <div class="hidden md:block">
                        <div class="ml-4 flex items-center md:ml-6">
                            <!-- Notifications -->
                            <div class="relative ml-3">
                                <button type="button"
                                    class="btn relative rounded-full bg-white/10 p-1 text-gray-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                    id="notification-button" aria-expanded="false" aria-haspopup="true"
                                    onclick="toggleNotifications()">
                                    <span class="sr-only">Notifications</span>
                                    @if (!Auth::user()->unreadNotifications->isEmpty())
                                        <span class="notification-badge pulse-animation"></span>
                                    @endif
                                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                        stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round"
                                            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                    </svg>
                                </button>

                                <!-- Panneau de notifications -->
                                <div class="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none hidden scale-in"
                                    id="notifications" role="menu" aria-orientation="vertical"
                                    aria-labelledby="notification-button" tabindex="-1">
                                    <div class="py-2">
                                        <h2 class="px-4 text-lg font-semibold text-gray-800 mb-2 border-b pb-2">
                                            Notifications</h2>
                                        <div class="max-h-60 overflow-y-auto px-2">
                                            @if (Auth::user()->unreadNotifications->isEmpty())
                                                <div class="text-center text-gray-400 py-6">
                                                    <svg class="mx-auto h-12 w-12 text-gray-300" fill="none"
                                                        viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="1.5"
                                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                    <p class="mt-2">Aucune notification</p>
                                                </div>
                                            @else
                                                @foreach (Auth::user()->unreadNotifications as $notification)
                                                    @if ($notification->type == 'App\Notifications\NotificationRejet')
                                                        <div
                                                            class="notification-item mb-2 px-3 py-2 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">
                                                            <a class="block text-sm font-medium text-gray-900"
                                                                href="{{ route('soumission.edit_noti', [$notification->data['id'], $notification->id]) }}">
                                                                <div class="flex items-center">
                                                                    <svg class="h-5 w-5 text-red-500 mr-2"
                                                                        fill="none" viewBox="0 0 24 24"
                                                                        stroke="currentColor">
                                                                        <path stroke-linecap="round"
                                                                            stroke-linejoin="round" stroke-width="2"
                                                                            d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                    {{ $notification->data['document'] }}
                                                                </div>
                                                            </a>
                                                            <p class="text-xs text-red-600 ml-7">Document rejeté</p>
                                                            <div class="flex justify-between items-center mt-1">
                                                                <span
                                                                    class="text-xs text-gray-500">{{ $notification->created_at->diffForHumans() }}</span>
                                                                <button
                                                                    class="text-xs text-blue-600 hover:text-blue-800">Marquer
                                                                    comme lu</button>
                                                            </div>
                                                        </div>
                                                    @else
                                                        <div
                                                            class="notification-item mb-2 px-3 py-2 bg-teal-100 rounded-lg hover:bg-teal-200 transition-colors">
                                                            <a class="block text-sm font-medium text-gray-900"
                                                                href="{{ route('soumission.edit_noti', [$notification->data['id'], $notification->id]) }}">
                                                                <div class="flex items-center">
                                                                    <svg class="h-5 w-5 text-teal-600 mr-2"
                                                                        fill="none" viewBox="0 0 24 24"
                                                                        stroke="currentColor">
                                                                        <path stroke-linecap="round"
                                                                            stroke-linejoin="round" stroke-width="2"
                                                                            d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    {{ $notification->data['document'] }}
                                                                </div>
                                                            </a>
                                                            <p class="text-xs text-teal-600 ml-7">Document approuvé</p>
                                                            <div class="flex justify-between items-center mt-1">
                                                                <span
                                                                    class="text-xs text-gray-500">{{ $notification->created_at->diffForHumans() }}</span>
                                                                <button
                                                                    class="text-xs text-blue-600 hover:text-blue-800">Marquer
                                                                    comme lu</button>
                                                            </div>
                                                        </div>
                                                    @endif
                                                @endforeach
                                            @endif
                                        </div>
                                        <div class="border-t mt-2 pt-2 px-4">
                                            <button
                                                class="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                                                Tout marquer comme lu
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Profil utilisateur -->
                            <div class="relative ml-3">
                                <button type="button"
                                    class="btn relative flex items-center rounded-full bg-white/10 p-1 text-gray-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                                    id="user-menu-button" aria-expanded="false" aria-haspopup="true"
                                    onclick="toggleUserMenu()">
                                    <span class="sr-only">Ouvrir le menu utilisateur</span>
                                    <div class="flex items-center space-x-2 pr-2">
                                        <svg class="h-8 w-8" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"
                                            fill="currentColor">
                                            <path
                                                d="M9 0a9 9 0 0 0-9 9 8.654 8.654 0 0 0 .05.92 9 9 0 0 0 17.9 0A8.654 8.654 0 0 0 18 9a9 9 0 0 0-9-9zm5.42 13.42c-.01 0-.06.08-.07.08a6.975 6.975 0 0 1-10.7 0c-.01 0-.06-.08-.07-.08a.512.512 0 0 1-.09-.27.522.522 0 0 1 .34-.48c.74-.25 1.45-.49 1.65-.54a.16.16 0 0 1 .03-.13.49.49 0 0 1 .43-.36l1.27-.1a2.077 2.077 0 0 0-.19-.79v-.01a2.814 2.814 0 0 0-.45-.78 3.83 3.83 0 0 1-.79-2.38A3.38 3.38 0 0 1 8.88 4h.24a3.38 3.38 0 0 1 3.1 3.58 3.83 3.83 0 0 1-.79 2.38 2.814 2.814 0 0 0-.45.78v.01a2.077 2.077 0 0 0-.19.79l1.27.1a.49.49 0 0 1 .43.36.16.16 0 0 1 .03.13c.2.05.91.29 1.65.54a.49.49 0 0 1 .25.75z" />
                                        </svg>
                                    </div>
                                </button>

                                <!-- Panneau profil utilisateur -->
                                <div class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden scale-in"
                                    id="user-menu" role="menu" aria-orientation="vertical"
                                    aria-labelledby="user-menu-button" tabindex="-1">
                                    <a href="{{ route('profile.edit') }}"
                                        class="user-menu-item flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        role="menuitem" tabindex="-1" id="user-menu-item-0">
                                        <svg class="mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24"
                                            stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        Profil
                                    </a>
                                    <form method="POST" action="{{ route('logout') }}">
                                        @csrf
                                        <button type="submit"
                                            class="user-menu-item flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem" tabindex="-1" id="user-menu-item-2">
                                            <svg class="mr-2 h-5 w-5 text-gray-500" fill="none"
                                                viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                    stroke-width="1.5"
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Déconnexion
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Bouton menu mobile -->
                    <div class="-mr-2 flex md:hidden">
                        <button type="button"
                            class="btn relative inline-flex items-center justify-center rounded-md bg-white/10 p-2 text-gray-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                            aria-controls="mobile-menu" aria-expanded="false" onclick="toggleMobileMenu()">
                            <span class="sr-only">Ouvrir le menu</span>
                            <svg id="menu-icon-open" class="block h-6 w-6" fill="none" viewBox="0 0 24 24"
                                stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                            <svg id="menu-icon-close" class="hidden h-6 w-6" fill="none" viewBox="0 0 24 24"
                                stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Menu mobile -->
            <div class="md:hidden hidden fade-in" id="mobile-menu">
                <div class="space-y-1 px-2 pb-3 pt-2">
                    <a href="{{ route('dashboard') }}"
                        class="nav-link block text-white hover:bg-white/20 px-3 py-2 rounded-md text-base font-medium">
                        Soumissions
                    </a>
                    <a href="#"
                        class="nav-link block text-white hover:bg-white/20 px-3 py-2 rounded-md text-base font-medium">
                        Programme
                    </a>
                    <a href="#"
                        class="nav-link block text-white hover:bg-white/20 px-3 py-2 rounded-md text-base font-medium">
                        Inscription
                    </a>
                </div>

                <div class="border-t border-gray-600 pb-3 pt-4">
                    <div class="flex items-center px-5">
                        <div class="flex-shrink-0">
                            <svg class="h-8 w-8 text-gray-200" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"
                                fill="currentColor">
                                <path
                                    d="M9 0a9 9 0 0 0-9 9 8.654 8.654 0 0 0 .05.92 9 9 0 0 0 17.9 0A8.654 8.654 0 0 0 18 9a9 9 0 0 0-9-9zm5.42 13.42c-.01 0-.06.08-.07.08a6.975 6.975 0 0 1-10.7 0c-.01 0-.06-.08-.07-.08a.512.512 0 0 1-.09-.27.522.522 0 0 1 .34-.48c.74-.25 1.45-.49 1.65-.54a.16.16 0 0 1 .03-.13.49.49 0 0 1 .43-.36l1.27-.1a2.077 2.077 0 0 0-.19-.79v-.01a2.814 2.814 0 0 0-.45-.78 3.83 3.83 0 0 1-.79-2.38A3.38 3.38 0 0 1 8.88 4h.24a3.38 3.38 0 0 1 3.1 3.58 3.83 3.83 0 0 1-.79 2.38 2.814 2.814 0 0 0-.45.78v.01a2.077 2.077 0 0 0-.19.79l1.27.1a.49.49 0 0 1 .43.36.16.16 0 0 1 .03.13c.2.05.91.29 1.65.54a.49.49 0 0 1 .25.75z" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <div class="text-base font-medium leading-none text-white">{{ Auth::user()->nom }}
                                {{ Auth::user()->prenom }}</div>
                            <div class="text-sm font-medium leading-none text-gray-400 mt-1">{{ Auth::user()->email }}
                            </div>
                        </div>
                        <button type="button"
                            class="btn ml-auto flex-shrink-0 rounded-full bg-white/10 p-1 text-gray-300 hover:text-white"
                            onclick="toggleMobileNotifications()">
                            <span class="sr-only">Notifications</span>
                            @if (!Auth::user()->unreadNotifications->isEmpty())
                                <span class="notification-badge"></span>
                            @endif
                            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                        </button>
                    </div>

                    <!-- Panneau de notifications mobile -->
                    <div id="mobile-notifications" class="hidden px-2 py-3 mt-3 bg-gray-700 rounded-lg mx-4 fade-in">
                        <h2 class="px-3 text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">
                            Notifications</h2>
                        <div class="max-h-60 overflow-y-auto">
                            @if (Auth::user()->unreadNotifications->isEmpty())
                                <div class="text-center text-gray-300 py-6">
                                    <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24"
                                        stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <p class="mt-2">Aucune notification</p>
                                </div>
                            @else
                                @foreach (Auth::user()->unreadNotifications as $notification)
                                    @if ($notification->type == 'App\Notifications\NotificationRejet')
                                        <div class="notification-item mb-2 px-3 py-2 bg-red-200 rounded-lg">
                                            <a class="block text-sm font-medium text-gray-900"
                                                href="{{ route('soumission.edit_noti', [$notification->data['id'], $notification->id]) }}">
                                                <div class="flex items-center">
                                                    <svg class="h-5 w-5 text-red-500 mr-2" fill="none"
                                                        viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    {{ $notification->data['document'] }}
                                                </div>
                                            </a>
                                            <p class="text-xs text-red-600 ml-7">Document rejeté</p>
                                            <span
                                                class="text-xs text-gray-500 block mt-1">{{ $notification->created_at->diffForHumans() }}</span>
                                        </div>
                                    @else
                                        <div class="notification-item mb-2 px-3 py-2 bg-teal-200 rounded-lg">
                                            <a class="block text-sm font-medium text-gray-900"
                                                href="{{ route('soumission.edit_noti', [$notification->data['id'], $notification->id]) }}">
                                                <div class="flex items-center">
                                                    <svg class="h-5 w-5 text-teal-600 mr-2" fill="none"
                                                        viewBox="0 0 24 24" stroke="currentColor">
                                                        <path stroke-linecap="round" stroke-linejoin="round"
                                                            stroke-width="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {{ $notification->data['document'] }}
                                                </div>
                                            </a>
                                            <p class="text-xs text-teal-600 ml-7">Document approuvé</p>
                                            <span
                                                class="text-xs text-gray-500 block mt-1">{{ $notification->created_at->diffForHumans() }}</span>
                                        </div>
                                    @endif
                                @endforeach
                            @endif
                        </div>
                        <div class="border-t border-gray-600 mt-2 pt-2 px-1">
                            <button class="w-full text-center text-sm text-blue-300 hover:text-blue-100">
                                Tout marquer comme lu
                            </button>
                        </div>
                    </div>

                    <div class="mt-3 space-y-1 px-5">
                        <a href="{{ route('profile.edit') }}"
                            class="user-menu-item flex items-center px-2 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md">
                            <svg class="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profil
                        </a>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit"
                                class="user-menu-item flex items-center w-full text-left px-2 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-md">
                                <svg class="mr-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Déconnexion
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Contenu principal -->
        <main class="flex-1">
            <div class="py-6">
                {{-- <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h1 class="text-2xl font-semibold text-gray-900">@yield('title', 'Dashboard')</h1>
                </div> --}}
                @if (session('success'))
                    <div class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 flex items-center justify-between rounded-md"
                        role="alert">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p class="font-semibold">Succès</p>
                                <p>{{ session('success') }}</p>
                            </div>
                        </div>
                        <button class="text-green-700 hover:text-green-900"
                            onclick="this.parentElement.style.display='none';">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                @endif

                @if (session('error'))
                    <div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 flex items-center justify-between rounded-md"
                        role="alert">
                        <div class="flex items-center">
                            <svg class="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p class="font-semibold">Succès</p>
                                <p>{{ session('success') }}</p>
                            </div>
                        </div>
                        <button class="text-red-700 hover:text-red-900"
                            onclick="this.parentElement.style.display='none';">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                @endif

                <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
                    @yield('Content')
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white">
            <div class="footer-container">
                <div class="footer-section">
                    <img class="w-20 mb-4" src="/assets/img/logo.png" alt="Logo Réseau Mère - Enfant" />
                    <h2 class="text-lg font-semibold mb-4">RESEAU MERE - ENFANT</h2>

                    <p class="text-gray-300 mb-4">Réseau d'excellence pour la santé maternelle et infantile</p>
                    <div class="flex space-x-4 mt-2">
                        <a href="#" class="text-gray-300 hover:text-white transition-colors">
                            <span class="sr-only">Facebook</span>
                            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill-rule="evenodd"
                                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                                    clip-rule="evenodd" />
                            </svg>
                        </a>
                        <a href="#" class="text-gray-300 hover:text-white transition-colors">
                            <span class="sr-only">Twitter</span>
                            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                            </svg>
                        </a>
                        <a href="#" class="text-gray-300 hover:text-white transition-colors">
                            <span class="sr-only">LinkedIn</span>
                            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path fill-rule="evenodd"
                                    d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                                    clip-rule="evenodd" />
                            </svg>
                        </a>
                    </div>
                </div>

                <div class="footer-section">
                    <h2 class="text-lg font-semibold mb-4">Liens rapides</h2>
                    <ul class="space-y-2">
                        <li><a href="#" class="footer-link text-gray-300 hover:text-white">Journées REMEHBS 2025
                            </a></li>
                        <li><a href="#" class="footer-link text-gray-300 hover:text-white">FeedBack 6e journée
                            </a></li>
                        {{-- <li><a href="#" class="footer-link text-gray-300 hover:text-white">Soumissions</a></li>
                        <li><a href="#" class="footer-link text-gray-300 hover:text-white">Inscription</a></li>
                        <li><a href="#" class="footer-link text-gray-300 hover:text-white">FAQ</a></li> --}}
                    </ul>
                </div>

                <div class="footer-section">
                    <h2 class="text-lg font-semibold mb-4">Contact</h2>
                    <ul class="space-y-2 text-gray-300">
                        <li class="flex items-start">
                            <svg class="h-5 w-5 mt-0.5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>+226 70244827</span>
                        </li>
                        <li class="flex items-start">
                            <svg class="h-5 w-5 mt-0.5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>+226 78694467</span>
                        </li>
                        <li class="flex items-start">
                            <svg class="h-5 w-5 mt-0.5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>+226 70340000</span>
                        </li>
                        <li class="flex items-start">
                            <svg class="h-5 w-5 mt-0.5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>+226 76562667</span>
                        </li>
                        <li class="flex items-start">
                            <svg class="h-5 w-5 mt-0.5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span>secretariat@remehbs-bf.org</span>
                        </li>
                    </ul>
                </div>

                <div class="footer-section">
                    <h2 class="text-lg font-semibold mb-4">Localisation</h2>
                    <p class="text-gray-300 mb-4">

                        Centre Hospitalier Universitaire Sourô SANOU | Bobo-Dioulasso | BURKINA - FASO</p>
                </div>
            </div>
            <div class="bg-gray-900 py-4 text-center text-sm text-gray-400">
                <p>© {{ date('Y') }} REMEHBS - Tous droits réservés</p>
            </div>
        </footer>
    </div>

    <script>
        function toggleUserMenu() {
            const menu = document.getElementById('user-menu');
            menu.classList.toggle('hidden');
        }

        function toggleNotifications() {
            const notifications = document.getElementById('notifications');
            notifications.classList.toggle('hidden');
        }

        function toggleMobileMenu() {
            const mobileMenu = document.getElementById('mobile-menu');
            const menuIconOpen = document.getElementById('menu-icon-open');
            const menuIconClose = document.getElementById('menu-icon-close');

            mobileMenu.classList.toggle('hidden');
            menuIconOpen.classList.toggle('hidden');
            menuIconClose.classList.toggle('hidden');

            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('mobile-menu-expanded');
            } else {
                mobileMenu.classList.remove('mobile-menu-expanded');
            }
        }

        function toggleMobileNotifications() {
            const notifications = document.getElementById('mobile-notifications');
            notifications.classList.toggle('hidden');
        }

        // Close dropdown menus when clicking outside
        window.addEventListener('click', function(event) {
            const userMenu = document.getElementById('user-menu');
            const userMenuButton = document.getElementById('user-menu-button');
            const notifications = document.getElementById('notifications');
            const notificationButton = document.getElementById('notification-button');

            if (!userMenuButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenu.classList.add('hidden');
            }

            if (!notificationButton.contains(event.target) && !notifications.contains(event.target)) {
                notifications.classList.add('hidden');
            }
        });
    </script>
</body>

</html>
