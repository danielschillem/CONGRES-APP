import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/soumission.dart';
import '../services/soumission_service.dart';
import '../services/api_service.dart';

class SoumissionProvider extends ChangeNotifier {
  List<Soumission> _soumissions = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Soumission> get soumissions => List.unmodifiable(_soumissions);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Stats getters
  int get total => _soumissions.length;
  int get totalAbstracts =>
      _soumissions.where((s) => s.submissionType == 'Abstract').length;
  int get totalPosters =>
      _soumissions.where((s) => s.submissionType == 'Poster').length;
  int get totalCommunications =>
      _soumissions.where((s) => s.submissionType == 'Communication').length;

  // Fetch all soumissions
  Future<void> fetchSoumissions() async {
    _setLoading(true);
    _clearError();
    try {
      _soumissions = await SoumissionService.getMySoumissions();
      // Sort by most recent first
      _soumissions.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      notifyListeners();
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Erreur lors du chargement des soumissions.';
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  // Create a new soumission
  Future<Soumission?> createSoumission({
    required String submissionType,
    required String theme,
    required String topics,
    required String documentTitle,
    required String authorName,
    required String resume,
    required List<String> keywords,
    required File pdfFile,
  }) async {
    _setLoading(true);
    _clearError();
    try {
      final soumission = await SoumissionService.createSoumission(
        submissionType: submissionType,
        theme: theme,
        topics: topics,
        documentTitle: documentTitle,
        authorName: authorName,
        resume: resume,
        keywords: keywords,
        pdfFile: pdfFile,
      );
      _soumissions.insert(0, soumission);
      notifyListeners();
      return soumission;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return null;
    } catch (e) {
      _errorMessage = 'Erreur lors de la création de la soumission.';
      notifyListeners();
      return null;
    } finally {
      _setLoading(false);
    }
  }

  // Update an existing soumission
  Future<Soumission?> updateSoumission({
    required String id,
    required String submissionType,
    required String theme,
    required String topics,
    required String documentTitle,
    required String authorName,
    required String resume,
    required List<String> keywords,
    File? pdfFile,
  }) async {
    _setLoading(true);
    _clearError();
    try {
      final updated = await SoumissionService.updateSoumission(
        id: id,
        submissionType: submissionType,
        theme: theme,
        topics: topics,
        documentTitle: documentTitle,
        authorName: authorName,
        resume: resume,
        keywords: keywords,
        pdfFile: pdfFile,
      );
      final index = _soumissions.indexWhere((s) => s.id == id);
      if (index != -1) {
        _soumissions[index] = updated;
      }
      notifyListeners();
      return updated;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return null;
    } catch (e) {
      _errorMessage = 'Erreur lors de la mise à jour de la soumission.';
      notifyListeners();
      return null;
    } finally {
      _setLoading(false);
    }
  }

  // Remove from local list (optional UI use)
  void removeSoumission(String id) {
    _soumissions.removeWhere((s) => s.id == id);
    notifyListeners();
  }

  void clearError() => _clearError();

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
  }
}
