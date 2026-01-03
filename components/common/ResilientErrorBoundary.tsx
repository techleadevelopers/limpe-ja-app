import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureException } from '../../services/observability';

interface Props {
  onRetry?: () => void;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

const Colors = {
  surface: '#FFFFFF',
  danger: '#D32F2F',
  text: '#1C1C1E',
  muted: '#6C757D',
  border: '#F5C6CB',
};

export class ResilientErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  componentDidCatch(error: Error) {
    this.setState({ hasError: true, error });
    captureException(error, { tags: { boundary: 'ResilientErrorBoundary' } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.fallbackContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.danger} accessibilityHidden />
          <Text style={styles.title}>Algo deu errado</Text>
          <Text style={styles.subtitle}>
            Não conseguimos carregar essa tela, mas você pode tentar novamente.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={this.handleRetry}
            accessibilityRole="button"
          >
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return <>{this.props.children}</>;
  }
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 18,
    backgroundColor: Colors.danger,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
