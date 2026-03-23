import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Basic Plan',
    desc: 'Free for students to access essential features.',
    price: 'Free',
    period: 'forever',
    features: ['Student App Access', 'Timetable Viewing', 'Homework Submission', 'Basic Notifications'],
    popular: false,
    button: 'Get Started'
  },
  {
    name: 'School Plan',
    desc: 'Full digital ecosystem for your institution.',
    price: '₹1',
    period: 'per student / mo',
    features: ['Everything in Basic', 'Teacher Dashboard', 'Parent App', 'Attendance Tracking', 'Curriculum Integration'],
    popular: true,
    button: 'Choose Plan'
  },
  {
    name: 'Premium',
    desc: 'Advanced tools tailored for modern educators.',
    price: 'Custom',
    period: 'billed annually',
    features: ['Everything in School', 'Advanced Admin Analytics', '1-on-1 Mentorship Tools', 'AI-Driven Insights', 'Priority Support'],
    popular: false,
    button: 'Contact Sales'
  }
];

const PricingSection: React.FC = () => {
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan: any) => {
    // If it's a free or custom plan, redirect to email
    if (plan.price === 'Free' || plan.price === 'Custom') {
      window.location.href = "mailto:edualtstudy@gmail.com";
      return;
    }

    setProcessingPlan(plan.name);

    try {
      const amountStr = plan.price.replace(/[^0-9]/g, '');
      const amountInPaise = parseInt(amountStr, 10) * 100;

      // 1. Ask Vercel Backend API to securely create an Order using a native REST endpoint (no CORS)
      const resOrder = await fetch('/api/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountInPaise })
      });
      const orderData = await resOrder.json();

      if (!resOrder.ok) {
        throw new Error(orderData.error || "Failed to create order on server");
      }

      // 2. Load the checkout script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay payment gateway failed to load. Please check your internet connection.");
        setProcessingPlan(null);
        return;
      }

      // 3. Open checkout with secure Order ID
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SUbr4cftio73uJ", 
        amount: amountInPaise,
        currency: "INR",
        name: "Edu Alt Tech",
        description: `Subscription for ${plan.name}`,
        image: "/edulogo.png",
        order_id: orderData.id, // Pulled securely from Vercel backend
        handler: async function (response: any) {
          try {
            // 4. Send signatures to Vercel backend for mathematical verification
            const resVerify = await fetch('/api/verifyPayment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await resVerify.json();

            if (resVerify.ok && verifyData.success) {
              alert(`Payment Verified Successfully! Received securely and confirmed.`);
            } else {
              throw new Error(verifyData.error || "Invalid Security Signature");
            }
          } catch (verifyError) {
            console.error("Verification failed:", verifyError);
            alert("Payment processed, but security verification failed! Please contact support.");
          }
        },
        prefill: {
          name: "Student Name", 
          email: "student@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#10b981" // Emerald-500 to match UI
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      
      paymentObject.on('payment.failed', function (response: any) {
        alert(`Payment Failed. Reason: ${response.error.description}`);
      });

      paymentObject.open();

    } catch (error: any) {
      console.error("Payment initiation failed:", error);
      alert(`Payment Failed: ${error.message}`);
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <section className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-emerald-500 font-semibold tracking-wide uppercase text-sm mb-3">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Simple, scalable pricing</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Choose the plan that best fits your school's needs. No hidden fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border ${plan.popular ? 'border-emerald-500 shadow-xl shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 min-h-[40px]">{plan.desc}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-slate-500 dark:text-slate-400 ml-2">/{plan.period}</span>}
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-600 dark:text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePayment(plan)}
                disabled={processingPlan === plan.name}
                className={`block w-full py-4 rounded-xl font-bold text-center transition-all ${
                  plan.popular 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-1' 
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white hover:-translate-y-1'
                } ${processingPlan === plan.name ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
              >
                {processingPlan === plan.name ? 'Connecting...' : (plan.price === 'Free' || plan.price === 'Custom' ? 'Contact Us' : plan.button)}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
