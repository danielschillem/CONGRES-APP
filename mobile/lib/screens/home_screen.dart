import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/soumission_provider.dart';
import '../providers/notification_provider.dart';
import '../widgets/soumission_card.dart';
import '../models/soumission.dart';

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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SoumissionProvider>().loadSoumissions();
      context.read<NotificationProvider>().loadNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      _buildDashboard(),
      _buildSoumissions(),
      _buildNotifications(),
      _buildMenu(),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home),
            label: 'Accueil',
          ),
          NavigationDestination(
            icon: const Icon(Icons.article_outlined),
            selectedIcon: const Icon(Icons.article),
            label: 'Soumissions',
          ),
          NavigationDestination(
            icon: const Icon(Icons.notifications_outlined),
            selectedIcon: const Icon(Icons.notifications),
            label: 'Notifications',
          ),
          NavigationDestination(
            icon: const Icon(Icons.menu),
            selectedIcon: const Icon(Icons.menu),
            label: 'Menu',
          ),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CongresApp'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Welcome card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Bienvenue',
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Consumer<AuthProvider>(
                    builder: (context, auth, _) => Text(
                      auth.user?.fullName ?? 'Cher participant',
                      style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Quick actions grid
          Text(
            'Actions rapides',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.3,
            children: [
              _quickActionCard(
                icon: Icons.event,
                label: 'Congres',
                color: Colors.blue,
                onTap: () => context.push('/congress'),
              ),
              _quickActionCard(
                icon: Icons.add_circle,
                label: 'Nouvelle soumission',
                color: Colors.green,
                onTap: () => context.push('/soumissions/new'),
              ),
              _quickActionCard(
                icon: Icons.fact_check,
                label: 'Inscription',
                color: Colors.orange,
                onTap: () => context.push('/congress'),
              ),
              _quickActionCard(
                icon: Icons.videocam,
                label: 'Sessions virtuelles',
                color: Colors.purple,
                onTap: () => context.push('/virtual/sessions'),
              ),
              _quickActionCard(
                icon: Icons.receipt_long,
                label: 'Mes inscriptions',
                color: Colors.teal,
                onTap: () => context.push('/inscriptions'),
              ),
              _quickActionCard(
                icon: Icons.rate_review,
                label: 'Evaluations',
                color: Colors.indigo,
                onTap: () => context.push('/reviewer/assignments'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _quickActionCard({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSoumissions() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes soumissions'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/soumissions/new'),
          ),
        ],
      ),
      body: Consumer<SoumissionProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(provider.error!, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => provider.loadSoumissions(),
                    child: const Text('Reessayer'),
                  ),
                ],
              ),
            );
          }

          if (provider.soumissions.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.article_outlined, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('Aucune soumission'),
                  SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: null, // navigate to new
                    child: Text('Soumettre un article'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadSoumissions(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.soumissions.length,
              itemBuilder: (context, index) {
                final soumission = provider.soumissions[index];
                return SoumissionCard(
                  soumission: soumission,
                  onTap: () => context.push('/soumissions/${soumission.id}'),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotifications() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, provider, _) {
              if (provider.notifications.any((n) => !n.isRead)) {
                return TextButton(
                  onPressed: () => provider.markAllAsRead(),
                  child: const Text('Tout marquer lu'),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.notifications.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.notifications_off, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('Aucune notification'),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadNotifications(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: provider.notifications.length,
              itemBuilder: (context, index) {
                final notif = provider.notifications[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  color: notif.isRead ? null : Colors.blue[50],
                  child: ListTile(
                    leading: Icon(
                      notif.isRead
                          ? Icons.notifications_none
                          : Icons.notifications_active,
                      color: notif.isRead ? Colors.grey : Colors.blue,
                    ),
                    title: Text(
                      notif.message,
                      style: TextStyle(
                        fontWeight: notif.isRead ? FontWeight.normal : FontWeight.bold,
                      ),
                    ),
                    subtitle: Text(
                      _formatDate(notif.createdAt),
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: notif.isRead
                        ? null
                        : IconButton(
                            icon: const Icon(Icons.check, size: 18),
                            onPressed: () => provider.markAsRead(notif.id),
                          ),
                    onTap: () {
                      if (!notif.isRead) provider.markAsRead(notif.id);
                      if (notif.soumissionId != null) {
                        context.push('/soumissions/${notif.soumissionId}');
                      }
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildMenu() {
    return Scaffold(
      appBar: AppBar(title: const Text('Menu')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Column(
              children: [
                _menuItem(Icons.event, 'Congres', () => context.push('/congress')),
                _menuItem(Icons.fact_check, 'Inscription', () => context.push('/congress')),
                _menuItem(Icons.receipt_long, 'Mes inscriptions', () => context.push('/inscriptions')),
                _menuItem(Icons.videocam, 'Sessions virtuelles', () => context.push('/virtual/sessions')),
                _menuItem(Icons.rate_review, 'Mes evaluations', () => context.push('/reviewer/assignments')),
                _menuItem(Icons.person, 'Mon profil', () => context.push('/profile')),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Consumer<AuthProvider>(
            builder: (context, auth, _) => Card(
              child: ListTile(
                leading: const Icon(Icons.logout, color: Colors.red),
                title: const Text('Deconnexion',
                    style: TextStyle(color: Colors.red)),
                onTap: () {
                  auth.logout();
                  context.go('/login');
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _menuItem(IconData icon, String label, VoidCallback onTap) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes} min';
    if (diff.inHours < 24) return 'Il y a ${diff.inHours}h';
    return '${date.day}/${date.month}/${date.year}';
  }
}


