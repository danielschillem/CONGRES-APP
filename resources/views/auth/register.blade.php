{{-- <x-guest-layout>
    <form method="POST" action="{{ route('register') }}">
        @csrf

        <!-- Name -->
        <div>
            <x-input-label for="name" :value="__('Name')" />
            <x-text-input id="name" class="block mt-1 w-full" type="text" name="name" :value="old('name')" required autofocus autocomplete="name" />
            <x-input-error :messages="$errors->get('name')" class="mt-2" />
        </div>

        <!-- Email Address -->
        <div class="mt-4">
            <x-input-label for="email" :value="__('Email')" />
            <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autocomplete="username" />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>

        <!-- Password -->
        <div class="mt-4">
            <x-input-label for="password" :value="__('Password')" />

            <x-text-input id="password" class="block mt-1 w-full"
                            type="password"
                            name="password"
                            required autocomplete="new-password" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <!-- Confirm Password -->
        <div class="mt-4">
            <x-input-label for="password_confirmation" :value="__('Confirm Password')" />

            <x-text-input id="password_confirmation" class="block mt-1 w-full"
                            type="password"
                            name="password_confirmation" required autocomplete="new-password" />

            <x-input-error :messages="$errors->get('password_confirmation')" class="mt-2" />
        </div>

        <div class="flex items-center justify-end mt-4">
            <a class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" href="{{ route('login') }}">
                {{ __('Already registered?') }}
            </a>

            <x-primary-button class="ms-4">
                {{ __('Register') }}
            </x-primary-button>
        </div>
    </form>
</x-guest-layout> --}}

{{-- <!DOCTYPE html>
<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>REMEHBS | Inscription</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg  my-10">
        <img src="{{ asset('/assets/img/register/pexels-anna-shvets-11369288.jpg') }}" alt="Image d'introduction"
            class="mx-auto mb-6 w-full h-48 object-cover opacity-80 rounded-lg">
        <h2 class="text-2xl font-semibold text-gray-700 mb-6 text-center">Formulaire d'inscription</h2>

        <form action="{{ route('register') }}" method="POST" class="p-6">
            @csrf

            <!-- Informations personnelles -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Civilité -->
                <div>
                    <label for="civilite" class="block text-sm font-medium text-gray-700">Civilité</label>
                    <select id="civilite" name="civilite"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                        <option>M.</option>
                        <option>Mme.</option>
                        <option>Dr.</option>
                        <option>Pr.</option>
                    </select>
                </div>

                <!-- Nom -->
                <div>
                    <label for="nom" class="block text-sm font-medium text-gray-700">Nom</label>
                    <input type="text" id="nom" name="nom"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                </div>

                <!-- Prénom -->
                <div>
                    <label for="prenom" class="block text-sm font-medium text-gray-700">Prénom</label>
                    <input type="text" id="prenom" name="prenom"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                </div>

                <!-- Sexe -->
                <div>
                    <label for="sexe" class="block text-sm font-medium text-gray-700">Sexe</label>
                    <select id="sexe" name="sexe"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                        <option>Masculin</option>
                        <option>Féminin</option>
                    </select>
                </div>

                <!-- Profession -->
                <div>
                    <label for="profession" class="block text-sm font-medium text-gray-700">Profession</label>
                    <input type="text" id="profession" name="profession"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                </div>

                <!-- Organisme affilié -->
                <div>
                    <label for="organisme" class="block text-sm font-medium text-gray-700">Organisme affilié</label>
                    <input type="text" id="organisme" name="organisme"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                </div>

                <!-- Téléphone -->
                <div>
                    <label for="telephone" class="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input type="text" id="telephone" name="telephone"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                </div>

                <!-- Adresse -->
                <div class="sm:col-span-2">
                    <label for="adresse" class="block text-sm font-medium text-gray-700">Adresse</label>
                    <textarea id="adresse" name="adresse" rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"></textarea>
                </div>

                <!-- Biographie -->
                <div class="sm:col-span-2">
                    <label for="biographie" class="block text-sm font-medium text-gray-700">Biographie</label>
                    <textarea id="biographie" name="biographie" rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"></textarea>
                </div>
            </div>

            <!-- Informations de connexion -->
            <div class="mt-6">
                <h3 class="text-xl font-semibold text-gray-700">Informations de connexion</h3>

                <!-- Email -->
                <div class="mt-4">
                    <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" id="email" name="email"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                </div>

                <!-- Mot de passe -->
                <div class="mt-4">
                    <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
                    <input type="password" id="password" name="password"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                </div>

                <!-- Confirmation mot de passe -->
                <div class="mt-4">
                    <label for="password_confirmation" class="block text-sm font-medium text-gray-700">Confirmation de
                        mot
                        de passe</label>
                    <input type="password" id="password_confirmation" name="password_confirmation"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                </div>
            </div>

            <!-- Bouton de soumission -->
            <div class="mt-6">
                <button type="submit"
                    class="w-full bg-teal-600 text-white py-3 rounded-lg shadow-lg hover:bg-teal-700 focus:ring-teal-500">
                    S'inscrire
                </button>
            </div>
        </form>

        <div class="mt-6">
            <p class="text-center text-gray-500">Déjà un compte ?
                <a href="{{ route('login') }}" class="text-blue-600 hover:underline">Connectez-vous ici</a>.
            </p>
            <!-- <p class="text-center text-gray-500 mt-2">Pas encore prêt à vous inscrire ?
                <a href="{{ route('home') }}" class="text-blue-600 hover:underline">Retour à l'accueil</a>.
            </p> -->
        </div>
    </div>

</body>

</html> --}}

