import React from "react";
import { Card } from "@/components/ui/card";

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <Card className="p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
    {Icon && (
      <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" strokeWidth={1.5} />
      </div>
    )}
    <h3 className="font-heading text-lg font-semibold mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
    {action}
  </Card>
);

export default EmptyState;
