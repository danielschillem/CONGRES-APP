@extends('AdminLayout')

@section('title', 'Visualisation de soumission')

@section('content')
    <div class="container mx-auto py-8 px-4 max-w-7xl">
    
        <!-- Bouton de retour -->
        <div class="mb-4">
            <a href="" onclick="history.back()" class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                </svg>
                Retour à la liste
            </a>
        </div>
    
        <!-- En-tête avec actions principales -->
        <div class="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h1 class="text-2xl md:text-3xl font-bold text-gray-800">{{ $soumission->document_title }}</h1>
                <p class="text-gray-600 mt-1">Par <span class="font-medium">{{ $soumission->author_name }}</span></p>
            </div>
            <div class="mt-4 md:mt-0 flex gap-3">
                @if ($soumission->statut == 'Approuvée')
                    <button id="openRejectModal" 
                            class="px-4 py-2 bg-white border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        Rejeter
                    </button>
                @else
                    @if ($soumission->statut == 'Rejétée')
                        <a href="{{ route('soumission.approuver', $soumission) }}"
                           class="px-4 py-2 bg-white border border-green-500 text-green-500 rounded-lg hover:bg-green-50 transition-colors">
                            Approuver
                        </a>
                    @else
                        <button id="openRejectModal" 
                                class="px-4 py-2 bg-white border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                            Rejeter
                        </button>
                        <a href="{{ route('soumission.approuver', $soumission) }}"
                           class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Approuver
                        </a>
                    @endif
                @endif
            </div>
        </div>
    
        <!-- Contenu principal -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Informations détaillées -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-xl shadow-sm p-6 space-y-5">
                    <!-- Statut de la soumission -->
                    <div class="mb-5">
                        @php
                            $statusColor = [
                                'En attente' => 'bg-yellow-100 text-yellow-800',
                                'Approuvée' => 'bg-green-100 text-green-800',
                                'Rejétée' => 'bg-red-100 text-red-800'
                            ][$soumission->statut] ?? 'bg-gray-100 text-gray-800';
                        @endphp
                        <span class="px-3 py-1 rounded-full text-sm font-medium {{ $statusColor }}">
                            {{ $soumission->statut }}
                        </span>
                    </div>
    
                    <!-- Type de soumission -->
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Type de soumission</h3>
                        <p class="mt-1 text-gray-900 font-medium">{{ $soumission->submission_type }}</p>
                    </div>
    
                    <!-- Thème -->
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Thème</h3>
                        <p class="mt-1 text-gray-900 font-medium">{{ $soumission->theme }}</p>
                    </div>
    
                    <!-- Sujet -->
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Sujet</h3>
                        <p class="mt-1 text-gray-900 font-medium">{{ $soumission->topics }}</p>
                    </div>
    
                    <!-- Mots-clés -->
                    <div>
                        <h3 class="text-sm font-medium text-gray-500">Mots-clés</h3>
                        <div class="mt-2 flex flex-wrap gap-2">
                            @foreach ($soumission->keywords as $keyword)
                                <span class="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">{{ $keyword }}</span>
                            @endforeach
                        </div>
                    </div>
                </div>
            </div>
    
            <!-- Résumé et visualisation du document -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Résumé -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h2 class="text-lg font-semibold mb-3">Résumé</h2>
                    <div class="prose max-w-none text-gray-700">
                        {{ $soumission->resume }}
                    </div>
                </div>
    
                <!-- Visualisation du document -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-lg font-semibold">Document</h2>
                        <a href="{{ route('soumission.download', $soumission->id) }}" download 
                           class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
                                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v9.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 13.586V4a1 1 0 011-1z" clip-rule="evenodd" />
                            </svg>
                            Télécharger
                        </a>
                    </div>
                    
                    <!-- Conteneur pour le document -->
                    <div class="border border-gray-200 rounded-lg">
                        <!--<iframe id="documentViewer" -->
                        <!--        class="w-full h-[600px]" -->
                        <!--        src="{{ Storage::url($soumission->file_path) }}">-->
                        <!--</iframe>-->
                        <embed class="w-full h-[600px]" src="{{ Storage::url($soumission->file_path) }}" type="">
                        <!-- Élément pour afficher le PDF -->
                        {{-- <div id="pdf-container" class="w-full h-[600px] overflow-scroll"></div> --}}
                    </div>
                </div>
            </div>
        </div>
    
        <!-- Modale de rejet -->
        <div id="rejectModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex justify-center items-center">
            <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold">Raison du rejet</h2>
                    <button id="closeRejectModal" class="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form action="{{ route('soumission.rejeter', $soumission) }}" method="POST">
                    @csrf
                    <div class="mb-4">
                        <label for="rejectionReason" class="block text-sm font-medium text-gray-700 mb-1">
                            Veuillez expliquer la raison du rejet
                        </label>
                        <textarea id="rejectionReason" name="reason" rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Détaillez les raisons du rejet..." required></textarea>
                    </div>
                    <div class="flex justify-end gap-3">
                        <button type="button" id="cancelReject"
                                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                            Annuler
                        </button>
                        <button type="submit" 
                                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            Confirmer le rejet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
    
    
    <!-- Inclure PDF.js -->
    <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.min.js"></script>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const rejectModal = document.getElementById('rejectModal');
            const openRejectModalBtn = document.getElementById('openRejectModal');
            const closeRejectModalBtn = document.getElementById('closeRejectModal');
            const cancelRejectBtn = document.getElementById('cancelReject');
            
            // Functions to control modal visibility
            function openModal() {
                rejectModal.classList.remove('hidden');
                document.body.style.overflow = 'hidden'; // Prevent scrolling
            }
            
            function closeModal() {
                rejectModal.classList.add('hidden');
                document.body.style.overflow = 'auto'; // Re-enable scrolling
            }
            
            // Event listeners
            if (openRejectModalBtn) {
                openRejectModalBtn.addEventListener('click', openModal);
            }
            
            if (closeRejectModalBtn) {
                closeRejectModalBtn.addEventListener('click', closeModal);
            }
            
            if (cancelRejectBtn) {
                cancelRejectBtn.addEventListener('click', closeModal);
            }
            
            // Close modal when clicking outside
            rejectModal.addEventListener('click', function(event) {
                if (event.target === rejectModal) {
                    closeModal();
                }
            });
            
            // Close modal with ESC key
            document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape' && !rejectModal.classList.contains('hidden')) {
                    closeModal();
                }
            });
        });
        
        // Pdf.js
        const pdfContainer = document.getElementById('pdf-container');
        const pdfUrl = "{{ Storage::url($soumission->file_path) }}";
    
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.16.105/build/pdf.worker.min.js';
    
        pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
            const scale = 1.5; // Échelle d'affichage
    
            // Boucler sur toutes les pages
            for (let i = 1; i <= pdf.numPages; i++) {
                pdf.getPage(i).then(function(page) {
                    const viewport = page.getViewport({ scale: scale });
    
                    // Créer un canvas pour chaque page
                    const canvas = document.createElement('canvas');
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    canvas.style.marginBottom = '10px'; // Espacement entre les pages
    
                    const renderContext = {
                        canvasContext: canvas.getContext('2d'),
                        viewport: viewport
                    };
    
                    page.render(renderContext);
    
                    // Ajouter le canvas au conteneur
                    pdfContainer.appendChild(canvas);
                });
            }
        });
    </script>
@endsection