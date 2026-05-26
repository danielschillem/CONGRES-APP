{{-- <x-guest-layout>
    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('login') }}">
        @csrf

        <!-- Email Address -->
        <div>
            <x-input-label for="email" :value="__('Email')" />
            <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autofocus autocomplete="username" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>

        <!-- Password -->
        <div class="mt-4">
            <x-input-label for="password" :value="__('Password')" />

            <x-text-input id="password" class="block mt-1 w-full"
                            type="password"
                            name="password"
                            required autocomplete="current-password" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <!-- Remember Me -->
        <div class="block mt-4">
            <label for="remember_me" class="inline-flex items-center">
                <input id="remember_me" type="checkbox" class="rounded border-gray-300 text-indigo-600 shadow-sm focus:ring-indigo-500" name="remember">
                <span class="ms-2 text-sm text-gray-600">{{ __('Remember me') }}</span>
            </label>
        </div>

        <div class="flex items-center justify-end mt-4">
            @if (Route::has('password.request'))
                <a class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" href="{{ route('password.request') }}">
                    {{ __('Forgot your password?') }}
                </a>
            @endif

            <x-primary-button class="ms-3">
                {{ __('Log in') }}
            </x-primary-button>
        </div>
    </form>
</x-guest-layout> --}}


<!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>REMEHBS | Connexion</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <div class="max-w-lg mx-auto bg-white shadow-lg rounded-lgmt-10 my-3 rounded-md">
        <img src="{{ asset('/assets/img/register/pexels-anna-shvets-11369288.jpg') }}" alt="Image d'introduction"
            class="mx-auto mb-6 w-full h-48 object-cover opacity-80 rounded-md">

        <h2 class="text-2xl font-semibold text-gray-700 mb-6 text-center">Connexion</h2>

        <!-- Formulaire de connexion -->
        <form method="POST" action="{{ route('login') }}" class="p-6">
            @csrf

            <!-- Email -->
            <div class="mb-4">
                <label for="email" class="block text-gray-700 font-semibold mb-2">Email</label>
                <input type="email" id="email" name="email"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Votre email" required>
                @error('email')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- Mot de passe -->
            <div class="mb-4">
                <label for="password" class="block text-gray-700 font-semibold mb-2">Mot de passe</label>
                <input type="password" id="password" name="password"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Votre mot de passe" required>
                @error('password')
                    <p class="text-red-500 text-sm mt-1">{{ $message }}</p>
                @enderror
            </div>

            <!-- Se souvenir de moi -->
            <div class="mb-4 flex items-center">
                <input type="checkbox" id="remember" name="remember" class="mr-2">
                <label for="remember" class="text-gray-700 font-semibold">Se souvenir de moi</label>
            </div>

            <!-- Bouton de connexion -->
            <div class="flex items-center justify-center">
                <button type="submit"
                    class="bg-teal-600 text-white px-4 py-2 rounded shadow hover:bg-teal-700 transition duration-300">Connexion</button>

                <!-- Lien mot de passe oublié -->
                {{-- <a href="{{ route('password.request') }}" class="text-sm text-blue-600 hover:underline">Mot de passe
                    oublié
                    ?</a> --}}
            </div>
        </form>

        <!-- Lien vers l'inscription et la page d'accueil -->
        <div class="mt-6 p-3">
            <p class="text-center text-gray-500">Pas encore de compte ?
                <a href="{{ route('register') }}" class="text-blue-600 hover:underline">Inscrivez-vous ici</a>.
            </p>
            {{-- <p class="text-center text-gray-500 mt-2">Retour à
                <a href="{{ route('home') }}" class="text-blue-600 hover:underline">l'accueil</a>.
            </p> --}}
        </div>
    </div>

</body>

</html>
