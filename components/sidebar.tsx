import Link from "next/link";
import Image from "next/image";
import React from "react";
import { DottedSeparator } from "./dotted-separator";
import { NavigationWrapper } from "./navigation-wrapper";
import { WorkspaceSwitcher } from "./workspace-switcher";

const Sidebar = () => {
  return (
    <aside className="h-full bg-neutral-100 p-4 w-full">
      <Link href={"/"}>
        <div className="flex items-center justify-center h-12 mb-2">
          <Image 
            src="/logo-edu.png" 
            alt="EduFutura Logo" 
            width={150} 
            height={48}
            className="object-contain"
          />
        </div>
      </Link>
      <DottedSeparator className="my-4" />
      <NavigationWrapper />
    </aside>
  );
};

export default Sidebar;
