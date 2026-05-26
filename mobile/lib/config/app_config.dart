class AppConfig {
  // Use --dart-define=API_BASE_URL=... to override for Docker/real devices
  // Default: 10.0.2.2 = Android emulator host loopback
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080/api',
  );

  // Auth endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String refreshEndpoint = '/auth/refresh';

  // Profile endpoint (not /auth/me)
  static const String profileEndpoint = '/profile';

  // Soumission endpoints
  static const String soumissionsEndpoint = '/soumissions';

  // Notification endpoints
  static const String notificationsEndpoint = '/notifications';

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
