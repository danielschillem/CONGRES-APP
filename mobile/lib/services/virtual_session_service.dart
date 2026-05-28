import '../models/virtual_session.dart';
import 'api_service.dart';

class VirtualSessionService {
  Future<List<VirtualSession>> listSessions(String congressId) async {
    final data = await ApiService.get('/virtual/sessions?congress_id=$congressId');
    if (data is List) {
      return data.map((e) => VirtualSession.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<VirtualSession> getSession(String id) async {
    final data = await ApiService.get('/virtual/sessions/$id');
    return VirtualSession.fromJson(data as Map<String, dynamic>);
  }

  Future<void> joinSession(String id) async {
    await ApiService.post('/virtual/sessions/$id/join', {});
  }

  Future<void> leaveSession(String id) async {
    await ApiService.post('/virtual/sessions/$id/leave', {});
  }

  Future<List<VirtualSession>> getMyUpcomingSessions() async {
    final data = await ApiService.get('/virtual/my-sessions');
    if (data is List) {
      return data.map((e) => VirtualSession.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }
}
