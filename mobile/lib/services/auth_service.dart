import '../config/app_config.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  // Login
  static Future<User> login(String email, String password) async {
    final response = await ApiService.post(
      AppConfig.loginEndpoint,
      {'email': email, 'password': password},
      withAuth: false,
    );

    final accessToken = response['access_token']?.toString() ??
        response['accessToken']?.toString() ??
        response['token']?.toString();
    final refreshToken = response['refresh_token']?.toString() ??
        response['refreshToken']?.toString() ??
        '';

    if (accessToken == null || accessToken.isEmpty) {
      throw ApiException(statusCode: 500, message: 'Token non reçu du serveur.');
    }

    User user;
    if (response['user'] != null) {
      user = User.fromJson(response['user'] as Map<String, dynamic>);
    } else {
      // Fetch user profile with the new token
      await StorageService.saveAccessToken(accessToken);
      final profileResponse = await ApiService.get(AppConfig.profileEndpoint);
      user = User.fromJson(profileResponse as Map<String, dynamic>);
    }

    await StorageService.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user.id,
    );

    return user;
  }

  // Register
  static Future<User> register({
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
    final body = <String, dynamic>{
      'civilite': civilite,
      'nom': nom,
      'prenom': prenom,
      'sexe': sexe,
      'telephone': telephone,
      'email': email,
      'password': password,
      if (organisme != null && organisme.isNotEmpty) 'organisme': organisme,
      if (profession != null && profession.isNotEmpty) 'profession': profession,
    };

    final response = await ApiService.post(
      AppConfig.registerEndpoint,
      body,
      withAuth: false,
    );

    final accessToken = response['access_token']?.toString() ??
        response['accessToken']?.toString() ??
        response['token']?.toString();
    final refreshToken = response['refresh_token']?.toString() ??
        response['refreshToken']?.toString() ??
        '';

    if (accessToken == null || accessToken.isEmpty) {
      throw ApiException(statusCode: 500, message: 'Token non reçu du serveur.');
    }

    User user;
    if (response['user'] != null) {
      user = User.fromJson(response['user'] as Map<String, dynamic>);
    } else {
      await StorageService.saveAccessToken(accessToken);
      final profileResponse = await ApiService.get(AppConfig.profileEndpoint);
      user = User.fromJson(profileResponse as Map<String, dynamic>);
    }

    await StorageService.saveTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
      userId: user.id,
    );

    return user;
  }

  // Logout — no backend endpoint, just clear local tokens
  static Future<void> logout() async {
    await StorageService.clearAll();
  }

  // Get current user profile
  static Future<User> getProfile() async {
    final response = await ApiService.get(AppConfig.profileEndpoint);
    return User.fromJson(response as Map<String, dynamic>);
  }

  // Update profile
  static Future<User> updateProfile(Map<String, dynamic> data) async {
    final response = await ApiService.patch(AppConfig.profileEndpoint, data);
    if (response is Map && response['user'] != null) {
      return User.fromJson(response['user'] as Map<String, dynamic>);
    }
    return User.fromJson(response as Map<String, dynamic>);
  }
}
