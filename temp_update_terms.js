const fs = require('fs');
const path = 'app/provider/profile/index.tsx';
const data = fs.readFileSync(path,'utf8');
const start = data.indexOf('  const handleAcceptTerms');
const end = data.indexOf('  const handleLogout', start);
if (start === -1 || end === -1) throw new Error('markers not found');
const newStr =   const handleAcceptTerms = async () => {
    if (acceptingTerms) return;
    setAcceptingTerms(true);
    try {
      const termsVersion = 'v1';
      const resp = await acceptProviderTerms(termsVersion);
      await AsyncStorage.setItem(TERMS_KEY, '1');
      setTermsAccepted(true);
      await updateUser({ termsAcceptedAt: resp.termsAcceptedAt, termsVersion: resp.termsVersion });
      setTermsModalVisible(false);
      Alert.alert('Termos aceitos', 'Obrigado por aceitar os termos e condições.');
    } catch (e) {
      alertUserError(e, 'Erro ao registrar a concordância');
    } finally {
      setAcceptingTerms(false);
    }
  };\n;
fs.writeFileSync(path, data.slice(0, start) + newStr + data.slice(end), 'utf8');
