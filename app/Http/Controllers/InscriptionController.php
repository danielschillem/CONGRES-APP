<?php

namespace App\Http\Controllers;

use App\Models\Inscription;
use App\Services\OrangeMoneyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InscriptionController extends Controller
{
    protected $orangeMoneyService;

    public function __construct(OrangeMoneyService $orangeMoneyService)
    {
        $this->orangeMoneyService = $orangeMoneyService;
    }

    public function store(Request $request)
    {
        // Validation des données
        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'telephone' => 'required|string|max:255',
            'institution' => 'required|string|max:255',
            'pays' => 'required|string|max:255',
            'participation' => 'required|string',
            'montant' => 'required|numeric',
            'payment' => 'required|string',
            'transaction_code' => 'required|string',
            'registration_id' => 'required|string|unique:inscriptions',
        ]);
        
        $reference = 'A789233';
        $message = '';



        // Paiement Orange Money
        try {
            // Log de la requête avant envoi
            Log::info('Demande de paiement envoyée à Orange Money', [
                $request->telephone,
                $request->montant,
                $request->transaction_code,
                $reference
            ]);

            $response = $this->orangeMoneyService->sendPayment(
                $request->telephone,
                $request->montant,
                $request->transaction_code,
                $reference
            );

            // Log de la réponse
            Log::info('Réponse reçue de Orange Money', $response);

            // Vérification de la réponse de Orange Money
            // Vérification du statut dans la réponse
            $status = isset($response['status']) ? (int) $response['status'] : null;
            $errorMessage = $response['message'] ?? 'Une erreur est survenue';


            if ($status !== 200) {
                return response()->json([
                    'success' => false,
                    'error' => $errorMessage,
                    'status' => $status
                ], 400);
                // return to_route('inscription')->with('error', 'erreur de paiment ' . $response['message']);
            } else {
                $messagePaiement = 'Paiement effectué avec succès !';
                // Enregistrer l'inscription
                $inscription = Inscription::create([
                    'nom' => $request->nom,
                    'prenom' => $request->prenom,
                    'email' => $request->email,
                    'telephone' => $request->telephone,
                    'organisme' => $request->institution,
                    'pays' => $request->pays,
                    'participation_type' => $request->participation,
                    'montant' => $request->montant,
                    'methode_paiement' => $request->paiement,
                    'code_otp' => $request->transaction_code,
                    'numero_facture' => $request->registration_id,
                ]);
                $message = "Inscription enregistrée avec succès";
            }
        } catch (\Exception $e) {
            Log::error('Erreur lors du paiement Orange Money: ' . $e->getMessage());
            $error = 'Erreur lors du paiement Orange Money: ' . $e->getMessage();
            $test = false;
            $message = 'Une erreur est survenue lors du paiement, veuillez réessayer plus tard.';
        }

        // Envoyer un email de confirmation
        // Mail::to($request->email)->send(new ConfirmationInscription($inscription));

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $inscription,
            'status de paiement' => $messagePaiement,
        ]);
    }
}
