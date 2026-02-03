// Script para descobrir o IP local da máquina
import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Ignora endereços internos (não IPv4) e não endereços locais
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  
  return 'localhost';
}

const ip = getLocalIP();
console.log('\n🌐 IP da sua máquina na rede:');
console.log(`   ${ip}\n`);
console.log('📱 Para acessar de outros dispositivos na mesma rede:');
console.log(`   Frontend: http://${ip}:5173`);
console.log(`   Backend:  http://${ip}:3000\n`);
