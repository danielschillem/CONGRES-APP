class AppConfig {
  // Android emulator uses 10.0.2.2 to reach host's localhost
  static const String baseUrl = 'http://10.0.2.2:8080/api';

  // Auth endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String refreshEndpoint = '/auth/refresh';
  static const String logoutEndpoint = '/auth/logout';
  static const String meEndpoint = '/auth/me';

  // Soumission endpoints
  static const String soumissionsEndpoint = '/soumissions';

  // Notification endpoints
  static const String notificationsEndpoint = '/notifications';

  // Profile endpoint
  static const String profileEndpoint = '/profile';

  // Storage keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';

  // App constants
  static const int maxResumeLength = 1000;
  static const int maxKeywords = 10;
  static const List<String> submissionTypes = [
    'Abstract',
    'Poster',
    'Communication',
  ];
  static const List<String> civilites = ['M.', 'Mme', 'Dr', 'Pr'];
  static const List<String> sexes = ['Homme', 'Femme'];
  static const List<String> statuts = [
    'En attente',
    'Approuvée',
    'Rejetée',
  ];
}
