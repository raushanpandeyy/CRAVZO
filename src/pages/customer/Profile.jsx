import React, { useState } from "react";

const Profile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [phones, setPhones] = useState([""]);
  const [addresses, setAddresses] = useState([
    { street: "", landmark: "", locality: "", district: "", po: "", pincode: "", editing: true },
  ]);

  const handleProfilePic = (e) => {
    if (e.target.files[0]) setProfilePic(URL.createObjectURL(e.target.files[0]));
  };

  const handleAddPhone = () => setPhones([...phones, ""]);
  const handlePhoneChange = (val, idx) => {
    const updated = [...phones];
    updated[idx] = val;
    setPhones(updated);
  };

  const handleAddAddress = () =>
    setAddresses([...addresses, { street: "", landmark: "", locality: "", district: "", po: "", pincode: "", editing: true }]);

  const handleAddressChange = (idx, field, val) => {
    const updated = [...addresses];
    updated[idx][field] = val;
    setAddresses(updated);
  };

  const handleSave = () => {
    console.log("Saved User Data:", { profilePic, name, email, age, gender, phones, addresses });
  };

  return (
    <div className="flex-1 sm:ml-80 ml-0 min-h-screen overflow-y-auto sm:p-8 p-2 bg-indigo-900">
      <div className="sm:p-8 pr-4 border border-indigo-200 bg-white rounded-2xl max-w-5xl shadow-xl space-y-10 mx-auto">
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-900 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
          >
            Save Profile
          </button>
        </div>

        {/* Profile Image + Name/Email/Gender/Age */}
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10 flex-wrap">
          <div className="flex flex-col items-center">
            <label htmlFor="profilePic" className="cursor-pointer">
              <img
                src={profilePic || "https://via.placeholder.com/100"}
                alt="Profile"
                className="w-28 h-28 rounded-full border-2 border-indigo-900 object-cover shadow-md hover:scale-105 transition"
              />
            </label>
            <input
              id="profilePic"
              type="file"
              accept="image/*"
              onChange={handleProfilePic}
              className="hidden"
            />
            <p className="text-xs text-indigo-900 mt-2">Click to change</p>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 placeholder-indigo-900 border-2 border-indigo-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 placeholder-indigo-900 border-2 border-indigo-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
            />
            <input
              type="number"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="px-4 py-2 placeholder-indigo-900 border-2 border-indigo-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
            />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="px-4 py-2 placeholder-indigo-900 border-2 border-indigo-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition bg-white text-gray-900"
            >
              <option value="" disabled>Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Phone Numbers */}
        <div>
          <p className="font-semibold text-indigo-900 mb-3 text-base">Phone Numbers</p>
          <div className="flex flex-wrap gap-3 items-center">
            {phones.map((phone, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Phone ${idx + 1}`}
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value, idx)}
                className="px-4 py-2 placeholder-indigo-900 border-2 border-indigo-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              />
            ))}
            <button
              onClick={handleAddPhone}
              className="px-4 py-2 bg-indigo-900 text-white text-base rounded-lg hover:bg-indigo-700 transition"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;












