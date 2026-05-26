@extends('userLayout')
<style>
    .bg-remehbs {
        background-color: #1e40af;
    }

    .text-remehbs {
        color: #1e40af;
    }

    .border-remehbs {
        border-color: #1e40af;
    }
</style>
@section('Content')
    <main>
        <!-- Bannière événement -->
        <div class="w-full ">
            <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" x-data="{ showDetails: false }">
                <!-- Bannière avec informations de l'événement -->
                <div class="bg-white shadow-xl rounded-lg overflow-hidden">
                    <!-- Banner Header -->
                    <div
                        class="bg-gradient-to-r from-blue-900 to-blue-700 p-4 flex flex-col md:flex-row items-center justify-between">
                        <div class="flex items-center">
                            <div class="h-16 w-16 bg-pink-200 rounded-full flex items-center justify-center mr-4">
                                <img class="h-10 w-10 logo" src="/assets/img/logo.png" alt="Logo REMEHBS">
                            </div>
                            <div>
                                <h1 class="text-2xl md:text-3xl text-white font-bold">20<sup>ans</sup></h1>
                                <h2 class="text-xl text-white font-semibold">7èmes Journées Scientifiques de Périnatalité
                                </h2>
                            </div>
                        </div>
                        <div class="bg-red-600 text-white font-bold py-2 px-4 rounded-full mt-4 md:mt-0">
                            <p class="text-center">23, 24, 25 juillet 2025</p>
                            <p class="text-center text-sm">Bobo-Dioulasso</p>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div class="p-4 md:p-6">
                        <h3 class="text-xl font-bold text-gray-800 mb-3">Réseau mère enfant des Hauts-Bassins : vingt ans
                            après, quel bilan ?</h3>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div class="bg-pink-100 rounded-lg p-3 flex items-center">
                                <div class="bg-pink-600 text-white p-2 rounded-full mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <span class="text-sm font-medium">Soumission des résumés:<br>01/04 - 23/06/2025</span>
                            </div>
                            <div class="bg-blue-100 rounded-lg p-3 flex items-center">
                                <div class="bg-blue-600 text-white p-2 rounded-full mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span class="text-sm font-medium">Pré-congrès: Orodara<br>01/03 - 30/06/2025</span>
                            </div>
                            <div class="bg-green-100 rounded-lg p-3 flex items-center">
                                <div class="bg-green-600 text-white p-2 rounded-full mr-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <span class="text-sm font-medium">Lieu: Maison de la Culture<br>Mgr Anselme Titianma
                                    SANON</span>
                            </div>
                        </div>

                        {{-- <!-- Thèmes button -->
                        <button @click="showDetails = !showDetails"
                            class="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded-md flex items-center justify-between mb-6">
                            <span>Voir les sous-thèmes abordés</span>
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transform transition-transform"
                                :class="showDetails ? 'rotate-180' : ''" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <!-- Dropdown content -->
                        <div x-show="showDetails" x-transition:enter="transition ease-out duration-300"
                            x-transition:enter-start="opacity-0 transform -translate-y-4"
                            x-transition:enter-end="opacity-100 transform translate-y-0"
                            x-transition:leave="transition ease-in duration-300"
                            x-transition:leave-start="opacity-100 transform translate-y-0"
                            x-transition:leave-end="opacity-0 transform -translate-y-4"
                            class="bg-gray-100 p-4 rounded-md mb-6">
                            <ul class="list-decimal pl-6 space-y-2 text-sm">
                                <li>Disponibilité et accessibilité de l'offre de santé en santé maternelle et infantile</li>
                                <li>Nutrition maternelle et infantile</li>
                                <li>Vaccination de l'enfant et de la femme enceinte</li>
                                <li>Soins obstétricaux et néonatals d'urgence (SONU)</li>
                                <li>Soins au nouveau-né (Soins maternels kangourou - SMK, Soins essentiels aux nouveau-nés -
                                    SENN, etc.)</li>
                                <li>Planification familiale</li>
                                <li>Santé mentale du couple mère-enfant et des acteurs</li>
                                <li>Éthique et qualité des soins et services de santé en santé maternelle et infantile</li>
                                <li>Numérique et santé maternelle et infantile</li>
                                <li>Gestion des structures de soins et des associations socio-professionnelles</li>
                            </ul>
                        </div> --}}
                    </div>
                </div>
            </div>
        </div>

        <div class="min-h-screen">
            <!-- Main Content -->
            <main class="container mx-auto px-4 py-8">
                <!-- Programme -->
                <div class="max-w-4xl mx-auto mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-xl font-bold text-remehbs mb-4 pb-2 border-b-2 border-remehbs">Programme Complet</h2>

                    <div class="mb-6">
                        <h3 class="text-lg font-bold text-remehbs mb-3">Thème principal</h3>
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <p class="text-lg">« Le Réseau mère enfant des Hauts-Bassins (REMEHBS) : vingt ans après, quel
                                bilan ? »</p>
                        </div>
                    </div>

                    <div class="mb-6">
                        <h3 class="text-lg font-bold text-remehbs mb-3">Sous-thèmes abordés</h3>
                        <ol class="list-decimal list-inside space-y-1 pl-4">
                            <li>Disponibilité et accessibilité de l'offre de santé en santé maternelle et infantile</li>
                            <li>Nutrition maternelle et infantile</li>
                            <li>Vaccination de l'enfant et de la femme enceinte</li>
                            <li>Soins obstétricaux et néonatals d'urgence (SONU)</li>
                            <li>Soins au nouveau-né (Soins maternels kangourou - SMK, Soins essentiels aux nouveau-nés -
                                SENN, etc.)</li>
                            <li>Planification familiale</li>
                            <li>Santé mentale du couple mère-enfant et des acteurs</li>
                            <li>Éthique et qualité des soins et services de santé en santé maternelle et infantile</li>
                            <li>Numérique et santé maternelle et infantile</li>
                            <li>Gestion des structures de soins et des associations socio-professionnelles</li>
                        </ol>
                    </div>

                    <div class="mb-6">
                        <h3 class="text-lg font-bold text-remehbs mb-3">Calendrier des événements</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse">
                                <thead>
                                    <tr class="bg-gray-100">
                                        <th class="p-3 border text-left">Événement</th>
                                        <th class="p-3 border text-left">Dates</th>
                                        <th class="p-3 border text-left">Lieu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="p-3 border">1er appel à communication</td>
                                        <td class="p-3 border">Septembre 2024</td>
                                        <td class="p-3 border">-</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 border">Pré-congrès</td>
                                        <td class="p-3 border">Du 1er mars au 30 juin 2025</td>
                                        <td class="p-3 border">Orodara</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 border">Session des compétences</td>
                                        <td class="p-3 border">Du 15 au 22 juillet 2025</td>
                                        <td class="p-3 border">Bobo-Dioulasso</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 border">Congrès</td>
                                        <td class="p-3 border">23, 24, 25 juillet 2025</td>
                                        <td class="p-3 border">Bobo-Dioulasso</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="mb-6">
                        <h3 class="text-lg font-bold text-remehbs mb-3">Soumission des résumés</h3>
                        <div class="space-y-2">
                            <p><span class="font-bold">Date de début de soumission:</span> 01/04/2025</p>
                            <p><span class="font-bold">Date de fin de soumission:</span> 23/06/2025</p>
                            <p class="mt-3"><span class="font-bold">Format:</span> Time news roman, interligne simple,
                                taille 12.</p>
                            <p><span class="font-bold">Total des mots:</span> 300</p>
                            <p><span class="font-bold">Mots clés:</span> 5 au maximum</p>
                            <p class="mt-3"><span class="font-bold">Structure:</span> Résumé (Introduction/objectif,
                                Méthodologie, Résultats, Conclusion)</p>
                        </div>
                    </div>

                    <div class="mb-6">
                        <h3 class="text-lg font-bold text-remehbs mb-3">Format des posters</h3>
                        <p>Dimensions: L100 x l120</p>
                    </div>

                    <div>
                        <h3 class="text-lg font-bold text-remehbs mb-3">Tarifs de participation</h3>
                        <div class="overflow-x-auto">
                            <table class="w-full border-collapse">
                                <thead>
                                    <tr class="bg-gray-100">
                                        <th class="p-3 border text-left">Catégorie</th>
                                        <th class="p-3 border text-right">Montant (FCFA)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td class="p-3 border">Spécialiste et assimilés</td>
                                        <td class="p-3 border text-right">30.000</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 border">Généralistes et DES</td>
                                        <td class="p-3 border text-right">25.000</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 border">Attachés de santé, SF/ME, IDE, IB et autres</td>
                                        <td class="p-3 border text-right">20.000</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 border">Location de stand</td>
                                        <td class="p-3 border text-right">500.000</td>
                                    </tr>
                                    <tr>
                                        <td class="p-3 border">Symposium</td>
                                        <td class="p-3 border text-right">350.000</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Contact Info -->
                <div class="max-w-4xl mx-auto mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h2 class="text-xl font-bold text-remehbs mb-4 pb-2 border-b-2 border-remehbs">Informations pratiques
                    </h2>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 class="text-lg font-bold text-remehbs mb-3">Lieu du congrès</h3>
                            <p class="mb-2">Maison de la Culture Mgr Anselme Titianma SANON</p>
                            <p>Bobo-Dioulasso, Burkina Faso</p>
                        </div>

                        <div>
                            <h3 class="text-lg font-bold text-remehbs mb-3">Contact</h3>
                            <p class="mb-2"><span class="font-bold">Téléphones:</span> (00226) 70244827 / 78694467 /
                                70340000 / 76562667</p>
                            <p class="mb-2"><span class="font-bold">Email:</span> secretariat@remehbs-bf.org</p>
                            <p><span class="font-bold">Site web:</span> <a href="https://remehbs-bf.org"
                                    class="text-remehbs hover:underline">remehbs-bf.org</a></p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </main>
@endsection
