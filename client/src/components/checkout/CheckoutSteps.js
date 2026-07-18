'use client';

export default function CheckoutSteps({ currentStep = 1 }) {
  const steps = [
    { num: 1, name: 'Shipping' },
    { num: 2, name: 'Payment' },
    { num: 3, name: 'Review' },
    { num: 4, name: 'Success' },
  ];

  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto mb-10 px-4 select-none">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.num;
        const isCompleted = currentStep > step.num;

        return (
          <div key={step.num} className="flex-1 flex items-center relative">
            {/* Step bubble */}
            <div className="flex flex-col items-center mx-auto z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border ${
                  isActive
                    ? 'bg-gradient-to-r from-lavender-500 to-blush-400 text-white shadow-glow border-transparent scale-110'
                    : isCompleted
                    ? 'bg-mint-400 text-white border-transparent'
                    : 'glass bg-white/40 text-gray-400 border-white/30'
                }`}
              >
                {isCompleted ? '✓' : step.num}
              </div>
              <span
                className={`text-[10px] md:text-xs font-semibold mt-2 transition-colors ${
                  isActive
                    ? 'text-lavender-600 font-bold'
                    : isCompleted
                    ? 'text-mint-500'
                    : 'text-gray-400'
                }`}
              >
                {step.name}
              </span>
            </div>

            {/* Connecting connector line */}
            {idx < steps.length - 1 && (
              <div className="absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-4.5 h-[2px] z-0">
                <div
                  className={`w-full h-full transition-all duration-500 ${
                    currentStep > step.num ? 'bg-mint-300' : 'bg-white/30'
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
