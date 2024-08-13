"use client";
import Home from "@/components/Home/Home";
import { useUser } from "@clerk/nextjs";
import React, { useEffect } from "react";
import { redirect } from "next/navigation";

const HomePage = () => {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!user) {
      redirect("/sign-in");
    }
  }, [user]);

  if (!isLoaded) return null;
  return (
    <div className="min-h-[90vh] flex items-center justify-center">
      <Home />
    </div>
  );
};

export default HomePage;
