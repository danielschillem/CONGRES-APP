<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
{
    /**
     * Détermine si l'utilisateur est autorisé à effectuer cette demande.
     *
     * @return bool
     */
    public function authorize()
    {
        return true; 
    }

    /**
     * Obtenez les règles de validation qui s'appliquent à la demande.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'civilite' => 'required|string|max:10',
            'nom' => 'required|string|max:50',
            'prenom' => 'required|string|max:50',
            'sexe' => 'required|string|in:Homme,Femme',
            'telephone' => [
                'required',
                'string',
                'regex:/^(0[567]\d{7}|[567]\d{7})$/',
                'unique:users,telephone'
            ],
            'adresse' => 'nullable|string|max:255',
            'profession' => 'nullable|string|max:100',
            'organisme' => 'nullable|string|max:100',
            'biographie' => 'nullable|string|max:500',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ];
    }

    /**
     * Obtenez les messages d'erreur personnalisés pour les règles de validation.
     *
     * @return array
     */
    public function messages()
    {
        return [
            'civilite.required' => 'La civilité est obligatoire.',
            'nom.required' => 'Le nom est obligatoire.',
            'prenom.required' => 'Le prénom est obligatoire.',
            'sexe.required' => 'Le sexe est obligatoire.',
            'telephone.required' => "Le numéro de téléphone est obligatoire.",
            'telephone.regex' => "Le numéro de téléphone doit comporter exactement 8 chiffres et commencer par 0, 5, 6 ou 7.",
            'telephone.unique' => "Ce numéro de téléphone est déjà utilisé.",
            'email.required' => "L'adresse e-mail est obligatoire.",
            'email.email' => "L'adresse e-mail doit être valide.",
            'email.unique' => "Cette adresse e-mail est déjà utilisée.",
            'password.required' => "Le mot de passe est obligatoire.",
            'password.min' => "Le mot de passe doit comporter au moins :min caractères.",
            'password.confirmed' => "Les mots de passe ne correspondent pas.",
        ];
    }
}
