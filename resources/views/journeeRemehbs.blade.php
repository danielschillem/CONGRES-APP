@extends('layout')

@section('title', 'Journées REMEHB')

@section('style')
    <style>
        #carousel {
            position: relative;
            overflow: hidden;
            width: 100%;
            height: 100vh;
            /* Assure-toi que le carrousel prend toute la hauteur de l'écran */
        }

        .carousel-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            /* Assure que l'image couvre le conteneur */
            transition: opacity 1s ease-in-out;
            /* Transition d'opacité pour un effet de fondu */
        }
    </style>
@endsection

@section('content')
    <div id="carousel" class="relative overflow-hidden h-screen">
        <img src="{{ asset('/assets/img/img-caroussel-2/A004C018_210726_K7B4.MOV.20_44_57_04.Still001.jpg') }}" alt="Image 1"
            class="carousel-image w-full h-screen absolute transition-opacity duration-1000 opacity-100">
        <img src="{{ asset('/assets/img/img-caroussel-2/A004C024_210726_K7B4.MOV.22_48_31_02.Still001.jpg') }}" alt="Image 2"
            class="carousel-image w-full h-screen absolute transition-opacity duration-1000 opacity-0">
        <img src="{{ asset('/assets/img/img-caroussel-2/A005C024_210724_K7B4.MOV.17_50_39_21.Still001.jpg') }}" alt="Image 3"
            class="carousel-image w-full h-screen absolute transition-opacity duration-1000 opacity-0">
        <img src="{{ asset('/assets/img/img-caroussel-2/A005C025_210724_K7B4.MOV.17_56_09_13.Still003.jpg') }}" alt="Image 4"
            class="carousel-image w-full h-screen absolute transition-opacity duration-1000 opacity-0">
    </div>
@endsection

@section('script')
    <script>
        // Carousel
        const images = document.querySelectorAll('.carousel-image');
        let currentIndex = 0;

        function showNextImage() {
            images[currentIndex].classList.remove('opacity-100');
            images[currentIndex].classList.add('opacity-0');

            currentIndex = (currentIndex + 1) % images.length;

            images[currentIndex].classList.remove('opacity-0');
            images[currentIndex].classList.add('opacity-100');
        }

        setInterval(showNextImage, 3000);
    </script>
@endsection
