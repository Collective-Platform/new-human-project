"use client";

import dynamic from "next/dynamic";

const SwRegister = dynamic(() => import("./sw-register").then((m) => m.SwRegister), { ssr: false });

export function SwRegisterLoader() {
  return <SwRegister />;
}
