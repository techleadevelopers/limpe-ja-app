import os
from dotenv import load_dotenv
from twilio.rest import Client
import time

# 1. Carrega as variáveis de ambiente do arquivo .env
# Certifique-se de que seu arquivo .env está na raiz do projeto
# ou no diretório de onde você está executando este script.
load_dotenv()

# 2. Suas credenciais Twilio, agora lidas das variáveis de ambiente
TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
# TWILIO_VERIFY_SERVICE_SID = os.getenv('TWILIO_VERIFY_SERVICE_SID')
# O TWILIO_VERIFY_SERVICE_SID é usado para o serviço de verificação do Twilio,
# mas não diretamente para listar mensagens SMS como esta função faz.

# Verifica se as credenciais foram carregadas
if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
    raise ValueError("As variáveis de ambiente TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN não foram carregadas. Verifique seu arquivo .env.")

# 3. Inicializa o cliente Twilio com as credenciais do .env
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

def get_latest_otp(phone_number_to_check: str) -> str | None:
    """
    Busca o código OTP mais recente enviado para um número de telefone específico
    nos logs do Twilio.

    Args:
        phone_number_to_check (str): O número de telefone que recebeu o OTP.
                                     Ex: "19994647291"

    Returns:
        str: O código OTP se encontrado, caso contrário None.
    """
    print(f"Aguardando e buscando OTP para o número: {phone_number_to_check}...")
    # Espera um pouco para a mensagem chegar. Ajuste conforme a latência do Twilio.
    # Pode ser necessário aumentar este tempo ou implementar uma lógica de retentativas.
    time.sleep(5)

    try:
        # Busca mensagens enviadas PARA o número especificado.
        # O 'date_sent_after' ajuda a filtrar mensagens recentes para maior eficiência.
        messages = client.messages.list(
            to=phone_number_to_check,
            date_sent_after=time.time() - 60 # Busca mensagens dos últimos 60 segundos
        )

        for message in messages:
            # Assumindo que o OTP está no corpo da mensagem, e você sabe o formato.
            # Adapte esta lógica de parsing conforme o formato exato da sua mensagem OTP.
            # Ex: "Seu código LimpeJa é: 123456"
            print(f"Mensagem recebida (corpo): {message.body}")
            if "Seu código LimpeJa é:" in message.body:
                otp = message.body.split("Seu código LimpeJa é:")[1].strip()
                # Validação básica para garantir que é um número
                if otp.isdigit():
                    return otp
    except Exception as e:
        print(f"Erro ao buscar mensagens do Twilio: {e}")
        return None
    
    return None

# --- Exemplo de uso no seu teste E2E ---
# Este é o número de telefone do seu celular de teste (o que recebe o OTP).
# Você pode passá-lo diretamente ou carregá-lo de outra variável de ambiente se for fixo.
TEST_USER_PHONE_NUMBER = "19994647291" 

# 1. Primeiro, você faria a requisição para o seu backend para solicitar o OTP.
#    Esta parte não está incluída aqui, pois é uma chamada HTTP para sua API.
#    Exemplo conceitual:
#    response = requests.post("SUA_URL_DO_BACKEND/auth/send-otp", json={"phone": TEST_USER_PHONE_NUMBER})
#    if response.status_code == 200:
#        print("Solicitação de OTP enviada com sucesso para o backend.")
#    else:
#        print(f"Erro ao solicitar OTP: {response.status_code} - {response.text}")
#        exit()

# 2. Em seguida, você chamaria a função para obter o OTP do Twilio.
otp_code = get_latest_otp(TEST_USER_PHONE_NUMBER)

if otp_code:
    print(f"OTP recebido com sucesso: {otp_code}")
    # 3. Agora, você usaria este OTP para verificar no seu backend.
    #    Esta parte também é uma chamada HTTP para sua API.
    #    Exemplo conceitual:
    #    response = requests.post("SUA_URL_DO_BACKEND/auth/verify-otp", json={"firebaseIdToken": "TOKEN_GERADO_PELO_FIREBASE_COM_ESTE_OTP"})
    #    if response.status_code == 200:
    #        print("Login com OTP verificado com sucesso!")
    #    else:
    #        print(f"Erro na verificação do OTP: {response.status_code} - {response.text}")
else:
    print("Não foi possível obter o OTP a tempo. Verifique se o SMS chegou no celular e se o formato da mensagem está correto na função 'get_latest_otp'.")
    # raise Exception("OTP não recebido a tempo!") # Descomente para falhar o teste se o OTP não for encontrado