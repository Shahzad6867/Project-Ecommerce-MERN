feather.replace();
function buyNow(productId, variant) {
  fetch(`/cart/buynow?productId=${productId}&variant=${variant}`, {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message === "Done") {
        window.location.href = "/checkout";
      } else {
        iziToast.error({
          title: "Product",
          message: data.specMessage,
          position: "topRight",
        });
      }
    })
    .catch((error) => {
      iziToast.error({
        title: "Error",
        message: error.message,
        position: "topRight",
      });
    });
}
function addToWishlist(btn, productId, variant) {
  btn.classList.add("hidden");
  let itemCount = document.getElementById("wishlistItemQty");
  fetch(`/wishlist?productId=${productId}&variant=${variant}`, {
    method: "POST",
  })
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
  if (Number(itemCount.innerText) === 0) {
    itemCount.classList.remove("hidden");
    let value = Number(itemCount.innerText);
    value++;
    itemCount.innerText = value;
  } else if (Number(itemCount.innerText) > 0) {
    let value = Number(itemCount.innerText);
    value++;
    itemCount.innerText = value;
  }
}
function removeFromWishlist(productId, variant) {
  document
    .getElementById(`addWishBtn${productId}${variant}`)
    .classList.remove("hidden");
  let itemCount = document.getElementById("wishlistItemQty");
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
  if (Number(itemCount.innerText) > 0) {
    let value = Number(itemCount.innerText);
    value--;
    itemCount.innerText = value;
    if (value === 0) {
      itemCount.classList.add("hidden");
    }
  }
}

