<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'organisme',
        'pays',
        'participation_type',
        'montant',
        'methode_paiement',
        'code_otp',
        'numero_facture',
    ];
}

