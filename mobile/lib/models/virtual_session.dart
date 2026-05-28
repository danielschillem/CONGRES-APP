class VirtualSession {
  final String id;
  final String congressId;
  final String title;
  final String? description;
  final String sessionType;
  final DateTime startTime;
  final DateTime endTime;
  final String roomName;
  final String? password;
  final int maxParticipants;
  final String status;
  final bool recordingEnabled;
  final String? joinUrl;

  VirtualSession({
    required this.id,
    required this.congressId,
    required this.title,
    this.description,
    required this.sessionType,
    required this.startTime,
    required this.endTime,
    required this.roomName,
    this.password,
    required this.maxParticipants,
    required this.status,
    required this.recordingEnabled,
    this.joinUrl,
  });

  bool get isLive => status == 'live';
  bool get isScheduled => status == 'scheduled';
  bool get isEnded => status == 'ended';

  factory VirtualSession.fromJson(Map<String, dynamic> json) {
    return VirtualSession(
      id: json['id']?.toString() ?? '',
      congressId: json['congress_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      sessionType: json['session_type']?.toString() ?? '',
      startTime: json['start_time'] != null
          ? DateTime.tryParse(json['start_time'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endTime: json['end_time'] != null
          ? DateTime.tryParse(json['end_time'].toString()) ?? DateTime.now()
          : DateTime.now(),
      roomName: json['room_name']?.toString() ?? '',
      password: json['password']?.toString(),
      maxParticipants: json['max_participants'] is int
          ? json['max_participants']
          : int.tryParse(json['max_participants']?.toString() ?? '50') ?? 50,
      status: json['status']?.toString() ?? 'scheduled',
      recordingEnabled: json['recording_enabled'] == true,
      joinUrl: json['join_url']?.toString() ?? json['jitsi_url']?.toString(),
    );
  }
}

class VirtualAttendance {
  final String id;
  final String sessionId;
  final String userId;
  final String? userName;
  final DateTime joinTime;
  final DateTime? leaveTime;
  final int duration;

  VirtualAttendance({
    required this.id,
    required this.sessionId,
    required this.userId,
    this.userName,
    required this.joinTime,
    this.leaveTime,
    required this.duration,
  });

  factory VirtualAttendance.fromJson(Map<String, dynamic> json) {
    return VirtualAttendance(
      id: json['id']?.toString() ?? '',
      sessionId: json['session_id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? '',
      userName: json['user_name']?.toString(),
      joinTime: json['join_time'] != null
          ? DateTime.tryParse(json['join_time'].toString()) ?? DateTime.now()
          : DateTime.now(),
      leaveTime: json['leave_time'] != null
          ? DateTime.tryParse(json['leave_time'].toString())
          : null,
      duration: json['duration'] is int
          ? json['duration']
          : int.tryParse(json['duration']?.toString() ?? '0') ?? 0,
    );
  }
}
