import React from "react";
import Notify from "@/shared/header/notify/Notify";
import { AppCard } from "@/shared/ui";

type NotifyPageProps = {
  userRole?: string | null;
};

const NotifyPage: React.FC<NotifyPageProps> = ({ userRole }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-neutral-900">Powiadomienia</h1>
        <p className="mt-2 text-base leading-relaxed text-neutral-500">
          Przegląd wniosków o rolę wystawcy (admin / owner).
        </p>
      </div>
      <AppCard>
        <Notify userRole={userRole} />
      </AppCard>
    </div>
  );
};

export default NotifyPage;
