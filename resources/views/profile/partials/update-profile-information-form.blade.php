<section>
    <header>
        <h2 class="text-lg font-medium text-gray-900">
            {{ __('Informations du Profil') }}
        </h2>

        <p class="mt-1 text-sm text-gray-600">
            {{ __('Mettez à jour les infromations de votre profil') }}
        </p>
    </header>

    <form id="send-verification" method="post" action="{{ route('verification.send') }}">
        @csrf
    </form>

    <form method="post" action="{{ route('profile.update') }}" class="mt-6 space-y-6">
        @csrf
        @method('patch')

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Civilité -->
            <div>
                <label for="civilite" class="block text-sm font-medium text-gray-700">Civilité</label>
                <select id="civilite" name="civilite"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                    <option value="M." {{ Auth::user()->civilite === 'M.' ? 'selected' : '' }}>M.</option>
                    <option value="Mme." {{ Auth::user()->civilite === 'Mme.' ? 'selected' : '' }}>Mme.</option>
                    <option value="Dr." {{ Auth::user()->civilite === 'Dr.' ? 'selected' : '' }}>Dr.</option>
                    <option value="Pr." {{ Auth::user()->civilite === 'Pr.' ? 'selected' : '' }}>Pr.</option>
                </select>
            </div>

            <!-- Nom -->
            <div>
                <label for="nom" class="block text-sm font-medium text-gray-700">Nom</label>
                <input type="text" id="nom" name="nom"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    value="{{ Auth::user()->nom }}">
            </div>

            <!-- Prénom -->
            <div>
                <label for="prenom" class="block text-sm font-medium text-gray-700">Prénom</label>
                <input type="text" id="prenom" name="prenom"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    value="{{ Auth::user()->prenom }}">
            </div>

            <!-- Sexe -->
            <div>
                <label for="sexe" class="block text-sm font-medium text-gray-700">Sexe</label>
                <select id="sexe" name="sexe"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">
                    <option value="Masculin" {{ Auth::user()->sexe === 'Masculin' ? 'selected' : '' }}>Masculin</option>
                    <option value="Féminin" {{ Auth::user()->sexe === 'Féminin' ? 'selected' : '' }}>Féminin</option>
                </select>
            </div>

            <!-- Profession -->
            <div>
                <label for="profession" class="block text-sm font-medium text-gray-700">Profession</label>
                <input type="text" id="profession" name="profession"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    value="{{ Auth::user()->profession }}">
            </div>

            <!-- Organisme affilié -->
            <div>
                <label for="organisme" class="block text-sm font-medium text-gray-700">Organisme affilié</label>
                <input type="text" id="organisme" name="organisme"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    value="{{ Auth::user()->organisme }}">
            </div>

            <!-- Téléphone -->
            <div>
                <label for="telephone" class="block text-sm font-medium text-gray-700">Téléphone</label>
                <input type="text" id="telephone" name="telephone"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    value="{{ Auth::user()->telephone }}">
            </div>

            <!-- Adresse -->
            <div class="sm:col-span-2">
                <label for="adresse" class="block text-sm font-medium text-gray-700">Adresse</label>
                <textarea id="adresse" name="adresse" rows="3"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">{{ Auth::user()->adresse }}</textarea>
            </div>

            <!-- Biographie -->
            <div class="sm:col-span-2">
                <label for="biographie" class="block text-sm font-medium text-gray-700">Biographie</label>
                <textarea id="biographie" name="biographie" rows="3"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm">{{ Auth::user()->biographie }}</textarea>
            </div>
        </div>

        <div>
            <x-input-label for="email" :value="__('Email')" />
            <x-text-input id="email" name="email" type="email" class="mt-1 block w-full" :value="old('email', $user->email)"
                required autocomplete="username" />
            <x-input-error class="mt-2" :messages="$errors->get('email')" />

            @if ($user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail && !$user->hasVerifiedEmail())
                <div>
                    <p class="text-sm mt-2 text-gray-800">
                        {{ __('votre adresse mail n\'a pas été vérifiée.') }}

                        <button form="send-verification"
                            class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            {{ __('Cliquez ici pour renvoyer le lien de verification') }}
                        </button>
                    </p>

                    @if (session('status') === 'verification-link-sent')
                        <p class="mt-2 font-medium text-sm text-green-600">
                            {{ __('Un nouveau lien de vérification à été envoyé à votre adresse maill') }}
                        </p>
                    @endif
                </div>
            @endif
        </div>

        <div class="flex items-center gap-4">
            {{-- <x-primary-button>{{ __('Enregistrer') }}</x-primary-button> --}}
            <button type="submit"
                    class="bg-teal-600 text-white px-4 py-2 rounded shadow hover:bg-teal-700 transition duration-300">Enregistrer</button>

            @if (session('status') === 'profile-updated')
                <p x-data="{ show: true }" x-show="show" x-transition x-init="setTimeout(() => show = false, 2000)"
                    class="text-sm text-gray-600">{{ __('Saved.') }}</p>
            @endif
        </div>
    </form>
</section>
