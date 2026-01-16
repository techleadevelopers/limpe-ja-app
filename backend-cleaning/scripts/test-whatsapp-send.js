#!/usr/bin/env node
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const baseUrl = process.env.ZAPI_BASE_URL;
const token = process.env.ZAPI_TOKEN;

if (!baseUrl) {
  console.error('ZAPI_BASE_URL não está definido.');
  process.exit(1);
}

if (!token) {
  console.error('ZAPI_TOKEN não está definido. Defina para autenticar a chamada.');
  process.exit(1);
}

const phone = '5519993223932';
const message =
  '🚀 LimpeJá & BlueCoder: Integração com Z-API concluída com sucesso! Sistema pronto para o lançamento.';

(async () => {
  try {
    const response = await axios.post(
      `${baseUrl}/send-text`,
      {
        phone,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('Mensagem enviada:', response.data);
  } catch (error) {
    console.error('Falha no envio de teste via Z-API:', error.message || error);
    process.exit(1);
  }
})();
