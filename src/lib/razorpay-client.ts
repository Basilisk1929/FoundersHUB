'use client';

export interface RazorpayCheckoutParams {
  keyId: string;
  orderId: string;
  amount: number; // in rupees
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (paymentResponse: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onError?: (error: any) => void;
  onDismiss?: () => void;
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      console.warn('[Razorpay] Failed to load external checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(params: RazorpayCheckoutParams): Promise<boolean> {
  const isLoaded = await loadRazorpayScript();

  if (!isLoaded || !(window as any).Razorpay) {
    console.warn('[Razorpay] Razorpay SDK unavailable, fallback required');
    return false;
  }

  try {
    const options = {
      key: params.keyId,
      amount: Math.round(params.amount * 100), // paise
      currency: params.currency || 'INR',
      name: params.name || 'FoundersHub Venture Syndication',
      description: params.description || 'Test Mode Syndication Commitment',
      order_id: params.orderId,
      image: '/brand/website-logo.png',
      handler: function (response: any) {
        if (params.onSuccess) {
          params.onSuccess({
            razorpay_payment_id: response.razorpay_payment_id || `pay_test_${Date.now()}`,
            razorpay_order_id: response.razorpay_order_id || params.orderId,
            razorpay_signature: response.razorpay_signature || 'test_mode_verified_sig'
          });
        }
      },
      prefill: {
        name: params.prefill?.name || 'Investor Admin',
        email: params.prefill?.email || 'investor@founderhub.com',
        contact: params.prefill?.contact || '9999999999'
      },
      theme: {
        color: '#6366f1'
      },
      modal: {
        ondismiss: function () {
          if (params.onDismiss) params.onDismiss();
        }
      }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      if (params.onError) params.onError(response.error);
    });
    rzp.open();
    return true;
  } catch (err) {
    console.error('[Razorpay] Error initializing checkout:', err);
    return false;
  }
}
