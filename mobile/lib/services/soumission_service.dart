import 'dart:io';
import '../config/app_config.dart';
import '../models/soumission.dart';
import 'api_service.dart';

class SoumissionService {
  // Fetch all soumissions for the current user
  static Future<List<Soumission>> getMySoumissions() async {
    final response = await ApiService.get(AppConfig.soumissionsEndpoint);
    if (response == null) return [];

    List<dynamic> data;
    if (response is List) {
      data = response;
    } else if (response is Map && response['data'] != null) {
      data = response['data'] as List<dynamic>;
    } else if (response is Map && response['soumissions'] != null) {
      data = response['soumissions'] as List<dynamic>;
    } else {
      data = [];
    }

    return data
        .map((json) => Soumission.fromJson(json as Map<String, dynamic>))
        .toList();
  }

  // Fetch a single soumission by ID
  static Future<Soumission> getSoumission(String id) async {
    final response = await ApiService.get('${AppConfig.soumissionsEndpoint}/$id');
    if (response is Map && response['soumission'] != null) {
      return Soumission.fromJson(response['soumission'] as Map<String, dynamic>);
    }
    return Soumission.fromJson(response as Map<String, dynamic>);
  }

  // Create a new soumission with a PDF file
  static Future<Soumission> createSoumission({
    required String submissionType,
    required String theme,
    required String topics,
    required String documentTitle,
    required String authorName,
    required String resume,
    required List<String> keywords,
    required File pdfFile,
  }) async {
    final fields = <String, String>{
      'submission_type': submissionType,
      'theme': theme,
      'topics': topics,
      'document_title': documentTitle,
      'author_name': authorName,
      'resume': resume,
      'keywords': keywords.join(','),
    };

    final response = await ApiService.postMultipart(
      AppConfig.soumissionsEndpoint,
      fields,
      pdfFile,
      fileFieldName: 'file',
    );

    if (response is Map && response['soumission'] != null) {
      return Soumission.fromJson(response['soumission'] as Map<String, dynamic>);
    }
    return Soumission.fromJson(response as Map<String, dynamic>);
  }

  // Update an existing soumission (only allowed if "En attente")
  static Future<Soumission> updateSoumission({
    required String id,
    required String submissionType,
    required String theme,
    required String topics,
    required String documentTitle,
    required String authorName,
    required String resume,
    required List<String> keywords,
    File? pdfFile, // optional – only if user wants to replace the file
  }) async {
    final fields = <String, String>{
      'submission_type': submissionType,
      'theme': theme,
      'topics': topics,
      'document_title': documentTitle,
      'author_name': authorName,
      'resume': resume,
      'keywords': keywords.join(','),
    };

    final response = await ApiService.patchMultipart(
      '${AppConfig.soumissionsEndpoint}/$id',
      fields,
      pdfFile,
      fileFieldName: 'file',
    );

    if (response is Map && response['soumission'] != null) {
      return Soumission.fromJson(response['soumission'] as Map<String, dynamic>);
    }
    return Soumission.fromJson(response as Map<String, dynamic>);
  }

  // Delete a soumission
  static Future<void> deleteSoumission(String id) async {
    await ApiService.delete('${AppConfig.soumissionsEndpoint}/$id');
  }
}
