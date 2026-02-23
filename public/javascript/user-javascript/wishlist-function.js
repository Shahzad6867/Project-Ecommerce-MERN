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
