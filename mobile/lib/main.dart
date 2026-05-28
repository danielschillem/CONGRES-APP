import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'providers/auth_provider.dart';
import 'providers/soumission_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/congress_provider.dart';
import 'providers/inscription_provider.dart';
import 'providers/virtual_session_provider.dart';
import 'providers/review_provider.dart';
import 'services/push_notification_service.dart';
import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/home_screen.dart';
import 'screens/soumissions/soumission_form_screen.dart';
import 'screens/soumissions/soumission_detail_screen.dart';
import 'screens/congress/congress_list_screen.dart';
import 'screens/congress/congress_detail_screen.dart';
import 'screens/inscription/inscription_form_screen.dart';
import 'screens/inscription/inscription_list_screen.dart';
import 'screens/virtual/virtual_sessions_screen.dart';
import 'screens/review/review_list_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize French date formatting
  await initializeDateFormatting('fr_FR', null);

  // Initialize push notifications
  await PushNotificationService.initialize();

  // Set preferred orientation
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(const CongressApp());
}

class CongressApp extends StatelessWidget {
  const CongressApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => SoumissionProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ChangeNotifierProvider(create: (_) => CongressProvider()),
        ChangeNotifierProvider(create: (_) => InscriptionProvider()),
        ChangeNotifierProvider(create: (_) => VirtualSessionProvider()),
        ChangeNotifierProvider(create: (_) => ReviewProvider()),
      ],
      child: _AppRouter(),
    );
  }
}

class _AppRouter extends StatefulWidget {
  @override
  State<_AppRouter> createState() => _AppRouterState();
}

class _AppRouterState extends State<_AppRouter> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = _buildRouter();
  }

  GoRouter _buildRouter() {
    return GoRouter(
      initialLocation: '/splash',
      debugLogDiagnostics: false,
      routes: [
        // Splash screen
        GoRoute(
          path: '/splash',
          builder: (context, state) => const SplashScreen(),
        ),

        // Auth routes
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => const RegisterScreen(),
        ),

        // Main home with bottom navigation
        GoRoute(
          path: '/home',
          builder: (context, state) => const HomeScreen(initialTab: 0),
        ),

        // Soumission routes
        GoRoute(
          path: '/soumissions/new',
          builder: (context, state) => const SoumissionFormScreen(),
        ),
        GoRoute(
          path: '/soumissions/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return SoumissionDetailScreen(soumissionId: id);
          },
        ),
        GoRoute(
          path: '/soumissions/:id/edit',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            final soumissionProvider = context.read<SoumissionProvider>();
            final soumissions = soumissionProvider.soumissions
                .where((s) => s.id == id);
            final soumission = soumissions.isNotEmpty ? soumissions.first : null;
            return SoumissionFormScreen(soumission: soumission);
          },
        ),

        // Congress routes
        GoRoute(
          path: '/congress',
          builder: (context, state) => const CongressListScreen(),
        ),
        GoRoute(
          path: '/congress/detail',
          builder: (context, state) {
            final id = state.extra as String;
            return CongressDetailScreen(congressId: id);
          },
        ),

        // Inscription routes
        GoRoute(
          path: '/inscription',
          builder: (context, state) {
            final congressId = state.extra as String?;
            return InscriptionFormScreen(congressId: congressId);
          },
        ),
        GoRoute(
          path: '/inscriptions',
          builder: (context, state) => const InscriptionListScreen(),
        ),

        // Virtual session routes
        GoRoute(
          path: '/virtual/sessions',
          builder: (context, state) => const VirtualSessionsScreen(),
        ),

        // Review routes
        GoRoute(
          path: '/reviewer/assignments',
          builder: (context, state) => const ReviewListScreen(),
        ),
      ],
      errorBuilder: (context, state) => Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                'Page introuvable',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => context.go('/splash'),
                child: const Text("Retour a l'accueil"),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'CongresApp',
      debugShowCheckedModeBanner: false,
      routerConfig: _router,

      // Material 3 theme
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3B82F6),
          brightness: Brightness.light,
          primary: const Color(0xFF3B82F6),
          secondary: const Color(0xFF6366F1),
          error: const Color(0xFFEF4444),
          surface: Colors.white,
          surfaceContainerHighest: const Color(0xFFF3F4F6),
        ),
        scaffoldBackgroundColor: const Color(0xFFF9FAFB),

        // AppBar theme
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Color(0xFF1F2937),
          elevation: 0,
          scrolledUnderElevation: 1,
          titleTextStyle: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1F2937),
          ),
          iconTheme: IconThemeData(color: Color(0xFF374151)),
        ),

        // Card theme
        cardTheme: CardTheme(
          elevation: 2,
          shadowColor: Colors.black.withValues(alpha: 0.08),
          surfaceTintColor: Colors.white,
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),

        // ElevatedButton theme
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF3B82F6),
            foregroundColor: Colors.white,
            elevation: 2,
            shadowColor: const Color(0xFF3B82F6).withValues(alpha: 0.3),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // OutlinedButton theme
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF3B82F6),
            side: const BorderSide(color: Color(0xFF3B82F6)),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),

        // Text theme
        textTheme: const TextTheme(
          headlineLarge: TextStyle(
            fontSize: 30,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
          headlineMedium: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
          titleLarge: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1F2937),
          ),
          titleMedium: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
          titleSmall: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF374151),
          ),
          bodyLarge: TextStyle(
            fontSize: 16,
            color: Color(0xFF1F2937),
          ),
          bodyMedium: TextStyle(
            fontSize: 14,
            color: Color(0xFF374151),
          ),
          bodySmall: TextStyle(
            fontSize: 12,
            color: Color(0xFF6B7280),
          ),
        ),

        // InputDecoration theme
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFF9FAFB),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF3B82F6), width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFEF4444)),
          ),
          labelStyle: const TextStyle(color: Color(0xFF6B7280)),
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),

        // Chip theme
        chipTheme: ChipThemeData(
          backgroundColor: const Color(0xFFEFF6FF),
          labelStyle: const TextStyle(
            color: Color(0xFF3B82F6),
            fontWeight: FontWeight.w500,
          ),
          side: const BorderSide(color: Color(0xFFBFDBFE)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),

        // Snackbar theme
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          contentTextStyle: const TextStyle(color: Colors.white),
        ),

        // NavigationBar theme
        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: Colors.white,
          elevation: 4,
          shadowColor: Colors.black.withValues(alpha: 0.1),
          indicatorColor:
              const Color(0xFF3B82F6).withValues(alpha: 0.12),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF3B82F6),
              );
            }
            return const TextStyle(
              fontSize: 12,
              color: Color(0xFF6B7280),
            );
          }),
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const IconThemeData(color: Color(0xFF3B82F6));
            }
            return const IconThemeData(color: Color(0xFF9CA3AF));
          }),
        ),

        // FloatingActionButton theme
        floatingActionButtonTheme: const FloatingActionButtonThemeData(
          backgroundColor: Color(0xFF3B82F6),
          foregroundColor: Colors.white,
          elevation: 4,
        ),

        // Dialog theme
        dialogTheme: DialogTheme(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 8,
          titleTextStyle: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1F2937),
          ),
        ),

        // Divider theme
        dividerTheme: const DividerThemeData(
          color: Color(0xFFE5E7EB),
          thickness: 1,
          space: 1,
        ),

        // ListTile theme
        listTileTheme: const ListTileThemeData(
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        ),
      ),
    );
  }
}
