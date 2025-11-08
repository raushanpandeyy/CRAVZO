import React, { useState } from "react";
import { Home, Building, MapPin, Plus } from "lucide-react";

export default function SavedAddresses() {
  const [selected, setSelected] = useState("HOME");

  // ✅ Convert to state so Remove/Edit works
  const [savedAddresses, setSavedAddresses] = useState({
    HOME: [
      {
        tag: "Home",
        address: "97, RZ Block, Sector 3, Uttam Nagar",
        city: "New Delhi",
        pin: "110059"
      }
    ],
    WORK: [
      {
        tag: "Work",
        address: "IIIT Delhi, Okhla Industrial Estate",
        city: "New Delhi",
        pin: "110020"
      }
    ],
    OTHER: [
      {
        tag: "Hostel",
        address: "Boys Hostel, University Road",
        city: "Greater Noida",
        pin: "201301"
      }
    ]
  });

  // ✅ Remove Handler
  const handleRemove = (index) => {
    const updated = { ...savedAddresses };
    updated[selected] = updated[selected].filter((_, i) => i !== index);
    setSavedAddresses(updated);
  };

  // ✅ Edit Handler (popup coming later)
  const handleEdit = (index) => {
    alert("Edit Address Form will open here.");
  };

  const categories = [
    { id: "HOME", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "WORK", label: "Work", icon: <Building className="w-5 h-5" /> },
    { id: "OTHER", label: "Others", icon: <MapPin className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-100 sm:pl-80 px-6 py-10 flex flex-col">

      <h1 className="text-3xl font-bold text-indigo-900 mb-8">Saved Addresses</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">

        {/* Sidebar */}
        <div className="col-span-1 flex flex-col bg-white rounded-2xl shadow-md border border-indigo-200 p-4">
          <h2 className="text-lg font-semibold text-indigo-900 mb-4">Address Categories</h2>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelected(cat.id)}
              className={`flex items-center gap-3 p-3 mb-2 rounded-xl transition 
                ${selected === cat.id
                  ? "bg-indigo-900 text-white scale-[1.02]"
                  : "bg-white text-indigo-900 border border-indigo-300 hover:bg-indigo-50"
                }`}
            >
              {cat.icon}
              <span className="font-medium">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Address Detail Section */}
        <div className="col-span-3 bg-white rounded-2xl shadow-md border border-indigo-200 p-6">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-indigo-900">
              {selected === "HOME" && "Home Addresses"}
              {selected === "WORK" && "Work Addresses"}
              {selected === "OTHER" && "Other Saved Places"}
            </h2>

            <button className="flex items-center gap-2 bg-corral text-white px-4 py-2 rounded-xl hover:scale-[1.03] transition">
              <Plus className="w-5 h-5" /> Add New
            </button>
          </div>

          <div className="space-y-4">
            {savedAddresses[selected].map((addr, index) => (
              <div
                key={index}
                className="p-4 bg-indigo-900 text-white rounded-xl flex justify-between items-start"
              >
                <div>
                  <p className="text-lg font-semibold">{addr.tag}</p>
                  <p className="text-sm text-gray-200 mt-1">{addr.address}</p>
                  <p className="text-sm text-gray-200">{addr.city} - {addr.pin}</p>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleEdit(index)}
                    className="text-sm underline hover:text-corral transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleRemove(index)}
                    className="text-sm underline hover:text-corral transition"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