<html lang="fr">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>REMEHBS | Inscription</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>

<body>
    <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg my-10">
        <img src="{{ asset('/assets/img/register/pexels-anna-shvets-11369288.jpg') }}" alt="Image d'introduction"
            class="mx-auto mb-6 w-full h-48 object-cover opacity-80 rounded-lg">
        <h2 class="text-2xl font-semibold text-gray-700 mb-6 text-center">Formulaire d'inscription</h2>

        <form action="{{ route('register') }}" method="POST" class="p-6">
            @csrf

            <!-- Affichage des messages d'erreur globaux -->
            @if ($errors->any())
                <div class="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <ul>
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <!-- Informations personnelles -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <!-- Civilité -->
                <div>
                    <label for="civilite" class="block text-sm font-medium text-gray-700">Civilité</label>
                    <select id="civilite" name="civilite"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                        <option>M.</option>
                        <option>Mme.</option>
                        <option>Dr.</option>
                        <option>Pr.</option>
                    </select>
                    @error('civilite')
                        <span class="text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Nom -->
                <div>
                    <label for="nom" class="block text-sm font-medium text-gray-700">Nom</label>
                    <input type="text" id="nom" name="nom"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        value="{{ old('nom') }}">
                    @error('nom')
                        <span class="text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Prénom -->
                <div>
                    <label for="prenom" class="block text-sm font-medium text-gray-700">Prénom</label>
                    <input type="text" id="prenom" name="prenom"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        value="{{ old('prenom') }}">
                    @error('prenom')
                        <span class="text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Sexe -->
                <div>
                    <label for="sexe" class="block text-sm font-medium text-gray-700">Sexe</label>
                    <select id="sexe" name="sexe"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                        <option>Homme</option>
                        <option>Femme</option>
                    </select>
                    @error('sexe')
                        <span class="text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Profession -->
                <div>
                    <label for="profession" class="block text-sm font-medium text-gray-700">Profession</label>
                    <input type="text" id="profession" name="profession"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        value="{{ old('profession') }}">
                    @error('profession')
                        <span class="text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Organisme affilié -->
                <div>
                    <label for="organisme" class="block text-sm font-medium text-gray-700">Organisme affilié</label>
                    <input type="text" id="organisme" name="organisme"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        value="{{ old('organisme') }}">
                    @error('organisme')
                        <span class="text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Téléphone -->
                <div>
                    <label for="telephone" class="block text-sm font-medium text-gray-700">Téléphone</label>
                    <input type="text" id="telephone" name="telephone"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                        value="{{ old('telephone') }}">
                    @error('telephone')
                        <span class="text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Adresse -->
                <div class="sm:col-span-2">
                    <label for="adresse" class="block text-sm font-medium text-gray-700">Adresse</label>
                    <textarea id="adresse" name="adresse" rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">{{ old('adresse') }}</textarea>
                    @error('adresse')
                        <span class="text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Biographie -->
                <div class="sm:col-span-2">
                    <label for="biographie" class="block text-sm font-medium text-gray-700">Biographie</label>
                    <textarea id="biographie" name="biographie" rows="3"
                        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">{{ old('biographie') }}</textarea>
                    @error('biographie')
                        <span class="text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>
            </div>

            <!-- Informations de connexion -->
            <div class="mt-6">
                <h3 class="text-xl font-semibold text-gray-700">Informations de connexion</h3>

                <!-- Email -->
                <div class="mt-4">
                    <label for = "email" class = "block text-sm font-medium text-gray-700">Email</label>
                    <input type = "email" id = "email" name = "email" value = "{{ old('email') }}"
                        class = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                    @error('email')
                        <span class = "text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Mot de passe -->
                <div class = "mt-4">
                    <label for = "password" class = "block text-sm font-medium text-gray-700">
                        Mot de passe</label>
                    <input type = "password" id = "password" name = "password"
                        class = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                    @error('password')
                        <span class = "text-red-600 text-sm">{{ $message }}</span>
                    @enderror
                </div>

                <!-- Confirmation mot de passe -->
                <div class = "mt-4">
                    <label for = "password_confirmation" class = "block text - sm font - medium text - gray - 700">
                        Confirmation de mot de passe</label>
                    <input type = "password" id = "password_confirmation" name = "password_confirmation"
                        class = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm ">
                    @error('password_confirmation')
                        <span class = "text-red-600 text-sm">
                            {{ $message }}</span>
                    @enderror
                </div>
            </div>

            <!-- Bouton de soumission -->
            <div class = "mt-6">
                <button type = "submit"
                    class = "w-full bg-teal-600 text-white py-3 rounded-lg shadow-lg hover:bg-teal-700 focus:ring-teal-500 ">
                    S'inscrire
                </button>
            </div>
        </form>

        <div class = "mt-6">
            <p class = "text-center text-gray-500 ">Déjà un compte ?
                <a href="{{ route('login') }}" class = "text-blue-600 hover:underline">
                    Connectez-vous ici</a>.
            </p>
        </div>
    </div>

</body>

</html>
