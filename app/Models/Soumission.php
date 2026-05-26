<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Soumission extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'submission_type',
        'theme',
        'topics',
        'document_title',
        'author_name',
        'resume',
        'keywords',
        'file_path',
        'user_id',
        'statut'
    ];

    protected $casts = [
        'keywords' => 'array',
    ];
}