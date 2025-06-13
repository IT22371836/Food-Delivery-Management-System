import { useState, useEffect } from "react";
import { Tag, Spin } from "antd";
import axios from "axios";

const SentimentAnalysis = ({ review }) => {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSentiment(review);
  }, [review]);

  const fetchSentiment = async (review) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        {
          review,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error("Network response was not ok");
      }

      const data = response.data;

      setSentiment(data.sentiment);
    } catch (error) {
      console.error("Error fetching sentiment:", error);
      setSentiment("Unknown");
    } finally {
      setLoading(false);
    }
  };

  const renderSentiment = () => {
    if (loading) {
      return <Spin size="small" />;
    }

    switch (sentiment) {
      case "Positive":
        return <Tag color="green">Positive</Tag>;
      case "Negative":
        return <Tag color="red">Negative</Tag>;
      default:
        return <Tag color="gray">Unknown</Tag>;
    }
  };

  return <div>{renderSentiment()}</div>;
};

export default SentimentAnalysis;
