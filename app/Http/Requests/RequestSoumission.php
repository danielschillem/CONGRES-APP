<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RequestSoumission extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'submission_type' => 'required|in:Abstract,Poster,Communication',
            'theme' => 'required|string|max:255',
            'topics' => 'required|string|max:255',
            'document_title' => 'required|string|max:255',
            'author_name' => 'required|string|max:255',
            'resume' => 'required|string|max:1000',
            'keywords' => 'required|array|min:1',
            'keywords.*' => 'required|string|max:50',
            'file' => 'required|file|mimes:pdf|max:50240', // max 50MB
        ];
    }

    public function messages()
    {
        return [
            'submission_type.required' => "Le type de soumission est obligatoire.",
            'submission_type.in' => "Le type de soumission doit être l'un des suivants : Article, Poster, Communication.",
            'theme.required' => "Le thème est obligatoire.",
            'theme.string' => "Le thème doit être une chaîne de caractères.",
            'theme.max' => "Le thème ne peut pas dépasser :max caractères.",
            'topics.required' => "Les sujets sont obligatoires.",
            'topics.string' => "Les sujets doivent être une chaîne de caractères.",
            'topics.max' => "Les sujets ne peuvent pas dépasser :max caractères.",
            'document_title.required' => "Le titre du document est obligatoire.",
            'document_title.string' => "Le titre du document doit être une chaîne de caractères.",
            'document_title.max' => "Le titre du document ne peut pas dépasser :max caractères.",
            'author_name.required' => "Le nom de l'auteur est obligatoire.",
            'author_name.string' => "Le nom de l'auteur doit être une chaîne de caractères.",
            'author_name.max' => "Le nom de l'auteur ne peut pas dépasser :max caractères.",
            'resume.required' => "Le résumé est obligatoire.",
            'resume.string' => "Le résumé doit être une chaîne de caractères.",
            'resume.max' => "Le résumé ne peut pas dépasser :max caractères.",
            'keywords.required' => "Les mots-clés sont obligatoires.",
            'keywords.array' => "Les mots-clés doivent être un tableau.",
            'keywords.min' => "Vous devez fournir au moins un mot-clé.",
            'keywords.*.required' => "Chaque mot-clé est obligatoire.",
            'keywords.*.string' => "Chaque mot-clé doit être une chaîne de caractères.",
            'keywords.*.max' => "Chaque mot-clé ne peut pas dépasser :max caractères.",
            'file.required' => "Un fichier est obligatoire.",
            'file.file' => "La soumission doit être un fichier valide.",
            'file.mimes' => "Le fichier doit être au format PDF.",
            'file.max' => "La taille du fichier ne peut pas dépasser :max Ko.", // 50MB = 50240 Ko
        ];
    }
}
