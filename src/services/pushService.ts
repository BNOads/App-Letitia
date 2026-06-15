import { supabase } from '@/lib/supabase';

// Chave Pública VAPID Gerada
const VAPID_PUBLIC_KEY = 'BFus97kRwt6LrSp9jzHocgtdpZ4uFmDsCrUazBsvdhsi4J8lzROnVDIVJ3hmCWZDCVS_SIty8IuyAkSX2f1INvg';

// Evita tentativas repetidas na mesma sessão se já falhou
let pushInitAttempted = false;
let pushInitResult: boolean | null = null;

/** Helper to convert VAPID base64 string to Uint8Array */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Check if Web Push is supported in current device/browser */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/** Request permission, subscribe, and register on Supabase automatically */
export async function initializePushNotifications(userId: string): Promise<boolean> {
  // Se já tentou nesta sessão, retorna o resultado anterior sem repetir
  if (pushInitAttempted) {
    return pushInitResult ?? false;
  }
  pushInitAttempted = true;

  if (!isPushSupported()) {
    pushInitResult = false;
    return false;
  }

  try {
    // 1. Registrar o Service Worker se não estiver ativo
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    }).catch(err => {
      console.warn('Erro ao registrar Service Worker:', err);
      throw err;
    });

    // 2. Aguarda o Service Worker ficar pronto
    await navigator.serviceWorker.ready;

    // 3. Verificar permissão de notificações
    let permission = Notification.permission;
    
    // Se a permissão não foi concedida nem negada ainda, solicita
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.warn('Permissão de Notificação negada pelo usuário.');
      return false;
    }

    // 4. Se concedido, criar ou recuperar a Inscrição de Push
    const subscribeOptions = {
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    };

    let subscription = await registration.pushManager.getSubscription();

    // Se não existir assinatura ativa para esta chave VAPID, cria uma nova
    if (!subscription) {
      subscription = await registration.pushManager.subscribe(subscribeOptions);
    }

    // 5. Salvar a assinatura no Supabase associada ao usuário autenticado
    if (subscription) {
      const endpoint = subscription.endpoint;
      const subscriptionJSON = subscription.toJSON();

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: endpoint,
          subscription: subscriptionJSON
        }, {
          onConflict: 'endpoint'
        });

      if (error) {
        console.warn('Erro ao salvar assinatura de push no banco de dados:', error.message);
        pushInitResult = false;
        return false;
      }
      pushInitResult = true;
      return true;
    }

    pushInitResult = false;
    return false;
  } catch (err) {
    console.warn('Falha ao inicializar Notificações Push:', err);
    pushInitResult = false;
    return false;
  }
}

interface SendPushParams {
  subscriptions: any[];
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: {
      url: string;
    };
  };
}

/** Frontend helper to dispatch request to our serverless /api/send-push */
export async function sendPushNotification({ subscriptions, payload }: SendPushParams) {
  if (subscriptions.length === 0) return;

  try {
    const response = await fetch('/api/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptions, payload }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao disparar push notification');
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Erro ao enviar push via API:', err);
    throw err;
  }
}
