import { useContext, useMemo, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useCart } from "../context/CartContext";
import { min } from "date-fns";
import MiniLoading from "./MiniLoading";
import { toast } from "react-toastify";
import AuthContext from "../context/AuthContext";

const ShoppingCart = () => {
  const { cartItems, loading, updateQty, removeItem, clearCart } = useCart();
  const maxQty = 500; // Maximum quantity allowed
  const maxQtyMessage = `You can only add up to ${maxQty} items one time.`;
  const [miniLoading, setminiLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user?.isEmailVerified) {
      toast.warn("Please verify your email before placing an order.");
      navigate("/settings");
      return;
    }

    // Proceed to checkout
    navigate("/checkout");
  };

  const handleRemoveItem = (productId) => {
    console.log(cartItems);
    Swal.fire({
      title: "Are you sure?",
      text: "This item will be removed from your cart.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, remove it!",
    }).then((result) => {
      if (result.isConfirmed) {
        removeItem(productId); // function to remove the item
        // Swal.fire({
        //   title: "Removed!",
        //   text: "The item has been removed from your cart.",
        //   icon: "success",
        //   timer: 1000, // Auto close after 2 seconds
        //   showConfirmButton: false,
        // });
      }
    });
  };

  const handleApplyCoupon = () => {
    toast.error("Invalid coupon code. Please try again.", {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });
  };

  const handleClearCart = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will remove all items from your cart.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, clear cart!",
    }).then((result) => {
      if (result.isConfirmed) {
        clearCart(); // Your function to clear the cart
        Swal.fire({
          title: "Cart Cleared!",
          text: "All items have been removed from your cart.",
          icon: "success",
          timer: 1000, // Auto close after 2 seconds
          showConfirmButton: false,
        });
      }
    });
  };

  // const subtotal = useMemo(
  //   () =>
  //     cartItems.reduce(
  //       (acc, item) => acc + (item.productId.previousPrice ?? item.productId.currentPrice) * item.qty,
  //       0
  //     ),
  //   [cartItems]
  // );

  // console.log(cartItems);

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) =>
          acc +
          (item.productId.previousPrice > 0
            ? item.productId.previousPrice
            : item.productId.currentPrice) *
            item.qty,
        0
      ),
    [cartItems]
  );

  const totalDiscount = useMemo(
    () =>
      cartItems.reduce((acc, item) => {
        const discount =
          item.productId.previousPrice && item.productId.currentPrice
            ? (item.productId.previousPrice - item.productId.currentPrice) *
              item.qty
            : 0;
        return acc + discount;
      }, 0),
    [cartItems]
  );

  const totalTax = useMemo(
    () =>
      cartItems.reduce((acc, item) => acc + item.productId.tax * item.qty, 0),
    [cartItems]
  );

  const total = useMemo(
    () => subtotal - totalDiscount + totalTax,
    [subtotal, totalDiscount, totalTax]
  );

  if (loading) {
    return (
      <>
        <div className="flex w-full justify-center flex-col gap-3 items-center h-[74vh] h-dvh-74 -translate-y-22">
          {/* Loading Cart... */}
          <div
            className="w-16 h-16 border-4 border-blue-500 border-y-transparent rounded-full animate-spin"
            style={{ animationDuration: "0.5s" }}
          ></div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col min-[900px]:flex-row gap-4">
      {miniLoading && <MiniLoading />}
      <div className="w-full flex flex-col min-[900px]:w-3/4 bg-white border border-[#E0E0E0] rounded-md p-4 max-[500px]:p-2 max-[500px]:pt-0">
        {cartItems.length < 1 ? (
          <div className="h-full flex items-center justify-center p-4 flex-col gap-1">
            <img
              src="cart-emty.png"
              alt="Empty Cart"
              className="object-cover"
            />
            <p className="text-3xl font-semibold">Empty Cart</p>
            <p className="text-lg">Go find the products you like.</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.productId._id}
              className="flex max-[500px]:flex-col max-[500px]:justify-center max-[500px]:items-center border-b border-[#E0E0E0] min-[500px]:py-4 max-[500px]:px-2 py-3"
            >
              <div className="min-[500px]:pt-4 max-[500px]:pb-1">
                <Link
                  to={`/product/${item.productId._id}`}
                  className="flex-shrink-0"
                >
                  <img
                    src={item.productId.image}
                    alt={item.productId.name}
                    className="w-20 border border-[#E0E0E0] max-[500px]:w-40 max-[500px]:h-40 rounded-md h-20 object-cover"
                  />
                </Link>
              </div>
              <div className="ml-4 mr-2 max-[500px]:mx-1 max-[500px]:w-full flex flex-col max-[500px]:items-center flex-1">
                <h2 className="text-lg font-semibold max-[500px]:text-center">
                  {item.productId.name}
                </h2>
                <p className="text-base text-gray-500 max-[500px]:text-center">
                  Size: {item.productId.sizes[0]}, Color: Any, Material:{" "}
                  {item.productId.material}
                  <br /> Seller: {item.productId.supplier.name}
                </p>
                <div className="mt-2 flex gap-2 w-full max-w-[300px] max-[500px]:items-center max-[500px]:justify-center">
                  <button
                    onClick={() => handleRemoveItem(item.productId._id)}
                    className="text-red-500 max-[500px]:bg-red-50 hover:bg-red-100 border border-[#E0E0E0] transition duration-300 cursor-pointer px-2 max-[500px]:w-1/2 py-1 rounded-md"
                  >
                    Remove
                  </button>
                  <button className="text-blue-500 max-[500px]:bg-blue-50 hover:bg-blue-100 border border-[#E0E0E0] transition duration-300 cursor-pointer max-[500px]:w-1/2 px-2 py-1 rounded-md">
                    Save for later
                  </button>
                </div>
              </div>
              <div className="text-right flex flex-col max-[500px]:flex-col max-[500px]:justify-end max-[500px]:items-center max-[500px]:gap-0 max-[375px]:flex-col max-[500px]:mt-2">
                <div className="flex flex-col max-[500px]:flex-row max-[500px]:gap-3 max-[500px]:justify-center max-[500px]:items-center">
                  <p className="text-lg ">
                    $
                    {item.productId?.previousPrice
                      ? item.productId?.previousPrice.toFixed(2)
                      : item.productId?.currentPrice.toFixed(2)}
                  </p>
                  <p className="text-green-500">
                    {item.productId.previousPrice
                      ? `- $${(
                          item.productId.previousPrice -
                          item.productId.currentPrice
                        ).toFixed(2)}`
                      : "- 0$"}
                  </p>

                  <p className="text-red-500">
                    + $
                    {item.productId?.tax
                      ? `${item.productId?.tax.toFixed(2)}`
                      : "0"}
                  </p>
                </div>
                <div className="relative flex flex-col items-center justify-center max-[500px]:gap-2">
                  {/* <select
                    className="min-[500px]:mt-2 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 border border-[#E0E0E0] appearance-none shadow-2xs rounded-md px-2 pr-10 py-1"
                    onChange={(e) =>
                      updateQty(item.productId._id, e.target.value)
                    }
                    value={item.qty}
                  >
                    {[...Array(12).keys()].map((n) => (
                      <option key={n + 1} value={n + 1}>
                        Qty: {n + 1}
                      </option>
                    ))}
                  </select> */}

                  <div className="relative w-full">
                    {item.productId.stock - item.qty <= 5 && (
                      <p className="text-sm text-center min-[500px]:text-right text-red-500 ">
                        {item.productId.stock === 1
                          ? "Only 1 item left in stock"
                          : `Only ${item.productId.stock} items available`}
                      </p>
                    )}
                    {item.qty >= maxQty && (
                      <p className="text-sm text-center min-[500px]:text-right text-red-500 ">
                        {maxQtyMessage}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 min-[500px]:mt-2 min-[500px]:self-end">
                    {/* Decrease Button */}
                    <button
                      disabled={item.qty <= 1}
                      className="px-3 relative cursor-pointer py-1 bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
                      onClick={async () => {
                        setminiLoading(true);
                        await updateQty(
                          item.productId._id,
                          Math.max(1, item.qty - 1)
                        );
                        setminiLoading(false);
                      }}
                    >
                      <span className="relative bottom-[1px]">-</span>
                    </button>

                    {/* Quantity Display */}
                    {/* <span className="px-4 py-1 border border-gray-300 rounded">
                      {item.qty}
                    </span> */}
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max={Math.min(item.productId.stock, maxQty)}
                      value={item.qty}
                      onChange={async (e) => {
                        let newQty = parseInt(e.target.value);
                        if (isNaN(newQty)) return;

                        newQty = Math.max(
                          1,
                          Math.min(
                            newQty,
                            Math.min(item.productId.stock, maxQty)
                          )
                        );

                        if (newQty !== item.qty) {
                          setminiLoading(true);
                          await updateQty(item.productId._id, newQty);
                          setminiLoading(false);
                        }
                      }}
                      className="w-12 text-center p-1 focus:outline-1 border border-gray-300 rounded appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    {/* Increase Button */}
                    <button
                      disabled={
                        item.qty >= Math.min(maxQty, item.productId.stock)
                      }
                      className="px-3 relative cursor-pointer py-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded transition duration-300"
                      onClick={async () => {
                        setminiLoading(true);

                        await updateQty(
                          item.productId._id,
                          Math.min(
                            item.qty + 1,
                            Math.min(maxQty, item.productId.stock)
                          )
                        );
                        setminiLoading(false);
                      }}
                    >
                      <span className="relative bottom-[1px]">+</span>
                    </button>
                  </div>

                  {/* <div className="absolute z-10 top-1/2 right-2 transform -translate-y-[33%] pointer-events-none text-2xl text-gray-400">
                    <MdKeyboardArrowDown />
                  </div> */}
                </div>
              </div>
            </div>
          ))
        )}
        <div className="mt-auto flex items-center justify-between w-full p-4">
          {/* Back to shop button */}
          <Link to={"/search"}>
            <button className="flex justify-center items-center gap-2 px-4 py-2 text-white cursor-pointer transition duration-300 bg-gradient-to-r from-blue-500 to-blue-600 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-700 rounded-lg">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                ></path>
              </svg>
              Back to shop
            </button>
          </Link>

          {/* Remove all button */}
          {cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="px-4 py-2 text-blue-500 hover:bg-gray-100 duration-300 cursor-pointer transition border font-semibold border-gray-300 rounded-lg"
            >
              Remove all
            </button>
          )}
        </div>
      </div>

      {/* Right */}

      <div className="w-full min-[900px]:w-1/4">
        {/* Coupon Section */}
        <div className="p-4 border border-[#E0E0E0] rounded-lg mb-3 bg-white">
          <p className="text-gray-700 mb-2">Have a coupon?</p>
          <div className="flex border border-[#E0E0E0] rounded-lg overflow-hidden">
            <input
              type="text"
              placeholder="Add coupon"
              className="w-full px-3 py-2 text-gray-500 border-none outline-none"
            />
            <button
              onClick={handleApplyCoupon}
              className="px-4 py-2 border-l border-[#E0E0E0] text-blue-500 font-medium hover:bg-gray-100 duration-300 cursor-pointer transition"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Cart Summary */}

        <div className="p-4 rounded-lg shadow-md bg-white">
          {/* Subtotal, Discount, Tax */}
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount:</span>
              <span className="text-green-500">
                - ${totalDiscount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span className="text-red-500">+ ${totalTax.toFixed(2)}</span>
            </div>
          </div>

          {/* Total */}
          <div className="mt-4 border-t pt-4 border-[#E0E0E0] flex justify-between text-xl font-semibold">
            <span>Total:</span>
            <span className="text-black">${total.toFixed(2)}</span>
          </div>

          {/* Checkout Button */}

          <button
            disabled={cartItems.length < 1}
            onClick={handleCheckout}
            className="w-full bg-[#00B517] text-white py-4 text-lg mt-4 rounded-lg hover:bg-[#009814] duration-300 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout
          </button>

          {/* Payment Methods */}
          {/* <div className="flex justify-center space-x-2 mt-4">
            <img src="/visa.png" alt="Visa" className="h-6" />
            <img src="/mastercard.png" alt="MasterCard" className="h-6" />
            <img src="/paypal.png" alt="PayPal" className="h-6" />
            <img src="/apple-pay.png" alt="Apple Pay" className="h-6" />
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
