import React, { useState } from "react";
import { Smartphone, CreditCard, Landmark, Wallet } from "lucide-react";

export default function PaymentMethods() {
  const [selected, setSelected] = useState("UPI");

  // Saved Payments (These will later come from backend / user profile DB)
  const savedUPI = ["raushan@oksbi", "pandey123@paytm", "cravzo_user@ybl"];
  const savedCards = [
    { bank: "HDFC Bank", number: "**** **** **** 4521", type: "Visa" },
    { bank: "SBI Bank", number: "**** **** **** 9082", type: "Mastercard" }
  ];
  const savedBanks = ["HDFC Net Banking", "SBI Net Banking", "ICICI Net Banking"];

  const paymentOptions = [
    { id: "UPI", label: "UPI", icon: <Smartphone className="w-5 h-5" /> },
    { id: "CARD", label: "Cards", icon: <CreditCard className="w-5 h-5" /> },
    { id: "NET", label: "Net Banking", icon: <Landmark className="w-5 h-5" /> },
    { id: "COD", label: "Cash on Delivery", icon: <Wallet className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-100 sm:pl-80 px-6 py-10 flex flex-col">

      <h1 className="text-3xl font-bold text-indigo-900 mb-8">Payment Methods</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">

        {/* LEFT SIDE - Saved Methods */}
        <div className="col-span-1 flex flex-col bg-white rounded-2xl shadow-md border border-indigo-200 p-4">

          <h2 className="text-lg font-semibold text-indigo-900 mb-4">Saved Methods</h2>

          {paymentOptions.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelected(method.id)}
              className={`flex items-center gap-3 p-3 mb-2 rounded-xl transition 
                ${selected === method.id
                  ? "bg-indigo-900 text-white scale-[1.02]"
                  : "bg-white text-indigo-900 border border-indigo-300 hover:bg-indigo-50"
                }`}
            >
              {method.icon}
              <span className="font-medium">{method.label}</span>
            </button>
          ))}
        </div>

        {/* RIGHT SIDE - Details */}
        <div className="col-span-3 bg-white rounded-2xl shadow-md border border-indigo-200 p-6">

          <h2 className="text-xl font-semibold text-indigo-900 mb-6">
            {selected === "UPI" && "Your UPI Accounts"}
            {selected === "CARD" && "Your Saved Cards"}
            {selected === "NET" && "Your Banks"}
            {selected === "COD" && "Cash on Delivery"}
          </h2>

          {/* Show Saved UPI */}
          {selected === "UPI" && (
            <div className="space-y-3">
              {savedUPI.map((upi) => (
                <div key={upi} className="flex justify-between items-center bg-indigo-900 text-white px-4 py-3 rounded-xl">
                  <span className="text-lg">{upi}</span>
                  <button className="text-sm underline hover:text-corral transition">Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* Show Cards */}
          {selected === "CARD" && (
            <div className="space-y-4">
              {savedCards.map((card, index) => (
                <div key={index} className="p-4 bg-indigo-900 text-white rounded-xl flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">{card.bank}</p>
                    <p className="text-sm text-gray-200">{card.number} • {card.type}</p>
                  </div>
                  <button className="text-sm underline hover:text-corral transition">Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* Show Banks */}
          {selected === "NET" && (
            <div className="space-y-3">
              {savedBanks.map((bank) => (
                <div key={bank} className="flex justify-between items-center bg-indigo-900 text-white px-4 py-3 rounded-xl">
                  <span className="text-lg">{bank}</span>
                  <button className="text-sm underline hover:text-corral transition">Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* COD */}
          {selected === "COD" && (
            <p className="text-indigo-900 text-lg">You can pay in cash when your food arrives 😊</p>
          )}

          {/* Pay Button */}
          <button className="mt-10 w-full bg-corral text-white text-lg font-semibold px-6 py-3 rounded-xl hover:scale-[1.02] transition">
            Proceed
          </button>

        </div>
      </div>
    </div>
  );
}




