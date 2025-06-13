import axios from "axios";
import { useEffect, useState } from "react";
import { baseUrl } from "../../constants";

const UserDetailsBox = ({ id }) => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    axios.get(`${baseUrl}/api/user/${id}`).then((res) => {
      setUser(res.data.user);
    });
  }, [id]);
  if (!user) return null;
  return (
    <div>
      {`${user.name}`}
      <p> {user.email}</p>
    </div>
  );
};

export default UserDetailsBox;
