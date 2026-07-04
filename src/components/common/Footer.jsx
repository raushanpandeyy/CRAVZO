import React from "react";
import { useNavigate } from "react-router-dom";

import {dodagologo} from "../../assets/images/logos.js";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="hidden w-full bg-white px-6 pt-8 text-indigo-700 md:block md:px-16 lg:px-36">
      <div className="flex w-full flex-col gap-10 border-b border-gray-300 pb-10 md:flex-row md:justify-between">
        <div className="md:max-w-96">
          <img
            onClick={() => navigate("/")}
            alt="Dodago Logo"
            className="h-28 w-auto cursor-pointer rounded-2xl bg-transparent"
            src={dodagologo}
          />

          <p className="mt-6 text-sm leading-6 text-slate-600">
            Dodago helps customers discover great local restaurants and place orders without friction.
            Browse cuisines, compare options, and get food delivered with confidence.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <img
              src="https://res.cloudinary.com/dp3l13mm5/image/fetch/f_auto,q_auto/https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/appDownload/googlePlayBtnBlack.svg"
              alt="Download on Google Play"
              className="h-10 w-auto rounded border border-white"
              loading="lazy"
            />
            <img
              src="https://res.cloudinary.com/dp3l13mm5/image/fetch/f_auto,q_auto/https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/appDownload/appleStoreBtnBlack.svg"
              alt="Download on the App Store"
              className="h-10 w-auto rounded border border-white"
              loading="lazy"
            />
          </div>
        </div>

        <div className="flex flex-1 items-start gap-20 md:justify-end md:gap-40">
          <div>
            <h2 className="mb-5 font-semibold">Company</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <button type="button" onClick={() => navigate("/")} className="text-left hover:text-indigo-700">
                  Home
                </button>
              </li>
              <li>
                <a href="#about" className="hover:text-indigo-700">
                  About us
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-indigo-700">
                  Contact us
                </a>
              </li>
              <li>
                <a href="#privacy" className="hover:text-indigo-700">
                  Privacy policy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-5 font-semibold">Get in touch</h2>
            <div className="space-y-2 text-sm text-slate-600">
              <p>+91 98765 43210</p>
              <p>hello@dodago.shop</p>
            </div>
          </div>
        </div>
      </div>

      <p className="pb-5 pt-4 text-center text-sm text-slate-500">
        Copyright {new Date().getFullYear()} ©{" "}
        <a href="http://dodago.shop" className="hover:text-indigo-700">
          DODAGO
        </a>
        . All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
