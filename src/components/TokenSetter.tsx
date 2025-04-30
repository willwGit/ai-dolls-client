"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";

export function TokenSetter() {
  useEffect(() => {
    // Set the token cookie with the provided value
    const token =
      "eyJhbGciOiJIUzUxMiJ9.eyJyYW5kb21LZXkiOiJqbnU3OTEiLCJzdWIiOiIxNjQwNTQzOTY0Njc3MzIwNzA2IiwiZXhwIjoxNjgyMzkwMzM1LCJpYXQiOjE2Nzk5NzExMzV9.C58hQ903EPbRN8Xo_Vdrml9lQiiahdR_YVYbWL9osoxRfr9QlZq89mpuy-GnoVkiEEntgLt7XC5-yxHUXlbzVQ";

    // Check if token already exists
    if (!Cookies.get("token")) {
      console.log("Setting token cookie");
      Cookies.set("token", token, { expires: 365 }); // Set to expire in 1 year
    } else {
      console.log("Token cookie already exists");
    }
  }, []);

  return null; // This component doesn't render anything
}
