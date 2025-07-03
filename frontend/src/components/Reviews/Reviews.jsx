// Reviews.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Reviews.css";

const Reviews = ({ itemId, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(
          `http://localhost:4000/api/review/item/${itemId}`
        );
        setReviews(response.data);
        console.log(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      }
    };

    fetchReviews();
  }, [itemId]);

  return (
    <div className="reviews-modal">
      <div className="reviews-content">
        <h2>Reviews</h2>
        {loading ? (
          <p>Loading reviews...</p>
        ) : reviews.length > 0 ? (
          <ul className="reviews-list">
            {reviews.map((review) => (
              <li key={review._id} className="review-item">
                <p className="review-text">{review.review}</p>
                <p className="review-rate">{review.rate}</p>
                <p className="review-author" style={{color: 'blue'}}>By: {review.reviewedBy.name}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No reviews yet for this item.</p>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Reviews;
