import "./globals.css";
import Navigation from "./../components/Navigation/Navigation";
import Footer from "./../components/Footer/Footer";

import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "Email Sender",
  description: "Loading...",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className=" bg-slate-800">
          <header>
            <Navigation />
          </header>
          {children}
          <footer>
            <Footer />
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
