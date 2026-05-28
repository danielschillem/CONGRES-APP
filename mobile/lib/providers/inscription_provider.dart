import 'package:flutter/foundation.dart';
import '../models/inscription.dart';
import '../services/inscription_service.dart';

class InscriptionProvider extends ChangeNotifier {
  final InscriptionService _service = InscriptionService();

  List<Inscription> _inscriptions = [];
  Inscription? _myInscription;
  bool _isLoading = false;
  String? _error;

  List<Inscription> get inscriptions => _inscriptions;
  Inscription? get myInscription => _myInscription;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadMyInscriptions({String? congressId}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _inscriptions = await _service.listMyInscriptions(congressId: congressId);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadMyInscription({String? congressId}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _myInscription = await _service.getMyInscription(congressId: congressId);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<Inscription?> createInscription(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final inscription = await _service.create(data);
      _inscriptions.insert(0, inscription);
      _myInscription = inscription;
      _isLoading = false;
      notifyListeners();
      return inscription;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  void clear() {
    _inscriptions = [];
    _myInscription = null;
    _error = null;
    notifyListeners();
  }
}
