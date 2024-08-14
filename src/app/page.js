"use client";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Home from "src/components/Home/Home";

const HomePage = () => {
  const { user, isLoaded } = useUser();
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Send user data to the server
        fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clerkId: user.id }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to link user");
            }
            return response.json();
          })
          .then((data) => {
            if (data.error) {
              throw new Error(data.error);
            }

            console.log("User linked successfully:", data.user);
            // Optionally handle successful response here, e.g., display a success message
          })
          .catch((error) => {
            console.error("Error linking user:", error);
            setError(error.message || "An error occurred");
          });
      } else {
        router.push("/sign-in");
      }
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) {
    return <div>Loading...</div>; // Show loading indicator while checking authentication
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center">
      {error && <p className="text-red-500">{error}</p>}
      <Home />
    </div>
  );
};

export default HomePage;
