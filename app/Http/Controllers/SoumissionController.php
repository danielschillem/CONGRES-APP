<?php

namespace App\Http\Controllers;

use App\Http\Requests\RequestSoumission;
use App\Models\Soumission;
use App\Models\User;
use App\Notifications\NotificationApprovation;
use App\Notifications\NotificationNouvelleSoumission;
use App\Notifications\NotificationRejet;
use App\Notifications\NotificationUpdateSoumission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SoumissionController extends Controller
{

    public function indexUser(Request $request)
    {
        $soumissions = Soumission::where(['user_id' => $request->user()->id])->paginate(10);
        $totalSubmissions = Soumission::count();
        $totalArticles = Soumission::where(['user_id' => $request->user()->id, 'submission_type' => 'Abstract'])->count();
        $totalPosters = Soumission::where(['user_id' => $request->user()->id, 'submission_type' => 'Poster'])->count();
        $totalCommunication = Soumission::where(['user_id' => $request->user()->id, 'submission_type' => 'Communication'])->count();
        return view('soumission/accueil', compact('soumissions', 'totalSubmissions', 'totalArticles', 'totalPosters', 'totalCommunication'));
    }

    public function indexAdmin(Request $request)
    {
        $query = Soumission::query();

        // Recherche
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('document_title', 'like', "%$search%")
                    ->orWhere('author_name', 'like', "%$search%");
            });
        }

        // Filtrage par type
        if ($request->has('type') && $request->get('type') !== 'Tout') {
            $query->where('submission_type', $request->get('type'));
        }
        else {
            $query->get();
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $submissions = $query->paginate(10)->appends($request->query());

        $totalSubmissions = Soumission::count();
        $totalArticles = Soumission::where('submission_type', 'Abstract')->count();
        $totalPosters = Soumission::where('submission_type', 'Poster')->count();
        $totalCommunication = Soumission::where('submission_type', 'Communication')->count();

        return view('soumission.dashboard', compact('submissions', 'totalSubmissions', 'totalArticles', 'totalPosters', 'totalCommunication'));
    }

    public function soumissionsEnAttente(Request $request)
    {
        $query = Soumission::query()->where('statut', 'En attente');

        // Recherche
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('document_title', 'like', "%$search%")
                ->orWhere('author_name', 'like', "%$search%");
            });
        }

        // Filtrage par type
        if ($request->has('type') && $request->get('type') !== 'Tout') {
            $query->where('submission_type', $request->get('type'));
        } else {
            $query->get();
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $submissions = $query->paginate(10)->appends($request->query());

        $totalSubmissions = Soumission::count();
        $totalArticles = Soumission::where('submission_type', 'Abstract')->count();
        $totalPosters = Soumission::where('submission_type', 'Poster')->count();
        $totalCommunication = Soumission::where('submission_type', 'Communication')->count();

        return view('soumission.soumissionsEnAttente', compact('submissions', 'totalSubmissions', 'totalArticles', 'totalPosters', 'totalCommunication'));
    }

    public function soumissionsApprouvees(Request $request)
    {
        $query = Soumission::query()->where('statut', 'Approuvée');

        // Recherche
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('document_title', 'like', "%$search%")
                ->orWhere('author_name', 'like', "%$search%");
            });
        }

        // Filtrage par type
        if ($request->has('type') && $request->get('type') !== 'Tout') {
            $query->where('submission_type', $request->get('type'));
        } else {
            $query->get();
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $submissions = $query->paginate(10)->appends($request->query());

        $totalSubmissions = Soumission::count();
        $totalArticles = Soumission::where('submission_type', 'Abstract')->count();
        $totalPosters = Soumission::where('submission_type', 'Poster')->count();
        $totalCommunication = Soumission::where('submission_type', 'Communication')->count();

        return view('soumission.soumissionsApprouvees', compact('submissions', 'totalSubmissions', 'totalArticles', 'totalPosters', 'totalCommunication'));
    }

    public function soumissionsRejetees(Request $request)
    {
        $query = Soumission::query()->where('statut', 'Rejétée');

        // Recherche
        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('document_title', 'like', "%$search%")
                ->orWhere('author_name', 'like', "%$search%");
            });
        }

        // Filtrage par type
        if ($request->has('type') && $request->get('type') !== 'Tout') {
            $query->where('submission_type', $request->get('type'));
        } else {
            $query->get();
        }

        // Tri
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $submissions = $query->paginate(10)->appends($request->query());

        $totalSubmissions = Soumission::count();
        $totalArticles = Soumission::where('submission_type', 'Abstract')->count();
        $totalPosters = Soumission::where('submission_type', 'Poster')->count();
        $totalCommunication = Soumission::where('submission_type', 'Communication')->count();

        return view('soumission.soumissionsRejetees', compact('submissions', 'totalSubmissions', 'totalArticles', 'totalPosters', 'totalCommunication'));
    }


    public function create()
    {
        return view('soumission.form');
    }

    public function edit(Soumission $soumission)
    {
        return view('soumission.edit', compact('soumission'));
    }

    public function show(Soumission $soumission)
    {
        return view('soumission.show', compact('soumission'));
    }

    public function showNoti(Soumission $soumission, $_notification)
    {
        DB::table('notifications')->where('id', $_notification)->update([
            'read_at' => now(),
        ]);
        return view('soumission.show', compact('soumission'));
    }

    public function editwithNotification(Soumission $soumission, $_notification)
    {
        DB::table('notifications')->where('id', $_notification)->update([
            'read_at' => now(),
        ]);
        $notification = DB::table('notifications')->find($_notification);
        $data = json_decode($notification->data);
        return view('soumission.editNoti', compact('soumission', 'data'));
    }

    public function store(RequestSoumission $request)
    {
        $validated = $request->validated();

        // Gérer l'upload du fichier
        if ($request->hasFile('file')) {
            $filePath = $request->file('file')->store('soumissions', 'public');
            $validated['file_path'] = $filePath;
        }

        // Créer la soumission
        $soumission = Soumission::create($validated);
        $soumission->user_id = $request->user()->id;
        $soumission->save();

        $admins = User::where(['role' => 'admin'])->get();
        foreach ($admins as $admin) {
            $admin->notify(New NotificationNouvelleSoumission($soumission));
        }
        
        return to_route('dashboard')
            ->with('success', 'Votre soumission a été enregistrée avec succès.');
    }

    public function update(RequestSoumission $request, Soumission $soumission)
    {
        $validated = $request->validated();

        // dd($validated);
        // Gérer l'upload du fichier
        if ($request->hasFile('file')) {
            // Vérifier si un fichier existe déjà pour cette soumission et le supprimer
            if ($soumission->file_path && Storage::disk('public')->exists($soumission->file_path)) {
                Storage::disk('public')->delete($soumission->file_path);
            }

            // Stocker le nouveau fichier
            $filePath = $request->file('file')->store('soumissions', 'public');
            $validated['file_path'] = $filePath;
        }

        // // Gérer l'upload du fichier
        // if ($request->hasFile('file')) {
        //     $filePath = $request->file('file')->store('soumissions', 'public');
        //     $validated['file_path'] = $filePath;
        // }

        // Créer la soumission
        $soumission->update($validated);
        $soumission->user_id = $request->user()->id;

        $admins = User::where(['role' => 'admin'])->get();
        foreach ($admins as $admin) {
            $admin->notify(new NotificationUpdateSoumission($soumission));
        }

        return to_route('dashboard')
        ->with('success', 'Votre soumission a été modifiée avec succès.');
    }

    public function downloadFile($id)
    {
        $submission = Soumission::findOrFail($id);
        return response()->download(storage_path('app/public/' . $submission->file_path));
    }

    public function deleteSubmission($id)
    {
        $submission = Soumission::findOrFail($id);
        $submission->delete();
        return back()->with('success', 'Soumission supprimée avec succès.');
    }

    public function approuver(Soumission $soumission)
    {
        $soumission->statut = 'Approuvée';
        $soumission->save();
        $user = User::find($soumission->user_id);
        $user->notify(New NotificationApprovation($soumission));
        return back()->with('success', 'Soumission approuvée avec succès.');
    }

    public function rejeter(Request $request, Soumission $soumission)
    {
        $soumission->statut = 'Rejétée';
        $soumission->save();
        $raison = $request->validate(['reason' => 'required|string']);
        $user = User::find($soumission->user_id);
        $user->notify(new NotificationRejet($soumission, $raison));
        return back()->with('success', 'Soumission rejétée avec succès.');
    }
}
