<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\Rule|array|string>
     */
    public function rules(): array
    {
        return [
            'nom' => ['required', 'string', 'max:255'],
            'civilite' => 'required|string',
            'prenom' => 'required|string|max:255',
            'sexe' => 'required|string',
            'profession' => 'nullable|string|max:255',
            'organisme' => 'nullable|string|max:255',
            'telephone' => 'required|string|max:15',
            'adresse' => 'nullable|string',
            'biographie' => 'nullable|string',
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }
}
