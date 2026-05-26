{{-- @extends('userLayout')

@section('Content')
    <header class="bg-white shadow">
        <nav aria-label="Breadcrumb"
            class="flex justify-between mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-3xl font-bold tracking-tight">
            <ol class="flex overflow-hidden rounded-lg border border-gray-200 text-gray-600">
                <li class="flex items-center">
                    <a href="{{ route('dashboard') }}"
                        class="flex h-10 items-center gap-1.5 {{ request()->routeIs('soumission.index') ? 'bg-gray-100' : 'bg-white' }} px-4 transition hover:text-gray-900">
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>

                        <span class="ms-1.5 text-xs font-medium"> Soumission </span>
                    </a>
                </li>

                <li class="relative flex items-center">
                    <span
                        class="absolute inset-y-0 -start-px h-10 w-4 bg-white [clip-path:_polygon(0_0,_0%_100%,_100%_50%)] rtl:rotate-180">
                    </span>

                    <span
                        class="flex h-10 items-center bg-gray-100 pe-4 ps-8 text-xs font-medium transition hover:text-gray-900">
                        Formulaire
                    </span>
                </li>
            </ol>
        </nav>
    </header>

    <main>
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <!-- Content here -->
            <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">

                <section
                    class="relative w-full h-[60vh] bg-gradient-to-b from-[#262626bb] to-[#262626a9] bg-cover bg-center mb-8"
                    style="background-image: url('/assets/img/20210817_112933.jpg');">
                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center p-6">
                        <h1 class="text-white text-3xl md:text-5xl font-semibold uppercase">REMEHBS - 2025</h1>
                        <p class="text-white mt-2">Appel à soumission d'article pour l'année 2025</p>
                    </div>
                </section>

                <h2 class="text-2xl font-semibold text-center">Formulaire de soumission</h2>
                <form action="{{ route('soumission.store') }}" method="POST" enctype="multipart/form-data"
                    class="p-6 space-y-6">
                    @csrf

                    <div class="space-y-2">
                        <label for="submission_type" class="block text-sm font-medium text-gray-700">Type de
                            soumission</label>
                        <select id="submission_type" name="submission_type"
                            class="mt-1 block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md">
                            <option value="Abstract">Abstract</option>
                            <option value="Poster">Poster</option>
                            <option value="Communication">Communication</option>
                        </select>
                        @error('submission_type')
                            <p class="text-red-600 text-sm">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="space-y-2">
                        <label for="theme" class="block text-sm font-medium text-gray-700">Thème</label>
                        <input type="text" id="theme" name="theme"
                            class="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="Ex. LA MIGRATION INTRA ABDOMINALE DE DIU">
                        @error('theme')
                            <p class="text-red-600 text-sm">{{ $message }}</p>
                        @enderror
                    </div>
                    <div class="space-y-2">
                        <label for="topics" class="block text-sm font-medium text-gray-700">Sujet</label>
                        <select id="topics" name="topics"
                            class="mt-1 block w-full md:w-fit pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md">
                            <option value="Disponibilité et accessibilité de l’offre de santé en santé maternelle et infantile">Disponibilité et accessibilité de l’offre de santé en santé maternelle et infantile</option>
                            <option value="Nutrition maternelle et infantile">Nutrition maternelle et infantile</option>
                            <option value="Vaccination de l’enfant et de la femme enceinte">Vaccination de l’enfant et de la femme enceinte</option>
                            <option value="Soins obstétricaux et néonatals d’urgence (SONU)">Soins obstétricaux et néonatals d’urgence (SONU)</option>
                            <option value="Soins au nouveau-né (Soins maternels kangourou - SMK, Soins essentiels aux nouveau-nés - SENN, etc.)">Soins au nouveau-né (Soins maternels kangourou - SMK, Soins essentiels aux nouveau-nés - SENN, etc.)</option>
                            <option value="Planification familiale">Planification familiale</option>
                            <option value="Santé mentale du couple mère-enfant et des acteurs">Santé mentale du couple mère-enfant et des acteurs</option>
                            <option value="Éthique et qualité des soins et services de santé en santé maternelle et infantile">Éthique et qualité des soins et services de santé en santé maternelle et infantile</option>
                            <option value="Numérique et santé maternelle et infantile">Numérique et santé maternelle et infantile</option>
                            <option value="Gestion des structures de soins et des associations socio-professionnelles">Planification familiale (PF)</option>                                
                        </select>
                        @error('topics')
                            <p class="text-red-600 text-sm">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="space-y-2">
                        <label for="document_title" class="block text-sm font-medium text-gray-700">Titre du
                            document</label>
                        <input type="text" id="document_title" name="document_title"
                            class="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="Ex. Incidence et facteurs associés aux grossesses non désirées chez les travailleuses du sexe (TS) à Bobo-Dioulasso (Burkina Faso)">

                        @error('document_title')
                            <p class="text-red-600 text-sm">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="space-y-2">
                        <label for="author_name" class="block text-sm font-medium text-gray-700">Nom(s) et Prénom(s) de
                            l'auteur ou de l'autrice principal-e</label>
                        <input type="text" id="author_name" name="author_name"
                            class="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-80 shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="Ex. Traore Pierre">
                        @error('author_name')
                            <p class="text-red-600 text-sm">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="space-y-2">
                        <label for="resume" class="block text-sm font-medium text-gray-700">Résumé de votre proposition de
                            contribution</label>
                        <textarea id="resume" name="resume" rows="4"
                            class="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            placeholder="Copiez ici le résumé de votre article - maximum 200-250 mots, sans référence bibliographique."></textarea>
                        @error('resume')
                            <p class="text-red-600 text-sm">{{ $message }}</p>
                        @enderror
                    </div>

                    <div class="space-y-2">
                        <div id="keywords-container" class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">
                                Mots clés
                                <button type="button"
                                    class="add-keyword px-2 py-1 bg-teal-700 text-white rounded hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-opacity-50">+</button>
                            </label>

                            @if (old('keywords'))
                                @foreach (old('keywords') as $index => $keyword)
                                    <div class="flex space-x-2">
                                        <input type="text" name="keywords[]" value="{{ $keyword }}"
                                            class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-60 shadow-sm sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Mot-clé">
                                        <button type="button"
                                            class="remove-keyword px-2 py-1 bg-red-600 text-white rounded hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50">-</button>
                                        @error('keywords.' . $index)
                                            <p class="text-red-600 text-sm">{{ $message }}</p>
                                        @enderror
                                    </div>
                                @endforeach
                            @else
                                <div class="flex space-x-2">
                                    <input type="text" name="keywords[]"
                                        class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-60 shadow-sm sm:text-sm border-gray-300 rounded-md"
                                        placeholder="Mot-clé">
                                    <button type="button"
                                        class="remove-keyword px-2 py-1 bg-red-600 text-white rounded hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50">-</button>
                                </div>
                            @endif
                        </div>
                        @if ($errors->has('keywords'))
                            <p class="text-red-600 text-sm">{{ $errors->first('keywords') }}</p>
                        @endif

                    </div>

                    <div class="space-y-2">
                        <label for="file" class="block text-sm font-medium text-gray-700">Fichier</label>
                        <input type="file" id="file" name="file"
                            class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-full shadow-sm sm:text-sm border-teal-300 rounded-md">
                    </div>

                    <div>
                        <button type="submit"
                            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                            Envoyer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('keywords-container');

            container.addEventListener('click', function(e) {
                // Ajouter un nouveau champ de mot-clé
                if (e.target.classList.contains('add-keyword')) {
                    const newKeyword = document.createElement('div');
                    newKeyword.className = 'flex space-x-2';
                    newKeyword.innerHTML = `
                <input type="text" name="keywords[]" 
                    class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-60 shadow-sm sm:text-sm border-gray-300 rounded-md" 
                    placeholder="Mot-clé">
                <button type="button" 
                    class="remove-keyword px-2 py-1 bg-red-600 text-white rounded hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50">-</button>
            `;
                    container.appendChild(newKeyword);
                }
                // Supprimer un champ de mot-clé
                else if (e.target.classList.contains('remove-keyword')) {
                    e.target.closest('div').remove();
                }
            });

            // Recharger les erreurs après validation si elles existent
            const reloadErrors = () => {
                const errorMessages = JSON.parse(document.getElementById('error-messages')?.value || '{}');
                if (errorMessages) {
                    // Itérer sur chaque champ de mot-clé existant et afficher l'erreur correspondante
                    Array.from(container.children).forEach((child, index) => {
                        const input = child.querySelector('input[name="keywords[]"]');
                        if (input && errorMessages[`keywords.${index}`]) {
                            const error = document.createElement('p');
                            error.className = 'text-red-600 text-sm';
                            error.textContent = errorMessages[`keywords.${index}`];
                            child.appendChild(error);
                        }
                    });
                }
            };

            reloadErrors();
        });
    </script>
