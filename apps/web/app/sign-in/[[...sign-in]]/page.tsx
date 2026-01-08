import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-black/80 border border-cyber-muted backdrop-blur-sm",
            headerTitle: "text-white font-pixel",
            headerSubtitle: "text-cyber-light",
            formButtonPrimary: "bg-white text-black hover:bg-cyber-light",
            formFieldInput: "bg-black text-white border-cyber-muted",
            footerActionLink: "text-cyber-light hover:text-white",
          },
        }}
      />
    </main>
  );
}
