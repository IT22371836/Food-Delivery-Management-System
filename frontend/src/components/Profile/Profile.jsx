import { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
  background-color:rgb(101, 154, 108);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(252, 250, 250, 0.1);
  margin: 40px auto;
  max-width: 500px;
`;

const Title = styled.h1`
  font-size: 28px;
  color:rgb(245, 247, 250);
  margin-bottom: 30px;
  font-weight: 700;
`;

const InfoText = styled.p`
  font-size: 18px;
  margin-bottom: 15px;
  color:rgb(243, 245, 248);
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 5px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const EditButton = styled(Button)`
  background-color: #3498db;
  color: white;

  &:hover {
    background-color: #2980b9;
  }
`;

const DeleteButton = styled(Button)`
  background-color: #e74c3c;
  color: white;

  &:hover {
    background-color: #c0392b;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 300px;
`;

const Input = styled.input`
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #bdc3c7;
  border-radius: 5px;
  font-size: 16px;
`;

const SubmitButton = styled(Button)`
  background-color: #2ecc71;
  color: white;

  &:hover {
    background-color: #27ae60;
  }
`;

const CancelButton = styled(Button)`
  background-color: #95a5a6;
  color: white;

  &:hover {
    background-color: #7f8c8d;
  }
`;

const Profile = () => {
  const id = localStorage.getItem("uid");
  const token = localStorage.getItem("token");
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/user/${id}`, {
        headers: { Authorization: `Bearer ${token}`, token: token },
      });
      setUser(response.data.user);
      setFormData({
        name: response.data.user.name,
        email: response.data.user.email,
        phoneNumber: response.data.user.phoneNumber,
        address: response.data.user.address,
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error fetching profile");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const updateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:4000/api/user/${id}`, formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          token: token,
        },
      });
      await getProfile();
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error updating profile");
    }
  };

  const deleteUser = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        await axios.delete(`http://localhost:4000/api/user/${id}`, {
          headers: { Authorization: `Bearer ${token}`, token: token },
        });
        alert("Account deleted successfully");
        // Handle logout or redirect here
        localStorage.removeItem("token");
        localStorage.removeItem("uid");
        // Redirect to home page or login page
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Error deleting account");
      }
    }
  };

  if (!user) return <ProfileContainer>Loading...</ProfileContainer>;

  return (
    <ProfileContainer>
      <Title>Profile</Title>
      {!isEditing ? (
        <>
          <InfoText>Name: {user.name}</InfoText>
          <InfoText>Email: {user.email}</InfoText>
          <InfoText>Phone Number: {user.phoneNumber}</InfoText>
          <InfoText>Address: {user.address}</InfoText>
          <EditButton onClick={() => setIsEditing(true)}>
            Edit Profile
          </EditButton>
          <DeleteButton onClick={deleteUser}>Delete Account</DeleteButton>
        </>
      ) : (
        <Form onSubmit={updateUser}>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
          />
          <Input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
          />
          <Input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
          <SubmitButton type="submit">Update Profile</SubmitButton>
          <CancelButton type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </CancelButton>
        </Form>
      )}
    </ProfileContainer>
  );
};

export default Profile;
