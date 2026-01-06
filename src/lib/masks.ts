// Máscara para CPF
export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  }
  if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  }
  if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  }
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
};

// Validação de CPF
export const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  const digit1 = remainder === 10 ? 0 : remainder;
  
  if (parseInt(numbers[9]) !== digit1) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  const digit2 = remainder === 10 ? 0 : remainder;
  
  return parseInt(numbers[10]) === digit2;
};

// Máscara para telefone brasileiro (celular ou fixo)
export const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 2) {
    return numbers.length ? `(${numbers}` : '';
  }
  if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }
  // Celular com 9 dígitos
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
};

// Máscara para CNPJ
export const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 2) {
    return numbers;
  }
  if (numbers.length <= 5) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  }
  if (numbers.length <= 8) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  }
  if (numbers.length <= 12) {
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  }
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
};

// Validação de CNPJ
export const validateCNPJ = (cnpj: string): boolean => {
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(numbers[12]) !== digit1) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(numbers[13]) === digit2;
};

// Validação de telefone
export const validatePhone = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  return numbers.length >= 10 && numbers.length <= 11;
};

// Máscara para CEP
export const formatCEP = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 5) {
    return numbers;
  }
  return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
};

// Validação de CEP
export const validateCEP = (cep: string): boolean => {
  const numbers = cep.replace(/\D/g, '');
  return numbers.length === 8;
};

// Busca endereço via ViaCEP
export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const fetchAddressByCEP = async (cep: string): Promise<ViaCEPResponse | null> => {
  const numbers = cep.replace(/\D/g, '');
  
  if (numbers.length !== 8) return null;
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
    const data = await response.json();
    
    if (data.erro) return null;
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

// Validação de e-mail
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Remove máscara
export const unmask = (value: string): string => {
  return value.replace(/\D/g, '');
};
