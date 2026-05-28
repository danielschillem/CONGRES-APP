import '../models/review.dart';
import 'api_service.dart';

class ReviewService {
  Future<List<ReviewAssignment>> getMyAssignments() async {
    final data = await ApiService.get('/reviewer/assignments');
    if (data is List) {
      return data.map((e) => ReviewAssignment.fromJson(e as Map<String, dynamic>)).toList();
    }
    return [];
  }

  Future<void> startReview(String assignmentId) async {
    await ApiService.post('/reviewer/assignments/$assignmentId/start', {});
  }

  Future<void> submitReview(String assignmentId, Map<String, dynamic> reviewData) async {
    await ApiService.post('/reviewer/assignments/$assignmentId/submit', reviewData);
  }
}
