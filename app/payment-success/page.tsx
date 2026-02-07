import React, { Suspense } from "react";
import PaymentSuccessClient from "./PaymentSuccessClient";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <PaymentSuccessClient />
    </Suspense>
  );
}
