import React from "react";
import { ArrowLeft, Heart, Users, TrendingUp, Zap, Shield, Star, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Transparent Pricing",
      description: "No hidden charges. Menu prices are same as restaurant dine-in rates.",
    },
    {
      icon: TrendingUp,
      title: "Affordable Delivery",
      description: "Distance-based delivery fees that are fair and honest.",
    },
    {
      icon: Users,
      title: "Student Partners",
      description: "Flexible earning opportunities for students through our delivery network.",
    },
    {
      icon: Zap,
      title: "Smart Restaurant Tools",
      description: "Advanced tools to help restaurants manage orders efficiently.",
    },
    {
      icon: Star,
      title: "AI-Powered Experience",
      description: "Personalized recommendations and smarter order management.",
    },
    {
      icon: Target,
      title: "Local Business Support",
      description: "Better platform for local food businesses to grow.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-10">
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">About Dodago</h1>
            <p className="text-xs text-slate-500">Our story and vision</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🍽️</span>
            <h2 className="text-3xl font-black">We Believe Food Delivery Should Be Fair</h2>
          </div>
          <p className="text-lg text-indigo-100 leading-relaxed">
            Food delivery was supposed to make life easier. Somewhere along the way, it became expensive, confusing, and unfair for both customers and restaurants. Dodago was created to change that.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Our Mission</h3>
          <p className="text-slate-600 leading-relaxed mb-4">
            We believe ordering food should feel simple, transparent, and accessible — without inflated menu prices, hidden charges, or unfair commissions.
          </p>
          <p className="text-slate-600 leading-relaxed">
            While traditional platforms often force restaurants to increase prices because of heavy commission fees, Dodago follows a different approach. Instead of taking large cuts on every order, we work on a subscription-based model that helps restaurants keep their prices closer to their actual dine-in rates.
          </p>
          <p className="mt-4 text-slate-600 leading-relaxed">
            That means customers pay more honestly priced bills, and local food businesses get a fairer platform to grow on.
          </p>
        </div>

        <div className="rounded-3xl bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
              <Heart className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">More Than Just Delivery</h3>
          </div>
          <p className="text-slate-600 leading-relaxed mb-4">
            But Dodago is not just another food delivery app. We are building a smarter and more community-driven ecosystem:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{feature.title}</p>
                    <p className="text-sm text-slate-500 mt-1">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm mb-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Our Vision</h3>
          <p className="text-slate-600 leading-relaxed">
            Our vision is to create a platform where technology genuinely improves the food ordering experience instead of making it more complicated. We also want to empower students and young people by creating flexible earning opportunities through our delivery partner network.
          </p>
        </div>

        <div className="rounded-3xl border-2 border-indigo-200 bg-indigo-50 p-6 text-center">
          <h3 className="text-xl font-bold text-indigo-900 mb-3">Our Core Belief</h3>
          <p className="text-lg text-indigo-800 font-medium leading-relaxed">
            "Good food should reach people fairly — for customers, restaurants, and delivery partners alike."
          </p>
          <p className="mt-4 text-sm text-indigo-600 font-semibold">
            This is just the beginning.
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-indigo-950 p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">Built with ❤️ for the community</h3>
          <p className="text-indigo-300 text-sm">Dodago - Fair food delivery for everyone</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;