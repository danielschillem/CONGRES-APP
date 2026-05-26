class Validators {
  // Email
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'L\'adresse email est requise.';
    }
    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Veuillez saisir une adresse email valide.';
    }
    return null;
  }

  // Password
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Le mot de passe est requis.';
    }
    if (value.length < 6) {
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    }
    return null;
  }

  // Password confirmation
  static String? Function(String?) passwordConfirm(String original) {
    return (String? value) {
      if (value == null || value.isEmpty) {
        return 'La confirmation du mot de passe est requise.';
      }
      if (value != original) {
        return 'Les mots de passe ne correspondent pas.';
      }
      return null;
    };
  }

  // Required field
  static String? Function(String?) required(String fieldName) {
    return (String? value) {
      if (value == null || value.trim().isEmpty) {
        return '$fieldName est requis(e).';
      }
      return null;
    };
  }

  // Telephone (Algeria / North Africa format)
  // Must be 10 digits starting with 0, and second digit: 5, 6, or 7
  static String? telephone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Le numéro de téléphone est requis.';
    }
    final cleaned = value.trim().replaceAll(RegExp(r'\s+'), '');
    final phoneRegex = RegExp(r'^0[5-7]\d{8}$');
    if (!phoneRegex.hasMatch(cleaned)) {
      return 'Numéro invalide. Format attendu: 0X XXXXXXXX (X=5,6,7).';
    }
    return null;
  }

  // Nom / Prénom (letters only, min 2 chars)
  static String? nom(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Ce champ est requis.';
    }
    if (value.trim().length < 2) {
      return 'Ce champ doit contenir au moins 2 caractères.';
    }
    return null;
  }

  // Resume (max 1000 chars)
  static String? resume(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Le résumé est requis.';
    }
    if (value.trim().length > 1000) {
      return 'Le résumé ne doit pas dépasser 1000 caractères.';
    }
    return null;
  }

  // Generic text with min length
  static String? Function(String?) minLength(String fieldName, int min) {
    return (String? value) {
      if (value == null || value.trim().isEmpty) {
        return '$fieldName est requis(e).';
      }
      if (value.trim().length < min) {
        return '$fieldName doit contenir au moins $min caractères.';
      }
      return null;
    };
  }

  // Dropdown selection
  static String? dropdown(String? value, String fieldName) {
    if (value == null || value.isEmpty) {
      return 'Veuillez sélectionner $fieldName.';
    }
    return null;
  }
}
