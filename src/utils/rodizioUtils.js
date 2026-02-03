/**
 * Calcula o dia de rodízio baseado na placa do veículo
 * Regra do DETRAN: baseada no último dígito da placa
 * @param {string} placa - Placa do veículo (formato ABC-1234 ou ABC1234)
 * @returns {object} Objeto com dia da semana e informações
 */
export function calcularDiaRodizio(placa) {
  if (!placa) {
    return {
      dia: null,
      diaNome: 'Não informado',
      aviso: false
    };
  }

  // Remover hífen e espaços, converter para maiúsculo
  const placaLimpa = placa.replace(/[-\s]/g, '').toUpperCase();
  
  // Pegar o último dígito numérico da placa
  const ultimoDigito = placaLimpa.match(/\d/g);
  
  if (!ultimoDigito || ultimoDigito.length === 0) {
    return {
      dia: null,
      diaNome: 'Placa inválida',
      aviso: false
    };
  }

  const digito = parseInt(ultimoDigito[ultimoDigito.length - 1]);

  // Regra do rodízio segundo DETRAN:
  // 1 e 2: Segunda-feira
  // 3 e 4: Terça-feira
  // 5 e 6: Quarta-feira
  // 7 e 8: Quinta-feira
  // 9 e 0: Sexta-feira
  const diasRodizio = {
    1: { nome: 'Segunda-feira', numero: 1 },
    2: { nome: 'Segunda-feira', numero: 1 },
    3: { nome: 'Terça-feira', numero: 2 },
    4: { nome: 'Terça-feira', numero: 2 },
    5: { nome: 'Quarta-feira', numero: 3 },
    6: { nome: 'Quarta-feira', numero: 3 },
    7: { nome: 'Quinta-feira', numero: 4 },
    8: { nome: 'Quinta-feira', numero: 4 },
    9: { nome: 'Sexta-feira', numero: 5 },
    0: { nome: 'Sexta-feira', numero: 5 }
  };

  const diaInfo = diasRodizio[digito];

  // Verificar se hoje é o dia de rodízio
  const hoje = new Date();
  const diaSemanaHoje = hoje.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  const aviso = diaSemanaHoje === diaInfo.numero;

  return {
    dia: diaInfo.numero,
    diaNome: diaInfo.nome,
    digito: digito,
    aviso: aviso
  };
}

/**
 * Verifica se hoje é dia de rodízio para a placa
 * @param {string} placa - Placa do veículo
 * @returns {boolean} True se hoje é dia de rodízio
 */
export function isRodizioHoje(placa) {
  const rodizio = calcularDiaRodizio(placa);
  return rodizio.aviso;
}

/**
 * Retorna a cor do aviso baseado no dia de rodízio
 * @param {object} rodizioInfo - Informações do rodízio
 * @returns {string} Classe CSS para o aviso
 */
export function getRodizioAvisoClass(rodizioInfo) {
  if (!rodizioInfo || !rodizioInfo.aviso) {
    return '';
  }
  return 'rodizio-hoje';
}
