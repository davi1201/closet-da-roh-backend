export function toTitleCase(val) {
  if (typeof val !== 'string' || !val) {
    return val;
  }

  // 1. Coloca tudo em minúsculo
  // 2. Quebra a string em palavras (pelo espaço)
  // 3. Mapeia cada palavra para (PrimeiraLetraMaiúscula + resto)
  // 4. Junta as palavras de volta com espaço
  return val
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function normalizeString(val) {
  if (!val || typeof val !== 'string') {
    return val;
  }
  return val.replace(/\D/g, ''); // RegEx que remove não-dígitos
}
