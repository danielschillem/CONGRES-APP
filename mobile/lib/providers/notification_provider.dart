import 'package:flutter/foundation.dart';
import '../models/notification.dart';
import '../services/notification_service.dart';
import '../services/api_service.dart';

class NotificationProvider extends ChangeNotifier {
  List<AppNotification> _notifications = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<AppNotification> get notifications => List.unmodifiable(_notifications);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get unreadCount => NotificationService.countUnread(_notifications);

  Future<void> fetchNotifications() async {
    _setLoading(true);
    _clearError();
    try {
      _notifications = await NotificationService.getNotifications();
      // Sort by newest first
      _notifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      notifyListeners();
    } on ApiException catch (e) {
      _errorMessage = e.message;
      notifyListeners();
    } catch (e) {
      _errorMessage = 'Erreur lors du chargement des notifications.';
      notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      await NotificationService.markAsRead(id);
      final index = _notifications.indexWhere((n) => n.id == id);
      if (index != -1) {
        _notifications[index] = _notifications[index].copyWith(isRead: true);
        notifyListeners();
      }
    } catch (_) {
      // Silent fail for read marking
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await NotificationService.markAllAsRead();
      _notifications = _notifications
          .map((n) => n.copyWith(isRead: true))
          .toList();
      notifyListeners();
    } catch (_) {
      // Silent fail
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
  }
}
