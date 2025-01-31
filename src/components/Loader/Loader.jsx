import React from "react";
import CircularProgress from "@mui/material/CircularProgress";

const Loader = () => {
  return (
    <div className="min-h-[90vh] flex items-center justify-center">
      <CircularProgress />
    </div>
  );
};

export default Loader;
