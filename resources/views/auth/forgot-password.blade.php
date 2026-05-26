<x-guest-layout>
    <div class="mb-4 text-sm text-gray-600">
        {{ __('Mot de passe oublié ? pas de soucis. Veuiller saisir votre adresse mail afin de recevoir le lien de réinitialisation de votre mot de passe') }}
    </div>

    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('password.email') }}">
        @csrf

        <!-- Email Address -->
        <div>
            <x-input-label for="email" :value="__('Email')" />
            <x-text-input id="email" class="block mt-1 w-full" type="email" name="email" :value="old('email')" required autofocus />
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>

        <div class="flex items-center justify-end mt-4">
            {{-- <x-primary-button>
                {{ __('Mail de réinitialisation envoyé') }}
            </x-primary-button> --}}

            {{-- <a href="{{ route('home') }}" class="text-blue-600 hover:underline float-start">l'accueil</a>. --}}
            <button type="submit"
                    class="bg-teal-600 text-white px-4 py-2 rounded shadow hover:bg-teal-700 transition duration-300">Envoyer le mail de réinitialisation</button>
        </div>
    </form>
</x-guest-layout>
