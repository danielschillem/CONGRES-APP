import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/virtual_session_provider.dart';
import '../../providers/congress_provider.dart';

class VirtualSessionsScreen extends StatefulWidget {
  const VirtualSessionsScreen({super.key});

  @override
  State<VirtualSessionsScreen> createState() => _VirtualSessionsScreenState();
}

class _VirtualSessionsScreenState extends State<VirtualSessionsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadSessions();
    });
  }

  void _loadSessions() {
    final congressProvider = context.read<CongressProvider>();
    if (congressProvider.selectedCongress != null) {
      context.read<VirtualSessionProvider>().loadSessions(
        congressProvider.selectedCongress!.id,
      );
    }
    context.read<VirtualSessionProvider>().loadMyUpcomingSessions();
  }

  @override
  Widget build(BuildContext context) {
    final timeFmt = DateFormat('HH:mm');
    final dateFmt = DateFormat('dd/MM/yyyy');

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Sessions virtuelles'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Disponibles'),
              Tab(text: 'Mes sessions'),
            ],
          ),
        ),
        body: Consumer<VirtualSessionProvider>(
          builder: (context, provider, _) {
            if (provider.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            return TabBarView(
              children: [
                _buildSessionList(
                  provider.sessions,
                  timeFmt,
                  dateFmt,
                  provider,
                ),
                _buildSessionList(
                  provider.mySessions,
                  timeFmt,
                  dateFmt,
                  provider,
                  showLeave: true,
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildSessionList(
    List sessions,
    DateFormat timeFmt,
    DateFormat dateFmt,
    VirtualSessionProvider provider, {
    bool showLeave = false,
  }) {
    if (sessions.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.videocam_off, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('Aucune session disponible'),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async => _loadSessions(),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: sessions.length,
        itemBuilder: (context, index) {
          final session = sessions[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          session.title,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      _statusChip(session.status),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.schedule, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        '${dateFmt.format(session.startTime)} ${timeFmt.format(session.startTime)} - ${timeFmt.format(session.endTime)}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.videocam, size: 14, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(session.roomName,
                          style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (showLeave)
                        OutlinedButton.icon(
                          onPressed: () => provider.leaveSession(session.id),
                          icon: const Icon(Icons.exit_to_app, size: 16),
                          label: const Text('Quitter'),
                        )
                      else
                        ElevatedButton.icon(
                          onPressed: session.isLive
                              ? () => provider.joinSession(session.id)
                              : null,
                          icon: const Icon(Icons.video_call, size: 16),
                          label: Text(session.isLive ? 'Rejoindre' : 'A venir'),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _statusChip(String status) {
    Color color;
    String label;
    switch (status) {
      case 'live':
        color = Colors.green;
        label = 'En direct';
        break;
      case 'scheduled':
        color = Colors.blue;
        label = 'Planifie';
        break;
      case 'ended':
        color = Colors.grey;
        label = 'Termine';
        break;
      default:
        color = Colors.grey;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: color),
      ),
    );
  }
}
