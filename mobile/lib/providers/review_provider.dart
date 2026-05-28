import 'package:flutter/foundation.dart';
import '../models/review.dart';
import '../services/review_service.dart';

class ReviewProvider extends ChangeNotifier {
  final ReviewService _service = ReviewService();

  List<ReviewAssignment> _assignments = [];
  bool _isLoading = false;
  String? _error;

  List<ReviewAssignment> get assignments => _assignments;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get pendingCount => _assignments.where((a) => a.status == 'assigned').length;
  int get inProgressCount => _assignments.where((a) => a.status == 'in_progress').length;
  int get completedCount => _assignments.where((a) => a.status == 'completed').length;

  Future<void> loadAssignments() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _assignments = await _service.getMyAssignments();
    } catch (e) {
      _error = e.toString();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> startReview(String assignmentId) async {
    try {
      await _service.startReview(assignmentId);
      await loadAssignments();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> submitReview(String assignmentId, Map<String, dynamic> reviewData) async {
    try {
      await _service.submitReview(assignmentId, reviewData);
      await loadAssignments();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  void clear() {
    _assignments = [];
    _error = null;
    notifyListeners();
  }
}
