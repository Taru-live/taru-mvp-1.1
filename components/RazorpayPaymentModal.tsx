'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, AlertCircle, CreditCard, Sparkles, MessageCircle, Brain } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planType: 'basic' | 'premium';
  paymentFor: 'career_access' | 'learning_path_save';
  learningPathId?: string;
  amount: number;
}

export default function RazorpayPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  planType: initialPlanType,
  paymentFor,
  learningPathId,
  amount: initialAmount
}: RazorpayPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [selectedPlanType, setSelectedPlanType] = useState<'basic' | 'premium'>(initialPlanType || 'basic');
  
  // Calculate amount based on selected plan
  const selectedAmount = selectedPlanType === 'basic' ? 99 : 199;

  // Load Razorpay script
  useEffect(() => {
    if (isOpen && !window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Razorpay script loaded');
      };
      script.onerror = () => {
        setError('Failed to load Razorpay payment gateway');
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isOpen]);

  const handlePayment = async () => {
    // Prevent duplicate clicks
    if (loading) {
      console.log('⚠️ Payment already in progress, ignoring duplicate click');
      return;
    }
    
    // Use different endpoint for learning path payments
    const endpoint = paymentFor === 'learning_path_save' 
      ? '/api/payments/create-learning-path-order'
      : '/api/payments/create-order';
    
    try {
      setLoading(true);
      setError(null);

      // NOTE: For career_access payments:
      // - learningPathId can be null for initial access (from career exploration page)
      //   In this case, a temporary subscription will be created and linked when learning path is saved
      // - learningPathId should be provided for upgrades/renewals (from learning path tab)
      //   In this case, subscription is scoped to that specific learning path
      
      // Log payment request details for debugging
      console.log('📋 Payment request details:', {
        paymentFor,
        learningPathId: learningPathId || 'null (initial access - will be linked later)',
        selectedPlanType,
        selectedAmount,
        hasLearningPathId: !!learningPathId,
        isInitialAccess: paymentFor === 'career_access' && !learningPathId
      });

      // Create order
      const requestBody = {
        planType: selectedPlanType,
        paymentFor,
        learningPathId: learningPathId || null
      };
      
      console.log('📤 Creating payment order:', {
        endpoint,
        ...requestBody,
        amount: selectedAmount,
        hasLearningPathId: !!learningPathId
      });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      });

      // Parse response JSON safely
      let data: any = {};
      try {
        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
          console.error('Empty response from server:', {
            status: response.status,
            statusText: response.statusText,
            endpoint
          });
          throw new Error(`Server returned empty response (${response.status}). Please try again.`);
        }
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response:', {
          parseError,
          status: response.status,
          statusText: response.statusText,
          endpoint
        });
        const errorMessage = response.status >= 500 
          ? 'Server error. Please try again in a moment.'
          : `Server error: ${response.status} ${response.statusText || 'Unknown error'}`;
        throw new Error(errorMessage);
      }
      
      // Check if response was successful (200-299) or if we got existing payment details
      if (!response.ok) {
        // If we got existing payment details in error response, use them
        if (data && data.success && data.orderId) {
          console.log('⚠️ Using existing payment order:', data.orderId);
          // Continue with existing payment details - don't throw error
        } else {
          // Handle error response - extract meaningful error message
          let errorMessage = 'Payment order creation failed. Please try again.';
          
          if (data && typeof data === 'object') {
            // Try to extract error message from various possible fields
            errorMessage = data.details || data.error || data.message || errorMessage;
            
            // If it's a validation error (400), show the specific message
            if (response.status === 400 && data.error) {
              errorMessage = data.error;
              if (data.details) {
                errorMessage += ` ${data.details}`;
              }
            }
          }
          
          console.error('Payment order creation failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData: data,
            endpoint,
            planType: selectedPlanType,
            paymentFor,
            learningPathId: learningPathId || 'missing',
            responseBody: JSON.stringify(data),
            extractedErrorMessage: errorMessage
          });
          
          // If it's a retryable error, provide more context
          if (data && typeof data === 'object' && data.retryable) {
            throw new Error(`${errorMessage} Please wait a moment and try again.`);
          }
          
          // Provide user-friendly error message based on status code
          if (response.status === 400) {
            // Validation error - show the specific message
            throw new Error(errorMessage);
          } else if (response.status === 500) {
            throw new Error('Server error occurred. Please try again in a moment.');
          } else if (response.status === 401) {
            throw new Error('Authentication required. Please log in again.');
          } else if (response.status === 404) {
            throw new Error('Service not found. Please contact support.');
          }
          
          throw new Error(errorMessage);
        }
      }
      
      // Validate that we have the required payment data
      if (!data.orderId || !data.keyId) {
        console.error('Invalid payment response:', data);
        throw new Error('Invalid payment order response. Please try again.');
      }
      
      console.log('✅ Payment order created/retrieved:', {
        orderId: data.orderId,
        paymentId: data.paymentId,
        amount: data.amount
      });
      setOrderId(data.orderId);
      setPaymentId(data.paymentId);

      // Initialize Razorpay checkout
      if (!window.Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const options = {
        key: data.keyId,
        amount: data.amount * 100, // Convert to paise
        currency: data.currency,
        name: 'Taru Learning Platform',
        description: `${selectedPlanType === 'basic' ? 'Basic' : 'Premium'} Plan - ${paymentFor === 'career_access' ? 'Career Access' : 'Learning Path Save'}`,
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            setLoading(true);

            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: data.paymentId
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || 'Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            console.log('✅ Payment verified:', verifyData);

            setLoading(false);
            onSuccess();
            onClose();
          } catch (err) {
            console.error('Payment verification error:', err);
            setError(err instanceof Error ? err.message : 'Payment verification failed');
            setLoading(false);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#7c3aed'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setError(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response);
        setError(response.error.description || 'Payment failed. Please try again.');
        setLoading(false);
      });

      razorpay.open();
      setLoading(false);
    } catch (err) {
      console.error('Error in handlePayment:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
        endpoint,
        planType: selectedPlanType,
        paymentFor
      });
      
      // Provide user-friendly error message
      let errorMessage = 'Failed to process payment';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Reset plan selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlanType(initialPlanType || 'basic');
      setError(null);
    }
  }, [isOpen, initialPlanType]);

  if (!isOpen) return null;

  const planName = selectedPlanType === 'basic' ? 'Basic' : 'Premium';
  const basicPlanFeatures = ['3 AI Buddy chats per day per chapter', '3 MCQ generations per month'];
  const premiumPlanFeatures = ['5 AI Buddy chats per day per chapter', '5 MCQ generations per month'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <Sparkles className="w-full h-full" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Complete Payment</h2>
                <p className="text-purple-100 text-sm">
                  {paymentFor === 'career_access' 
                    ? 'Unlock Career Details & Learning Paths' 
                    : 'Save Additional Learning Path'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Plan Selection */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Select a Plan:</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Basic Plan Option */}
                <button
                  onClick={() => setSelectedPlanType('basic')}
                  disabled={loading}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedPlanType === 'basic'
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-1">Basic</div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">₹99</div>
                    <div className="text-xs text-gray-500 mb-3">per month</div>
                    {selectedPlanType === 'basic' && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Premium Plan Option */}
                <button
                  onClick={() => setSelectedPlanType('premium')}
                  disabled={loading}
                  className={`p-4 rounded-xl border-2 transition-all relative ${
                    selectedPlanType === 'premium'
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    POPULAR
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-1">Premium</div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">₹199</div>
                    <div className="text-xs text-gray-500 mb-3">per month</div>
                    {selectedPlanType === 'premium' && (
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Plan Features Comparison */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Plan Features:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <MessageCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      selectedPlanType === 'basic' ? 'text-blue-500' : 'text-purple-500'
                    }`} />
                    <span className="text-sm text-gray-600">
                      {selectedPlanType === 'basic' ? '3' : '5'} AI Buddy chats per day per chapter
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Brain className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      selectedPlanType === 'basic' ? 'text-blue-500' : 'text-purple-500'
                    }`} />
                    <span className="text-sm text-gray-600">
                      {selectedPlanType === 'basic' ? '3' : '5'} MCQ generations per month
                    </span>
                  </div>
                  {selectedPlanType === 'premium' && (
                    <div className="flex items-start gap-2 pt-1 border-t border-gray-200">
                      <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-purple-500" />
                      <span className="text-sm text-gray-600 font-medium">
                        Priority support & early access to new features
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">Payment Error</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{selectedAmount}
                  </>
                )}
              </button>
            </div>

            {/* Security Note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              🔒 Secure payment powered by Razorpay
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
