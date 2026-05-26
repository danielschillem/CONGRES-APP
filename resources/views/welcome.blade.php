{{-- @extends('layout')

@section('title', 'Accueil')

@section('style')
    <style>
        #carousel {
            position: relative;
            overflow: hidden;
            width: 100%;
            height: 100vh;
            /* Full height for larger screens */
        }

        .carousel-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            /* Cover the container */
            transition: opacity 1s ease-in-out;
            /* Fade effect */
        }

        @media (max-width: 768px) {
            #carousel {
                height: 50vh;
                /* Reduced height for smaller screens */
            }

            .carousel-image {
                height: auto;
                /* Allow images to maintain aspect ratio */
                max-height: 50vh;
                /* Limit height on small screens */
            }
        }


        .coord-sec {
            flex-direction: column;
            /* Stack on small screens */
        }

        @media (min-width: 768px) {
            .coord-sec {
                flex-direction: row;
                /* Align side by side on larger screens */
            }
        }

        .text-container {
            padding-left: 1rem;
            padding-right: 1rem;
        }

        @media (min-width: 768px) {
            .text-container {
                padding-left: 2.5rem;
                padding-right: 2.5rem;
            }
        }
        
    </style>
@endsection

@section('content')


    <div id="carousel" class="relative overflow-hidden h-screen">
        <img src="{{ asset('/assets/img/img-caroussel/A004C006_210726_K7B4.MOV.19_02_35_12.Still001.jpg') }}" alt="Image 1"
            class="carousel-image w-full h-screen absolute transition-opacity duration-1000 opacity-100">
        <img src="{{ asset('/assets/img/img-caroussel/A004C009_210726_K7B4.MOV.19_06_10_19.Still001.jpg') }}" alt="Image 2"
            class="carousel-image w-full h-screen absolute transition-opacity duration-1000 opacity-0">
        <img src="{{ asset('/assets/img/img-caroussel/A005C081_210724_K7B4.MOV.00_05_21_19.Still001.jpg') }}" alt="Image 3"
            class="carousel-image w-full h-screen absolute transition-opacity duration-1000 opacity-0">
        <img src="{{ asset('/assets/img/img-caroussel/A005C090_210726_K7B4.MOV.17_29_02_00.Still001.jpg') }}" alt="Image 4"
            class="carousel-image w-full h-screen absolute transition-opacity duration-1000 opacity-0">
        <img src="{{ asset('/assets/img/img-caroussel/congres.00_02_48_09.Still001.jpg') }}" alt="Image 5"
            class="carousel-image w-full h-screen absolute transition-opacity duration-1000 opacity-0">
    </div>


    <!-- President -->
    <section class="custom-container w-full py-20 bg-gray-100">
        <div class="mot-remehbs bg-white p-4 shadow-md">
            <div class="text-container max-h-[480px] overflow-hidden relative px-4 py-2 text-justify">
                <div class="coord-sec flex flex-col md:flex-row gap-6">
                    <img style="width: 140px; height: auto;" src="{{ asset('assets/img/coordonnateur.png') }}"
                        alt="Photo du Coordonnateur" />
                    <div>
                        <p class="text-base">Le Coordonateur du REMEHBS</p>
                        <h2 class="rem-coord text-xl md:text-2xl font-medium text-indigo-800">Pr. Ziemlé Clément MEDA</h2>
                        <p class="text-base">
                            Maître de conférences agrégé <br />
                            Santé publique/ Politique et management des systèmes de santé
                        </p>
                    </div>
                </div>
                <p class="mt-2">
                    Chers membres, collègues, et partenaires, C'est avec une immense joie
                    et un grand honneur que je vous souhaite la bienvenue au sein du
                    Réseau Mère Enfants des Hauts-Bassins (REMEHBS).
                </p>
                <p>
                    Le Réseau mère enfant des Hauts-Bassins (REMEHBS) est une association
                    prônant le réseau de périnatalité, et engagée résolument pour
                    l’amélioration de la santé de la mère et de l’enfant dans la Région de
                    Hauts-Bassins, voire au niveau national au Burkina Faso. Un réseau de
                    périnatalité est une modalité particulière d’organisation des soins de
                    santé maternels et périnatals regroupant aussi bien les établissements
                    de soins que les professionnels du secteur socio-sanitaire, les
                    usagers des services, et les non professionnels de la santé, tous
                    œuvrant pour la santé de la mère et de l’enfant. L’objectif principal
                    d’un réseau de périnatalité est une meilleure utilisation de toutes
                    les ressources et acteurs pour améliorer la qualité de la santé
                    maternelle et périnatale.
                </p>
                <p>
                    Se faisant, le REMEHBS contribue à la promotion de la santé et à la
                    prévention en santé élevées au rang de premier tremplin de tout
                    développement national. Première approche novatrice de réseau de
                    périnatalité pour la réduction des morbidités et mortalités
                    maternelles et périnatales en Afrique francophone, l’expérience du
                    REMEHBS fait bon chemin au Burkina Faso depuis 2025.
                </p>
                <p>
                    Ayant son siège à Bobo-Dioulasso, le REMEHBS est une association de
                    professionnels de santé et de non professionnels de la région des
                    Hauts-Bassins ayant pour but de contribuer à la réduction des
                    morbidités et mortalités maternelles et infantiles, par une synergie
                    des efforts et des acteurs, allant de la communauté à l’hôpital. C’est
                    une organisation non gouvernementale, apolitique et non
                    confessionnelle dont le principe est la promotion de soins
                    obstétricaux et néonataux d’urgence (SONU) et factuels. Il s’agit d’un
                    autre regard, autre que celui de l’Administration sanitaire publique.
                </p>
                <p>
                    Notre mission est de garantir que chaque mère et chaque enfant
                    puissent accéder à des soins de santé de qualité, quel que soit leur
                    lieu de résidence. Nous devons œuvrer ensemble pour renforcer nos
                    capacités, promouvoir les bonnes pratiques et mettre en place des
                    systèmes de santé résilients. En travaillant en synergie avec nos
                    partenaires, nous visons à réduire les morbidités et mortalités
                    maternelles et infantiles, améliorer la nutrition, et offrir des soins
                    et services de santé de qualité adaptés aux besoins de nos populations.
                </p>
                <p>
                    Cela s’exprime par la promotion de la santé, la recherche,
                    l’expertise scientifique et technique, et la formation pour contribuer à sa manière au développement
                    sanitaire.
                </p>
                <p>
                    Par la promotion de la santé, le REMEHBS compte éveiller les consciences des populations pour leur santé
                    et par elles-mêmes. Par la recherche,
                    le REMEHBS compte améliorer les connaissances scientifiques pour générer des évidences diffusées et
                    utiles à l’amélioration
                    de la santé des populations.
                </p>
                <p>
                    Par l’évaluation de terrain, l’offre de soins et services
                    de santé, et l’expertise scientifique des politiques,
                    des programmes et des projets, c’est rendre disponibles les meilleures informations à même
                    d’assurer des décisions fondées sur des faits.
                </p>
                <p>
                    Par la formation des scientifiques
                    et des professionnels de la santé surtout l’implication
                    des paramédicaux, il s’agit d’élargir
                    la base des acteurs compétents au service
                    de la santé des mères et enfants.
                </p>
                <p>
                    Avec notre détermination collective
                    et notre engagement, toutes
                    nous pouvons surmonter les défis du domaine
                    de la santé maternelle.
                </p>
                <p>Avec mes sincères salutations.</p>
            </div>
        </div>

        <div class="text-center">
            <button class="show-more-btn mt-2 cursor-pointer text-blue-600">Afficher plus</button>
        </div>
    </section>

    <!-- Equipe -->
    <section class="w-full flex flex-col items-center py-8">
        <h2 class="text-[#251d56] text-2xl font-medium mb-10 mt-3">Notre équipe</h2>
        <div class="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

            <div class="flex flex-col items-center">
                <div class="w-64 h-64 bg-[#0047ab] rounded-lg overflow-hidden relative">
                    <img src="/assets/img/charge_recherche.jpg" alt="charge de la recherche"
                        class="w-full h-full object-cover" />
                </div>
                <h3 class="text-xl font-medium mt-2">Professeur Der Adolphe SOME</h3>
                <p class="text-[#f02b5f] font-medium">Chargé de la recherche et de la formation</p>
                <p class="text-center">Médecin Gynécologue et Obstétricien Past Coordinator</p>
            </div>

            <div class="flex flex-col items-center">
                <div class="w-64 h-64 bg-[#0047ab] rounded-lg overflow-hidden relative">
                    <img src="/assets/img/adjoint_coordonnateur.jpg" alt="adjoint coordonnateur"
                        class="w-full h-full object-cover" />
                </div>
                <h3 class="text-xl font-medium mt-2">Dr Hermann Habib OUATTARA</h3>
                <p class="text-[#f02b5f] font-medium text-center">Chargé de la planification et du suivi évaluation,
                    Adjoint du Coordonnateur</p>
                <p class="text-center">Médecin Gynécologue et Obstétricien</p>
            </div>

            <div class="flex flex-col items-center">
                <div class="w-64 h-64 bg-[#0047ab] rounded-lg overflow-hidden relative">
                    <img src="/assets/img/charge_tresorerie.jpg" alt="charge de la tresorerie"
                        class="w-full h-full object-cover" />
                </div>
                <h3 class="text-xl font-medium mt-2">Mme Honorine SOMA</h3>
                <p class="text-[#f02b5f] font-medium">Chargé de la Trésorerie</p>
                <p class="text-center">Sage-femme d’Etat</p>
            </div>

            <div class="flex flex-col items-center">
                <div class="w-64 h-64 bg-[#0047ab] rounded-lg overflow-hidden relative">
                    <img src="/assets/img/sante_infantile.jpg" alt="Charge des activite de la sante infantile"
                        class="w-full h-full object-cover" />
                </div>
                <h3 class="text-xl font-medium mt-2">Dr Makoura BARRO</h3>
                <p class="text-[#f02b5f] font-medium">Chargé des activités de santé infantile</p>
                <p class="text-center">Médecin, Maître de conférences agrégé (MCA) en Pédiatrie</p>
            </div>

            <div class="flex flex-col items-center">
                <div class="w-64 h-64 bg-[#0047ab] rounded-lg overflow-hidden relative">
                    <img src="/assets/img/charge_sante_maternelle.jpg" alt="Charge des activite de la sante maternelle"
                        class="w-full h-full object-cover" />
                </div>
                <h3 class="text-xl font-medium mt-2">Dr Éric TOGBE</h3>
                <p class="text-[#f02b5f] font-medium">Chargé des activités de santé maternelle</p>
                <p class="text-center">Médecin Gynécologue et Obstétricien</p>
            </div>

            <div class="flex flex-col items-center">
                <div class="w-64 h-64 bg-[#0047ab] rounded-lg overflow-hidden relative">
                    <img src="/assets/img/comite_scientifique.jpg" alt="Charge des activite de la sante maternelle"
                        class="w-full h-full object-cover" />
                </div>
                <h3 class="text-xl font-medium mt-2">Professeur Souleymane OUATTARA</h3>
                <p class="text-[#f02b5f] font-medium">Président du comité scientifique</p>
                <p class="text-center">Médecin Gynécologue et Obstétricien</p>
            </div>

        </div>
    </section>


    <footer class="bg-gray-900 flex justify-evenly gap-6 flex-wrap p-8 text-white section-footer">
        <div class="flex flex-col items-center">
            <img class="w-20" src="/assets/img/logo.png" alt="Logo Réseau Mère - Enfant" />
            <p>RESEAU MERE - ENFANT</p>
        </div>
        <div>
            <h3 class="text-lg font-semibold tracking-wide mb-5">Localisation</h3>
            <p class="mb-3">Centre Hospitalier Universitaire Sourô SANOU</p>
            <p class="mb-3">Bobo - Dioulasso</p>
            <p>BURKINA - FASO</p>
        </div>
        <div>
            <h3 class="text-lg font-semibold tracking-wide mb-5">Contacts</h3>
            <p class="mb-3">Ph. +226 70244827</p>
            <p class="mb-3">Ph. +226 78694467</p>
            <p class="mb-3">Ph. +226 70340000</p>
            <p class="mb-3">Ph. +226 76562667</p>
            <p>Mail. secretariat@remehbs-bf.org</p>
        </div>
        <div>
            <h3 class="text-lg font-semibold tracking-wide mb-5">Lien rapide</h3>
            <p class="mb-3"><a href="/remehbs/journee-remehbs" class="text-white hover:text-gray-300">Journées
                    remehbs 2025</a></p>
            <p><a href="#" class="text-white hover:text-gray-300">FeedBack 6e journée</a></p>
        </div>
    </footer>

    <section class="bg-gray-800 p-8 text-white section-mention-legale">
        <p class="text-center">&copy; 2024 Réseau Mère - Enfant. Tous droits réservés.</p>
    </section>

