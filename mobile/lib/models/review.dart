class Review {
  final String id;
  final String soumissionId;
  final String reviewerId;
  final String? reviewGridId;
  final List<CriterionScore> scores;
  final double overallScore;
  final String comment;
  final String status; // assigned, in_progress, completed
  final DateTime createdAt;
  final DateTime? updatedAt;

  Review({
    required this.id,
    required this.soumissionId,
    required this.reviewerId,
    this.reviewGridId,
    required this.scores,
    required this.overallScore,
    required this.comment,
    required this.status,
    required this.createdAt,
    this.updatedAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    List<CriterionScore> scores = [];
    if (json['scores'] != null) {
      if (json['scores'] is List) {
        scores = (json['scores'] as List)
            .map((e) => CriterionScore.fromJson(e as Map<String, dynamic>))
            .toList();
      }
    }

    return Review(
      id: json['id']?.toString() ?? '',
      soumissionId: json['soumission_id']?.toString() ?? '',
      reviewerId: json['reviewer_id']?.toString() ?? '',
      reviewGridId: json['review_grid_id']?.toString(),
      scores: scores,
      overallScore: (json['overall_score'] is num
          ? (json['overall_score'] as num).toDouble()
          : double.tryParse(json['overall_score']?.toString() ?? '0') ?? 0),
      comment: json['comment']?.toString() ?? '',
      status: json['status']?.toString() ?? 'assigned',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'scores': scores.map((e) => e.toJson()).toList(),
      'comment': comment,
    };
  }
}

class CriterionScore {
  final String criterionId;
  final String? criterionName;
  final double score;
  final double maxScore;

  CriterionScore({
    required this.criterionId,
    this.criterionName,
    required this.score,
    required this.maxScore,
  });

  factory CriterionScore.fromJson(Map<String, dynamic> json) {
    return CriterionScore(
      criterionId: json['criterion_id']?.toString() ?? json['id']?.toString() ?? '',
      criterionName: json['criterion_name']?.toString() ?? json['name']?.toString(),
      score: (json['score'] is num
          ? (json['score'] as num).toDouble()
          : double.tryParse(json['score']?.toString() ?? '0') ?? 0),
      maxScore: (json['max_score'] is num
          ? (json['max_score'] as num).toDouble()
          : double.tryParse(json['max_score']?.toString() ?? '5') ?? 5),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'criterion_id': criterionId,
      'score': score,
    };
  }
}

class ReviewAssignment {
  final String reviewId;
  final String soumissionId;
  final String documentTitle;
  final String authorName;
  final String submissionType;
  final String status;
  final DateTime createdAt;

  ReviewAssignment({
    required this.reviewId,
    required this.soumissionId,
    required this.documentTitle,
    required this.authorName,
    required this.submissionType,
    required this.status,
    required this.createdAt,
  });

  factory ReviewAssignment.fromJson(Map<String, dynamic> json) {
    // The review object may be nested under a "review" key or at the top level
    final review = json['review'] is Map ? json['review'] as Map<String, dynamic> : json;
    final soumission = json['soumission'] is Map ? json['soumission'] as Map<String, dynamic> : null;

    return ReviewAssignment(
      reviewId: review['id']?.toString() ?? '',
      soumissionId: review['soumission_id']?.toString() ?? json['id']?.toString() ?? '',
      documentTitle: soumission?['document_title']?.toString() ?? json['document_title']?.toString() ?? '',
      authorName: soumission?['author_name']?.toString() ?? json['author_name']?.toString() ?? '',
      submissionType: soumission?['submission_type']?.toString() ?? json['submission_type']?.toString() ?? '',
      status: review['status']?.toString() ?? json['status']?.toString() ?? 'assigned',
      createdAt: review['created_at'] != null
          ? DateTime.tryParse(review['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
