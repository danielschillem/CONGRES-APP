import 'package:flutter/foundation.dart';
import '../models/congress.dart';
import '../services/congress_service.dart';

class CongressProvider extends ChangeNotifier {
  final CongressService _service = CongressService();

  List<Congress> _congresses = [];
  Congress? _selectedCongress;
  bool _isLoading = false;
  String? _error;

  List<Congress> get congresses => _congresses;
  Congress? get selectedCongress => _selectedCongress;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadActiveCongresses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _congresses = await _service.getActiveCongresses();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> selectCongress(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedCongress = await _service.getCongress(id);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  void clearSelection() {
    _selectedCongress = null;
    notifyListeners();
  }
}
