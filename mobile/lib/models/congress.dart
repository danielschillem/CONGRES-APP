class Congress {
  final String id;
  final String title;
  final String? subtitle;
  final String? description;
  final String? edition;
  final DateTime startDate;
  final DateTime endDate;
  final String location;
  final String? city;
  final String? country;
  final String status;
  final bool attestationsAvailable;
  final Map<String, dynamic>? config;

  Congress({
    required this.id,
    required this.title,
    this.subtitle,
    this.description,
    this.edition,
    required this.startDate,
    required this.endDate,
    required this.location,
    this.city,
    this.country,
    required this.status,
    required this.attestationsAvailable,
    this.config,
  });

  String get dateRange =>
      '${_fmt(startDate)} - ${_fmt(endDate)}';
  String get fullLocation =>
      [location, city, country].where((e) => e != null && e.isNotEmpty).join(', ');

  static String _fmt(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  bool get isActive => status == 'active';

  factory Congress.fromJson(Map<String, dynamic> json) {
    return Congress(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      subtitle: json['subtitle']?.toString(),
      description: json['description']?.toString(),
      edition: json['edition']?.toString(),
      startDate: json['start_date'] != null
          ? DateTime.tryParse(json['start_date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      endDate: json['end_date'] != null
          ? DateTime.tryParse(json['end_date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      location: json['location']?.toString() ?? '',
      city: json['city']?.toString(),
      country: json['country']?.toString(),
      status: json['status']?.toString() ?? 'draft',
      attestationsAvailable: json['attestations_available'] == true,
      config: json['config'] is Map ? json['config'] as Map<String, dynamic>? : null,
    );
  }
}
