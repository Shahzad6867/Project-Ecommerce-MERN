function deleteItemFromCart(cartId, productId, variantIndex) {
  let quantity = document.getElementById(
    `cartItemQty${productId}${variantIndex}`
  );
  let price = Number(
    document.getElementById(`price${cartId}${variantIndex}`).innerText
  );
  let myCartHead = document.getElementById("cartHeadItemCount");
  let cartItemQtyNotifier = document.getElementById("cartItemQty");
  let subTotal = document.getElementById("subTotal");
  let cartItem = document.getElementById(`cartItem${productId}${variantIndex}`);
  fetch(`/cart/delete-cart-item?cartItemId=${cartId}&productId=${productId}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then((data) => {
      myCartHead.innerText =
        Number(myCartHead.innerText) - Number(quantity.innerText);
      cartItemQtyNotifier.innerText =
        Number(cartItemQtyNotifier.innerText) - Number(quantity.innerText);
      subTotal.innerText = (
        Number(subTotal.innerText) -
        Number(quantity.innerText) * price
      ).toFixed(2);
      cartItem.remove();
      if (document.getElementById("cartItemsDiv").children.length === 0) {
        document.getElementById(
          "cartItemsDiv"
        ).innerHTML = `<div id="nothingInCartCard" class="flex  items-center justify-center border border-gray-400 w-[96%] text-left px-3 py-8 text-gray-700  rounded-lg m-2">
                                                                <h1 class="font-bold">
                                                                    Your cart is empty. Start shopping!
                                                                </h1>
                                                            </div>`;
      }
      feather.replace();
      iziToast.info({
        title: "Cart",
        message: data.message,
        position: "topRight",
      });
    });
}
function addToCartFromWishlist(productId, variant) {
  fetch(`/cart?productId=${productId}&variant=${variant}&quantity=${1}`, {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => {
      iziToast.success({
        title: "Cart",
        message: data.message,
        position: "topRight",
      });

      document
        .getElementById(`addToCartBtn${productId}${variant}`)
        .classList.add("hidden");
      document
        .getElementById(`addedToCartBtn${productId}${variant}`)
        .classList.remove("hidden");
      let cartItemCount = document.getElementById("cartItemQty");
      let tempValue = Number(cartItemCount.innerText);
      tempValue++;
      cartItemCount.innerText = tempValue;
      let itemCount = document.getElementById("wishlistItemQty");
      if (Number(itemCount.innerText) > 0) {
        let value = Number(itemCount.innerText);
        value--;
        itemCount.innerText = value;
        if (value === 0) {
          itemCount.classList.add("hidden");
        }
      }
    })
    .catch((error) => {
      iziToast.error({
        title: "Cart",
        message: error.message,
        position: "topRight",
      });
    });
}
function removeFromWishlist(productId, variant) {
  fetch(
    `/wishlist/remove-wishlist-item?productId=${productId}&variant=${variant}`,
    { method: "DELETE" }
  )
    .then((res) => res.json())
    .then((data) => {
      iziToast.success({
        title: "Wishlist",
        message: data.message,
        position: "topRight",
      });
    })
    .catch((error) => {
      iziToast.error({
        title: "Wishlist",
        message: error.message,
        position: "topRight",
      });
    });
  document.getElementById(`item${productId}${variant}`).remove();
  let itemCount = document.getElementById("wishlistItemQty");
  if (Number(itemCount.innerText) > 0) {
    let value = Number(itemCount.innerText);
    value--;
    itemCount.innerText = value;
    if (value === 0) {
      itemCount.classList.add("hidden");
    }
  }
  if (document.getElementById("itemsWishedDiv").children.length === 0) {
    document.getElementById(
      "itemsWishedDiv"
    ).innerHTML += `<div class="w-full h-[12rem] bg-white rounded-xl shadow-md p-6">
                <div class="border-2 w-full h-full  rounded-lg">
                    <h1 class="text-2xl font-bold text-center mt-[2.5rem] ">Looks like you haven’t added anything yet !</h1>
                    <a href="/shop"><button type="button"  class="btn-primary ml-[33rem] flex font-bold rounded-full px-4 py-2 mt-1 "><i data-feather="shopping-cart" class="mr-2"></i>Shop Now</button></a>
                </div>
              </div>`;
  }
}
