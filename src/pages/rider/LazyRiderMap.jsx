import React, { lazy, Suspense } from "react";

const RiderMap = lazy(() => import("./RiderMap"));

const LazyRiderMap = (props) => {
  return (
    <Suspense fallback={<p>Loading Map...</p>}>
      <RiderMap {...props} />
    </Suspense>
  );
};

export default LazyRiderMap;