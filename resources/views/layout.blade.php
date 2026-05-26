<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Réseau Mère-Enfant | @yield('title')</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        /* Styles pour la transition fluide de la navbar */
        #navbar {
            transition: all 0.3s ease-in-out;
        }

        #navbar.scrolled {
            background-color: #111827;
        }

        #navbar.scrolled a,
        #navbar.scrolled p,
        #navbar.scrolled .ad {
            color: white;
        }

        /* Styles pour le menu mobile */
        .mobile-menu {
            display: none;
        }

        @media (max-width: 768px) {
            .mobile-menu {
                display: block;
            }

            .desktop-menu {
                display: none;
            }
        }

        /* Optimisations pour les très petits écrans */
        @media (max-width: 360px) {
            .contact-info {
                font-size: 0.875rem;
            }
        }

        /* Style pour le contenu principal */
        .main-content {
            padding-top: calc(4rem + 56px);
            /* Hauteur de la barre supérieure + navbar */
        }
    </style>
    @yield('style')
</head>

<body class="min-h-screen flex flex-col">
    <!-- Barre supérieure - Maintenant fixe en haut -->
    <div id="topBar" class="fixed top-0 left-0 right-0 z-50 bg-gray-900">
        <section class="w-full text-white py-2">
            <div class="container mx-auto px-4">
                <div class="flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0">
                    <!-- Section contact -->
                    <div class="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
                        <p class="hidden md:block">Avez-vous des questions ?</p>
                        <div class="flex flex-col sm:flex-row gap-2 items-center">
                            <p class="flex items-center gap-1 text-sm sm:text-base">
                                <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                    <g id="SVGRepo_iconCarrier">
                                        <path
                                            d="M16.5562 12.9062L16.1007 13.359C16.1007 13.359 15.0181 14.4355 12.0631 11.4972C9.10812 8.55901 10.1907 7.48257 10.1907 7.48257L10.4775 7.19738C11.1841 6.49484 11.2507 5.36691 10.6342 4.54348L9.37326 2.85908C8.61028 1.83992 7.13596 1.70529 6.26145 2.57483L4.69185 4.13552C4.25823 4.56668 3.96765 5.12559 4.00289 5.74561C4.09304 7.33182 4.81071 10.7447 8.81536 14.7266C13.0621 18.9492 17.0468 19.117 18.6763 18.9651C19.1917 18.9171 19.6399 18.6546 20.0011 18.2954L21.4217 16.883C22.3806 15.9295 22.1102 14.2949 20.8833 13.628L18.9728 12.5894C18.1672 12.1515 17.1858 12.2801 16.5562 12.9062Z"
                                            fill="#ffffff"></path>
                                    </g>
                                </svg>
                                <span class="break-all sm:break-normal">+226 70244827 / +226 78694467</span>
                            </p>
                            <p class="flex items-center gap-1 text-sm sm:text-base">
                                <svg class="mt-1" width="24px" height="24px" viewBox="0 0 24 24" fill="none"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                    <g id="SVGRepo_iconCarrier">
                                        <path fill-rule="evenodd" clip-rule="evenodd"
                                            d="M5.33333 4C3.49238 4 2 5.53502 2 7.42857V16.5714C2 18.465 3.49238 20 5.33333 20H18.6667C20.5076 20 22 18.465 22 16.5714V7.42857C22 5.53502 20.5076 4 18.6667 4H5.33333ZM7.62469 8.21913C7.19343 7.87412 6.56414 7.94404 6.21913 8.37531C5.87412 8.80657 5.94404 9.43586 6.37531 9.78087L11.3753 13.7809L12 14.2806L12.6247 13.7809L17.6247 9.78087C18.056 9.43586 18.1259 8.80657 17.7809 8.37531C17.4359 7.94404 16.8066 7.87412 16.3753 8.21913L12 11.7194L7.62469 8.21913Z"
                                            fill="#ffffff"></path>
                                    </g>
                                </svg>
                                <span>secretariat@remehbs-bf.org</span>
                            </p>
                        </div>
                    </div>

                    <!-- Section utilisateur -->
                    <div class="flex flex-row gap-4 items-center">
                        @if (Auth::user())
                            <div class="flex gap-4">
                                <a href="{{ Auth::user()->role == 'user' ? route('dashboard') : route('soumission.dashboard') }}"
                                    class="flex items-center gap-1 hover:text-gray-300 transition-colors">
                                    <svg width="24px" height="24px" viewBox="0 0 32 32"
                                        xmlns="http://www.w3.org/2000/svg" fill="#000000">
                                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round">
                                        </g>
                                        <g id="SVGRepo_iconCarrier">
                                            <defs>
                                                <style>
                                                    .cls-1 {
                                                        fill: none;
                                                        stroke: #ffffff;
                                                        stroke-linecap: round;
                                                        stroke-linejoin: round;
                                                        stroke-width: 2px;
                                                    }
                                                </style>
                                            </defs>
                                            <title></title>
                                            <g id="dashboard">
                                                <line class="cls-1" x1="3" x2="29" y1="29"
                                                    y2="29">
                                                </line>
                                                <line class="cls-1" x1="3" x2="3" y1="3"
                                                    y2="29">
                                                </line>
                                                <line class="cls-1" x1="16" x2="16" y1="7"
                                                    y2="25">
                                                </line>
                                                <line class="cls-1" x1="22" x2="22" y1="11"
                                                    y2="25">
                                                </line>
                                                <line class="cls-1" x1="10" x2="10" y1="16"
                                                    y2="25">
                                                </line>
                                            </g>
                                        </g>
                                    </svg>
                                    <span>Tableau de bord</span>
                                </a>
                                <form method="POST" action="{{ route('logout') }}" class="inline">
                                    @csrf
                                    <button type="submit"
                                        class="flex items-center gap-1 hover:text-gray-300 transition-colors">
                                        <svg fill="#ffff" width="24px" height="24px" viewBox="0 0 24 24"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round"
                                                stroke-linejoin="round"></g>
                                            <g id="SVGRepo_iconCarrier">
                                                <g id="Logout">
                                                    <g>
                                                        <path
                                                            d="M20.968,18.448a2.577,2.577,0,0,1-2.73,2.5c-2.153.012-4.306,0-6.459,0a.5.5,0,0,1,0-1c2.2,0,4.4.032,6.6,0,1.107-.016,1.589-.848,1.589-1.838V5.647A1.546,1.546,0,0,0,19,4.175a3.023,3.023,0,0,0-1.061-.095H11.779a.5.5,0,0,1,0-1c2.224,0,4.465-.085,6.687,0a2.567,2.567,0,0,1,2.5,2.67Z">
                                                        </path>
                                                        <path
                                                            d="M3.176,11.663a.455.455,0,0,0-.138.311c0,.015,0,.028-.006.043s0,.027.006.041a.457.457,0,0,0,.138.312l3.669,3.669a.5.5,0,0,0,.707-.707L4.737,12.516H15.479a.5.5,0,0,0,0-1H4.737L7.552,8.7a.5.5,0,0,0-.707-.707Z">
                                                        </path>
                                                    </g>
                                                </g>
                                            </g>
                                        </svg>
                                        <span>Déconnexion</span>
                                    </button>
                                </form>
                            </div>
                        @else
                            <div class="flex gap-4">
                                <a href="{{ route('login') }}"
                                    class="flex items-center gap-1 hover:text-gray-300 transition-colors">
                                    <svg width="24px" height="24px" viewBox="0 0 24 24" fill="#fff"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round">
                                        </g>
                                        <g id="SVGRepo_iconCarrier">
                                            <path
                                                d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z"
                                                stroke="#ffffff" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round">
                                            </path>
                                            <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z"
                                                stroke="#ffffff" stroke-width="2" stroke-linecap="round"
                                                stroke-linejoin="round"></path>
                                        </g>
                                    </svg>
                                    <span>Se connecter</span>
                                </a>
                                <a href="{{ route('register') }}"
                                    class="flex items-center gap-1 hover:text-gray-300 transition-colors">
                                    <svg fill="#fff" height="24px" width="24px" version="1.1" id="Capa_1"
                                        xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                                        viewBox="0 0 368.469 368.469" xml:space="preserve" stroke="#000000">
                                        <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                        <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round">
                                        </g>
                                        <g id="SVGRepo_iconCarrier">
                                            <path
                                                d="M256.901,302.978c-7.18,0-13-5.82-13-13c0-7.18,5.82-13,13-13h50.185v-30h-50.185c-7.18,0-13-5.82-13-13 c0-7.18,5.82-13,13-13h50.185v-22.464c0-18.945-10.539-35.428-26.072-43.91V96.78c0-53.365-43.415-96.78-96.779-96.78 S87.455,43.415,87.455,96.78v57.823c-15.533,8.482-26.072,24.965-26.072,43.91v119.955c0,27.614,22.387,50,50,50h145.703 c27.613,0,50-22.386,50-50v-15.491H256.901z M231.014,148.514h-93.559V96.78c0-25.795,20.984-46.78,46.779-46.78 c25.793,0,46.779,20.985,46.779,46.78V148.514z">
                                            </path>
                                        </g>
                                    </svg>
                                    <span>S'inscrire</span>
                                </a>
                            </div>
                        @endif
                    </div>
                </div>
            </div>
        </section>
    </div>

    <!-- Navigation principale - Positionnée sous la barre supérieure -->
    <header class="fixed top-[109px] sm:top-[77px] lg:top-[45px] left-0 right-0 z-40 bg-gray-900">
        <nav id="navbar" class="w-full transition-all duration-500 ease-in-out">
            <div class="container mx-auto px-4 py-3">
                <div class="flex items-center justify-between">
                    <!-- Logo -->
                    <a href="{{ route('home') }}" class="flex items-center gap-3">
                        <img class="w-12 h-12 md:w-14 md:h-14" src="{{ asset('/assets/img/logo.png') }}"
                            alt="Logo Réseau Mère - Enfant" />
                        <span class="text-white font-semibold text-lg hidden sm:block">Réseau Mère - Enfant</span>
                    </a>

                    <!-- Menu mobile -->
                    <button class="mobile-menu p-2 md:hidden" onclick="toggleMobileMenu()">
                        <svg class="w-6 h-6" fill="white" viewBox="0 0 24 24">
                            <path d="M4 6h16M4 12h16M4 18h16" stroke="white" stroke-width="2"
                                stroke-linecap="round" />
                        </svg>
                    </button>

                    <!-- Menu principal -->
                    <div class="hidden md:flex items-center gap-8">
                        <ul class="flex items-center space-x-6">
                            <li><a class="text-white hover:text-teal-400 transition-colors"
                                    href="{{ route('home') }}">Remehbs</a></li>
                            <li><a class="text-white hover:text-teal-400 transition-colors"
                                    href="{{ route('journee') }}">Journées remehbs 2025</a></li>
                            <li><a class="text-white hover:text-teal-400 transition-colors" href="/carte">FeedBack 6e
                                    journées</a></li>
                        </ul>

                        <a href="{{ Auth::check() ? (Auth::user()->role == 'user' ? route('dashboard') : route('soumission.dashboard')) : route('login') }}"
                            class="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                            Adhésion
                        </a>
                    </div>
                </div>

                <!-- Menu mobile déroulant -->
                <div id="mobile-menu" class="hidden md:hidden mt-4 pb-4">
                    <ul class="flex flex-col space-y-4">
                        <li><a class="text-white hover:text-teal-400 transition-colors"
                                href="{{ route('home') }}">Remehbs</a></li>
                        <li><a class="text-white hover:text-teal-400 transition-colors"
                                href="{{ route('journee') }}">Journées remehbs 2025</a></li>
                        <li><a class="text-white hover:text-teal-400 transition-colors" href="/carte">FeedBack 6e
                                journées</a></li>
                        <li>
                            <a href="{{ Auth::check() ? (Auth::user()->role == 'user' ? route('dashboard') : route('soumission.dashboard')) : route('login') }}"
                                class="inline-block bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
                                Adhésion
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>

    <!-- Contenu principal -->
    <main class="flex-grow main-content">
        @yield('content')
    </main>

    <script>
        let lastScroll = 0;
        const topBar = document.getElementById('topBar');
        const navbar = document.getElementById('navbar');

        window.addEventListener('scroll', () => {
            const currentScroll = window.scrollY;

            // Gestion de la barre supérieure
            if (currentScroll > lastScroll && currentScroll > 50) {
                // Défilement vers le bas - masquer la top-bar et fixer la navbar en haut
        topBar.classList.add('hidden');
        navbar.classList.add('top-0');
        navbar.classList.add('fixed'); // La navbar devient fixe en haut
                navbar.classList.add('scrolled');
            } else if (currentScroll < lastScroll && currentScroll < 50) {
                // Défilement vers le haut - afficher la top-bar et ajuster la navbar
        topBar.classList.remove('hidden');
        navbar.classList.remove('top-0');
        navbar.classList.remove('fixed');
                navbar.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        });

        // Gestion du menu mobile
        function toggleMobileMenu() {
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenu.classList.toggle('hidden');
        }

        // Fermeture du menu mobile lors du redimensionnement
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 768) {
                const mobileMenu = document.getElementById('mobile-menu');
                mobileMenu.classList.add('hidden');
            }
        });
    </script>

    @yield('script')
</body>

</html>