@endsection --}}

@extends('userLayout')

@section('Content')
    <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb">
                <ol class="flex overflow-hidden rounded-lg border border-gray-200">
                    <li class="flex items-center">
                        <a href="{{ route('dashboard') }}"
                            class="flex h-10 items-center gap-1.5 bg-white px-4 transition hover:bg-gray-50">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span class="text-sm font-medium text-gray-700"> Soumission </span>
                        </a>
                    </li>

                    <li class="relative flex items-center">
                        <span
                            class="absolute inset-y-0 -start-px h-10 w-4 bg-white [clip-path:_polygon(0_0,_0%_100%,_100%_50%)] rtl:rotate-180">
                        </span>

                        <span
                            class="flex h-10 items-center bg-gray-50 pe-4 ps-8 text-sm font-medium text-teal-600">
                            Formulaire
                        </span>
                    </li>
                </ol>
            </nav>
        </div>
    </header>

    <main class="bg-gray-50 py-10">
        <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <!-- Hero Banner -->
            <div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 shadow-xl mb-8">
                <div class="absolute inset-0 bg-black opacity-40"></div>
                <div class="relative h-64 flex flex-col justify-center items-center text-center px-6 py-12">
                    <h1 class="text-white text-4xl font-bold tracking-tight mb-2">REMEHBS - 2025</h1>
                    <div class="w-24 h-1 bg-white my-4"></div>
                    <p class="text-white text-xl">Appel à soumission d'article pour l'année 2025</p>
                </div>
            </div>
            
            <!-- Form Card -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 class="text-xl font-semibold text-gray-800">Formulaire de soumission</h2>
                    <p class="mt-1 text-sm text-gray-600">Veuillez remplir tous les champs obligatoires</p>
                </div>
                
                <form action="{{ route('soumission.store') }}" method="POST" enctype="multipart/form-data"
                    class="p-6 space-y-8">
                    @csrf

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Type de soumission -->
                        <div>
                            <label for="submission_type" class="block text-sm font-medium text-gray-700 mb-1">
                                Type de soumission <span class="text-red-500">*</span>
                            </label>
                            <select id="submission_type" name="submission_type"
                                class="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50">
                                <option value="Abstract">Abstract</option>
                                <option value="Poster">Poster</option>
                                <option value="Communication">Communication</option>
                            </select>
                            @error('submission_type')
                                <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>

                        <!-- Sujet -->
                        <div>
                            <label for="topics" class="block text-sm font-medium text-gray-700 mb-1">
                                Sujet <span class="text-red-500">*</span>
                            </label>
                            <select id="topics" name="topics"
                                class="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50">
                                <option value="Disponibilité et accessibilité de l'offre de santé en santé maternelle et infantile">Disponibilité et accessibilité de l'offre de santé</option>
                                <option value="Nutrition maternelle et infantile">Nutrition maternelle et infantile</option>
                                <option value="Vaccination de l'enfant et de la femme enceinte">Vaccination de l'enfant et de la femme enceinte</option>
                                <option value="Soins obstétricaux et néonatals d'urgence (SONU)">Soins obstétricaux et néonatals d'urgence (SONU)</option>
                                <option value="Soins au nouveau-né (Soins maternels kangourou - SMK, Soins essentiels aux nouveau-nés - SENN, etc.)">Soins au nouveau-né</option>
                                <option value="Planification familiale">Planification familiale</option>
                                <option value="Santé mentale du couple mère-enfant et des acteurs">Santé mentale du couple mère-enfant</option>
                                <option value="Éthique et qualité des soins et services de santé en santé maternelle et infantile">Éthique et qualité des soins</option>
                                <option value="Numérique et santé maternelle et infantile">Numérique et santé maternelle et infantile</option>
                                <option value="Gestion des structures de soins et des associations socio-professionnelles">Gestion des structures de soins</option>
                            </select>
                            @error('topics')
                                <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                            @enderror
                        </div>
                    </div>

                    <!-- Thème -->
                    <div>
                        <label for="theme" class="block text-sm font-medium text-gray-700 mb-1">
                            Thème <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="theme" name="theme"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                            placeholder="Ex. LA MIGRATION INTRA ABDOMINALE DE DIU">
                        @error('theme')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- Titre du document -->
                    <div>
                        <label for="document_title" class="block text-sm font-medium text-gray-700 mb-1">
                            Titre du document <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="document_title" name="document_title"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                            placeholder="Ex. Incidence et facteurs associés aux grossesses non désirées chez les travailleuses du sexe (TS) à Bobo-Dioulasso">
                        @error('document_title')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- Auteur -->
                    <div>
                        <label for="author_name" class="block text-sm font-medium text-gray-700 mb-1">
                            Nom(s) et Prénom(s) de l'auteur ou de l'autrice principal-e <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="author_name" name="author_name"
                            class="w-full md:w-2/3 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                            placeholder="Ex. Traore Pierre">
                        @error('author_name')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- Résumé -->
                    <div>
                        <label for="resume" class="block text-sm font-medium text-gray-700 mb-1">
                            Résumé de votre proposition <span class="text-red-500">*</span>
                        </label>
                        <textarea id="resume" name="resume" rows="5"
                            class="w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                            placeholder="Copiez ici le résumé de votre article - maximum 200-250 mots, sans référence bibliographique."></textarea>
                        <p class="mt-1 text-xs text-gray-500">Maximum 250 mots, sans référence bibliographique</p>
                        @error('resume')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- Mots clés -->
                    <div>
                        <div id="keywords-container" class="space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="block text-sm font-medium text-gray-700">
                                    Mots clés <span class="text-red-500">*</span>
                                </label>
                                <button type="button"
                                    class="add-keyword px-3 py-1 rounded-md bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors">
                                    Ajouter un mot-clé
                                </button>
                            </div>

                            <div class="keywords-list space-y-3">
                                @if (old('keywords'))
                                    @foreach (old('keywords') as $index => $keyword)
                                        <div class="flex space-x-2">
                                            <input type="text" name="keywords[]" value="{{ $keyword }}"
                                                class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                                                placeholder="Mot-clé">
                                            <button type="button"
                                                class="remove-keyword p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                                </svg>
                                            </button>
                                            @error('keywords.' . $index)
                                                <p class="text-red-600 text-sm">{{ $message }}</p>
                                            @enderror
                                        </div>
                                    @endforeach
                                @else
                                    <div class="flex space-x-2">
                                        <input type="text" name="keywords[]"
                                            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50"
                                            placeholder="Mot-clé">
                                        <button type="button"
                                            class="remove-keyword p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                @endif
                            </div>
                            
                            @if ($errors->has('keywords'))
                                <p class="text-red-600 text-sm">{{ $errors->first('keywords') }}</p>
                            @endif
                        </div>
                    </div>

                    <!-- Fichier -->
                    <div>
                        <label for="file" class="block text-sm font-medium text-gray-700 mb-1">
                            Fichier <span class="text-red-500">*</span>
                        </label>
                        <div class="flex items-center justify-center w-full">
                            <label for="file" class="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg class="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                    </svg>
                                    <p class="mb-1 text-sm text-gray-500">Cliquez pour télécharger ou glisser-déposer</p>
                                    <p class="text-xs text-gray-500">DOC, DOCX, ou PDF (max. 5MB)</p>
                                </div>
                                <input id="file" name="file" type="file" class="hidden" />
                            </label>
                        </div>
                        <div id="file-name" class="mt-2 text-sm text-gray-500"></div>
                        @error('file')
                            <p class="mt-1 text-sm text-red-600">{{ $message }}</p>
                        @enderror
                    </div>

                    <!-- Submit Button -->
                    <div class="pt-4">
                        <button type="submit"
                            class="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors">
                            Soumettre l'article
                        </button>
                    </div>
                </form>
            </div>
            
            <!-- Info Section -->
            <div class="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3 flex-1">
                        <h3 class="text-sm font-medium text-blue-800">Information</h3>
                        <div class="mt-2 text-sm text-blue-700">
                            <p>Pour toute question ou assistance concernant votre soumission, veuillez contacter l'équipe REMEHBS à <a href="mailto:contact@remehbs.org" class="font-medium underline">contact@remehbs.org</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.getElementById('keywords-container');
            const keywordsList = container.querySelector('.keywords-list');
            const fileInput = document.getElementById('file');
            const fileNameDisplay = document.getElementById('file-name');

            // Gestion des mots-clés
            container.addEventListener('click', function(e) {
                // Ajouter un nouveau champ de mot-clé
                if (e.target.classList.contains('add-keyword') || e.target.closest('.add-keyword')) {
                    const newKeyword = document.createElement('div');
                    newKeyword.className = 'flex space-x-2';
                    newKeyword.innerHTML = `
                        <input type="text" name="keywords[]" 
                            class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring focus:ring-teal-200 focus:ring-opacity-50" 
                            placeholder="Mot-clé">
                        <button type="button" 
                            class="remove-keyword p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                            </svg>
                        </button>
                    `;
                    keywordsList.appendChild(newKeyword);
                }
                // Supprimer un champ de mot-clé
                else if (e.target.classList.contains('remove-keyword') || e.target.closest('.remove-keyword')) {
                    const button = e.target.classList.contains('remove-keyword') ? e.target : e.target.closest('.remove-keyword');
                    const keywordField = button.closest('div');
                    
                    // S'assurer qu'il reste au moins un champ
                    if (keywordsList.children.length > 1) {
                        keywordField.remove();
                    }
                }
            });

            // Afficher le nom du fichier sélectionné
            fileInput.addEventListener('change', function() {
                if (fileInput.files.length > 0) {
                    fileNameDisplay.textContent = `Fichier sélectionné: ${fileInput.files[0].name}`;
                } else {
                    fileNameDisplay.textContent = '';
                }
            });

            // Recharger les erreurs après validation si elles existent
            const reloadErrors = () => {
                const errorMessages = JSON.parse(document.getElementById('error-messages')?.value || '{}');
                if (errorMessages) {
                    // Itérer sur chaque champ de mot-clé existant et afficher l'erreur correspondante
                    Array.from(keywordsList.children).forEach((child, index) => {
                        const input = child.querySelector('input[name="keywords[]"]');
                        if (input && errorMessages[`keywords.${index}`]) {
                            const error = document.createElement('p');
                            error.className = 'text-red-600 text-sm';
                            error.textContent = errorMessages[`keywords.${index}`];
                            child.appendChild(error);
                        }
                    });
                }
            };

            reloadErrors();
        });
    </script>
@endsection