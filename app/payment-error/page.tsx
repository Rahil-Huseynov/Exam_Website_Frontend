import React, { Suspense } from "react";
import PaymentErrorClient from "./PaymentErrorClient";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <PaymentErrorClient />
    </Suspense>
  );
}
