import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';

class StorageService {
  static const FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
  );

  // Access Token
  static Future<void> saveAccessToken(String token) async {
    await _storage.write(key: AppConfig.accessTokenKey, value: token);
  }

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: AppConfig.accessTokenKey);
  }

  static Future<void> deleteAccessToken() async {
    await _storage.delete(key: AppConfig.accessTokenKey);
  }

  // Refresh Token
  static Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: AppConfig.refreshTokenKey, value: token);
  }

  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: AppConfig.refreshTokenKey);
  }

  static Future<void> deleteRefreshToken() async {
    await _storage.delete(key: AppConfig.refreshTokenKey);
  }

  // User ID
  static Future<void> saveUserId(String userId) async {
    await _storage.write(key: AppConfig.userIdKey, value: userId);
  }

  static Future<String?> getUserId() async {
    return await _storage.read(key: AppConfig.userIdKey);
  }

  // Clear all auth data
  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  // Save all tokens at once
  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
    required String userId,
  }) async {
    await Future.wait([
      saveAccessToken(accessToken),
      saveRefreshToken(refreshToken),
      saveUserId(userId),
    ]);
  }

  // Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
