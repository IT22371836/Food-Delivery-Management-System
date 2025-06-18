import React, { useContext, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/");
  };

  const handleNavigation = (menuName, path) => {
    setMenu(menuName);
    if (path) {
      navigate(path);
    }
  };

  const renderMenuItem = (menuName, label, path) => (
    <Link
      to={path}
      onClick={() => handleNavigation(menuName, path)}
      className={menu === menuName ? "active" : ""}
    >
      {label}
    </Link>
  );

  const renderProfileMenu = () => (
    <div className="navbar-profile-container"> 
      <img
        className="profile-icon"
        src={assets.profile_icon}
        alt="Profile"
        onClick={() => navigate("/profile")}
      />
      <div className="profile-dropdown">
        <ul>
          <li onClick={() => navigate("/myorders")}>
            <img src={assets.bag_icon} alt="Orders" />
            <p>Orders</p>
          </li>
          <li onClick={logout}>
            <img src={assets.logout_icon} alt="Logout" />
            <p>Logout</p>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="navbar">
      <Link to="/">
        <img src={assets.logo} alt="Logo" className="logo" />
      </Link>
      <ul className="navbar-menu">
        {renderMenuItem("home", "Home", "/")}
        <a
          href="#explore-menu"
          onClick={() => handleNavigation("menu")}
          className={menu === "menu" ? "active" : ""}
        >
          Menu
        </a>
        <a
          href="#app-download"
          onClick={() => handleNavigation("mobile-app")}
          className={menu === "mobile-app" ? "active" : ""}
        >
          Mobile App
        </a>
        <a
          href="#contact-us"
          onClick={() => navigate("/contactus")}
          className={menu === "contact-us" ? "active" : ""}
        >
          Contact Us
        </a>
      </ul>
      <div className="navbar-right">
        <img src={assets.search_icon} alt="Search" />
        <div className="navbar-cart-icon">
          <Link to="/cart">
            <img src={assets.basket_icon} alt="Cart" />
            {getTotalCartAmount() > 0 && <div className="dot"></div>}
          </Link> 
        </div>
        {!token ? (
          <button onClick={() => setShowLogin(true)}>Sign In</button>
        ) : (
          renderProfileMenu()
        )}
      </div>
    </div>
  );
};

export default Navbar;