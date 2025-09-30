import React, { useState } from "react";

const Profile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phones, setPhones] = useState([""]);
  const [addresses, setAddresses] = useState([
    { street: "", landmark: "", locality: "", district: "", po: "", pincode: "" },
  ]);

  const handleProfilePic = (e) => {
    if (e.target.files[0]) {
      setProfilePic(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleAddPhone = () => {
    setPhones([...phones, ""]);
  };

  const handlePhoneChange = (value, index) => {
    const updated = [...phones];
    updated[index] = value;
    setPhones(updated);
  };

  const handleAddAddress = () => {
    setAddresses([
      ...addresses,
      { street: "", landmark: "", locality: "", district: "", po: "", pincode: "" },
    ]);
  };

  const handleAddressChange = (index, field, value) => {
    const updated = [...addresses];
    updated[index][field] = value;
    setAddresses(updated);
  };

  const handleSave = () => {
    const userData = { profilePic, name, email, phones, addresses };
    console.log("Saved User Data:", userData);
    
  };

  return (
    <div className="pt-20  px-6">
      <div className="p-10  border border-indigo-500 bg-white rounded-xl w-4/5 mx-auto shadow-lg">



        {/* Save Button aligned Right */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-black text-white font-semibold rounded-lg shadow hover:bg-gray-400"
          >
            Save
          </button>
        </div>



        {/* Top Section - Image + Name/Email */}
        <div className="flex items-center gap-10 mb-8">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <label htmlFor="profilePic" className="cursor-pointer">
              <img
                src={profilePic || "https://via.placeholder.com/120"}
                alt="Profile"
                className="w-28 alt-indigo-800 h-28 rounded-full border-2 border-indigo-800 object-cover"
              />
            </label>
            <input
              id="profilePic"
              type="file"
              accept="image/*"
              onChange={handleProfilePic}
              className="hidden"
            />
            <p className="text-sm text-indigo-800 mt-2">Click to add image</p>
          </div>






          {/* Name + Email side by side */}
          <div className="flex-1 grid  grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2 border placeholder-indigo-700 border-2 border-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 border placeholder-indigo-700 border-2 border-indigo-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>




        {/* Phone Numbers */}
        <div className="mb-8">
          <p className="font-semibold text-indigo-800 mb-2">Phone Numbers</p>
          <div className="flex flex-wrap gap-3 items-center">
            {phones.map((phone, index) => (
              <input
                key={index}
                type="text"
                placeholder={`Phone ${index + 1}`}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value, index)}
                className="p-3 border placeholder-indigo-700 border-2 border-indigo-800 rounded-lg w-1/3 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            ))}
            <button
              onClick={handleAddPhone}
              className="px-4 py-2 bg-indigo-800 text-xl font-size:1.125rem border border-3 flex items-center border-indigo-800 text-white rounded-lg shadow hover:bg-indigo-400 text-white border border-indigo-800"
            >
              + 
            </button>
          </div>
        </div>





        {/* Addresses */}
        <div className="mb-8  p-4 rounded-lg">
          <p className="font-semibold text-indigo-800 mb-3">Addresses</p>
          {addresses.map((addr, index) => (
            <div
              key={index}
              className="grid grid-cols-2 gap-4 p-4 mb-4 border-indigo-800 border-2 border rounded-lg bg-white shadow"
            >
              <input
                type="text"
                placeholder="Street"
                value={addr.street}
                onChange={(e) =>
                  handleAddressChange(index, "street", e.target.value)
                }
                className="p-2 border placeholder-indigo-700 border-2 border-indigo-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="Landmark"
                value={addr.landmark}
                onChange={(e) =>
                  handleAddressChange(index, "landmark", e.target.value)
                }
                className="p-2 border placeholder-indigo-700 border-2 border-indigo-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="Locality"
                value={addr.locality}
                onChange={(e) =>
                  handleAddressChange(index, "locality", e.target.value)
                }
                className="p-2 border placeholder-indigo-700 border-2 border-indigo-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="District"
                value={addr.district}
                onChange={(e) =>
                  handleAddressChange(index, "district", e.target.value)
                }
                className="p-2 border  placeholder-indigo-700 border-2 border-indigo-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="Post Office"
                value={addr.po}
                onChange={(e) => handleAddressChange(index, "po", e.target.value)}
                className="p-2 border placeholder-indigo-700 border-2 border-indigo-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="text"
                placeholder="Pincode"
               
                value={addr.pincode}
                onChange={(e) =>
                  handleAddressChange(index, "pincode", e.target.value)
                }
                className="p-2 border placeholder-indigo-700 border-2 border-indigo-800 rounded focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          ))}
          <button
            onClick={handleAddAddress}
            className="px-4 py-2 bg-indigo-800 border border-3 border-indigo-800 text-white rounded-lg shadow hover:bg-indigo-400"
          >
            + Add Address
          </button>
        </div>




       
      </div>
    </div>
  );
};

export default Profile;







