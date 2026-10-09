import React from 'react';
import { useApp } from '../context/AppContext';

export const PromoBannersPair: React.FC = () => {
  const { navigateToCategory } = useApp();

  return (
    <section className="py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Banner 1 */}
        <div
          onClick={() => navigateToCategory('باقات الورود الطبيعية')}
          className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-[#1a2b20]"
        >
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="https://cdn.salla.sa/form-builder/mypBuAvVrV6ns12LvQX99vVEToDW0JU2xP3pCijx.png"
            />
            <img
              src="https://cdn.salla.sa/form-builder/UyrjLKc6fqzpog6pXVMOtIgt2Qe27ELnq45h9Q6W.png"
              alt="Hadaya Special Promotion 1"
              className="w-full h-auto object-cover group-hover:scale-103 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </picture>
        </div>

        {/* Banner 2 */}
        <div
          onClick={() => navigateToCategory('ورد وشوكولاتة بلجيكية فاخرة')}
          className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-[#1a2b20]"
        >
          <picture>
            <source
              media="(max-width: 640px)"
              srcSet="https://cdn.salla.sa/form-builder/elgP0ELiGIk2ONO9lmsZv2TYxlzbnzj1UyVkVQbb.png"
            />
            <img
              src="https://cdn.salla.sa/form-builder/wrkohrPk90xTpC7DzSnsRoDKINz8GRcQxxBCaWyu.png"
              alt="Hadaya Special Promotion 2"
              className="w-full h-auto object-cover group-hover:scale-103 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
          </picture>
        </div>
      </div>
    </section>
  );
};
