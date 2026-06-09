import React from "react";
import { Award, ShieldCheck } from "lucide-react";

const isProfileComplete = (restaurant) => {
  if (!restaurant) return false;

  const required = [
    restaurant.name,
    restaurant.cuisine,
    restaurant.phone,
    restaurant.addressLine1,
    restaurant.city,
    restaurant.state,
    restaurant.postalCode,
    restaurant.imageUrl,
  ];

  return required.every((field) => field && field.toString().trim() !== "");
};

const VerifiedBadgeComponent = ({ restaurant, showLabel = true }) => {
  const isVerified = isProfileComplete(restaurant);

  if (!restaurant) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
        isVerified
          ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 shadow-sm"
          : "bg-slate-100 border border-slate-200"
      }`}
    >
      {isVerified ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-amber-800">Verified Partner</span>
        </>
      ) : (
        <>
          <Award className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-slate-600">Profile Incomplete</span>
        </>
      )}
    </div>
  );
};

const VerifiedBadgeLargeImpl = ({ restaurant }) => {
  const isVerified = isProfileComplete(restaurant);

  if (!restaurant) return null;

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl p-4 transition-all duration-300 ${
        isVerified
          ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200"
          : "bg-slate-50 border-2 border-slate-200"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          isVerified ? "bg-amber-100" : "bg-slate-200"
        }`}
      >
        {isVerified ? (
          <ShieldCheck className="h-6 w-6 text-amber-600" />
        ) : (
          <Award className="h-6 w-6 text-slate-500" />
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {isVerified ? "Verified Partner" : "Complete Your Profile"}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {isVerified
            ? "Your profile is complete and verified"
            : "Fill all details to get verified badge"}
        </p>
      </div>
    </div>
  );
};

const ProfileProgressImpl = ({ restaurant }) => {
  if (!restaurant) return null;

  const fields = [
    { key: "name", label: "Restaurant Name" },
    { key: "cuisine", label: "Cuisine" },
    { key: "phone", label: "Phone" },
    { key: "imageUrl", label: "Image" },
    { key: "addressLine1", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "postalCode", label: "Pincode" },
    { key: "fssaiNumber", label: "FSSAI (Optional)" },
  ];

  const filledCount = fields.filter(
    (f) => restaurant[f.key] && restaurant[f.key].toString().trim() !== ""
  ).length;
  const progress = Math.round((filledCount / fields.length) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">Profile Completion</span>
        <span className="font-semibold text-slate-900">{progress}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progress === 100 ? "bg-emerald-500" : "bg-amber-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {progress === 100
          ? "Profile complete! You're verified."
          : `${fields.length - filledCount} fields remaining`}
      </p>
    </div>
  );
};

export const VerifiedBadge = React.memo(VerifiedBadgeComponent);
export const VerifiedBadgeLarge = React.memo(VerifiedBadgeLargeImpl);
export const ProfileProgress = React.memo(ProfileProgressImpl);
export default VerifiedBadge;