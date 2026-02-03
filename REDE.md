# 🌐 Como Rodar o Projeto em Rede

Este guia explica como configurar o projeto para ser acessado por outros dispositivos na mesma rede local.

## 📋 Pré-requisitos

- Todos os dispositivos devem estar na mesma rede Wi-Fi/Ethernet
- Firewall deve permitir conexões nas portas 3000 (backend) e 5173 (frontend)

## 🚀 Passo a Passo

### 1. Descobrir o IP da sua máquina

Execute no terminal (na raiz do projeto):

```bash
npm run get-ip
```

Ou manualmente:

**Windows:**
```cmd
ipconfig
```
Procure por "Endereço IPv4" (geralmente começa com 192.168.x.x ou 10.x.x.x)

**Linux/Mac:**
```bash
ifconfig
# ou
ip addr show
```

### 2. Iniciar o Backend

```bash
npm run backend
```

O backend estará disponível em:
- Local: `http://localhost:3000`
- Rede: `http://[SEU_IP]:3000`

### 3. Iniciar o Frontend

**Opção 1: Modo normal (já configurado para rede)**
```bash
npm run dev
```

**Opção 2: Modo rede explícito**
```bash
npm run dev:network
```

O frontend estará disponível em:
- Local: `http://localhost:5173`
- Rede: `http://[SEU_IP]:5173`

### 4. Acessar de outros dispositivos

No navegador de outro dispositivo (celular, tablet, outro computador), acesse:

```
http://[SEU_IP]:5173
```

**Exemplo:**
```
http://192.168.1.100:5173
```

## ⚙️ Configurações Avançadas

### Usar IP fixo no frontend

Se quiser que o frontend sempre use um IP específico para o backend, crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://[SEU_IP]:3000/api
```

**Importante:** Substitua `[SEU_IP]` pelo IP real da sua máquina.

### Alterar portas

**Frontend (vite.config.js):**
```js
server: {
  host: '0.0.0.0',
  port: 5173, // Altere aqui
}
```

**Backend (backend/src/server.js):**
```js
const PORT = process.env.PORT || 3000; // Altere aqui ou use variável de ambiente
```

## 🔒 Segurança

⚠️ **Atenção:** Ao rodar em rede, o projeto fica acessível para qualquer dispositivo na mesma rede. Para produção, use:

- Autenticação adequada
- HTTPS
- Firewall configurado
- Variáveis de ambiente para credenciais

## 🐛 Solução de Problemas

### Não consigo acessar de outro dispositivo

1. **Verifique o firewall:**
   - Windows: Permita as portas 3000 e 5173 no Firewall do Windows
   - Linux: `sudo ufw allow 3000` e `sudo ufw allow 5173`

2. **Verifique se está na mesma rede:**
   - Todos os dispositivos devem estar no mesmo Wi-Fi/Ethernet

3. **Verifique o IP:**
   - Execute `npm run get-ip` novamente
   - Certifique-se de usar o IP correto

4. **Teste a conectividade:**
   - Do outro dispositivo, tente acessar `http://[SEU_IP]:3000/api/health`
   - Deve retornar: `{"status":"OK","message":"API funcionando"}`

### Erro de CORS

O backend já está configurado com CORS habilitado. Se ainda tiver problemas, verifique `backend/src/server.js`.

### Proxy não funciona

O Vite usa proxy automático. Se precisar configurar manualmente, edite `vite.config.js`.

## 📱 Testando no Celular

1. Certifique-se de que o celular está na mesma rede Wi-Fi
2. Descubra o IP da máquina: `npm run get-ip`
3. No navegador do celular, acesse: `http://[SEU_IP]:5173`

## 💡 Dicas

- Use um IP fixo na sua máquina para facilitar o acesso
- Anote o IP em um lugar de fácil acesso
- Considere usar um serviço como ngrok para acesso externo (apenas para desenvolvimento)
