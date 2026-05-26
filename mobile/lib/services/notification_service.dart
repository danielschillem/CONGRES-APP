import '../config/app_config.dart';
import '../models/notification.dart';
import 'api_service.dart';

class NotificationService {
  // Fetch all notifications for the current user
  static Future<List<AppNotification>> getNotifications() async {
    final response = await ApiService.get(AppConfig.notificationsEndpoint);
    if (response == null) return [];

    List<dynamic> data;
    if (response is List) {
      data = response;
    } else if (response is Map && response['data'] != null) {
      data = response['data'] as List<dynamic>;
    } else if (response is Map && response['notifications'] != null) {
      data = response['notifications'] as List<dynamic>;
    } else {
      data = [];
    }

    return data
        .map((json) => AppNotification.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  // Mark a notification as read
  static Future<void> markAsRead(String id) async {
    await ApiService.patch(
      '${AppConfig.notificationsEndpoint}/$id/read',
      {},
    );
  }

  // Mark all notifications as read
  static Future<void> markAllAsRead() async {
    await ApiService.patch(
      '${AppConfig.notificationsEndpoint}/read-all',
      {},
    );
  }

  // Count unread notifications
  static int countUnread(List<AppNotification> notifications) {
    return notifications.where((n) => !n.isRead).length;
  }
}
