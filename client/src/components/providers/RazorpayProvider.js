'use client';

import Script from 'next/script';

export default function RazorpayProvider({ children }) {
  return (
    <>
      <Script
        id="razorpay-checkout-sdk"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      {children}
    </>
  );
}
