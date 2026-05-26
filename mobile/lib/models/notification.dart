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
    return AppNotification(
      id: json['id']?.toString() ?? '',
      message: json['message']?.toString() ?? '',
      type: json['type']?.toString(),
      isRead: json['is_read'] == true ||
          json['isRead'] == true ||
          json['read'] == true ||
          json['is_read'] == 1 ||
          json['isRead'] == 1,
      soumissionId: json['soumission_id']?.toString() ?? json['soumissionId']?.toString(),
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
