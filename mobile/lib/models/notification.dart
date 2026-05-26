import 'dart:convert';

class AppNotification {
  final String id;
  final String message;
  final String? type;
  final bool isRead;
  final String? soumissionId;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.message,
    this.type,
    required this.isRead,
    this.soumissionId,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    // Parse the nested `data` JSON object from the backend
    String message = '';
    String? soumissionId;

    if (json['data'] != null) {
      dynamic rawData = json['data'];
      if (rawData is Map) {
        message = rawData['message']?.toString() ?? '';
        soumissionId = rawData['soumission_id']?.toString() ??
            rawData['soumissionId']?.toString();
      } else if (rawData is String) {
        // data is a JSON string, try to decode it
        try {
          final decoded = jsonDecode(rawData);
          if (decoded is Map) {
            message = decoded['message']?.toString() ?? '';
            soumissionId = decoded['soumission_id']?.toString() ??
                decoded['soumissionId']?.toString();
          }
        } catch (_) {
          message = rawData;
        }
      }
    }

    // read_at: null = unread, non-null = read
    final bool isRead;
    if (json['read_at'] != null) {
      isRead = json['read_at'].toString().isNotEmpty;
    } else {
      isRead = false;
    }

    return AppNotification(
      id: json['id']?.toString() ?? '',
      message: message,
      type: json['type']?.toString(),
      isRead: isRead,
      soumissionId: soumissionId,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
              : DateTime.now(),
    );
  }

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      message: message,
      type: type,
      isRead: isRead ?? this.isRead,
      soumissionId: soumissionId,
      createdAt: createdAt,
    );
  }
}
