import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";

const userDetails = () => {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const session = await getSession();
        if (session) {
          setUser({
            name: session.user?.name || "Unknown User",
            email: session.user?.email || "No Email",
          });
        }
      } catch (error) {
        console.error("Error fetching user session:", error);
      }
    };

    fetchUserSession();
  }, []);

  return (
    <div>
      <p>Welcome, {user?.name || "Guest"}!</p>
    </div>
  );
};

export default userDetails;
