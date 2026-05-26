class User {
  final String id;
  final String civilite;
  final String nom;
  final String prenom;
  final String sexe;
  final String telephone;
  final String? adresse;
  final String? profession;
  final String? organisme;
  final String? biographie;
  final String email;
  final String role;

  User({
    required this.id,
    required this.civilite,
    required this.nom,
    required this.prenom,
    required this.sexe,
    required this.telephone,
    this.adresse,
    this.profession,
    this.organisme,
    this.biographie,
    required this.email,
    required this.role,
  });

  String get fullName => '$prenom $nom';
  String get displayName => '$civilite $prenom $nom';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id']?.toString() ?? '',
      civilite: json['civilite']?.toString() ?? '',
      nom: json['nom']?.toString() ?? '',
      prenom: json['prenom']?.toString() ?? '',
      sexe: json['sexe']?.toString() ?? '',
      telephone: json['telephone']?.toString() ?? '',
      adresse: json['adresse']?.toString(),
      profession: json['profession']?.toString(),
      organisme: json['organisme']?.toString(),
      biographie: json['biographie']?.toString(),
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'civilite': civilite,
      'nom': nom,
      'prenom': prenom,
      'sexe': sexe,
      'telephone': telephone,
      if (adresse != null) 'adresse': adresse,
      if (profession != null) 'profession': profession,
      if (organisme != null) 'organisme': organisme,
      if (biographie != null) 'biographie': biographie,
      'email': email,
      'role': role,
    };
  }

  User copyWith({
    String? id,
    String? civilite,
    String? nom,
    String? prenom,
    String? sexe,
    String? telephone,
    String? adresse,
    String? profession,
    String? organisme,
    String? biographie,
    String? email,
    String? role,
  }) {
    return User(
      id: id ?? this.id,
      civilite: civilite ?? this.civilite,
      nom: nom ?? this.nom,
      prenom: prenom ?? this.prenom,
      sexe: sexe ?? this.sexe,
      telephone: telephone ?? this.telephone,
      adresse: adresse ?? this.adresse,
      profession: profession ?? this.profession,
      organisme: organisme ?? this.organisme,
      biographie: biographie ?? this.biographie,
      email: email ?? this.email,
      role: role ?? this.role,
    );
  }
}
