class Soumission {
  final String id;
  final String submissionType;
  final String theme;
  final String topics;
  final String documentTitle;
  final String authorName;
  final String resume;
  final List<String> keywords;
  final String filePath;
  final String userId;
  final String statut;
  final String? raisonRejet;
  final DateTime createdAt;
  final DateTime? updatedAt;

  Soumission({
    required this.id,
    required this.submissionType,
    required this.theme,
    required this.topics,
    required this.documentTitle,
    required this.authorName,
    required this.resume,
    required this.keywords,
    required this.filePath,
    required this.userId,
    required this.statut,
    this.raisonRejet,
    required this.createdAt,
    this.updatedAt,
  });

  factory Soumission.fromJson(Map<String, dynamic> json) {
    List<String> parseKeywords(dynamic raw) {
      if (raw == null) return [];
      if (raw is List) return raw.map((e) => e.toString()).toList();
      if (raw is String) {
        if (raw.trim().isEmpty) return [];
        // Could be comma-separated or JSON array string
        try {
          // Try splitting by comma
          return raw.split(',').map((e) => e.trim()).where((e) => e.isNotEmpty).toList();
        } catch (_) {
          return [];
        }
      }
      return [];
    }

    return Soumission(
      id: json['id']?.toString() ?? '',
      submissionType: json['submission_type']?.toString() ?? json['submissionType']?.toString() ?? '',
      theme: json['theme']?.toString() ?? '',
      topics: json['topics']?.toString() ?? '',
      documentTitle: json['document_title']?.toString() ?? json['documentTitle']?.toString() ?? '',
      authorName: json['author_name']?.toString() ?? json['authorName']?.toString() ?? '',
      resume: json['resume']?.toString() ?? '',
      keywords: parseKeywords(json['keywords']),
      filePath: json['file_path']?.toString() ?? json['filePath']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      statut: json['statut']?.toString() ?? 'En attente',
      raisonRejet: json['raison_rejet']?.toString() ?? json['raisonRejet']?.toString(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : json['createdAt'] != null
              ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
              : DateTime.now(),
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'].toString())
          : json['updatedAt'] != null
              ? DateTime.tryParse(json['updatedAt'].toString())
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'submission_type': submissionType,
      'theme': theme,
      'topics': topics,
      'document_title': documentTitle,
      'author_name': authorName,
      'resume': resume,
      'keywords': keywords,
      'file_path': filePath,
      'user_id': userId,
      'statut': statut,
      if (raisonRejet != null) 'raison_rejet': raisonRejet,
      'created_at': createdAt.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }

  bool get isEnAttente => statut == 'En attente';
  bool get isApprouvee => statut == 'Approuvée';
  bool get isRejetee => statut == 'Rejetée';
}
