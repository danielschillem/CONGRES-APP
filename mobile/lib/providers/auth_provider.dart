import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../services/api_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider extends ChangeNotifier {
  AuthStatus _status = AuthStatus.unknown;
  User? _user;
  String? _errorMessage;
  bool _isLoading = false;

  AuthStatus get status => _status;
  User? get user => _user;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  AuthProvider() {
    // Register logout callback on the API service
    ApiService.onLogout = () {
      _status = AuthStatus.unauthenticated;
      _user = null;
      notifyListeners();
    };
  }

  // Check stored token and restore session
  Future<void> checkAuthStatus() async {
    _setLoading(true);
    try {
      final loggedIn = await StorageService.isLoggedIn();
      if (loggedIn) {
        // Try to load user profile
        try {
          _user = await AuthService.getProfile();
          _status = AuthStatus.authenticated;
        } catch (_) {
          // Token might be invalid; clear and require login
          await StorageService.clearAll();
          _status = AuthStatus.unauthenticated;
        }
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (_) {
      _status = AuthStatus.unauthenticated;
    } finally {
      _setLoading(false);
    }
  }

  // Login
  Future<bool> login(String email, String password) async {
    _setLoading(true);
    _clearError();
    try {
      _user = await AuthService.login(email, password);
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Erreur de connexion. Vérifiez votre réseau.';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Register
  Future<bool> register({
    required String civilite,
    required String nom,
    required String prenom,
    required String sexe,
    required String telephone,
    required String email,
    required String password,
    String? organisme,
    String? profession,
  }) async {
    _setLoading(true);
    _clearError();
    try {
      _user = await AuthService.register(
        civilite: civilite,
        nom: nom,
        prenom: prenom,
        sexe: sexe,
        telephone: telephone,
        email: email,
        password: password,
        organisme: organisme,
        profession: profession,
      );
      _status = AuthStatus.authenticated;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Erreur lors de l\'inscription. Vérifiez votre réseau.';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Logout
  Future<void> logout() async {
    _setLoading(true);
    try {
      await AuthService.logout();
    } catch (_) {
      // Ignore server-side errors; always clear locally
    } finally {
      _user = null;
      _status = AuthStatus.unauthenticated;
      _setLoading(false);
    }
  }

  // Update profile
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    _setLoading(true);
    _clearError();
    try {
      _user = await AuthService.updateProfile(data);
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Erreur lors de la mise à jour du profil.';
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
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
