"use client";
import React from "react";

const Footer = () => {
  const date = new Date().getFullYear();
  return (
    <div className="p-5 footer bg-[#000000] font-bold">
      <p className="text-center text-white uppercase">
        Copyright &copy; {date}
      </p>
    </div>
  );
};

export default Footer;
