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
    <div class="min-h-screen">
        <!-- Main Content -->
        <main class="container mx-auto px-4 py-8">
            <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <!-- Banner -->
                <div class="bg-remehbs text-white p-6 flex flex-col items-center">
                    <h2 class="text-2xl font-bold text-center mb-2">Inscription aux Journées Scientifiques</h2>
                    <p class="text-center text-lg mb-2">23, 24, 25 juillet 2025</p>
                    <p class="text-center text-lg mb-4">Maison de la Culture Mgr Anselme Titianma SANON, Bobo-Dioulasso
                    </p>
                    <div class="bg-white text-remehbs font-bold py-2 px-4 rounded-full">
                        Date limite d'inscription: 23/06/2025
                    </div>
                </div>

                <!-- Form -->
                <form method="POST" action="{{route('inscription.store')}}" id="registrationForm" class="p-6">
                    @csrf
                    @method('post')
                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-remehbs mb-4 pb-2 border-b-2 border-remehbs">Informations
                            personnelles</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="nom" class="block text-gray-700 font-medium mb-2">Nom</label>
                                <input type="text" id="nom" name="nom" required value="{{ Auth::user()->nom }}"
                                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-remehbs">
                            </div>
                            <div>
                                <label for="prenom" class="block text-gray-700 font-medium mb-2">Prénom</label>
                                <input type="text" id="prenom" name="prenom" required value="{{ Auth::user()->prenom }}"
                                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-remehbs">
                            </div>
                            <div>
                                <label for="email" class="block text-gray-700 font-medium mb-2">Email</label>
                                <input type="email" id="email" name="email" required value="{{ Auth::user()->email }}"
                                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-remehbs">
                            </div>
                            <div>
                                <label for="telephone" class="block text-gray-700 font-medium mb-2">Téléphone</label>
                                <input type="tel" id="telephone" name="telephone" required placeholder="Saisir le numéro qui servira pour le paiement"
                                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-remehbs">
                                <p class="text-sm text-blue-600 underline">Seul le paiement par orange money est pris en compte</p>
                            </div>
                            <div>
                                <label for="institution"
                                    class="block text-gray-700 font-medium mb-2">Institution/Organisation</label>
                                <input type="text" id="institution" name="institution" required value="{{ Auth::user()->organisme }}"
                                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-remehbs">
                            </div>
                            <div>
                                <label for="pays" class="block text-gray-700 font-medium mb-2">Pays</label>
                                <input type="text" id="pays" name="pays" required placeholder="Saisir votre pays de résidence"
                                    class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-remehbs">
                            </div>
                        </div>
                    </div>

                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-remehbs mb-4 pb-2 border-b-2 border-remehbs">Type de
                            participation</h3>
                        <div class="space-y-4">
                            <div>
                                <label class="flex items-center">
                                    <input type="radio" name="participation" value="Spécialiste et assimilés"
                                        class="mr-2 text-remehbs focus:ring-remehbs" required>
                                    <span>Spécialiste et assimilés - 30.000 Fcfa</span>
                                </label>
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="radio" name="participation" value="Généraliste"
                                        class="mr-2 text-remehbs focus:ring-remehbs">
                                    <span>Généraliste et DES - 25.000 Fcfa</span>
                                </label>
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="radio" name="participation" value="Attaché de santé"
                                        class="mr-2 text-remehbs focus:ring-remehbs">
                                    <span>Attachés de santé, SF/ME, IDE, IB et autres - 20.000 Fcfa</span>
                                </label>
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="radio" name="participation" value="Location de stand"
                                        class="mr-2 text-remehbs focus:ring-remehbs">
                                    <span>Location de stand - 500.000 Fcfa</span>
                                </label>
                            </div>
                            <div>
                                <label class="flex items-center">
                                    <input type="radio" name="participation" value="Symposium"
                                        class="mr-2 text-remehbs focus:ring-remehbs">
                                    <span>Symposium - 350.000 Fcfa</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="mb-8">
                        <h3 class="text-xl font-bold text-remehbs mb-4 pb-2 border-b-2 border-remehbs">Méthode de
                            paiement</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    class="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                    <input type="radio" name="payment" value="orangemoney"
                                        class="mr-2 text-remehbs focus:ring-remehbs" required checked>
                                    <span>Orange Money</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Ajoutons un champ caché pour stocker le code OTP -->
                    <input type="hidden" name="transaction_code" id="transaction_code" value="">
                    <input type="hidden" name="registration_id" id="registration_id" value="">
                    <input type="hidden" name="montant" id="montant" value="">


                    <div class="mt-6 text-center">
                        <button type="button" id="validateBtn"
                            class="bg-remehbs text-white font-bold py-3 px-8 rounded-full hover:bg-blue-800 transition">
                            S'inscrire et procéder au paiement
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Handle validate button click
            document.getElementById('validateBtn').addEventListener('click', function() {
                // Validate form
                const form = document.getElementById('registrationForm');
                let isValid = true;
                let paymentType = '';

                // Get selected payment method
                document.getElementsByName('payment').forEach(radio => {
                    if (radio.checked) {
                        paymentType = radio.value;
                    }
                });

                // Get participation type and cost
                let participation = '';
                let cost = 0;
                document.getElementsByName('participation').forEach(radio => {
                    if (radio.checked) {
                        participation = radio.value;
                        switch (participation) {
                            case 'Spécialiste et assimilés':
                                cost = 30000;
                                break;
                            case 'Généraliste':
                                cost = 25000;
                                break;
                            case 'Attaché de santé':
                                cost = 20000;
                                break;
                            case 'Location de stand':
                                cost = 500000;
                                break;
                            case 'Symposium':
                                cost = 350000;
                                break;
                        }
                    }
                });

                if (!paymentType || !participation) {
                    alert("Veuillez sélectionner un type de participation et une méthode de paiement.");
                    isValid = false;
                }

                if (isValid) {
                    // Show payment confirmation modal
                    showPaymentModal(paymentType, cost, participation, function(transactionId) {
                        // Set the transaction ID to the hidden field
                        document.getElementById('transaction_code').value = transactionId;

                        // Now submit the form
                        form.submit();
                    });
                }
            });

            // Payment modal function
            function showPaymentModal(paymentType, cost, participationLabel, callback) {
                // Get user information for receipt
                const nom = document.getElementById('nom').value;
                const prenom = document.getElementById('prenom').value;
                const email = document.getElementById('email').value;
                const institution = document.getElementById('institution').value;
                document.getElementById('montant').value = cost;
                // Generate receipt with current date
                const today = new Date();
                const dateStr = today.toLocaleDateString();
                const registrationId = 'REMEHBS2025-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                document.getElementById('registration_id').value = registrationId;

                // Create modal container
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

                // Create modal content
                const modalContent = document.createElement('div');
                modalContent.className = 'bg-white rounded-lg p-6 max-w-md w-full h-[600px]';

                // Payment instructions based on payment type
                let paymentInstructions = '';
                let phoneNumber = document.getElementById('telephone').value;
                let paymentMethodLabel = '';

                switch (paymentType) {
                    case 'orangemoney':
                        paymentMethodLabel = 'Orange Money';
                        paymentInstructions = `
                <h3 class="text-lg font-bold mb-4">Paiement par Orange Money</h3>
                <p class="mb-4">Veuillez effectuer un paiement de <span class="font-bold">${cost.toLocaleString()} FCFA</span></p>
                <div class="bg-orange-100 border border-orange-200 rounded-lg p-4 mb-4 text-center">
                    <p class="font-bold">Composer le <span class="text-red-500">*144*4*6*${cost.toLocaleString()}#</span> pour obtenir le code OTP</p>
                </div>
            `;
                        break;
                }

                const receipt = `
        <div class="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 class="text-center font-bold text-lg mb-3 text-remehbs border-b pb-2">Résumé de Paiement</h3>
            <div class="flex justify-between mb-2">
                <span class="font-medium">N° Facture:</span>
                <span>${registrationId}</span>
            </div>
            <div class="flex justify-between mb-2">
                <span class="font-medium">Date:</span>
                <span>${dateStr}</span>
            </div>
            <div class="flex justify-between mb-2">
                <span class="font-medium">Nom:</span>
                <span>${prenom} ${nom}</span>
            </div>
            <div class="flex justify-between mb-2">
                <span class="font-medium">Email:</span>
                <span>${email}</span>
            </div>
            <div class="flex justify-between mb-2">
                <span class="font-medium">Institution:</span>
                <span>${institution}</span>
            </div>
            <div class="mt-4 border-t pt-2">
                <div class="flex justify-between mb-2">
                    <span class="font-medium">Type de participation:</span>
                    <span>${participationLabel}</span>
                </div>
                <div class="flex justify-between mb-2">
                    <span class="font-medium">Méthode de paiement:</span>
                    <span>${paymentMethodLabel}</span>
                </div>
                <div class="flex justify-between font-bold mt-2 pt-2 border-t border-gray-300">
                    <span>Total:</span>
                    <span>${cost.toLocaleString()} FCFA</span>
                </div>
            </div>
        </div>
    `;

                modalContent.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold text-remehbs">Confirmation de paiement</h2>
            <button id="closeModal" class="text-gray-500 hover:text-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class='h-[450px] overflow-scroll mb-2'>
            ${receipt}
            ${paymentInstructions}
            <div class="mb-4">
                <label for="transactionId" class="block text-gray-700 font-medium mb-2">Code OTP</label>
                <input type="text" id="transactionId" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-remehbs" placeholder="Entrez le code OTP généré">
            </div>
        </div>
        <div class="flex justify-between">
            <button id="cancelPayment" class="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-400 transition">
                Annuler
            </button>
            <button id="confirmPayment" class="bg-remehbs text-white font-bold py-2 px-4 rounded hover:bg-blue-800 transition">
                Confirmer l'inscription
            </button>
        </div>
    `;

                modal.appendChild(modalContent);
                document.body.appendChild(modal);

                // Event listeners for modal actions
                document.getElementById('closeModal').addEventListener('click', function() {
                    document.body.removeChild(modal);
                });

                document.getElementById('cancelPayment').addEventListener('click', function() {
                    document.body.removeChild(modal);
                });

                document.getElementById('confirmPayment').addEventListener('click', function() {
                    const transactionId = document.getElementById('transactionId').value;
                    if (!transactionId) {
                        alert('Veuillez entrer le code OTP.');
                        return;
                    }

                    // Remove modal
                    document.body.removeChild(modal);

                    // Call the callback function with transaction ID
                    if (typeof callback === 'function') {
                        callback(transactionId, registrationId);
                    }
                });
            }
        });
    </script>
@endsection