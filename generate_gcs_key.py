import json
import base64
import os

# --- INSTRUÇÕES DE USO ---
# 1. Salve este código como, por exemplo, 'generate_gcs_key.py'.
# 2. Certifique-se de que o arquivo JSON da sua conta de serviço do Google Cloud
#    (por exemplo, 'limpeja-run-sa-key.json') esteja no mesmo diretório
#    deste script, ou forneça o caminho completo para ele.
# 3. Execute o script no seu terminal: python generate_gcs_key.py
# 4. O script irá imprimir a linha completa que você deve copiar e colar
#    no seu arquivo '.env'.
# --- FIM DAS INSTRUÇÕES ---

# Substitua 'limpeja-run-sa-key.json' pelo nome exato do seu arquivo JSON
# Se o arquivo não estiver no mesmo diretório, forneça o caminho completo:
# Ex: json_file_path = '/caminho/completo/para/seu/limpeja-run-sa-key.json'
json_file_path = 'limpeja-run-sa-key.json' # Assumindo que está na raiz do seu projeto ou no mesmo dir do script

print(f"Tentando ler o arquivo JSON da conta de serviço: {json_file_path}")

try:
    with open(json_file_path, 'r', encoding='utf-8') as f:
        service_account_data = json.load(f) # Carrega o JSON em um objeto Python

    # Converte o objeto Python de volta para uma string JSON compacta (single-line).
    # json.dumps() garantirá que todas as quebras de linha dentro das strings (como private_key)
    # sejam corretamente escapadas como \\n.
    json_string_for_env = json.dumps(service_account_data)

    # Base64 codifica a string JSON compacta.
    base64_encoded_key = base64.b64encode(json_string_for_env.encode('utf-8')).decode('utf-8')

    print("\n--- COPIE A LINHA ABAIXO E COLE NO SEU ARQUIVO .ENV ---")
    print(f"GCS_KEY={base64_encoded_key}")
    print("-------------------------------------------------------\n")
    print("Sucesso! A chave GCS_KEY foi gerada. Cole-a no seu .env e reinicie a aplicação NestJS.")

except FileNotFoundError:
    print(f"ERRO: Arquivo não encontrado em '{json_file_path}'.")
    print("Por favor, verifique se o arquivo JSON está no diretório correto ou se o caminho está correto.")
    print("O nome do arquivo na imagem é 'limpeja-run-sa-key.json'.")
except json.JSONDecodeError as e:
    print(f"ERRO: O arquivo '{json_file_path}' não é um JSON válido. Detalhes: {e}")
    print("Verifique o conteúdo do seu arquivo JSON para garantir que ele esteja bem formatado.")
except Exception as e:
    print(f"Ocorreu um erro inesperado: {e}")