class Inscription {
  final int id;
  final String userId;
  final String congressId;
  final CongressInfo? congress;
  final String nom;
  final String prenom;
  final String email;
  final String telephone;
  final String? organisme;
  final String pays;
  final String tariffLabel;
  final String participationType;
  final double montant;
  final String methodePaiement;
  final String numeroFacture;
  final String? transactionId;
  final String paymentStatus;
  final DateTime createdAt;

  Inscription({
    required this.id,
    required this.userId,
    required this.congressId,
    this.congress,
    required this.nom,
    required this.prenom,
    required this.email,
    required this.telephone,
    this.organisme,
    required this.pays,
    required this.tariffLabel,
    required this.participationType,
    required this.montant,
    required this.methodePaiement,
    required this.numeroFacture,
    this.transactionId,
    required this.paymentStatus,
    required this.createdAt,
  });

  String get fullName => '$prenom $nom';
  bool get isConfirmed => paymentStatus == 'confirmed';
  bool get isPending => paymentStatus == 'pending';

  factory Inscription.fromJson(Map<String, dynamic> json) {
    CongressInfo? congress;
    if (json['congress'] != null && json['congress'] is Map) {
      congress = CongressInfo.fromJson(json['congress'] as Map<String, dynamic>);
    } else {
      congress = null;
    }

    return Inscription(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id']?.toString() ?? '0') ?? 0,
      userId: json['user_id']?.toString() ?? '',
      congressId: json['congress_id']?.toString() ?? '',
      congress: congress,
      nom: json['nom']?.toString() ?? '',
      prenom: json['prenom']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      telephone: json['telephone']?.toString() ?? '',
      organisme: json['organisme']?.toString(),
      pays: json['pays']?.toString() ?? '',
      tariffLabel: json['tariff_label']?.toString() ?? '',
      participationType: json['participation_type']?.toString() ?? '',
      montant: (json['montant'] is num ? (json['montant'] as num).toDouble() : double.tryParse(json['montant']?.toString() ?? '0') ?? 0),
      methodePaiement: json['methode_paiement']?.toString() ?? '',
      numeroFacture: json['numero_facture']?.toString() ?? '',
      transactionId: json['transaction_id']?.toString(),
      paymentStatus: json['payment_status']?.toString() ?? 'pending',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class CongressInfo {
  final String id;
  final String title;
  final String? subtitle;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? location;
  final String? city;
  final String? country;

  CongressInfo({
    required this.id,
    required this.title,
    this.subtitle,
    this.startDate,
    this.endDate,
    this.location,
    this.city,
    this.country,
  });

  String get dateRange {
    if (startDate == null || endDate == null) return '';
    return '${_fmt(startDate!)} - ${_fmt(endDate!)}';
  }

  static String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  factory CongressInfo.fromJson(Map<String, dynamic> json) {
    return CongressInfo(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      subtitle: json['subtitle']?.toString(),
      startDate: json['start_date'] != null
          ? DateTime.tryParse(json['start_date'].toString())
          : null,
      endDate: json['end_date'] != null
          ? DateTime.tryParse(json['end_date'].toString())
          : null,
      location: json['location']?.toString(),
      city: json['city']?.toString(),
      country: json['country']?.toString(),
    );
  }
}
