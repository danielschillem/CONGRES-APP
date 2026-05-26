<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InscriptionController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SoumissionController;
use Illuminate\Support\Facades\Route;

// Route::get('/test', function () {
//     return view('test');
// });

// Soumission
Route::middleware(['auth', 'checkRole:user'])->group(function () {
    Route::get('dashboard', [SoumissionController::class, 'indexUser'])->name('dashboard');
    Route::get('/soumission/formulaire', [SoumissionController::class, 'create'])->name('soumission.create');
    Route::post('/soumission/formulaire', [SoumissionController::class, 'store'])->name('soumission.store');
    Route::get('/soumission/edition/{soumission}', [SoumissionController::class, 'edit'])->name('soumission.edit');
    Route::get('/soumission/edition/{soumission}/{notification}', [SoumissionController::class, 'editwithNotification'])->name('soumission.edit_noti');

    Route::patch('/soumission/edition/{soumission}', [SoumissionController::class, 'update'])->name('soumission.update');

    Route::get('/programme', function () {
        return view('programme');
    })->name('programme');

    Route::get('/inscription', function () {
        return view('inscription');
    })->name('inscription');

    Route::post('/inscription', [InscriptionController::class, 'store'])->name('inscription.store');
});

Route::middleware(['auth', 'checkRole:admin'])->group(function () {
    Route::get('/soumissions/dashboard', [SoumissionController::class, 'indexAdmin'])->name('soumission.dashboard');
    Route::get('/soumissions/en-attente', [SoumissionController::class, 'soumissionsEnAttente'])->name('soumission.en_attente');
    Route::get('/soumissions/approuvées', [SoumissionController::class, 'soumissionsApprouvees'])->name('soumission.approuvee');
    Route::get('/soumissions/rejétées', [SoumissionController::class, 'soumissionsRejetees'])->name('soumission.rejetee');

    Route::get('/soumission/visualisation/{soumission}', [SoumissionController::class, 'show'])->name('soumission.show');
    Route::get('/soumission/visualisation/{soumission}/{notification}', [SoumissionController::class, 'showNoti'])->name('soumission.show_noti');

    Route::get('/soumission/{id}/download', [SoumissionController::class, 'downloadFile'])->name('soumission.download');
    Route::delete('/soumission/{id}', [SoumissionController::class, 'deleteSubmission'])->name('soumission.delete');
    Route::get('/soumission/{soumission}/approuvée', [SoumissionController::class, 'approuver'])->name('soumission.approuver');
    Route::post('/soumission/{soumission}/rejetée', [SoumissionController::class, 'rejeter'])->name('soumission.rejeter');

    Route::get('/profile/admin', [ProfileController::class, 'editAdmin'])->name('profile.edit_admin');

});

Route::get('/', [AuthenticatedSessionController::class, 'create']);
// Route::get('/', [HomeController::class, 'index'])->name('home');
// Route::get('/journee-remehbs', [HomeController::class, 'journee'])->name('journee');


// Route::get('/dashboard', function () {
//     return view('dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
