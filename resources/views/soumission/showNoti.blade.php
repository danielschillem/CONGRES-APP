<!-- resources/views/soumission/show.blade.php -->
@extends('AdminLayout')

@section('title', 'Visualisation de soumission')


@section('content')
    <div class="container mx-auto mt-5">
        <h1 class="text-2xl font-bold mb-4">@yield('title')</h1>

        <div class="container mx-auto mt-5">
            <h1 class="text-3xl font-bold mb-6 text-center">Détails de la Soumission</h1>

            <div class="bg-white shadow-lg rounded-lg p-6">
                <h2 class="text-2xl font-semibold mb-4">Informations Générales</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 border rounded-lg shadow-sm bg-gray-50">
                        <p><strong>Type de Soumission :</strong> {{ $soumission->submission_type }}</p>
                    </div>
                    <div class="p-4 border rounded-lg shadow-sm bg-gray-50">
                        <p><strong>Thème :</strong> {{ $soumission->theme }}</p>
                    </div>
                    <div class="p-4 border rounded-lg shadow-sm bg-gray-50">
                        <p><strong>Sujets :</strong> {{ $soumission->topics }}</p>
                    </div>
                    <div class="p-4 border rounded-lg shadow-sm bg-gray-50">
                        <p><strong>Titre du Document :</strong> {{ $soumission->document_title }}</p>
                    </div>
                    <div class="p-4 border rounded-lg shadow-sm bg-gray-50">
                        <p><strong>Auteur :</strong> {{ $soumission->author_name }}</p>
                    </div>
                    <div class="p-4 border rounded-lg shadow-sm bg-gray-50">
                        <p><strong>Résumé :</strong> {{ $soumission->resume }}</p>
                    </div>
                </div>

                <h2 class="text-2xl font-semibold mt-6 mb-4">Mots-Clés</h2>
                <ul class="list-disc list-inside p-4 border rounded-lg shadow-sm bg-gray-50">
                    @foreach ($soumission->keywords as $keyword)
                        <li>{{ $keyword }}</li>
                    @endforeach
                </ul>

                <h2 class="text-2xl font-semibold mt-6 mb-4">Prévisualisation du Document soumis</h2>
                <p class="p-4 border rounded-lg shadow-sm bg-gray-50">
                    <iframe src="{{ Storage::url($soumission->file_path) }}" width="100%" height="500px"
                        frameborder="0"></iframe>
                </p>

                <h2 class="text-2xl font-semibold mt-6 mb-4">Actions</h2>
                <p class="p-4 border rounded-lg shadow-sm bg-gray-50 text-center">
                    <a href="{{ route('soumission.download', $soumission->id) }}" class="text-blue-600 hover:underline mr-3"
                        target="_blank">
                        Télécharger le fichier
                    </a>
                    @if ($soumission->statut == 'Approuvée')
                        <button id="openModalButton{{ $soumission->id }}" class="text-red-500 hover:underline mr-3">
                            Rejeter
                        </button>
                    @else
                        @if ($soumission->statut == 'Rejétée')
                            <a href="{{ route('soumission.approuver', $soumission) }}"
                                class="text-green-500 hover:underline mr-3">Approuver</a>
                        @else
                            <a href="{{ route('soumission.approuver', $soumission) }}"
                                class="text-green-500 hover:underline mr-3">Approuver</a>
                            <button id="openModalButton{{ $soumission->id }}" class="text-red-500 hover:underline mr-3">
                                Rejeter
                            </button>
                        @endif
                    @endif
                </p>

            </div>
        </div>

        <!-- Modale -->
        <div id="modal{{ $soumission->id }}"
            class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden flex justify-center items-center">
            <div class="bg-white rounded-lg shadow-lg p-6 w-1/3">
                <h2 class="text-lg font-semibold mb-4">Formulaire de rejet</h2>
                <form action="{{ route('soumission.rejeter', $soumission) }}" method="POST">
                    @csrf
                    <div class="mb-4">
                        <label for="reason{{ $soumission->id }}" class="block text-sm font-medium text-gray-700">Raison du
                            rejet</label>
                        <textarea id="reason{{ $soumission->id }}" name="reason" rows="4"
                            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"></textarea>
                    </div>
                    <div class="flex justify-end">
                        <!-- Utilisation d'un onclick pour fermer la modale -->
                        {{-- <button type="button" onclick="closeModal({{ $submission->id }})"
                                                class="mr-2 px-4 py-2 bg-gray-300 rounded">Annuler</button> --}}
                        <button type="submit" class="px-4 py-2 bg-red-500 text-white rounded">Soumettre</button>
                    </div>
                </form>
            </div>
        </div>

    </div>

    <script>
        // Ouvrir la modale
        function openModal(id) {
            const modal = document.getElementById('modal' + id);
            modal.classList.remove('hidden');
        }

        // Fermer la modale
        function closeModal(id) {
            const modal = document.getElementById('modal' + id);
            modal.classList.add('hidden');
        }

        // Écouteurs d'événements pour chaque bouton d'ouverture de modale
        document.querySelectorAll('[id^="openModalButton"]').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.id.replace('openModalButton', '');
                openModal(id);
            });
        });

        // Fermer la modale si l'utilisateur clique à l'extérieur
        window.addEventListener('click', (event) => {
            document.querySelectorAll('[id^="modal"]').forEach(modal => {
                if (event.target === modal) {
                    const id = modal.id.replace('modal', '');
                    closeModal(id);
                }
            });
        });
    </script>
@endsection
