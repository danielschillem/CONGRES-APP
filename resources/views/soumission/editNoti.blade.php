@extends('userLayout')

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
                        Edition de formulaire
                    </span>
                </li>
            </ol>
        </nav>
    </header>

    <main>
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <!-- Content here -->

            @if (isset($data->reason))
                <div role="alert" class="max-w-4xl mx-auto mb-4 relative rounded border-s-4 border-red-500 bg-red-50 p-4">
                    <button id="closeAlert"
                        class="absolute top-2 right-2 text-red-800 hover:text-red-600 focus:outline-none">
                        <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                            <g id="SVGRepo_iconCarrier">
                                <circle opacity="0.5" cx="12" cy="12" r="10" stroke="#ff0000"
                                    stroke-width="1.5"></circle>
                                <path d="M14.5 9.50002L9.5 14.5M9.49998 9.5L14.5 14.5" stroke="#ff0000" stroke-width="1.5"
                                    stroke-linecap="round"></path>
                            </g>
                        </svg>
                    </button>

                    <div class="flex items-center gap-2 text-red-800">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
                            <path fill-rule="evenodd"
                                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                                clip-rule="evenodd" />
                        </svg>

                        <strong class="block font-medium"> Votre soumission a été rjetée </strong>
                    </div>

                    <p class="mt-2 text-sm text-red-700">
                        Veuillez prendre connaissance de la raison de ce rejet
                    </p>

                    <p class="mt-2 text-sm text-red-700">
                        {{ $data->reason }}
                    </p>
                </div>
            @endif

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
                <form action="{{ route('soumission.update', $soumission) }}" method="POST" enctype="multipart/form-data"
                    class="p-6 space-y-6">
                    @csrf
                    @method('patch')

                    <div class="space-y-2">
                        <label for="submission_type" class="block text-sm font-medium text-gray-700">Type de
                            soumission</label>
                        <select id="submission_type" name="submission_type"
                            class="mt-1 block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md">
                            <option value="Abstract" {{ $soumission->submission_type === 'Abstract' ? 'selected' : '' }}>
                                Abstract</option>
                            <option value="Poster" {{ $soumission->submission_type === 'Poster' ? 'selected' : '' }}>Poster
                            </option>
                            <option value="Communication"
                                {{ $soumission->submission_type === 'Communication' ? 'selected' : '' }}>Communication
                            </option>
                        </select>
                    </div>

                    <div class="space-y-2">
                        <label for="theme" class="block text-sm font-medium text-gray-700">Thème</label>
                        <input type="text" id="theme" name="theme"
                            class="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value="{{ $soumission->theme }}">
                    </div>
                    <div class="space-y-2">
                        <label for="topics" class="block text-sm font-medium text-gray-700">Sujet</label>
                        <select id="topics" name="topics"
                            class="mt-1 block w-full md:w-fit pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md">
                            <option value="Disponibilité et accessibilité de l’offre de santé en santé maternelle et infantile"
                                {{ $soumission->topics === 'Disponibilité et accessibilité de l’offre de santé en santé maternelle et infantile' ? 'selected' : '' }}>Urgences
                                Disponibilité et accessibilité de l’offre de santé en santé maternelle et infantile</option>
                            <option value="Nutrition maternelle et infantile"
                                {{ $soumission->topics === 'Nutrition maternelle et infantile' ? 'selected' : '' }}>Nutrition maternelle et infantile</option>
                            <option value="Vaccination de l’enfant et de la femme enceinte"
                                {{ $soumission->topics === 'Vaccination de l’enfant et de la femme enceinte' ? 'selected' : '' }}>Vaccination de l’enfant et de la femme enceinte</option>
                            <option value="Soins obstétricaux et néonatals d’urgence (SONU)"
                                {{ $soumission->topics === 'Soins obstétricaux et néonatals d’urgence (SONU)' ? 'selected' : '' }}>
                                Soins obstétricaux et néonatals d’urgence (SONU)</option>
                            <option value="Soins au nouveau-né (Soins maternels kangourou - SMK, Soins essentiels aux nouveau-nés - SENN, etc.)"
                                {{ $soumission->topics === 'Soins au nouveau-né (Soins maternels kangourou - SMK, Soins essentiels aux nouveau-nés - SENN, etc.)' ? 'selected' : '' }}>
                                Soins au nouveau-né (Soins maternels kangourou - SMK, Soins essentiels aux nouveau-nés - SENN, etc.)</option>
                            <option value="Planification familiale"
                                {{ $soumission->topics === 'Planification familiale' ? 'selected' : '' }}>
                                Planification familiale</option>
                            <option value="Santé mentale du couple mère-enfant et des acteurs"
                                {{ $soumission->topics === 'Santé mentale du couple mère-enfant et des acteurs' ? 'selected' : '' }}>
                                Santé mentale du couple mère-enfant et des acteurs</option>
                            <option value="Éthique et qualité des soins et services de santé en santé maternelle et infantile"
                                {{ $soumission->topics === 'Éthique et qualité des soins et services de santé en santé maternelle et infantile' ? 'selected' : '' }}>
                                Éthique et qualité des soins et services de santé en santé maternelle et infantile</option>
                            <option value="Numérique et santé maternelle et infantile"
                                {{ $soumission->topics === 'Numérique et santé maternelle et infantile' ? 'selected' : '' }}>
                                Numérique et santé maternelle et infantile</option>
                            <option value="Gestion des structures de soins et des associations socio-professionnelles"
                                {{ $soumission->topics === 'Gestion des structures de soins et des associations socio-professionnelles' ? 'selected' : '' }}>
                                Gestion des structures de soins et des associations socio-professionnelles</option>
                        </select>
                    </div>

                    <div class="space-y-2">
                        <label for="document_title" class="block text-sm font-medium text-gray-700">Titre du
                            document</label>
                        <input type="text" id="document_title" name="document_title"
                            class="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value="{{ $soumission->document_title }}">
                    </div>

                    <div class="space-y-2">
                        <label for="author_name" class="block text-sm font-medium text-gray-700">Nom(s) et Prénom(s) de
                            l'auteur ou de l'autrice principal-e</label>
                        <input type="text" id="author_name" name="author_name"
                            class="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-80 shadow-sm sm:text-sm border-gray-300 rounded-md"
                            value="{{ $soumission->author_name }}">
                    </div>

                    <div class="space-y-2">
                        <label for="resume" class="block text-sm font-medium text-gray-700">Résumé de votre proposition
                            de
                            contribution</label>
                        <textarea id="resume" name="resume" rows="4"
                            class="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">{{ $soumission->resume }}</textarea>
                    </div>

                    <div class="space-y-2">
                        <div id="keywords-container" class="space-y-2">
                            <label class="block text-sm font-medium text-gray-700">
                                Mots clés
                                <button type="button"
                                    class="add-keyword px-2 py-1 bg-teal-700 text-white rounded hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-opacity-50">+</button>
                            </label>
                            @foreach ($soumission->keywords as $keyword)
                                <div class="flex space-x-2">
                                    <input type="text" name="keywords[]"
                                        class="mt-1 focus:ring-gray-500 focus:border-gray-500 block w-60 shadow-sm sm:text-sm border-gray-300 rounded-md"
                                        value="{{ $keyword }}">
                                </div>
                            @endforeach

                        </div>
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
                if (e.target.classList.contains('add-keyword')) {
                    const newKeyword = document.createElement('div');
                    newKeyword.className = 'flex space-x-2';
                    newKeyword.innerHTML = `
                        <input type="text" name="keywords[]" class="mt-1 focus:ring-teal-500 focus:border-teal-500 block w-60 shadow-sm sm:text-sm border-gray-300 rounded-md" placeholder="Mot-clé">
                        <button type="button" class="remove-keyword px-2 py-1 bg-red-600 text-white rounded hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50">-</button>
                    `;
                    container.appendChild(newKeyword);
                } else if (e.target.classList.contains('remove-keyword')) {
                    e.target.closest('div').remove();
                }
            });
        });

        // Script pour fermer l'alerte
        document.getElementById('closeAlert').addEventListener('click', function() {
            this.closest('[role="alert"]').style.display = 'none';
        });
    </script>
@endsection