@endsection

@section('script')


    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const textContainer = document.querySelector('.text-container');
            const showMoreBtn = document.querySelector('.show-more-btn');

            showMoreBtn.addEventListener('click', () => {
                textContainer.classList.toggle('max-h-[480px]');
                textContainer.classList.toggle('h-auto');
                showMoreBtn.textContent = textContainer.classList.contains('h-auto') ? 'Afficher moins' :
                    'Afficher plus';
            });

            // Carousel
            const images = document.querySelectorAll('.carousel-image');
            let currentIndex = 0;

            function showNextImage() {
                images[currentIndex].classList.remove('opacity-100');
                images[currentIndex].classList.add('opacity-0');

                currentIndex = (currentIndex + 1) % images.length; // Passer à l'image suivante

                images[currentIndex].classList.remove('opacity-0');
                images[currentIndex].classList.add('opacity-100');
            }

            setInterval(showNextImage, 3000);
        });
    </script>
@endsection --}}

@extends('layout')

@section('title', 'Accueil')

@section('style')
    <style>
        /* Base styles */
        :root {
            --primary-color: #251d56;
            --accent-color: #f02b5f;
            --link-color: #0047ab;
        }

        /* Carousel styles */
        #carousel {
            position: relative;
            overflow: hidden;
            width: 100%;
            height: 100vh;
        }

        @media (max-width: 640px) {
            #carousel {
                height: 60vh;
            }
        }

        .carousel-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: opacity 1s ease-in-out;
            will-change: opacity;
        }

        /* President section styles */
        .custom-container {
            width: 100%;
            max-width: 1280px;
            margin: 0 auto;
            padding: 1rem;
        }

        @media (min-width: 768px) {
            .custom-container {
                padding: 2rem;
            }
        }

        .mot-remehbs {
            border-radius: 0.5rem;
            /* max-width: 1024px; */
            margin: 0 auto;
        }

        .text-container {
            max-height: 480px;
            overflow: hidden;
            transition: max-height 0.3s ease-in-out;
        }

        .text-container.expanded {
            max-height: none;
        }

        .coord-sec {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            align-items: center;
            text-align: center;
            margin-bottom: 1.5rem;
        }

        @media (min-width: 768px) {
            .coord-sec {
                flex-direction: row;
                text-align: left;
                align-items: flex-start;
            }
        }

        .coord-image {
            width: 140px;
            height: auto;
            border-radius: 0.5rem;
        }

        /* Team section styles */
        .team-grid {
            display: grid;
            gap: 2rem;
            width: 100%;
            max-width: 1280px;
            margin: 0 auto;
            padding: 1rem;
        }

        @media (min-width: 640px) {
            .team-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (min-width: 1024px) {
            .team-grid {
                grid-template-columns: repeat(3, 1fr);
            }
        }

        .team-member {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .member-image-container {
            width: 100%;
            max-width: 256px;
            aspect-ratio: 1;
            border-radius: 0.5rem;
            overflow: hidden;
            background-color: var(--link-color);
        }

        .member-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .member-image-container:hover .member-image {
            transform: scale(1.05);
        }

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
@endsection

@section('content')
    <!-- Carousel Section -->
    <div id="carousel">
        @foreach(['A004C006_210726_K7B4.MOV.19_02_35_12.Still001.jpg',
                  'A004C009_210726_K7B4.MOV.19_06_10_19.Still001.jpg',
                  'A005C081_210724_K7B4.MOV.00_05_21_19.Still001.jpg',
                  'A005C090_210726_K7B4.MOV.17_29_02_00.Still001.jpg',
                  'congres.00_02_48_09.Still001.jpg'] as $index => $image)
            <img src="{{ asset('/assets/img/img-caroussel/' . $image) }}" 
                 alt="Carousel Image {{ $index + 1 }}"
                 class="carousel-image {{ $index === 0 ? 'opacity-100' : 'opacity-0' }}">
        @endforeach
    </div>

    <!-- President Section -->
    <section class="custom-container py-20">
        <div class="mot-remehbs bg-white p-4 shadow-md">
            <div class="text-container">
                <div class="coord-sec">
                    <img class="coord-image" src="{{ asset('assets/img/coordonnateur.png') }}" alt="Photo du Coordonnateur" />
                    <div>
                        <p class="text-base">Le Coordonateur du REMEHBS</p>
                        <h2 class="text-2xl font-medium text-indigo-800">Pr. Ziemlé Clément MEDA</h2>
                        <p class="text-base">
                            Maître de conférences agrégé <br />
                            Santé publique/ Politique et management des systèmes de santé
                        </p>
                    </div>
                </div>
                <p class="mt-2">
                    Chers membres, collègues, et partenaires, C'est avec une immense joie
                    et un grand honneur que je vous souhaite la bienvenue au sein du
                    Réseau Mère Enfants des Hauts-Bassins (REMEHBS).
                </p>
                <p>
                    Le Réseau mère enfant des Hauts-Bassins (REMEHBS) est une association
                    prônant le réseau de périnatalité, et engagée résolument pour
                    l’amélioration de la santé de la mère et de l’enfant dans la Région de
                    Hauts-Bassins, voire au niveau national au Burkina Faso. Un réseau de
                    périnatalité est une modalité particulière d’organisation des soins de
                    santé maternels et périnatals regroupant aussi bien les établissements
                    de soins que les professionnels du secteur socio-sanitaire, les
                    usagers des services, et les non professionnels de la santé, tous
                    œuvrant pour la santé de la mère et de l’enfant. L’objectif principal
                    d’un réseau de périnatalité est une meilleure utilisation de toutes
                    les ressources et acteurs pour améliorer la qualité de la santé
                    maternelle et périnatale.
                </p>
                <p>
                    Se faisant, le REMEHBS contribue à la promotion de la santé et à la
                    prévention en santé élevées au rang de premier tremplin de tout
                    développement national. Première approche novatrice de réseau de
                    périnatalité pour la réduction des morbidités et mortalités
                    maternelles et périnatales en Afrique francophone, l’expérience du
                    REMEHBS fait bon chemin au Burkina Faso depuis 2025.
                </p>
                <p>
                    Ayant son siège à Bobo-Dioulasso, le REMEHBS est une association de
                    professionnels de santé et de non professionnels de la région des
                    Hauts-Bassins ayant pour but de contribuer à la réduction des
                    morbidités et mortalités maternelles et infantiles, par une synergie
                    des efforts et des acteurs, allant de la communauté à l’hôpital. C’est
                    une organisation non gouvernementale, apolitique et non
                    confessionnelle dont le principe est la promotion de soins
                    obstétricaux et néonataux d’urgence (SONU) et factuels. Il s’agit d’un
                    autre regard, autre que celui de l’Administration sanitaire publique.
                </p>
                <p>
                    Notre mission est de garantir que chaque mère et chaque enfant
                    puissent accéder à des soins de santé de qualité, quel que soit leur
                    lieu de résidence. Nous devons œuvrer ensemble pour renforcer nos
                    capacités, promouvoir les bonnes pratiques et mettre en place des
                    systèmes de santé résilients. En travaillant en synergie avec nos
                    partenaires, nous visons à réduire les morbidités et mortalités
                    maternelles et infantiles, améliorer la nutrition, et offrir des soins
                    et services de santé de qualité adaptés aux besoins de nos populations.
                </p>
                <p>
                    Cela s’exprime par la promotion de la santé, la recherche,
                    l’expertise scientifique et technique, et la formation pour contribuer à sa manière au développement
                    sanitaire.
                </p>
                <p>
                    Par la promotion de la santé, le REMEHBS compte éveiller les consciences des populations pour leur santé
                    et par elles-mêmes. Par la recherche,
                    le REMEHBS compte améliorer les connaissances scientifiques pour générer des évidences diffusées et
                    utiles à l’amélioration
                    de la santé des populations.
                </p>
                <p>
                    Par l’évaluation de terrain, l’offre de soins et services
                    de santé, et l’expertise scientifique des politiques,
                    des programmes et des projets, c’est rendre disponibles les meilleures informations à même
                    d’assurer des décisions fondées sur des faits.
                </p>
                <p>
                    Par la formation des scientifiques
                    et des professionnels de la santé surtout l’implication
                    des paramédicaux, il s’agit d’élargir
                    la base des acteurs compétents au service
                    de la santé des mères et enfants.
                </p>
                <p>
                    Avec notre détermination collective
                    et notre engagement, toutes
                    nous pouvons surmonter les défis du domaine
                    de la santé maternelle.
                </p>
                <p>Avec mes sincères salutations.</p>
            </div>
            <div class="text-center mt-4">
                <button class="show-more-btn px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                    Afficher plus
                </button>
            </div>
        </div>
    </section>

    <!-- Team Section -->
    <section class="py-16">
        <h2 class="text-center text-3xl font-medium text-[var(--primary-color)] mb-12">Notre équipe</h2>
        <div class="team-grid">
            @foreach([
                ['nom' => 'Pr. Der Adolphe SOME', 
                 'role' => 'Chargé de la recherche et de la formation',
                 'titre' => 'Médecin Gynécologue et Obstétricien Past Coordinator',
                 'image' => 'charge_recherche.jpg'],

                 ['nom' => 'Dr. Hermann Habib OUATTARA', 
                 'role' => 'Chargé de la planification et du suivi évaluation,
                    Adjoint du Coordonnateur',
                 'titre' => 'Médecin Gynécologue et Obstétricien',
                 'image' => 'adjoint_coordonnateur.jpg'],

                 ['nom' => 'Mme Honorine SOMA', 
                 'role' => 'Chargé de la Trésorerie',
                 'titre' => 'Sage-femme d\'Etat',
                 'image' => 'charge_tresorerie.jpg'],

                 ['nom' => 'Dr. Makoura BARRO', 
                 'role' => 'Chargé des activités de santé infantile',
                 'titre' => 'Médecin, Maître de conférences agrégé (MCA) en Pédiatrie',
                 'image' => 'sante_infantile.jpg'],

                 ['nom' => 'Dr. Éric TOGBE', 
                 'role' => 'Chargé des activités de santé maternelle',
                 'titre' => 'Chargé des activités de santé maternelle',
                 'image' => 'charge_sante_maternelle.jpg'],

                 ['nom' => 'Pr. Souleymane OUATTARA', 
                 'role' => 'Président du comité scientifique',
                 'titre' => 'Médecin Gynécologue et Obstétricien',
                 'image' => 'comite_scientifique.jpg'],
                // ... Ajoutez les autres membres de l'équipe ici
            ] as $member)
                <div class="team-member">
                    <div class="member-image-container">
                        <img src="/assets/img/{{ $member['image'] }}" 
                             alt="{{ $member['nom'] }}"
                             class="member-image">
                    </div>
                    <h3 class="text-xl font-medium mt-4">{{ $member['nom'] }}</h3>
                    <p class="text-[var(--accent-color)] font-medium mt-2">{{ $member['role'] }}</p>
                    <p class="mt-2">{{ $member['titre'] }}</p>
                </div>
            @endforeach
        </div>
    </section>

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
            @foreach(['70244827', '78694467', '70340000', '76562667'] as $phone)
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
@endsection

@section('script')
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Show More Button Logic
            const textContainer = document.querySelector('.text-container');
            const showMoreBtn = document.querySelector('.show-more-btn');

            showMoreBtn.addEventListener('click', () => {
                textContainer.classList.toggle('expanded');
                showMoreBtn.textContent = textContainer.classList.contains('expanded') 
                    ? 'Afficher moins' 
                    : 'Afficher plus';
            });

            // Carousel Logic with Performance Optimization
            const images = document.querySelectorAll('.carousel-image');
            let currentIndex = 0;
            let isTransitioning = false;

            function showNextImage() {
                if (isTransitioning) return;
                isTransitioning = true;

                const currentImage = images[currentIndex];
                currentIndex = (currentIndex + 1) % images.length;
                const nextImage = images[currentIndex];

                currentImage.classList.remove('opacity-100');
                currentImage.classList.add('opacity-0');
                
                nextImage.classList.remove('opacity-0');
                nextImage.classList.add('opacity-100');

                setTimeout(() => {
                    isTransitioning = false;
                }, 1000);
            }

            // Prefetch next image
            images.forEach(img => {
                if (!img.complete) {
                    img.onload = () => {
                        img.style.visibility = 'visible';
                    };
                }
            });

            const carouselInterval = setInterval(showNextImage, 3000);

            // Cleanup on page leave
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    clearInterval(carouselInterval);
                }
            });
        });
    </script>
@endsection