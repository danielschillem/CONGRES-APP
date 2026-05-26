{{-- @extends('userLayout')

@section('Content')
    <header class="bg-white shadow">
        <nav aria-label="Breadcrumb"
            class="flex justify-between mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-3xl font-bold tracking-tight">
            <ol class="flex overflow-hidden rounded-lg border border-gray-200 text-gray-600">
                <li class="flex items-center">
                    <a href="#" class="flex h-10 items-center gap-1.5 bg-gray-100 px-4 transition hover:text-gray-900">
                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>

                        <span class="ms-1.5 text-xs font-medium"> Soumission </span>
                    </a>
                </li>
            </ol>
        </nav>
    </header>



    <main>
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div class="py-12">
                <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div class="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div class="p-6 bg-white border-b border-gray-200">
                            <div class="flex justify-between items-center mb-4">
                                <h2 class="text-2xl font-semibold text-gray-800">Soumissions</h2>
                                <a href="{{ route('soumission.create') }}"
                                    class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded">
                                    + Nouveau
                                </a>
                            </div>
                            <p class="text-gray-600 mb-4">Liste de l'ensemble des soumissions faites.</p>

                            <div class="overflow-x-auto">
                                @if ($soumissions->isEmpty())
                                    <p class="m-8 text-center">(Aucune soumissions effectuée pour le moment)</p>
                                @else
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Titre</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thème</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    type</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date de soumission</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Statut</th>
                                                <th scope="col"
                                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            @foreach ($soumissions as $soumission)
                                                <tr>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm font-medium text-gray-900">
                                                            {{ $soumission->document_title }}</div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-500">{{ $soumission->theme }}</div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            class="px-2 py-1 rounded text-xs font-semibold
                                                            {{ $soumission->submission_type == 'Abstract' ? 'bg-blue-200 text-blue-800' : '' }}
                                                            {{ $soumission->submission_type == 'Poster' ? 'bg-green-200 text-green-800' : '' }}
                                                            {{ $soumission->submission_type == 'Communication' ? 'bg-yellow-200 text-yellow-800' : '' }}">
                                                            {{ $soumission->submission_type }}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <div class="text-sm text-gray-500">
                                                            {{ $soumission->created_at->format('d/m/Y') }}</div>

                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            class="px-2 py-1 rounded text-xs font-semibold
                                                            {{ $soumission->statut == 'Approuvée' ? 'bg-green-200 text-green-800' : '' }}
                                                            {{ $soumission->statut == 'Rejétée' ? 'bg-red-200 text-red-800' : '' }}
                                                            {{ $soumission->statut == 'En attente' ? 'bg-blue-200 text-blue-800' : '' }}">
                                                            {{ $soumission->statut }}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                        @if ($soumission->statut == 'Rejétée' || $soumission->statut == 'En attente')
                                                            <a href="{{ route('soumission.edit', $soumission) }}"
                                                                class="text-indigo-600 hover:text-indigo-900">Edit</a>
                                                        @endif
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                @endif
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
@endsection --}}

@extends('userLayout')

