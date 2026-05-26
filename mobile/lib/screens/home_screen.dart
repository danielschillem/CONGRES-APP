import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/notification_provider.dart';
import '../providers/soumission_provider.dart';
import 'soumissions/soumission_list_screen.dart';
import 'notifications/notification_screen.dart';
import 'profile/profile_screen.dart';

class HomeScreen extends StatefulWidget {
  final int initialTab;

  const HomeScreen({super.key, this.initialTab = 0});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialTab;
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    await Future.wait([
      context.read<SoumissionProvider>().fetchSoumissions(),
      context.read<NotificationProvider>().fetchNotifications(),
    ]);
  }

  final List<Widget> _screens = const [
    SoumissionListScreen(),
    NotificationScreen(),
    ProfileScreen(),
  ];

  void _onTabTapped(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: _onTabTapped,
        backgroundColor: Colors.white,
        elevation: 8,
        shadowColor: Colors.black.withValues(alpha: 0.1),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.article_outlined),
            selectedIcon: Icon(Icons.article),
            label: 'Soumissions',
          ),
          NavigationDestination(
            icon: Consumer<NotificationProvider>(
              builder: (context, notifProvider, _) {
                final count = notifProvider.unreadCount;
                return Badge(
                  isLabelVisible: count > 0,
                  label: Text(count > 99 ? '99+' : count.toString()),
                  child: const Icon(Icons.notifications_outlined),
                );
              },
            ),
            selectedIcon: Consumer<NotificationProvider>(
              builder: (context, notifProvider, _) {
                final count = notifProvider.unreadCount;
                return Badge(
                  isLabelVisible: count > 0,
                  label: Text(count > 99 ? '99+' : count.toString()),
                  child: const Icon(Icons.notifications),
                );
              },
            ),
            label: 'Notifications',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () => context.push('/soumissions/new'),
              icon: const Icon(Icons.add),
              label: const Text('Nouvelle soumission'),
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: Colors.white,
              elevation: 4,
            )
          : null,
    );
  }
}
