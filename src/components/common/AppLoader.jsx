import React from "react";

import {cravzologo} from "../../assets/images/logos.js";

const AppLoader = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7FB] px-6">
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 rounded-[28px] bg-indigo-950/10 animate-ping" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-white shadow-2xl shadow-indigo-950/15">
            <img src={cravzologo} alt="Cravzo" className="h-16 w-16 rounded-2xl object-cover" />
          </span>
        </div>

        <h1 className="mt-5 text-2xl font-black uppercase tracking-wide text-indigo-950">CRAVZO</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Getting your table ready...</p>
      </div>
    </div>
  );
};

export default AppLoader;