@section('Content')

    <!-- Header avec breadcrumb amélioré -->
    {{-- <header class="bg-gradient-to-r from-blue-900 to-blue-700 shadow-lg">
        <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <nav aria-label="Breadcrumb" class="flex justify-between items-center">
                <ol class="flex overflow-hidden rounded-lg bg-white/10 text-white">
                    <li class="flex items-center">
                        <a href="#" class="flex h-10 items-center gap-1.5 px-4 transition hover:bg-white/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span class="text-sm font-medium"> Accueil </span>
                        </a>
                    </li>
                    
                    <li class="flex items-center">
                        <span class="mx-2 text-white/70">/</span>
                        <a href="#" class="flex h-10 items-center gap-1.5 bg-white/20 px-4 font-semibold">
                            <span class="text-sm"> Soumissions </span>
                        </a>
                    </li>
                </ol>
                
                <h1 class="text-2xl font-bold text-white hidden sm:block">Gestion des Soumissions</h1>
            </nav>
        </div>
    </header> --}}

    <main>
        <!-- Stats Cards -->
        <div class="px-4 py-6 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm border border-blue-200">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-blue-600">Total des soumissions</p>
                        <h2 class="text-3xl font-bold text-gray-800 mt-1">{{ $totalSubmissions }}</h2>
                    </div>
                    <div class="p-3 bg-blue-500 rounded-full text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-xl shadow-sm border border-indigo-200">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-indigo-600">Abstracts</p>
                        <h2 class="text-3xl font-bold text-gray-800 mt-1">{{ $totalArticles }}</h2>
                    </div>
                    <div class="p-3 bg-indigo-500 rounded-full text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-sm border border-green-200">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-green-600">Posters</p>
                        <h2 class="text-3xl font-bold text-gray-800 mt-1">{{ $totalPosters }}</h2>
                    </div>
                    <div class="p-3 bg-green-500 rounded-full text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl shadow-sm border border-amber-200">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-amber-600">Communications</p>
                        <h2 class="text-3xl font-bold text-gray-800 mt-1">{{ $totalCommunication }}</h2>
                    </div>
                    <div class="p-3 bg-amber-500 rounded-full text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Liste des soumissions -->
        <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div class="bg-white overflow-hidden shadow-xl rounded-lg">
                <div class="p-6">
                    <div class="flex flex-col sm:flex-row justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-semibold text-gray-800 mb-2">Mes Soumissions</h2>
                            <p class="text-gray-600">Liste de l'ensemble des soumissions faites.</p>
                        </div>
                        <a href="{{ route('soumission.create') }}"
                            class="mt-4 sm:mt-0 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                            </svg>
                            Nouvelle Soumission
                        </a>
                    </div>

                    <!-- Information Box -->
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clip-rule="evenodd"/>
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-blue-800">
                                    La soumission des résumés est ouverte jusqu'au 23 juin 2025. Veuillez vous assurer que votre soumission respecte les critères demandés.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="overflow-x-auto bg-gray-50 rounded-lg shadow-inner">
                        @if ($soumissions->isEmpty())
                            <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p class="text-gray-600 mb-2">Aucune soumission effectuée pour le moment</p>
                                <p class="text-gray-500 max-w-md">Créez votre première soumission en cliquant sur le bouton "Nouvelle Soumission" ci-dessus.</p>
                            </div>
                        @else
                            <table class="min-w-full divide-y divide-gray-200">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th scope="col"
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Titre</th>
                                        <th scope="col"
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Thème</th>
                                        <th scope="col"
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type</th>
                                        <th scope="col"
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date de soumission</th>
                                        <th scope="col"
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Statut</th>
                                        <th scope="col"
                                            class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    @foreach ($soumissions as $soumission)
                                        <tr class="hover:bg-gray-50 transition-colors duration-200">
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm font-medium text-gray-900">
                                                    {{ $soumission->document_title }}</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-500">{{ $soumission->theme }}</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    class="px-3 py-1 rounded-full text-xs font-semibold
                                                    {{ $soumission->submission_type == 'Abstract' ? 'bg-blue-100 text-blue-800' : '' }}
                                                    {{ $soumission->submission_type == 'Poster' ? 'bg-green-100 text-green-800' : '' }}
                                                    {{ $soumission->submission_type == 'Communication' ? 'bg-yellow-100 text-yellow-800' : '' }}">
                                                    {{ $soumission->submission_type }}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm text-gray-500">
                                                    {{ $soumission->created_at->format('d/m/Y') }}</div>

                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    class="px-3 py-1 rounded-full text-xs font-semibold
                                                    {{ $soumission->statut == 'Approuvée' ? 'bg-green-100 text-green-800' : '' }}
                                                    {{ $soumission->statut == 'Rejétée' ? 'bg-red-100 text-red-800' : '' }}
                                                    {{ $soumission->statut == 'En attente' ? 'bg-blue-100 text-blue-800' : '' }}">
                                                    {{ $soumission->statut }}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div class="flex space-x-2">
                                                    <a href="#" class="text-blue-600 hover:text-blue-900">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </a>
                                                    
                                                    @if ($soumission->statut == 'Rejétée' || $soumission->statut == 'En attente')
                                                        <a href="{{ route('soumission.edit', $soumission) }}" class="text-indigo-600 hover:text-indigo-900">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </a>
                                                    @endif
                                                </div>
                                            </td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        @endif
                    </div>
                    <!-- Pagination -->
                    @if (!$soumissions->isEmpty())
                        <div class="mt-6">
                            {{ $soumissions->links() }}
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </main>
@endsection

@push('scripts')
<script src="https://cdnjs.cloudflare.com/ajax/libs/alpinejs/3.10.3/cdn.min.js" defer></script>
@endpush