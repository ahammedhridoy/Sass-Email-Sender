import { SignIn } from "@clerk/nextjs";

export default function Signin() {
  return (
    <div className="">
      <div className="container min-h-[90vh] flex items-center justify-center">
        <SignIn />
      </div>
    </div>
  );
}
