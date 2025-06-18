import React, { useContext, useState } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import Reviews from "../Reviews/Reviews";

const FoodItem = ({
  id,
  name,
  description,
  price,
  image,
  category,
  ingredients,
  dietaryInfo,
  specialOffer,
}) => {
  const { cartItems, addToCart, removeFromCart, url } =
    useContext(StoreContext);
  const [showReviews, setShowReviews] = useState(false);

  return (
    <div className="food-item">
      <div className="food-item-image-container">
        <img
          className="food-item-image"
          src={url + "/images/" + image}
          alt=""
        />
        {!cartItems ? (
          <img
            className="add"
            onClick={() => addToCart(id)}
            src={assets.add_icon_white}
            alt=""
          />
        ) : !cartItems[id] ? (
          <img
            className="add"
            onClick={() => addToCart(id)}
            src={assets.add_icon_white}
            alt=""
          />
        ) : (
          <div className="food-item-counter">
            <img
              onClick={() => removeFromCart(id)}
              src={assets.remove_icon_red}
              alt=""
            />
            <p>{cartItems[id]}</p>
            <img
              onClick={() => addToCart(id)}
              src={assets.add_icon_green}
              alt=""
            />
          </div>
        )}
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <img src={assets.rating_starts} alt="" />
        </div>
        <p className="food-item-description">{description}</p>
        <p className="food-item-price">${price}</p>
        <p className="food-item-category">Category: {category}</p>
        <p className="food-item-ingredients" style={{ color: 'black' }}> 
          Ingredients: {ingredients.join(", ")}
        </p>
        <div className="food-item-dietary-info" style={{ color: 'black' }}>
          {dietaryInfo.isVegetarian && (
            <span className="dietary-tag">Vegetarian</span>
          )}
          {dietaryInfo.isGlutenFree && (
            <span className="dietary-tag">Gluten-Free</span>
          )}
          {dietaryInfo.isVegan && <span className="dietary-tag">Vegan</span>}
        </div>
        {specialOffer.isOnOffer && (
          <div className="food-item-special-offer">
            <p>Special Offer: {specialOffer.offerDescription}</p>
            <p>Discount: {specialOffer.discountPercentage}% off</p>
          </div>
        )}
      <button
  className="view-reviews-btn"
  onClick={() => setShowReviews(true)}
  style={{ backgroundColor: 'chocolate', color: 'white' }} // Add your styles here
>
  View Reviews
</button>
          
      </div>
      {showReviews && (
        <Reviews itemId={id} onClose={() => setShowReviews(false)} />
      )}
    </div>
  );
};

export default FoodItem;
