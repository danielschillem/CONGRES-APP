import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import 'storage_service.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException({required this.statusCode, required this.message});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiService {
  static ApiService? _instance;
  static ApiService get instance => _instance ??= ApiService._();

  ApiService._();

  // Callback to handle logout when token refresh fails
  static void Function()? onLogout;

  // Build full URL
  static String _url(String endpoint) {
    return '${AppConfig.baseUrl}$endpoint';
  }

  // Build headers with optional auth
  static Future<Map<String, String>> _buildHeaders({bool withAuth = true}) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (withAuth) {
      final token = await StorageService.getAccessToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  // Parse error from response
  static String _parseError(http.Response response) {
    try {
      final body = jsonDecode(response.body);
      return body['message']?.toString() ??
          body['error']?.toString() ??
          body['msg']?.toString() ??
          'Erreur serveur (${response.statusCode})';
    } catch (_) {
      return response.body.isNotEmpty
          ? response.body
          : 'Erreur serveur (${response.statusCode})';
    }
  }

  // Refresh access token using refresh token
  static Future<bool> _refreshToken() async {
    try {
      final refreshToken = await StorageService.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) return false;

      final response = await http.post(
        Uri.parse(_url(AppConfig.refreshEndpoint)),
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: jsonEncode({'refresh_token': refreshToken}),
      );

      if (response.statusCode == 200) {
        final raw = jsonDecode(response.body);
        // Unwrap { success: true, data: { ... } }
        final body = (raw is Map && raw['success'] == true && raw['data'] != null)
            ? raw['data'] as Map<String, dynamic>
            : raw as Map<String, dynamic>;

        final newAccessToken = body['access_token']?.toString() ??
            body['accessToken']?.toString() ??
            body['token']?.toString();
        final newRefreshToken = body['refresh_token']?.toString() ??
            body['refreshToken']?.toString();

        if (newAccessToken != null) {
          await StorageService.saveAccessToken(newAccessToken);
          if (newRefreshToken != null) {
            await StorageService.saveRefreshToken(newRefreshToken);
          }
          return true;
        }
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // Handle 401 by refreshing and retrying
  static Future<http.Response> _handleUnauthorized(
    Future<http.Response> Function() retryRequest,
  ) async {
    final refreshed = await _refreshToken();
    if (refreshed) {
      return await retryRequest();
    } else {
      // Clear tokens and call logout
      await StorageService.clearAll();
      onLogout?.call();
      throw ApiException(statusCode: 401, message: 'Session expirée. Veuillez vous reconnecter.');
    }
  }

  // GET request
  static Future<dynamic> get(String endpoint) async {
    final headers = await _buildHeaders();
    final response = await http.get(
      Uri.parse(_url(endpoint)),
      headers: headers,
    );

    if (response.statusCode == 401) {
      final retryResponse = await _handleUnauthorized(() async {
        final newHeaders = await _buildHeaders();
        return http.get(Uri.parse(_url(endpoint)), headers: newHeaders);
      });
      return _processResponse(retryResponse);
    }

    return _processResponse(response);
  }

  // POST request
  static Future<dynamic> post(
    String endpoint,
    Map<String, dynamic> body, {
    bool withAuth = true,
  }) async {
    final headers = await _buildHeaders(withAuth: withAuth);
    final response = await http.post(
      Uri.parse(_url(endpoint)),
      headers: headers,
      body: jsonEncode(body),
    );

    if (response.statusCode == 401 && withAuth) {
      final retryResponse = await _handleUnauthorized(() async {
        final newHeaders = await _buildHeaders();
        return http.post(
          Uri.parse(_url(endpoint)),
          headers: newHeaders,
          body: jsonEncode(body),
        );
      });
      return _processResponse(retryResponse);
    }

    return _processResponse(response);
  }

  // PATCH request
  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body) async {
    final headers = await _buildHeaders();
    final response = await http.patch(
      Uri.parse(_url(endpoint)),
      headers: headers,
      body: jsonEncode(body),
    );

    if (response.statusCode == 401) {
      final retryResponse = await _handleUnauthorized(() async {
        final newHeaders = await _buildHeaders();
        return http.patch(
          Uri.parse(_url(endpoint)),
          headers: newHeaders,
          body: jsonEncode(body),
        );
      });
      return _processResponse(retryResponse);
    }

    return _processResponse(response);
  }

  // PUT request
  static Future<dynamic> put(String endpoint, Map<String, dynamic> body) async {
    final headers = await _buildHeaders();
    final response = await http.put(
      Uri.parse(_url(endpoint)),
      headers: headers,
      body: jsonEncode(body),
    );

    if (response.statusCode == 401) {
      final retryResponse = await _handleUnauthorized(() async {
        final newHeaders = await _buildHeaders();
        return http.put(
          Uri.parse(_url(endpoint)),
          headers: newHeaders,
          body: jsonEncode(body),
        );
      });
      return _processResponse(retryResponse);
    }

    return _processResponse(response);
  }

  // DELETE request
  static Future<dynamic> delete(String endpoint) async {
    final headers = await _buildHeaders();
    final response = await http.delete(
      Uri.parse(_url(endpoint)),
      headers: headers,
    );

    if (response.statusCode == 401) {
      final retryResponse = await _handleUnauthorized(() async {
        final newHeaders = await _buildHeaders();
        return http.delete(Uri.parse(_url(endpoint)), headers: newHeaders);
      });
      return _processResponse(retryResponse);
    }

    return _processResponse(response);
  }

  // Multipart POST (file upload)
  static Future<dynamic> postMultipart(
    String endpoint,
    Map<String, String> fields,
    File? file, {
    String fileFieldName = 'file',
    void Function(int sent, int total)? onProgress,
  }) async {
    return _sendMultipart('POST', endpoint, fields, file,
        fileFieldName: fileFieldName, onProgress: onProgress);
  }

  // Multipart PATCH (file upload)
  static Future<dynamic> patchMultipart(
    String endpoint,
    Map<String, String> fields,
    File? file, {
    String fileFieldName = 'file',
    void Function(int sent, int total)? onProgress,
  }) async {
    return _sendMultipart('PATCH', endpoint, fields, file,
        fileFieldName: fileFieldName, onProgress: onProgress);
  }

  static Future<dynamic> _sendMultipart(
    String method,
    String endpoint,
    Map<String, String> fields,
    File? file, {
    String fileFieldName = 'file',
    void Function(int sent, int total)? onProgress,
  }) async {
    final token = await StorageService.getAccessToken();
    final request = http.MultipartRequest(method, Uri.parse(_url(endpoint)));

    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    request.headers['Accept'] = 'application/json';

    // Add fields
    request.fields.addAll(fields);

    // Add file if provided
    if (file != null) {
      final fileName = file.path.split('/').last;
      final multipartFile = await http.MultipartFile.fromPath(
        fileFieldName,
        file.path,
        filename: fileName,
      );
      request.files.add(multipartFile);
    }

    try {
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 401) {
        final refreshed = await _refreshToken();
        if (refreshed) {
          // Retry the request
          return _sendMultipart(method, endpoint, fields, file,
              fileFieldName: fileFieldName, onProgress: onProgress);
        } else {
          await StorageService.clearAll();
          onLogout?.call();
          throw ApiException(statusCode: 401, message: 'Session expirée. Veuillez vous reconnecter.');
        }
      }

      return _processResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        statusCode: 0,
        message: 'Erreur de connexion: ${e.toString()}',
      );
    }
  }

  static dynamic _processResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return null;
      try {
        final decoded = jsonDecode(response.body);
        // Unwrap the standard { success: true, data: ... } wrapper
        if (decoded is Map && decoded['success'] == true && decoded.containsKey('data')) {
          return decoded['data'];
        }
        return decoded;
      } catch (_) {
        return response.body;
      }
    } else {
      throw ApiException(
        statusCode: response.statusCode,
        message: _parseError(response),
      );
    }
  }
}
