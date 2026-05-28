import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PushNotificationService {
  static const _fcmTokenKey = 'fcm_token';

  static Future<String?> getFcmToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_fcmTokenKey);
  }

  static Future<void> saveFcmToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_fcmTokenKey, token);
  }

  static Future<void> removeFcmToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_fcmTokenKey);
  }

  /// Simulate push notification registration on platforms without Firebase.
  /// In production, replace with firebase_messaging setup.
  static Future<void> initialize() async {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      debugPrint('[PushNotification] Firebase Cloud Messaging would be initialized here');
      debugPrint('[PushNotification] For production, add firebase_messaging dependency');
    }
  }

  /// Handle a received notification payload.
  static void handleNotificationPayload(Map<String, dynamic>? payload) {
    if (payload == null) return;
    debugPrint('[PushNotification] Received: ${jsonEncode(payload)}');

    final type = payload['type']?.toString();
    final soumissionId = payload['soumission_id']?.toString();
    final message = payload['message']?.toString() ?? 'Nouvelle notification';

    // In a full implementation, this would navigate to the relevant screen
    debugPrint('[PushNotification] Type: $type, Soumission: $soumissionId, Message: $message');
  }
}
