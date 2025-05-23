import React, { useState, useEffect, useRef, useMemo } from "react";
import StarRating from "./StarRating";
import { formatDistanceToNow } from "date-fns";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

import axios from "axios";
import { useParams } from "react-router-dom";

// Sample reviews
const sampleReviews = [
  {
    id: 1,
    name: "Ali Raza",
    rating: 5,
    comment:
      "Absolutely amazing product! Quality is top-notch and delivery was quick.",
    createdAt: new Date("2025-04-11"),
  },
  {
    id: 2,
    name: "Sara Ahmed",
    rating: 4.5,
    comment: "Very nice overall. Would be perfect if the packaging was better.",
    createdAt: new Date("2023-04-02"),
  },
  {
    id: 3,
    name: "Zain Malik",
    rating: 3.5,
    comment:
      "It's okay. Expected a bit more but still satisfied for the price.",
    createdAt: new Date("2025-02-28"),
  },
  {
    id: 4,
    name: "Ayesha Noor",
    rating: 2.5,
    comment:
      "Product quality was average. Not fully satisfied with the purchase.",
    createdAt: new Date("2024-04-10"),
  },
  {
    id: 5,
    name: "Hamza Tariq",
    rating: 4,
    comment: "Good value for money. Would recommend to others!",
    createdAt: new Date("2024-04-15"),
  },
  {
    id: 6,
    name: "Fatima Khan",
    rating: 5,
    comment: "Outstanding quality! Will definitely buy again.",
    createdAt: new Date("2024-04-19"),
  },
  {
    id: 7,
    name: "Sara Ahmed",
    rating: 4.5,
    comment: "Very nice overall. Would be perfect if the packaging was better.",
    createdAt: new Date("2024-04-02"),
  },
  {
    id: 8,
    name: "Zain Malik",
    rating: 3.5,
    comment:
      "It's okay. Expected a bit more but still satisfied for the price.",
    createdAt: new Date("2025-02-28"),
  },
  {
    id: 9,
    name: "Ayesha Noor",
    rating: 2.5,
    comment:
      "Product quality was average. Not fully satisfied with the purchase.",
    createdAt: new Date("2023-04-10"),
  },
];

// Pagination settings
const REVIEWS_PER_PAGE = 6;

const ReviewsSection = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [fade, setFade] = useState(true);
  const [containerHeight, setContainerHeight] = useState("auto");
  const contentRef = useRef(null);
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // const totalPages = Math.ceil(sampleReviews.length / REVIEWS_PER_PAGE);
  // const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  // const currentReviews = sampleReviews.slice(
  //   startIndex,
  //   startIndex + REVIEWS_PER_PAGE
  // );

  const { id } = useParams(); // from URL
  const productId = id;
  // console.log("Product ID:", productId);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE);
  // const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
  // const currentReviews = reviews.slice(
  //   startIndex,
  //   startIndex + REVIEWS_PER_PAGE
  // );

  const currentReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE;
    return reviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);
  }, [reviews, currentPage]);

  // console.log("test");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/reviews/product/${productId}`
        );
        const formatted = res.data.map((r) => ({
          id: r._id,
          // name: r.user.name,
          // for Sample or Fake reviews check if name is present
          name: r?.name || r.user?.name || "Anonymous",
          rating: r.rating,
          comment: r.comment,
          createdAt: new Date(r.createdAt),
        }));
        setReviews(formatted);
      } catch (err) {
        console.error("Error fetching reviews", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  // useEffect(() => {
  //   setCurrentPage(1);
  // }, [productId]);

  useEffect(() => {
    const contentEl = contentRef.current;
    if (contentEl) {
      setContainerHeight(`${contentEl.offsetHeight}px`); // Lock height before transition
    }

    setFade(false); // Start fade out

    const timeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page
      setFade(true); // Fade in after update
    }, 200); // Match fade duration

    return () => clearTimeout(timeout);
  }, [productId]);

  // useEffect(() => {
  //   // Only run after productId changes AND loading completes
  //   if (loading) return;

  //   const contentEl = contentRef.current;
  //   if (contentEl) {
  //     setContainerHeight(`${contentEl.offsetHeight}px`);
  //   }

  //   setFade(false); // fade out

  //   const timeout = setTimeout(() => {
  //     setCurrentPage(1); // reset
  //     setFade(true); // fade in
  //   }, 200);

  //   return () => clearTimeout(timeout);
  // }, [productId, loading]);

  const handlePageChange = (newPage) => {
    if (newPage === currentPage) return;
    setFade(false); // start fade out
    const contentEl = contentRef.current;
    if (contentEl) {
      // Fix height to current before fade out
      setContainerHeight(`${contentEl.offsetHeight}px`);
    }

    setTimeout(() => {
      setCurrentPage(newPage);
      setFade(true);
    }, 200); // match fade-out
  };

  // Update height smoothly when currentReviews change
  useEffect(() => {
    const contentEl = contentRef.current;
    if (!contentEl) return;

    const newHeight = contentEl.scrollHeight;

    requestAnimationFrame(() => {
      setContainerHeight(`${newHeight}px`);
    });

    const timeout = setTimeout(() => {
      // Clean up inline height after transition
      setContainerHeight("auto");
    }, 300); // must match transition duration

    return () => clearTimeout(timeout);
  }, [currentReviews]);

  return (
    <div className="bg-white p-6 rounded-lg border border-[#E0E0E0]">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Customer Reviews</h2>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading reviews...</p>
      ) : currentReviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet.</p>
      ) : (
        <>
          <div
            className="transition-[height] duration-300 ease-in-out overflow-hidden"
            style={{ height: containerHeight }}
          >
            <div
              ref={contentRef}
              className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 transition-opacity duration-300 ${
                fade ? "opacity-100" : "opacity-0"
              }`}
            >
              {currentReviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-[#E0E0E0] rounded-lg p-4 bg-gray-50 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-700">
                      {review.name}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(review.createdAt, {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="mb-2">
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-gray-600 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center mt-6 gap-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md bg-gray-200 cursor-pointer hover:bg-gray-300 disabled:opacity-50"
            >
              <FaArrowLeft />
            </button>

            <span className="text-gray-700 font-medium">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md bg-gray-200 cursor-pointer hover:bg-gray-300 disabled:opacity-50"
            >
              <FaArrowRight />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReviewsSection;
