import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../config/app_config.dart';
import '../../providers/auth_provider.dart';
import '../../providers/soumission_provider.dart';
import '../../utils/validators.dart';
import '../../widgets/custom_text_field.dart';
import '../../widgets/custom_button.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isEditing = false;

  // Controllers
  late TextEditingController _nomController;
  late TextEditingController _prenomController;
  late TextEditingController _telephoneController;
  late TextEditingController _organismeController;
  late TextEditingController _professionController;
  late TextEditingController _biographieController;

  String? _selectedCivilite;
  String? _selectedSexe;

  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _initControllers();
  }

  void _initControllers() {
    final user = context.read<AuthProvider>().user;
    _nomController = TextEditingController(text: user?.nom ?? '');
    _prenomController = TextEditingController(text: user?.prenom ?? '');
    _telephoneController = TextEditingController(text: user?.telephone ?? '');
    _organismeController = TextEditingController(text: user?.organisme ?? '');
    _professionController = TextEditingController(text: user?.profession ?? '');
    _biographieController = TextEditingController(text: user?.biographie ?? '');
    _selectedCivilite = user?.civilite;
    _selectedSexe = user?.sexe;
  }

  @override
  void dispose() {
    _nomController.dispose();
    _prenomController.dispose();
    _telephoneController.dispose();
    _organismeController.dispose();
    _professionController.dispose();
    _biographieController.dispose();
    super.dispose();
  }

  void _cancelEdit() {
    setState(() {
      _isEditing = false;
      _initControllers();
    });
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();
    final data = <String, dynamic>{
      'civilite': _selectedCivilite,
      'nom': _nomController.text.trim(),
      'prenom': _prenomController.text.trim(),
      'sexe': _selectedSexe,
      'telephone': _telephoneController.text.trim(),
      if (_organismeController.text.trim().isNotEmpty)
        'organisme': _organismeController.text.trim(),
      if (_professionController.text.trim().isNotEmpty)
        'profession': _professionController.text.trim(),
      if (_biographieController.text.trim().isNotEmpty)
        'biographie': _biographieController.text.trim(),
    };

    final success = await authProvider.updateProfile(data);
    if (!mounted) return;

    if (success) {
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Profil mis à jour avec succès.'),
          backgroundColor: Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              authProvider.errorMessage ?? 'Erreur lors de la mise à jour.'),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text('Se déconnecter'),
        content: const Text(
          'Êtes-vous sûr de vouloir vous déconnecter?\nVous devrez vous reconnecter pour accéder à l\'application.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (mounted) {
                context.go('/login');
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            child: const Text('Se déconnecter'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          'Mon profil',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Modifier le profil',
              onPressed: () => setState(() => _isEditing = true),
            )
          else ...[
            TextButton(
              onPressed: _cancelEdit,
              child: const Text('Annuler'),
            ),
          ],
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          final user = authProvider.user;
          if (user == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            child: Column(
              children: [
                // Profile header
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      // Avatar
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF3B82F6), Color(0xFF6366F1)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF3B82F6).withValues(alpha: 0.3),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Center(
                          child: Text(
                            user.prenom.isNotEmpty
                                ? user.prenom[0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        user.displayName,
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user.email,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          user.role == 'admin' ? 'Administrateur' : 'Utilisateur',
                          style: const TextStyle(
                            color: Color(0xFF3B82F6),
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Stats row
                _StatsRow(),

                const SizedBox(height: 12),

                // Edit form or display view
                if (_isEditing)
                  _EditForm(
                    formKey: _formKey,
                    nomController: _nomController,
                    prenomController: _prenomController,
                    telephoneController: _telephoneController,
                    organismeController: _organismeController,
                    professionController: _professionController,
                    biographieController: _biographieController,
                    selectedCivilite: _selectedCivilite,
                    selectedSexe: _selectedSexe,
                    onCiviliteChanged: (v) =>
                        setState(() => _selectedCivilite = v),
                    onSexeChanged: (v) => setState(() => _selectedSexe = v),
                    onSave: _saveProfile,
                    isLoading: authProvider.isLoading,
                  )
                else
                  _ProfileView(user: user),

                const SizedBox(height: 16),

                // Logout button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: CustomButton(
                    label: 'Se déconnecter',
                    outlined: true,
                    color: const Color(0xFFEF4444),
                    textColor: const Color(0xFFEF4444),
                    icon: Icons.logout,
                    onPressed: _showLogoutDialog,
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<SoumissionProvider>(
      builder: (context, provider, _) {
        return Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          margin: const EdgeInsets.only(top: 8),
          child: Row(
            children: [
              _StatItem(label: 'Total', value: provider.total),
              _VerticalDivider(),
              _StatItem(label: 'Approuvées',
                value: provider.soumissions
                    .where((s) => s.isApprouvee)
                    .length),
              _VerticalDivider(),
              _StatItem(label: 'En attente',
                value: provider.soumissions
                    .where((s) => s.isEnAttente)
                    .length),
              _VerticalDivider(),
              _StatItem(label: 'Rejetées',
                value: provider.soumissions
                    .where((s) => s.isRejetee)
                    .length),
            ],
          ),
        );
      },
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final int value;

  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Column(
        children: [
          Text(
            value.toString(),
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
            ),
          ),
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1,
      height: 40,
      color: Colors.grey.withValues(alpha: 0.2),
    );
  }
}

class _ProfileView extends StatelessWidget {
  final dynamic user;
  const _ProfileView({required this.user});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Card(
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              _InfoRow(
                icon: Icons.badge_outlined,
                label: 'Civilité',
                value: user.civilite,
              ),
              _InfoRow(
                icon: Icons.person_outline,
                label: 'Nom complet',
                value: user.fullName,
              ),
              _InfoRow(
                icon: Icons.wc_outlined,
                label: 'Sexe',
                value: user.sexe,
              ),
              _InfoRow(
                icon: Icons.phone_outlined,
                label: 'Téléphone',
                value: user.telephone,
              ),
              if (user.organisme != null && user.organisme!.isNotEmpty)
                _InfoRow(
                  icon: Icons.business_outlined,
                  label: 'Organisme',
                  value: user.organisme!,
                ),
              if (user.profession != null && user.profession!.isNotEmpty)
                _InfoRow(
                  icon: Icons.work_outline,
                  label: 'Profession',
                  value: user.profession!,
                ),
              if (user.biographie != null && user.biographie!.isNotEmpty)
                _InfoRow(
                  icon: Icons.info_outline,
                  label: 'Biographie',
                  value: user.biographie!,
                  isLast: true,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool isLast;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              Icon(icon, size: 20, color: theme.colorScheme.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      value,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        if (!isLast)
          Divider(
            height: 1,
            color: theme.colorScheme.outline.withValues(alpha: 0.15),
          ),
      ],
    );
  }
}

class _EditForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController nomController;
  final TextEditingController prenomController;
  final TextEditingController telephoneController;
  final TextEditingController organismeController;
  final TextEditingController professionController;
  final TextEditingController biographieController;
  final String? selectedCivilite;
  final String? selectedSexe;
  final void Function(String?) onCiviliteChanged;
  final void Function(String?) onSexeChanged;
  final VoidCallback onSave;
  final bool isLoading;

  const _EditForm({
    required this.formKey,
    required this.nomController,
    required this.prenomController,
    required this.telephoneController,
    required this.organismeController,
    required this.professionController,
    required this.biographieController,
    required this.selectedCivilite,
    required this.selectedSexe,
    required this.onCiviliteChanged,
    required this.onSexeChanged,
    required this.onSave,
    required this.isLoading,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Form(
        key: formKey,
        child: Card(
          elevation: 1,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Modifier mes informations',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 16),

                // Civilité
                DropdownButtonFormField<String>(
                  value: selectedCivilite,
                  decoration: InputDecoration(
                    labelText: 'Civilité *',
                    prefixIcon: const Icon(Icons.badge_outlined),
                    filled: true,
                    fillColor: theme.colorScheme.surfaceContainerHighest
                        .withValues(alpha: 0.3),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                          color:
                              theme.colorScheme.outline.withValues(alpha: 0.5)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:
                          BorderSide(color: theme.colorScheme.primary, width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                  ),
                  items: AppConfig.civilites
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: onCiviliteChanged,
                  validator: (v) => Validators.dropdown(v, 'la civilité'),
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: prenomController,
                  label: 'Prénom *',
                  validator: Validators.nom,
                  prefixIcon: const Icon(Icons.person_outline),
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: nomController,
                  label: 'Nom *',
                  validator: Validators.nom,
                  prefixIcon: const Icon(Icons.person_outline),
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),

                // Sexe
                DropdownButtonFormField<String>(
                  value: selectedSexe,
                  decoration: InputDecoration(
                    labelText: 'Sexe *',
                    prefixIcon: const Icon(Icons.wc_outlined),
                    filled: true,
                    fillColor: theme.colorScheme.surfaceContainerHighest
                        .withValues(alpha: 0.3),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                          color:
                              theme.colorScheme.outline.withValues(alpha: 0.5)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide:
                          BorderSide(color: theme.colorScheme.primary, width: 2),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                  ),
                  items: AppConfig.sexes
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: onSexeChanged,
                  validator: (v) => Validators.dropdown(v, 'le sexe'),
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: telephoneController,
                  label: 'Téléphone *',
                  keyboardType: TextInputType.phone,
                  validator: Validators.telephone,
                  prefixIcon: const Icon(Icons.phone_outlined),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: organismeController,
                  label: 'Organisme',
                  prefixIcon: const Icon(Icons.business_outlined),
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: professionController,
                  label: 'Profession',
                  prefixIcon: const Icon(Icons.work_outline),
                  textCapitalization: TextCapitalization.sentences,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: biographieController,
                  label: 'Biographie',
                  maxLines: 3,
                  prefixIcon: const Icon(Icons.info_outline),
                  textCapitalization: TextCapitalization.sentences,
                  textInputAction: TextInputAction.done,
                ),
                const SizedBox(height: 20),

                CustomButton(
                  label: 'Enregistrer',
                  isLoading: isLoading,
                  onPressed: onSave,
                  icon: Icons.save_outlined,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
