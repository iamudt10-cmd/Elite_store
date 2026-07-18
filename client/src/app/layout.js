import { Inter, Poppins } from 'next/font/google';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileNav from '../components/layout/MobileNav';
import RazorpayProvider from '../components/providers/RazorpayProvider';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'Elite Style | Premium Fashion & Lifestyle Boutique',
  description: 'Shop luxury apparel, handcrafted footwear, designer handbags and custom accessories with secure Razorpay checkouts.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col relative select-none">
        {/* Floating gradient glassmorphism decorative background blobs */}
        <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] rounded-full bg-blush-200/30 filter blur-[90px] floating-blob" style={{ animationDelay: '0s' }} />
        <div className="absolute top-[40%] right-[10%] w-[450px] h-[450px] rounded-full bg-lavender-200/25 filter blur-[100px] floating-blob" style={{ animationDelay: '-5s' }} />
        <div className="absolute bottom-[20%] left-[15%] w-[400px] h-[400px] rounded-full bg-baby-200/30 filter blur-[95px] floating-blob" style={{ animationDelay: '-10s' }} />
        <div className="absolute bottom-[5%] right-[5%] w-[300px] h-[300px] rounded-full bg-mint-200/25 filter blur-[80px] floating-blob" style={{ animationDelay: '-15s' }} />

        {/* Global Razorpay payment sdk provider */}
        <RazorpayProvider>
          <Header />
          <MobileNav />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
            {children}
          </main>
          <Footer />
        </RazorpayProvider>

        {/* Toast notifications container */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgba(255, 255, 255, 0.75)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.45)',
              color: '#374151',
              borderRadius: '16px',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
              fontSize: '13px',
              fontWeight: '600',
            },
          }}
        />
      </body>
    </html>
  );
}
