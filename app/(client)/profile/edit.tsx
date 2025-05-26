// LimpeJaApp/app/(client)/profile/edit.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth'; // Ajuste o caminho se 'hooks' estiver na raiz
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// import * as ImagePicker from 'expo-image-picker'; // Descomente quando for implementar o upload
// import { updateClientProfile } from '../../../services/clientService'; // Descomente para API real

// Supondo que o tipo User no AuthContext possa ter avatarUrl
// interface User {
//   // ... outros campos
//   avatarUrl?: string;
// }

export default function EditClientProfileScreen() {
  const { user, updateUser } = useAuth(); // Removido 'tokens' se não for usado diretamente aqui
  const router = useRouter();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || ''); // Email geralmente não é editável
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null); // Supondo que user.avatarUrl exista
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarUri(user.avatarUrl || null); // Atualiza se o avatar no contexto mudar
    }
  }, [user]);

  const handlePickImage = async () => {
    Alert.alert("Upload de Foto", "Funcionalidade de upload de foto a ser implementada.");
    // TODO: Implementar lógica de upload de imagem com expo-image-picker
    // 1. Pedir permissão: await ImagePicker.requestMediaLibraryPermissionsAsync();
    // 2. Abrir galeria: let result = await ImagePicker.launchImageLibraryAsync({...});
    // 3. Se não cancelado, setAvatarUri(result.assets[0].uri) e preparar para upload.
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      Alert.alert("Nome Inválido", "O nome não pode estar vazio.");
      return;
    }
    // TODO: Adicionar mais validações (telefone, etc.) se necessário

    setIsLoading(true);
    console.log("[EditProfile] Salvando alterações:", { name, phone, avatarUri });

    // TODO: Implementar chamada real ao clientService para atualizar o perfil
    // try {
    //   const profileDataToUpdate: Partial<User> = { name, phone };
    //   if (avatarUri && avatarUri !== user?.avatarUrl) { // Se o avatar mudou
    //     // profileDataToUpdate.avatarUrl = await uploadImageFunction(avatarUri); // Função para fazer upload e retornar URL
    //   }
    //   const updatedUser = await updateClientProfile(profileDataToUpdate);
    //   updateUser(updatedUser); // Atualiza o AuthContext com o usuário retornado pela API
    //   Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    //   router.back();
    // } catch (error: any) {
    //   Alert.alert("Erro ao Atualizar", error.message || "Não foi possível atualizar o perfil.");
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulação de sucesso
    setTimeout(() => {
      updateUser({ name, phone, avatarUrl: avatarUri }); // Atualiza o AuthContext com os dados locais
      Alert.alert("Sucesso! (Simulado)", "Perfil atualizado!");
      setIsLoading(false);
      router.back();
    }, 1500);
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Editar Meu Perfil' }} />
      
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle-outline" size={80} color="#CED4DA" />
            </View>
          )}
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePickImage}>
            <Text style={styles.changePhotoButtonText}>Alterar Foto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Nome Completo</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome como aparecerá no app"
            placeholderTextColor="#ADB5BD"
          />
        </View>

        <Text style={styles.label}>Email</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            editable={false} // Email geralmente não é editável
            placeholderTextColor="#ADB5BD"
          />
        </View>
        
        <Text style={styles.label}>Telefone</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="(XX) XXXXX-XXXX"
            placeholderTextColor="#ADB5BD"
            keyboardType="phone-pad"
            maxLength={15} // (XX) 9XXXX-XXXX
          />
        </View>
      </View>

      <TouchableOpacity style={styles.linkButton} onPress={() => Alert.alert("Alterar Senha", "Navegar para tela de alterar senha.") /* TODO: router.push('/(client)/profile/change-password'); */}>
        <MaterialCommunityIcons name="lock-reset" size={20} color="#007AFF" style={styles.linkIcon} />
        <Text style={styles.linkButtonText}>Alterar Senha</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
        onPress={handleSaveChanges}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="save-outline" size={20} color="#fff" style={styles.saveButtonIcon}/>
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    padding: 20,
    paddingBottom: 40, // Espaço para o botão no final
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative', // Para o ícone da câmera sobrepor
    marginBottom: 10,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#DEE2E6',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#007AFF',
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff'
  },
  changePhotoButtonText: {
      fontSize: 15,
      color: '#007AFF',
      fontWeight: '600',
  },
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    marginTop: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50, // Altura fixa para inputs
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%', // Para ocupar toda a altura do inputContainer
    fontSize: 16,
    color: '#212529',
  },
  disabledInput: {
    backgroundColor: '#F8F9FA', // Cor de fundo para input desabilitado
    color: '#6C757D',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    // justifyContent: 'center', // Se quiser centralizar
    marginBottom: 25,
  },
  linkIcon: {
      marginRight: 8,
  },
  linkButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonDisabled: {
    backgroundColor: '#a0cfff',
  },
  saveButtonIcon: {
      marginRight: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});