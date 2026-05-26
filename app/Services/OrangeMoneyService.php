<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class OrangeMoneyService
{
    public function sendPayment($customerMsisdn, $amount, $otp, $reference)
    {
        $url = config('services.orange_money.base_url');
        $merchantMsisdn = config('services.orange_money.merchant_msisdn');
        $apiUsername = config('services.orange_money.api_username');
        $apiPassword = config('services.orange_money.api_password');
        $provider = config('services.orange_money.provider');
        $payid = config('services.orange_money.payid');
        $certPublic = config('services.orange_money.cert_public');
        $certPrivate = config('services.orange_money.cert_private');

        $extTxnId = uniqid(); // Génération d’un ID de transaction unique

        // Création du XML à envoyer
        $xmlRequest = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>
            <COMMAND>
                <TYPE>OMPREQ</TYPE>
                <customer_msisdn>{$customerMsisdn}</customer_msisdn>
                <merchant_msisdn>{$merchantMsisdn}</merchant_msisdn>
                <api_username>{$apiUsername}</api_username>
                <api_password>{$apiPassword}</api_password>
                <amount>{$amount}</amount>
                <PROVIDER>{$provider}</PROVIDER>
                <PROVIDER2>{$provider}</PROVIDER2>
                <PAYID>{$payid}</PAYID>
                <PAYID2>{$payid}</PAYID2>
                <otp>{$otp}</otp>
                <reference_number>{$reference}</reference_number>
                <ext_txn_id>{$extTxnId}</ext_txn_id>
            </COMMAND>";

        // Envoi de la requête avec certificat SSL
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Content-Type: text/xml"
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $xmlRequest);
        curl_setopt($ch, CURLOPT_SSLCERT, $certPublic);
        curl_setopt($ch, CURLOPT_SSLKEY, $certPrivate);

        // Exécution de la requête
        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        // Log des erreurs Curl
        if ($error) {
            Log::error('rreur de connexion à Orange Money: ' . $error);
            return ['error' => 'Erreur de connexion à Orange Money'];
        }

        // Log de la réponse brute
        Log::info("Réponse reçue de Orange Money: " . $response);

        // Parser la réponse XML
        return $this->parseResponse($response);
        // Affichage de la réponse brute
        // return ['response' => $response];
    }

    private function parseResponse($xmlResponse)
    {
        // Nettoyage de la réponse
        $xmlResponse = trim($xmlResponse);

        // Vérifier si la réponse ne contient pas déjà une racine
        if (strpos($xmlResponse, '<') !== 0) {
            return ['error' => 'Réponse XML invalide'];
        }

        // Ajout d'une racine pour que le XML soit valide
        $xmlResponse = "<root>" . $xmlResponse . "</root>";

        // Essayer de parser le XML
        $xml = simplexml_load_string($xmlResponse);

        if ($xml === false) {
            return ['error' => 'Erreur lors du parsing XML'];
        }

        // Retourner les données extraites
        return [
            'status' => isset($xml->status) ? (string) $xml->status : null,
            'message' => isset($xml->message) ? (string) $xml->message : null,
            'transaction_id' => isset($xml->transID) ? (string) $xml->transID : null,
        ];
    }
}
