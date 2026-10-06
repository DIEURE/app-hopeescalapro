import {
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

/**
 * Navega para qualquer rota registrada usando a assinatura moderna do React Navigation:
 * navigationRef.navigate(name, params)
 */
export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
    return;
  }

  // Fila de retry caso o clique ocorra durante transição inicial
  const timer = setTimeout(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate(name, params);
    } else {
      console.warn(`[navigationRef] Não foi possível navegar para "${name}": container indisponível.`);
    }
  }, 100);

  return () => clearTimeout(timer);
}

export function goBack() {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
}

export function resetRoot(routeName: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.resetRoot({
      index: 0,
      routes: [{ name: routeName, params }],
    });
  }
}

export function replace(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name, params));
  }
}