function addToCartInitiallyFromProductPage(input, variant, productId) {
  let cartItemQty = document.getElementById("cartItemQty");
  let price = Number(
    document.getElementById(`price${productId}${variant}`).innerText
  );
  let cartItemsDiv = document.getElementById("cartItemsDiv");
  let myCartHead = document.getElementById("cartHeadItemCount");
  let subTotal = document.getElementById("subTotal");
  let nothingInCartCard = document.getElementById("nothingInCartCard");
  fetch(`/cart?productId=${productId}&variant=${variant}&quantity=1`, {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.message === "Product has been added to Cart") {
        input.classList.add("hidden");
        document.getElementById(`incDecQtyDiv`).classList.remove("hidden");
        if (Number(cartItemQty.innerText) === 0) {
          document.getElementById("checkoutBtn").disabled = false;
          document.getElementById("checkoutBtn").onclick = function () {
            window.location.href = "/checkout";
          };
        }
        cartItemQty.innerText = Number(cartItemQty.innerText) + 1;
        myCartHead.innerText = Number(myCartHead.innerText) + 1;
        if (nothingInCartCard) {
          nothingInCartCard.remove();
        }
        if (data.product.productName.length > 29) {
          data.product.productName =
            data.product.productName.slice(0, 26) + "...";
        }
        cartItemsDiv.innerHTML =
          `<div id="cartItem${data.product._id}${variant}" >
                                    <input  type="text" value="${data.cart._id}" hidden></input>
                                    <div class="flex  border border-gray-400 w-[96%] text-left px-3 py-2 text-gray-700  rounded-lg m-2">
                                        <a href="/product?id=${data.product._id}&variant=${variant}" >
                                            <div class="w-[6rem]">
                                            <img src="${data.product.variants[variant].productImages[0]}" class="rounded-md mr-1 w-full border border-gray-400 "></img>
                                           </div>
                                        </a>
                                       
                                        <div class="w-[78%] ml-1">
                                              <a href="/product?id=${data.product._id}&variant=${variant}" >
                                                 <h1 class="font-bold text-black">${data.product.productName}</h1>
                                                 <p class="text-gray-600 text-xs">Color : <strong class="text-black">${data.product.variants[variant].color}</strong><span class="ml-2">Size : <strong class="text-black">${data.product.variants[variant].size}</strong></span></p>
                                                 <p class="text-sm text-gray-600 mt-[0.1rem]">Quantity : <strong class="text-black font-bold" id="cartItemQty${productId}${variant}">1</strong></p>
                                             </a>
                                            <div class="flex justify-between items-center mt-1">
                                                <h2 class="text-lg text-black font-bold ">$ ${price}</h2>
                                               
                                                    <button type="button" class="text-sm  flex items-center justify-center rounded-lg hover:text-red-500  px-2 z-50  text-black" onclick="deleteItemFromCartFromProductPage('${data.cart._id}','${data.product._id}',${variant})">
                                                        <i data-feather="trash-2" class="w-5 h-5 mr-1"></i>
                                                    </button>
                                              
                                            </div>
                                        </div> 
                                        
                                    </div>
                                </div>` + cartItemsDiv.innerHTML;
        subTotal.innerText = (Number(subTotal.innerText) + price).toFixed(2);
        feather.replace();
        iziToast.info({
          title: "Cart",
          message: data.message,
          position: "topRight",
        });
      } else if (
        data.message === "Out of Stock" ||
        data.message === "Product Unavailable"
      ) {
        document.getElementById("incDecQtyDiv").classList.add("hidden");
        document.getElementById("buyNow").classList.add("hidden");
        input.classList.remove(...input.classList);
        input.classList.add("py-3");
        input.classList.add("px-2");
        input.classList.add("bg-red-400");
        input.classList.add("font-bold");
        input.classList.add("rounded-lg");
        input.innerHTML = "";
        input.innerText = data.message;
        input.disabled = true;
      }
    })
    .catch((error) => {
      iziToast.error({
        title: "Error",
        message: error.message,
        position: "topRight",
      });
    });
}
function incrementQuantityFromProductPage(variantIndex, productId) {
  let quantity = document.getElementById(`quantity${productId}${variantIndex}`);
  let price = Number(
    document.getElementById(`price${productId}${variantIndex}`).innerText
  );
  let addToCartBtn = document.getElementById(
    `addToCartBtn${productId}${variantIndex}`
  );
  let cartItemQtyToBeUpdated = document.getElementById(
    `cartItemQty${productId}${variantIndex}`
  );
  let myCartHead = document.getElementById("cartHeadItemCount");
  let cartItemQtyNotifier = document.getElementById("cartItemQty");
  let subTotal = document.getElementById("subTotal");
  let counter = parseInt(quantity.value);
  counter++;

  if (counter > 10) {
    iziToast.warning({
      title: "Quantity Limit Reached",
      message: "You can order up to a maximum of 10 items only.",
      position: "topRight",
    });
  } else {
    fetch(
      `/cart/update-cart-item?productId=${productId}&variant=${variantIndex}&quantity=${counter}`,
      { method: "PATCH" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Quantity has been updated in Cart") {
          subTotal.innerText = (
            Number(subTotal.innerText) +
            (counter * price - Number(quantity.value) * price)
          ).toFixed(2);
          quantity.value = counter;
          cartItemQtyToBeUpdated.innerText =
            Number(cartItemQtyToBeUpdated.innerText) + 1;
          cartItemQtyNotifier.innerText =
            Number(cartItemQtyNotifier.innerText) + 1;
          myCartHead.innerText = Number(myCartHead.innerText) + 1;
          feather.replace();
        } else if (
          data.message === "Out of Stock" ||
          data.message === "Product Unavailable"
        ) {
          document.getElementById("incDecQtyDiv").classList.add("hidden");
          document.getElementById("buyNow").classList.add("hidden");
          addToCartBtn.classList.remove(...addToCartBtn.classList);
          addToCartBtn.classList.add("py-3");
          addToCartBtn.classList.add("bg-red-400");
          addToCartBtn.classList.add("font-bold");
          addToCartBtn.classList.add("px-2");
          addToCartBtn.classList.add("rounded-lg");
          addToCartBtn.innerHTML = "";
          addToCartBtn.innerText = data.message;
          cartItemQtyToBeUpdated.classList.remove("text-black");
          cartItemQtyToBeUpdated.classList.add("text-red-500");
          cartItemQtyToBeUpdated.innerText = data.message;
          cartItemQtyNotifier.innerText =
            Number(cartItemQtyNotifier.innerText) - Number(quantity.value);
          myCartHead.innerText =
            Number(myCartHead.innerText) - Number(quantity.value);
          iziToast.error({
            title: "Cart",
            message: data.specMessage,
            position: "topRight",
          });
        } else {
          iziToast.info({
            title: "Cart",
            message: data.message,
            position: "topRight",
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
function decrementQuantityFromProductPage(variantIndex, productId) {
  let quantity = document.getElementById(`quantity${productId}${variantIndex}`);
  let price = Number(
    document.getElementById(`price${productId}${variantIndex}`).innerText
  );
  let addToCartBtn = document.getElementById(
    `addToCartBtn${productId}${variantIndex}`
  );
  let cartItemQtyToBeUpdated = document.getElementById(
    `cartItemQty${productId}${variantIndex}`
  );
  let myCartHead = document.getElementById("cartHeadItemCount");
  let cartItemQtyNotifier = document.getElementById("cartItemQty");
  let subTotal = document.getElementById("subTotal");
  let cartItem = document.getElementById(`cartItem${productId}${variantIndex}`);
  let cartId = document.querySelector(
    `#cartItem${productId}${variantIndex} input`
  ).value;
  let counter = parseInt(quantity.value);
  counter--;
  if (counter < 1) {
    fetch(
      `/cart/delete-cart-item?cartItemId=${cartId}&productId=${productId}`,
      { method: "DELETE" }
    )
      .then((res) => res.json())
      .then((data) => {
        addToCartBtn.classList.remove("hidden");
        document.getElementById(`incDecQtyDiv`).classList.add("hidden");
        myCartHead.innerText = Number(myCartHead.innerText) - 1;
        cartItemQtyNotifier.innerText =
          Number(cartItemQtyNotifier.innerText) - 1;
        subTotal.innerText = (
          Number(subTotal.innerText) -
          (Number(quantity.value) * price - counter * price)
        ).toFixed(2);
        cartItem.remove();
        if (Number(cartItemQtyNotifier.innerText) === 0) {
          document.getElementById("checkoutBtn").disabled = true;
        }
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
  } else {
    fetch(
      `/cart/update-cart-item?productId=${productId}&variant=${variantIndex}&quantity=${counter}`,
      { method: "PATCH" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "Quantity has been updated in Cart") {
          subTotal.innerText = (
            Number(subTotal.innerText) -
            (Number(quantity.value) * price - counter * price)
          ).toFixed(2);
          quantity.value = counter;
          cartItemQtyToBeUpdated.innerText =
            Number(cartItemQtyToBeUpdated.innerText) - 1;
          cartItemQtyNotifier.innerText =
            Number(cartItemQtyNotifier.innerText) - 1;
          myCartHead.innerText = Number(myCartHead.innerText) - 1;
        } else if (
          data.message === "Out of Stock" ||
          data.message === "Product Unavailable"
        ) {
          document.getElementById("incDecQtyDiv").classList.add("hidden");
          document.getElementById("buyNow").classList.add("hidden");
          addToCartBtn.classList.remove(...addToCartBtn.classList);
          addToCartBtn.classList.add("py-3");
          addToCartBtn.classList.add("bg-red-400");
          addToCartBtn.classList.add("font-bold");
          addToCartBtn.classList.add("px-2");
          addToCartBtn.classList.add("rounded-lg");
          addToCartBtn.innerHTML = "";
          addToCartBtn.innerText = data.message;
          cartItemQtyToBeUpdated.classList.remove("text-black");
          cartItemQtyToBeUpdated.classList.add("text-red-500");
          cartItemQtyToBeUpdated.innerText = data.message;
          cartItemQtyNotifier.innerText =
            Number(cartItemQtyNotifier.innerText) - Number(quantity.value);
          myCartHead.innerText =
            Number(myCartHead.innerText) - Number(quantity.value);
          iziToast.error({
            title: "Cart",
            message: data.specMessage,
            position: "topRight",
          });
        } 
      })
      .catch((error) => {
        console.log(error);
      });
  }
}
function deleteItemFromCartFromProductPage(cartId, productId, variantIndex) {
  let quantity = document.getElementById(`quantity${productId}${variantIndex}`);
  let addToCartBtn = document.getElementById(
    `addToCartBtn${productId}${variantIndex}`
  );
  let price = Number(
    document.getElementById(`price${productId}${variantIndex}`).innerText
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
      addToCartBtn.classList.remove("hidden");
      document.getElementById(`incDecQtyDiv`).classList.add("hidden");
      myCartHead.innerText =
        Number(myCartHead.innerText) - Number(quantity.value);
      cartItemQtyNotifier.innerText =
        Number(cartItemQtyNotifier.innerText) - Number(quantity.value);
      quantity.value = 1;
      subTotal.innerText = (
        Number(subTotal.innerText) -
        Number(quantity.value) * price
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

const mainImage = document.getElementById("mainImage");
const thumbnails = document.querySelectorAll(".thumbnail");
let imageZoom = document.getElementById("imageZoom");
thumbnails.forEach((thumbnail) => {
  thumbnail.addEventListener("click", () => {
    // Update main image source
    mainImage.src = thumbnail.src;
    imageZoom.style.setProperty("--url", `url(${thumbnail.src})`);
  });
});
imageZoom.addEventListener("mousemove", (event) => {
  imageZoom.style.setProperty("--display", "block");
  let pointer = {
    x: (event.offsetX * 100) / imageZoom.offsetWidth,
    y: (event.offsetY * 100) / imageZoom.offsetHeight,
  };
  imageZoom.style.setProperty("--zoom-x", pointer.x + "%");
  imageZoom.style.setProperty("--zoom-y", pointer.y + "%");
});
imageZoom.addEventListener("mouseout", (event) => {
  imageZoom.style.setProperty("--display", "none");
});
