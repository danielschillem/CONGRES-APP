import 'package:flutter/foundation.dart';
import '../models/virtual_session.dart';
import '../services/virtual_session_service.dart';

class VirtualSessionProvider extends ChangeNotifier {
  final VirtualSessionService _service = VirtualSessionService();

  List<VirtualSession> _sessions = [];
  List<VirtualSession> _mySessions = [];
  VirtualSession? _selectedSession;
  bool _isLoading = false;
  String? _error;

  List<VirtualSession> get sessions => _sessions;
  List<VirtualSession> get mySessions => _mySessions;
  VirtualSession? get selectedSession => _selectedSession;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadSessions(String congressId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _sessions = await _service.listSessions(congressId);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadMyUpcomingSessions() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _mySessions = await _service.getMyUpcomingSessions();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> selectSession(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _selectedSession = await _service.getSession(id);
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> joinSession(String id) async {
    try {
      await _service.joinSession(id);
      await loadMyUpcomingSessions();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> leaveSession(String id) async {
    try {
      await _service.leaveSession(id);
      await loadMyUpcomingSessions();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  void clear() {
    _sessions = [];
    _mySessions = [];
    _selectedSession = null;
    _error = null;
    notifyListeners();
  }
}
